---
title: "Live updates in a CMS admin: telling your own save from someone else's"
slug: admin-live-updates
language: en
category: Engineering
publishedAt: 2027-03-01
coverText: "saved elsewhere"
excerpt: "Easy CMS 1.48 made the admin live. Why updatedAt couldn't recognise the page's own save, how lists change without moving rows under the cursor, one stream per browser tab, and the race that is still open."
---
Until Easy CMS 1.48.0, released on 14 November 2026, the admin had a quiet way to lose work. Two people open the same post. Both edit. The one who saves second overwrites the first, and nobody is told. Lists had a milder version of the same problem: they showed what was there when you opened them, until you reloaded.

The realtime stream from 1.47.0 ([the previous post](/blog/realtime-sse) is about how it works) gave the admin a way to hear about other saves. Using it turned out to be mostly about one question I didn't expect to be hard: when a change event arrives for the document on screen, was that save mine?

## What changed for editors

For collections with `realtime: true` (the admin schema now says which ones are), three places are live. Other collections work as before and open no connection.

- **The list.** A "Live" dot beside the heading, grey with "Reconnecting…" while the stream is down. Rows on screen change in place when they are saved elsewhere. A row deleted elsewhere is greyed out and tagged "Deleted". New documents, and ones that move in or out of what the list shows, are counted in a pill, "3 changes — Show", instead of appearing or disappearing.
- **The edit page and the drawer.** If you have no unsaved changes, another save loads by itself, with a small "Updated from the latest save". If you do have unsaved changes, a banner says "This document was saved elsewhere", with **Load new version (discard mine)** and **Keep mine**. If you keep yours, saving asks first: "This document was saved elsewhere after you opened it. Save yours over that version?"
- **Deleted, or no longer yours to see.** A banner says "This document was deleted" or "You can no longer see this document", and Save is turned off. What you typed stays on the page to copy. The page doesn't redirect you away from your own text.

It deliberately doesn't say *who* saved. The events carry no author, and "elsewhere" includes you in another tab.

## Why updatedAt couldn't recognise my own save

The page subscribes to its own document. When you click Save, the server writes the document, writes the event row, and the stream delivers an `update` for that same document a moment later, to the same page. If the page treats that like any other save, every save you make shows "Updated from the latest save", or worse, if you started typing again right after saving, "This document was saved elsewhere" for your own work.

The first idea is obvious: the save response has an `updatedAt`. When an event arrives, read the document; if its `updatedAt` is the one my save returned, it's my save.

That works until drafts. When you save a draft of a document that is already published, the published row stays as it is and the draft is stored as a version, written after the document row. The `updatedAt` the admin reads back for that draft is not the one the save returned, so the match fails on exactly the documents where two editors are most likely to collide: published pages being reworked in a draft.

I could have tried to make the two timestamps agree, but that would make a correctness rule depend on the order of two writes inside the save. So the page tells its own saves apart by **content** instead:

1. While the page is busy (saving, loading, deleting, or running an action) incoming events wait. Only the last one is kept; it is enough.
2. When the page is idle, it reads the document again, the same way the page reads it.
3. It turns that into form values and compares them with the form's **baseline**: the snapshot of what was last loaded or saved, which the save itself just set.
4. Equal means it was this page's own save, or nothing visible changed. Nothing happens.
5. Different and the form is clean: load it, show "Updated from the latest save". Different and the form has unsaved changes: show the conflict banner.

`updatedAt` still has a job, just a smaller one: an event whose document is older than or as old as what the page already has is skipped without reading anything.

The cost is one extra read of the document for each change the edit page sees. The benefit is that "is this mine?" is answered by the same thing the editor cares about: is what's on the server different from what I think I saved?

## Lists that don't move under the cursor

The list was the part with the most UX decisions, and most of them came from one rule: **never move a row the user might be about to click.**

![What the admin list does with each live change: rows on screen are read again and changed in place, rows deleted elsewhere are greyed out, and anything that would add, move or remove rows is counted in an "N changes — Show" pill](/images/blog/admin-live-updates/diagram-1.png)

The logic is a small function, `listReaction`, with four answers:

