---
title: "Realtime in an embedded CMS: Server-Sent Events, an event table, and the leave event that almost leaked ids"
slug: realtime-sse
language: en
category: Engineering
publishedAt: 2027-02-22
coverText: "SSE"
excerpt: "How Easy CMS 1.47 streams collection changes to apps over Server-Sent Events, with an event row written in the save's transaction, polling for many instances, Last-Event-ID resume, and a fix that kept hidden document ids hidden."
---
Since Easy CMS 1.47.0, released on 14 November 2026, an app can subscribe to changes in a collection and get each one as it is saved. A list of posts on your site updates when an editor publishes, without reloading and without polling REST yourself.

It was the last missing piece of level 2 on the [roadmap](/blog/more-than-a-cms), and it took more decisions than I expected for something that sounds like "send a message when a row changes". This post goes through them: why Server-Sent Events, why a new table instead of the outbox I already had, how several instances share events with no Redis, and the `leave` event that would have told subscribers the ids of documents they were never allowed to see.

## What it looks like

You turn it on per collection:

```ts
{
  slug: 'posts',
  realtime: true,
  fields: [/* … */],
}
```

Then, in the browser:

```ts
import { createClient } from '@easy-cms/core/client'

const cms = createClient<typeof config>({ url: '/api/cms' })

const stream = cms.subscribe(
  [
    { collection: 'posts', where: { category: { equals: 'news' } } },
    { collection: 'comments', id: 42 },
  ],
  {
    onEvent: (change) => {
      if (change.collection === 'posts' && 'doc' in change) console.log(change.doc.title)
    },
    onReset: () => reloadEverything(),
  },
)
```

Most apps won't call `subscribe()` directly. `useLive()` in `@easy-cms/next/live` and in `@easy-cms/nuxt` loads a list, keeps it sorted and trimmed to `limit`, and applies the events. Server code gets the same events from `cms.subscribe()` in the Local API, as an async iterator.

Every event carries the document **as that subscriber would read it over REST**. Collection access, row-level access, field-level read access, API key grants and drafts all apply to each subscriber on its own. That was the first rule I wrote down, and most of the rest follows from it.

## Why Server-Sent Events first

The stream is one HTTP request: `GET /api/cms/realtime?s=posts&s=comments/42`, answered with `text/event-stream`. I picked SSE over WebSocket for a few plain reasons:

