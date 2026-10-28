---
title: "Our CMS at a million documents: what we measured, what we fixed, what is still slow"
slug: scale-1m
language: en
category: Engineering
publishedAt: 2027-02-01
coverText: "1,000,000"
excerpt: "A nightly load test with 1,000,000 posts and 200 editors showed where an embedded Node.js CMS on Postgres spends its time. Cursors, trigram indexes, HTTP caching and an outbox, without adding Redis."
---
Easy CMS is a headless CMS that runs inside your Nuxt or Next.js app, on your own Postgres or SQLite. Since 1.0 the question I hear most from teams is the obvious one: does it hold up when the content does?

So before changing anything, I measured. This post is what a million documents taught me: the numbers, the four fixes, the things I didn't add, and what is still slow.

## The test

A GitHub Actions workflow runs every night at 03:00 Bangkok time:

- Postgres 17 in Docker on a 4-core runner, and `easy-cms serve` in front of it.
- **1,000,000 posts**, written through the Local API the way an app writes them: Thai text with English titles, drafts and versions, a category, tags and blocks.
- **200 editors** at once for five minutes: 90% reads, 10% saves.
- A separate run with 20 concurrent requests per kind of request, to see each one on its own.

The workflow fails when any kind of request is more than 20% slower (p95) than the median of the last seven nights. The 200 ms target from the requirements is reported, not enforced: a target the code can't meet yet would just make the workflow red every night.

The first lesson came before any number. At a million rows, Postgres started answering with 500s: "could not resize shared memory segment". Parallel queries share memory through `/dev/shm`, and Docker gives a container 64 MB of it by default. `--shm-size=1g` fixed it. If you run Postgres in Docker with a large table, check yours.

## What was fast from the start

Lookups by id or slug, and the first page of a list, were fine at a million rows: an index is an index. The first run also showed the problems, all in the mixed load. Reads under 200 editors had a p95 of about 30 seconds.

Nothing was broken. A few slow kinds of request held Postgres connections long enough that every other request waited for one. One slow query slows everything.

## Fix 1: stop counting every page (1.8)

Every paginated list returned `totalDocs` and `totalPages`, so every page ran a `count(*)` over the whole match. With a million rows, that count was the expensive part of most list requests.

Two changes:

- `count: false` (REST `?count=false`) skips it. `hasNextPage` comes from fetching one row more. Archives and infinite scroll don't need a total.
- Counts of the same list are reused for `countCacheSeconds`, 5 seconds by default. The documents are always current; only the total can be that old. A list fifty editors have open is counted once in that time, not fifty times.

## Fix 2: cursors for deep pages (1.9)

`OFFSET 500000` makes Postgres read and discard half a million rows. The fix is old and well known: remember where the page ended and continue from there.

```ts
const page = await cms.find('posts', { cursor: '', limit: 20 })
const next = await cms.find('posts', { cursor: page.nextCursor, limit: 20 })
```

The cursor encodes the sort values of the last row and belongs to its query: the same `where`, `sort` and locale, or it is refused. The next page by cursor, deep in the list, has a p95 of 37 ms. A random page by number deep in the list is still 6.8 s, and 7.3 s without totals, which proves the time goes to skipping rows, not counting them.

The admin keeps page numbers, because editors use them. API clients get `maxPage`, which caps how deep they may page by number and points them to `cursor`.

## Fix 3: searching Thai without reading every row (1.10)

Thai is written without spaces between words. A search for part of a title is a `like '%…%'`, and a b-tree index can't help with a pattern that starts with `%`.

A trigram index can. `index: 'trigram'` on a text field makes a GIN `pg_trgm` index, and Postgres uses it for `like` on any substring:

```ts
{ name: 'title', type: 'text', localized: true, index: 'trigram' }
```

A Thai search at a million posts now has a p95 of 79 ms. Two caveats came out of the test:

