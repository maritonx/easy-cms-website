---
title: "Postgres (and SQLite) as a job queue: why our embedded CMS skips Redis"
slug: postgres-job-queue
language: en
category: Engineering
publishedAt: 2026-11-16
coverText: "UPDATE … WHERE"
excerpt: "How Easy CMS runs scheduled publishing, retries and backups once across several instances, with one conditional UPDATE and no Redis."
---
A CMS does a surprising amount of work when nobody is clicking. A post scheduled for 9:00 has to publish at 9:00. A webhook that got a 503 has to be sent again later. The nightly backup has to run. An email that failed has to be retried.

On one long-running server, that's a `setInterval`. It stops being simple when the same app runs as two instances behind a load balancer, or on Vercel, where nothing keeps running and a cron calls an endpoint once a minute. Now two processes can wake up at the same moment and both see "post 42 is due". If both act, the post publishes twice, the `afterChange` hook runs twice, and the webhook fires twice.

This post is how Easy CMS handles that without adding Redis. The core of it is one conditional `UPDATE`, and it works the same on Postgres and SQLite. If you're building your own app with a little background work, you can lift the pattern as it is. ([The first post in this series](FIRST_POST_URL) covers what Easy CMS is.)

## The bug that started it

Up to 1.2.0, the scheduled-publish runner read the due rows, did the work, and marked each row done afterwards. There was no lock between the read and the write, and webhook retries, email retries and backups had the same gap. The design record for this change (ADR-0052) puts it plainly: with two instances, both could pick the same job. It's a correctness bug, not a speed problem. The fix first reached npm in 1.3.0.

The usual fix is a real queue: BullMQ on Redis, or SQS. Easy CMS is an embedded CMS. It runs inside your Nuxt or Next.js app, next to a database you already have. A queue server is a second piece of infrastructure to run, back up and watch, for a workload the ADR estimates at hundreds to thousands of jobs per hour. The ADR's view is that Postgres handles that comfortably.

So the work stays in the database. pg-boss and Graphile Worker are built on the same idea for Postgres.

## Claim first, then work

Every piece of background work is a row. Before doing anything with a row, an instance claims it with an update that only succeeds if the row still looks the way it did when it was read. That's compare-and-set. If another instance got there first, the update matches nothing and this instance moves on.

The Easy CMS database adapter already had the tool for this. Since 0.46, `update()` takes an optional `where`, and returns `null` when the stored row no longer matches it. The claim helper in the core is short:

```ts
// packages/core/src/local-api.ts (trimmed)
private async claim(collection, row, changes, expect: Where): Promise<boolean> {
  const { id, ...data } = row
  return (
    (await this.db.update({ collection, id, data: { ...data, ...changes }, where: expect })) !==
    null
  )
}
```

And the scheduled-publish loop uses it like this:

```ts
// packages/core/src/local-api.ts (runScheduled, trimmed)
for (const row of due.docs) {
  const claimed = await this.claim(
    SCHEDULED_JOBS,
    row,
    { state: 'running', updatedAt: now.toISOString() },
    { state: { equals: 'pending' } },
  )
  // Another process took it.
  if (!claimed) continue
  // ... publish or unpublish, then set state to 'done' or 'failed'
}
```

On Postgres, the claim for one row comes out roughly as this. (The real statement also rewrites the row's other columns, because the adapter's `update()` takes the whole document.)

```sql
UPDATE ecms_scheduled_jobs
SET state = 'running', updated_at = $2
WHERE id = $1 AND state = 'pending'
RETURNING id;
```

![Two instances read the same pending job and send the same conditional UPDATE: one changes a row and runs the job, the other changes none and skips it](/images/blog/postgres-job-queue/diagram-1.png)

Why this is safe on each database:

- **Postgres.** If two transactions update the same row, the second waits for the first to commit. Then, at the default `READ COMMITTED` level, Postgres checks the `WHERE` again against the new version of the row. `state` is now `'running'`, so the second update changes zero rows and `RETURNING` gives nothing back.
- **SQLite.** There's only one writer at a time. The second `UPDATE` runs after the first one has committed and sees `'running'` too.

Same statement, same answer, no dialect-specific code.

## Why not `FOR UPDATE SKIP LOCKED`