- **It is a normal GET.** It goes through the same handler, the same auth and the same proxies as every other read, and it works over HTTP/2. There is no upgrade handshake to support in Next.js, Nuxt and the standalone server. (Nuxt still needed care: h3's `sendWebResponse` kept reading a stream after the client left, so the Nuxt handler writes the event stream itself and cancels it when the connection closes.)
- **The client can read it with `fetch`.** That matters more than it sounds. `EventSource` can't send an `Authorization` header, so a server-side client with an API key couldn't use it. Reading the stream with `fetch` and parsing the SSE lines myself works in a browser with the session cookie and on a server with a header.
- **The flow is one way anyway.** Subscribers don't send anything after they connect. What they follow is fixed when the stream opens.

That last point is also the cost. You can't add a subscription to an open stream. To change what it follows, you open a new one. I made that cheap instead of avoiding it: each `s` parameter is a REST path with its query (`posts?where[category][equals]=news&depth=0`), up to 20 on one connection, and the client can start the new stream from where the old one got to, so nothing in between is missed.

WebSocket isn't ruled out. Every message is three parts, `id`, `event` and `data`, and one function turns them into SSE text. A WebSocket transport later would send the same three parts as JSON.

## An event row in the same transaction as the save

The obvious way to build this would be an in-process event emitter: a save finishes, you call every open stream. It fails in two ways I cared about. A save on instance A never reaches a stream held by instance B. And a client that drops for ten seconds has no way to get what it missed.

So every save of a collection with `realtime: true` writes a row into a new table, `realtime-events`: the collection, the document id, the kind of change (`create`, `update`, `delete`, `publish`, `unpublish`), whether it only touched a draft, and whether the document was published. The row's serial id becomes the SSE `id:` and the cursor for resuming.

The row is written **in the same database transaction as the save**. No event for a save that rolled back, no save without its event. On SQLite and Postgres the adapters already had a way to do this, because the outbox from [ADR-0053](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0053-outbox-for-after-hooks.md) passes extra rows to `create`, `update` and `delete` to write alongside the document. An adapter that can't write in the save's transaction writes the event right after and says so at startup. If the process dies in that gap, one event is lost.

Why not just read the outbox? I looked at it first. The outbox is a work queue: a row is written only when there is something to run (a hook, a webhook, a cache purge), and it is deleted when that work succeeds. A collection with no hooks writes nothing to it, and a client reconnecting a minute later would find the rows already gone. A replay log needs the opposite: a row for every change, kept for a while. So it is a separate table, kept for `retentionHours` (24 by default) and pruned by the jobs that already run every minute.

One detail I only found by thinking about Postgres sequences: Postgres hands out the id before the transaction commits. A slow transaction can commit id 41 after a fast one committed 42. A reader that jumped to 42 would never see 41. So the reader stops at a gap in the ids and waits, for at most 10 seconds, because a rolled-back transaction leaves a gap that never fills. Events go out in order and none are skipped; the price is that a gap that never closes delays the next events by up to 10 seconds.

## Many instances, no Redis

Easy CMS instances already coordinate through the database and nothing else. The job queue works that way ([I wrote about it here](/blog/postgres-job-queue)), and I didn't want realtime to be the reason someone has to run Redis.

![How a save reaches subscribers: the save and its event row commit together, every instance reads new rows every pollMs, and each subscriber gets the document as it may read it, or a leave only if it could see the document before](/images/blog/realtime-sse/diagram-1.png)

Each server reads new rows from `realtime-events` every `pollMs` (1,000 ms by default), once for all of its open streams, and hands them to each stream. After a save on the same instance it reads right away instead of waiting for the timer. A save on instance A reaches a subscriber on instance B within about `pollMs`, and there is a test for exactly that: two instances on one database, a stream on one, a post created through REST on the other.

The event row never holds the document that is sent. For each subscriber, the server loads the document fresh with the subscription's `where` plus the id, as that subscriber, with its drafts, depth and locale. That is what makes "as it would read it over REST" true. It is also the expensive part: one read per subscriber per event. Visitors with the same subscription share one read per event, which covers the common case of a public page many people have open, but many signed-in subscribers to a busy collection cost real reads.

**Cloudflare Workers** don't fit the shared model. One request can't write to another request's stream, so on Workers each stream polls the table on its own: one query per stream every `pollMs`. It works, there is a smoke test that opens a stream on Workers and waits for a post created through REST, and the guide says to keep `pollMs` higher there or the number of streams small.

**Serverless functions** (Vercel, Netlify) end a stream at the function's maximum duration. The client reconnects with `Last-Event-ID` and misses nothing, but long-lived streams use up function time, so a long-running server suits many subscribers better.

## Resume, reset and heartbeat

A client that reconnects sends `Last-Event-ID`, and the server first replays what that subscriber may see after that id, then sends `ready`. `EventSource` does this by itself; the client in `@easy-cms/core/client` does it too, with backoff from 1 to 30 seconds plus jitter so that clients cut off by a restart don't all come back in the same second. It stops retrying when the API refuses the subscription (400, 401, 403 or 404).

Sometimes resuming isn't possible, and the server says so with `reset` instead of guessing:

- rows after that id may have been pruned (the client was away longer than `retentionHours`),
- the id is higher than the newest row, which means the database changed under it,
- the value isn't a number,
- or the client is more than 1,000 events behind, where loading the list again is cheaper than replaying.

On `reset`, the client loads what it shows again. `live()` and `useLive()` do that for you.

A comment line goes out every `heartbeatMs` (25 seconds) so proxies don't close a quiet stream. The heartbeat also moves the stream's `id:` forward to the last event the server processed, including ones this subscriber wasn't allowed to see. Without that, a subscriber that follows a quiet `where` on a busy collection would reconnect from an id far in the past and replay hundreds of events only to drop them all.

The response also sets `cache-control: no-cache, no-transform` and `x-accel-buffering: no`. The `no-transform` is there because compression, Next.js's included, holds events back until a buffer fills, which for a stream means "much later".

## Auth and limits

Auth is the same as REST: the session cookie in a browser, an API key or token in the `Authorization` header on a server. **A token is never taken from the URL.** URLs end up in proxy logs, browser history and `Referer` headers; a long-lived stream URL with a token in it would be a token in all of those. The integration test sends a valid token as `?token=` and expects `401`, because the request is just treated as a visitor.

Access is checked when the stream opens, by running a count with `max: 0` for each subscription as that user. A `where` on a field the user can't read gets `403` before any event is sent, as a list would. While the stream is open, the session or API key is checked again about once a minute; if it ended or was revoked, the stream closes and the client reconnects as whoever it is now.

Two limits keep one client from holding the server: `maxPerUser` (10) open streams per user, per API key or per visitor IP, answered with `429` and `Retry-After: 30`; and `maxConnections` (1,000) per server, answered with `503` and `Retry-After: 10`. Both count per process, or per isolate on Workers, not across instances.

## The leave that almost leaked ids

Besides the five kinds of change, a subscriber can get one more event: `leave`. It means "a document you may have had no longer shows for you": a published post was unpublished for a visitor, or it was edited so that it no longer matches the subscription's `where` or the user's row-level access. Without it, a filtered list would keep showing a post that moved to another category until the page reloaded.

My first version sent `leave` (and `delete`) to every subscriber who could read the collection and didn't get the document back. That sounds harmless. It isn't. Picture a `notes` collection where each user reads only their own notes, through row-level access. User A edits their note. The server loads it for user B, B can't read it, so B gets `leave` with the note's id. B never saw that note and never could. Now B knows it exists, its id, and when it changed. The same went for a subscription with `where: { category: { equals: 'news' } }`: every edit to a sports post sent a `leave` to the news subscribers.

The review before the 1.47.0 release caught it, and the fix went in the same morning as the release. It needed one thing the event row didn't have: what the document looked like **before** the change.

- Each event row for an update or delete now keeps the stored document from before it, as JSON, in a `before` column, without the password hash. It is **never sent**: not in the SSE `data`, not in `cms.subscribe()`. It is only checked.
- `leave` and `delete` go only to subscribers who could see that before-state: it matched the subscription (collection, id, `where`), and it passes the subscriber's read access **now**, row-level `where` and API key grants included, and drafts as they may read them. A visitor who reads published documents only needs the before-state to have been published.
- Because `before` is in the row, the same check works when a reconnecting client replays events with `Last-Event-ID`.

That check runs in memory, with a small function called `matchesWhere`, against the stored row. It knows `equals`, `not_equals`, `in`, `not_in`, `gt`, `gte`, `lt`, `lte`, `exists`, `and` and `or`, paths into groups and localized values, and relationships compared by id. It returns `true`, `false`, or **"I can't tell"**. A `like` depends on the database's collation and text rules, and a value inside an array (a `hasMany` field, tags) depends on how the database stores it. Rather than reimplement both badly, `matchesWhere` says it doesn't know, and "don't know" counts as **not visible**: no `leave`.

That is a trade-off on purpose. A client following a `like` search may keep a document on screen after it stopped matching, until it loads again. The other choice was to tell someone an id they shouldn't have, and that is the kind of bug you can't take back once it has shipped.

The integration test now spells out the four cases with two users and row-level access: hidden before and after, nothing at all, not even the id; visible before and hidden after, `leave` for the one who saw it and nothing for the other; hidden before and visible after, an `update` with the document; deleted, `delete` only for the user who could see it.

## What is still missing

- **Globals and custom channels.** Only collections can be followed.
- **WebSocket**, for clients that want it. The message format is ready for it; the transport isn't built.
- **`cms.increment()` writes no event**, the same as it sends no webhook.
- **Cost at scale.** Every instance reads the table every `pollMs` while anyone is subscribed, every event reads the document once per subscriber, and each row keeps a copy of the document before the change for `retentionHours`, so the table grows with document size. On Workers the query cost multiplies by the number of streams.
- **The table needs a migration** the first time you turn realtime on: `easy-cms migrate:create realtime`.

The admin uses the same stream since 1.48.0, which raised its own problem: telling a save you just made from someone else's. That is the next post.

## Try it

Add `realtime: true` to a collection, create the migration, and `useLive()` gives you a list that follows your editors. The [realtime guide](/docs/realtime) has the options, the stream format and the notes on Workers and serverless hosts, and [ADR-0070](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0070-realtime.md) has the full reasoning. If you run it across several instances or on an edge runtime and something doesn't behave, or you need a channel that isn't a collection, tell me in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions).