- **A row on screen was updated or published:** `refresh`. The list reads those rows again, as the list reads them, and swaps them in place. Changes that come close together are batched with a 100 ms timer.
- **A row on screen was deleted:** `deleted`. It stays where it is, greyed out, with "Deleted", and its checkbox is disabled. If it was selected, it is unselected.
- **Anything that would add, move or remove rows:** `pending`. A new document, a row on screen that no longer matches the filters, a document elsewhere that now matches. It goes into the count. **Show** loads the list again with its page, sort, filters and selection.
- **Not on this page and deleted or left anyway:** `ignore`.

When the list has filters, "does this change belong in my list?" isn't something the client can answer alone. So the list asks the API: the list's own `where`, plus `id in (…)` for the changed documents, and compares the answer with what is on screen. Only documents whose membership actually changed are counted.

If the stream couldn't resume (`reset`), the list doesn't know how many changes it missed, so the pill just says "Changes — Show".

### Why the list follows the whole collection

The obvious design would be to subscribe with the list's filters, so the server only sends matching changes. I didn't, because of something I wrote in the realtime post: `leave` and `delete` only go to subscribers who could see the document before, and that check runs in memory. A `like`, which is what the admin's search uses, is one of the things it can't decide, so it counts as not visible. A list subscribed with its search would never hear that a row it is showing was deleted.

So the list follows the whole collection and decides membership by asking the API. The trade-off is in the ADR: on a collection that is edited very often, a list with a narrow filter still gets every event. The end-to-end test happens to start from a search (`?q=Live`), which is the case this protects.

## One stream per browser tab

An admin tab can have a list open and a document drawer on top of it, and the user can move between pages quickly. If every view opened its own stream, one person with a few tabs would hit the server's per-user limit of 10 streams fast.

So every view in a tab shares one stream (`lib/realtime.ts`). Each view registers what it follows, a collection or one document; views following the same thing share one subscription on the stream.

The protocol from 1.47 doesn't let a stream change its subscriptions, so when a view opens or closes, the admin waits **100 ms**, so that a page change, which removes one subscription and adds another, opens one new stream rather than two, and then opens a new stream with the new set, starting from where the old one got to. For that, the core client got one option in 1.48.0:

```ts
const next = cms.subscribe(newSubscriptions, handlers, { lastEventId: stream.lastEventId })
stream.close()
```

`lastEventId` is where the stream got to: the last event's id, or the position that `ready` or a heartbeat reported. The new stream replays what came after it, so nothing between the two streams is missed.

That replay has a side effect the list has to handle. A view that just subscribed may receive events from before it loaded, replayed because the *stream* started from an older position. The shared stream marks events that arrive before a subscription's first `ready` as replays, and the list doesn't count those as new changes. A row on screen is still refreshed, because reading it again is harmless.

With one stream per tab, `maxPerUser` at its default of 10 means about ten admin tabs per user per server. The guide says so.

## The quiet parts

A few details that don't show in a screenshot:

- The banners and the "Updated" note are in an `aria-live="polite"` region, so a screen reader announces them without moving focus away from the field you are typing in.
- The Live dot stops pulsing under `prefers-reduced-motion`.
- There is no toast when the stream drops. The grey dot, with "Reconnecting…" as its tooltip, is the only signal.
- Every text is in English and Thai, as the rest of the admin.

The end-to-end test runs this as two admins in two browser windows, on the Next.js example. A renames a post and B's list row changes. A creates a draft in another tab and B sees "1 change", not a new row, until Show. A deletes it and B's row greys out. B opens the post and A's save loads silently. Then both edit, B keeps theirs, gets asked before overwriting, and A, with nothing unsaved, sees B's version arrive. Finally A deletes it while B is typing, and B's text stays but Publish is disabled.

## What is still missing

- **A server-side check for stale saves.** Two saves at the very same moment can still overwrite each other, because the server doesn't refuse stale saves yet. The admin narrows the window to a moment, but only a server that refuses a save made from an old version, with a `409`, closes it. That is planned, not built.
- **Presence and locking.** You aren't told who else has the document open. That is out of scope for this release.
- **Who saved.** The events don't carry it, so the banner can't say.
- **Cost on busy collections.** Each change the edit page sees reads the document once; each change on a list reads the changed rows, and asks the API about membership when there are filters.

## Try it

If your collections already have `realtime: true`, update to 1.48.0 and the admin is live; there is nothing else to turn on. The [In the admin section of the realtime guide](/docs/realtime#in-the-admin) describes each state, and [ADR-0071](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0071-admin-live-updates.md) has the reasoning. If your editors run into a case where the admin guesses wrong about whose save it was, I'd like to hear about it in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions).