- **Trigrams need three characters.** A search for one or two characters can't use the index and reads every row. A search for 1 to 3 digits still has a p95 of 3.4 s.
- **The database's `LC_CTYPE` matters.** With `C`, `pg_trgm` doesn't treat Thai letters as letters and the index finds nothing useful. Easy CMS now warns at startup when that is the case.

## Fix 4: let the CDN answer (1.11)

Most requests to a CMS are reads of published content, and they are the same for everyone. Instead of a cache inside the app, Easy CMS can now send HTTP caching headers: `s-maxage`, `stale-while-revalidate`, a weak `ETag`, and cache tags (`ecms:posts:42`). Saving, publishing or deleting a post calls `purge` with the tags that changed, which in Next.js is `revalidateTag`.

Anything with a login, a session, an API key or drafts stays `no-store`. Getting that wrong would show one person's drafts to everyone, so the rules are deliberately narrow.

## What I didn't add: Redis

Every step of this had a "just add Redis" answer: a Redis cache, a Redis job queue, Redis for rate limits. Each would have been one more server for every team that self-hosts.

I wrote the decisions down instead:

- The job queue stays in Postgres (or SQLite), claimed with a conditional `UPDATE` ([an earlier post](/blog/postgres-job-queue) explains how).
- Caching goes to HTTP and the CDN the team already has.
- If a measurement ever shows Redis is needed, it comes as an optional adapter.

The same thinking gave 1.12 an **outbox**: after hooks, webhooks and cache purges are written in the same transaction as the save, then run and retried by a worker. A purge that fails no longer leaves a stale page behind until someone notices.

## Search, and a bug with sara am (1.13)

Trigram indexes find substrings. Relevance ranking across fields and collections needs a search engine, so 1.13 adds a search adapter interface and a first adapter, `memorySearch()`, for development and small sites. It splits words with `Intl.Segmenter`, the dictionary-based word breaks of ICU that Node ships with. `ข่าวน้ำท่วมกรุงเทพมหานคร` ("flood news, Bangkok") becomes ข่าว | น้ำ | ท่วม | กรุงเทพมหานคร.

The first version normalized text with NFKC before splitting, as you do to make text comparable. The test searching for `น้ำท่วม` (flood) failed. NFKC decomposes sara am (ำ) into two characters, nikhahit and sara aa. The text looks the same, but ICU's dictionary no longer recognizes the word, and `ข่าวน้ำท่วม` came out as ข่า | วน้ํา | ท่วม. NFC keeps sara am whole. If you normalize Thai before searching it, use NFC.

## The numbers now

On 1.15, with 20 concurrent requests per kind, as the median of three runs (each run gets a different runner, and the same request can differ by about 40% between them):

- A post by id or slug: **27 ms** (p95)
- The first page of a list: **36 ms**
- The next page by cursor, deep in the list: **37 ms**
- Thai `like` search with a trigram index: **79 ms**
- Saving a draft, with a version: **104 ms**

![Bar chart of p95 times at 1,000,000 posts on a log scale: lookups, cursors and Thai search under 110 ms; relationship filters, digit searches, deep pages and queries inside blocks between 1.8 and 6.8 seconds](/images/blog/scale-1m/diagram-1.png)

Under 200 editors, reads went from about 30 s to 18 s at p95. That is better, and still far from good.

## What is still slow

- **Filter by a relationship, sort by date:** p95 1.8 s.
- **Queries inside blocks** (`layout.blockType`): p95 6.0 s. Blocks are stored as JSON; there is no index for that path yet.
- **Deep pages by number:** 6.8 s. Use cursors.
- **Saves under the mixed load:** p95 31 s, because they wait for connections the slow reads hold.

The [Databases guide](/docs/databases#at-1000000-posts) lists all of it, and every number in this post comes from there or from the workflow. Measuring first changed what I built. I had expected the database to be the limit. Instead it was a handful of query shapes holding connections, and each fix only counted once the nightly number moved.

If you run Easy CMS, or any Node.js app on Postgres, with large tables, I'd like to hear what your slow queries look like: [GitHub discussions](https://github.com/maritonx/easy-cms/discussions).