That was the original plan. The tracking issue (#153) is still titled "Claim scheduled jobs and webhook deliveries with `SKIP LOCKED`". While working on it, I changed course, for two reasons the ADR records.

**It's not more correct.** Both approaches give each row to exactly one claimer. What `SKIP LOCKED` adds is less contention: workers skip rows another transaction has locked, so ten workers take ten different rows instead of all trying the first one. That matters at thousands of jobs per second. With two or three instances and a few rows a minute, the losing instance runs an `UPDATE` that matches nothing. That's the whole cost.

**It would change the adapter.** `SKIP LOCKED` needs a new `claim()` method on the database adapter. That interface is exported from `@easy-cms/core`, so the 1.0 stability promise covers it. SQLite has no `SELECT ... FOR UPDATE` at all, so it would need a second implementation anyway. The `update ... where` that already existed works on both.

## A lease, without a new column

Claiming solves "two instances at once". It doesn't solve "one instance claimed a job and then died" (a deploy, a crash, a serverless function hitting its time limit). That row would sit in `running` forever.

So a claim is a lease. The scheduled-publish claim stamps `updatedAt`. Every run first puts back anything that has been `running` for more than 10 minutes, with the same compare-and-set so two instances can't both put it back:

```ts
// packages/core/src/local-api.ts (runScheduled, trimmed)
const expired = new Date(now.getTime() - JOB_LEASE).toISOString() // JOB_LEASE = 10 minutes
// for each row that is 'running' with updatedAt < expired:
await this.claim(
  SCHEDULED_JOBS,
  row,
  { state: 'pending', updatedAt: now.toISOString() },
  { and: [{ state: { equals: 'running' } }, { updatedAt: { lt: expired } }] },
)
```

Webhook and email retries already had a `nextAttemptAt` column. A claim moves it 5 minutes into the future before sending, so a delivery whose sender died simply becomes due again. If you've used SQS, it's the same idea as a visibility timeout. Backups are claimed with `state = 'pending'`.

None of this needed a migration. The lease lives in columns the rows already had.

## Your own jobs: one row per job

Apps and plugins can add their own recurring jobs:

```ts
// easy-cms.config.ts
export default defineConfig({
  // Times of day below are in this zone. Default: the server's (often UTC on serverless).
  timeZone: 'Asia/Bangkok',
  jobs: [
    { name: 'feed:import', every: 600, run: ({ cms }) => importFeed(cms) },
    { name: 'sitemap:refresh', at: '02:00', adminSchedule: true, run: refreshSitemap },
  ],
})
```

These aren't rows in a queue. They're schedules. Since 1.3.0, each one has a row in an internal `job-runs` table, with a unique `name` and a `lastRunAt`. This table did need a migration: apps with `jobs` run `easy-cms migrate:create` once and deploy it. An instance claims a run by moving `lastRunAt` from the value it read to now:

```ts
// packages/core/src/local-api.ts (runConfigJobs, trimmed)
if (!due(row.lastRunAt)) continue
claimed = await this.claim(
  JOB_RUNS,
  row,
  { lastRunAt: stamp, lastStatus: 'running', updatedAt: stamp },
  { lastRunAt: { equals: String(row.lastRunAt) } },
)
```

The first run of a new job creates its row instead. The unique `name` acts as the claim there: if two instances insert at once, one insert fails, and that instance skips the job.

**Missed runs fire once.** The due check only compares the last run with the most recent time the job should have run. It doesn't count how many times were missed. A daily 02:00 job on a server that was down for three days runs once when jobs run again, then goes back to its schedule. That's usually what you want from a sitemap refresh. It's wrong for "charge each customer once a day", and that kind of work belongs in rows of its own.

The guide is honest about the other edge: a run that stops half-way isn't retried until its next time. Write jobs so that running twice does no harm.

## One claim path for the server and the cron

There are three ways background work gets started:

| Where | What calls `runJobs()` |
|---|---|
| Long-running server (Nuxt, `easy-cms serve`, self-hosted Next.js) | An in-process timer, every minute |
| Serverless (Vercel, Netlify) | A cron or scheduled function calling `GET <api>/jobs/run` with `Authorization: Bearer $CRON_SECRET` |
| Anywhere else | `npx easy-cms jobs:run` from any cron |

```json
// vercel.json — Vercel Cron sends Authorization: Bearer $CRON_SECRET
{ "crons": [{ "path": "/api/cms/jobs/run", "schedule": "* * * * *" }] }
```

All three call the same `runJobs()`, so they all go through the same claims. Inside one process, `runJobs()` also chains each run onto the previous one, so the timer and a cron request arriving at the same moment wait for each other. Across processes, the database decides.

The tests check exactly this. Two instances on one database call the runner at the same time, and each of 8 scheduled posts must publish once, with its `afterChange` hook called once. Another test fakes a job claimed 11 minutes ago and checks that it comes back. CI runs these suites on SQLite, PGlite and a real Postgres 17.

## Make the queue visible

A queue in your own tables is easy to forget, and on serverless the usual failure isn't a race. It's a cron nobody set up. Settings → Jobs (1.4.0) shows each job's schedule, last run, duration, result and next run, plus the queue of scheduled publishes. Admins can pause and resume a job, and change the schedule of jobs marked `adminSchedule`. Since 1.4.1, the page warns when nothing has run jobs for 10 minutes. That warning will probably catch more real problems than the claim code.

[TODO: your story — one line on whether you've seen the missing-cron case on a real Vercel deploy, or remove]

## When you want a real queue

This design is right for a CMS-sized workload. It's the wrong tool if you need:

- **Throughput.** Thousands of jobs per second, or many workers draining one queue. Here `SKIP LOCKED` (pg-boss, Graphile Worker) or a dedicated queue earns its keep. I haven't benchmarked Easy CMS's runner, and I won't claim numbers for it.
- **Low latency.** Work is picked up by polling: once a minute on a server, or as often as your cron calls (the Netlify guide uses every five minutes). Nothing is pushed.
- **Priorities and rate limits.** ADR-0052 lists both as not done.
- **Long or parallel jobs.** One run does its work in order, so a slow job delays the next one. The 10-minute lease also assumes a publish never takes that long.
- **A queue shared between services.** If several apps produce and consume jobs, that queue isn't part of any one app's database.

## The lesson for your own app

If your background work fits in a few hundred rows an hour, you probably don't need a queue server. You need three things:

1. **A row per piece of work**, with a state or a timestamp you can compare.
2. **A claim that's one conditional `UPDATE`**, where "zero rows changed" means someone else has it. Any database with transactions can do this, ORMs included.
3. **A lease**, so work claimed by a process that died comes back after a timeout.

Then make it visible, because the bug you'll actually hit is the cron that never ran.

---

Easy CMS is MIT-licensed: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [docs](/docs). If you try it, tell me what got in your way in the [feedback issue](https://github.com/maritonx/easy-cms/issues/137).

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
