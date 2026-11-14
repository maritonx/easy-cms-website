---
title: "One CMS server on Node, Bun, Deno and Cloudflare Workers, smoke-tested on every pull request"
slug: four-runtimes
language: en
category: Engineering
publishedAt: 2027-03-08
coverText: "bun · deno · workers"
excerpt: "How Easy CMS went from Node-only to Bun, Deno and Cloudflare Workers in one day of releases. What had to change (crypto, the file system, streams, the database), what still needs Node.js, and the CI matrix that has to pass before a runtime counts as supported."
---
Until 13 November 2026, Easy CMS ran on Node.js and nothing else. On that day two releases came out. 1.44.0 moved every Node-specific import in the core into one folder, and 1.45.0 added `easy-cms build --target workers`. Since then the standalone server, the admin and the REST API, also runs on Bun, Deno and Cloudflare Workers.

This post is about what had to change for that, what still needs Node.js, and the CI matrix behind the word "supported". The short version of the rule I set: a runtime is supported when a smoke test on it passes in CI, on every pull request that changes code. Not when it starts on my laptop.

## Why I said no first

Eleven days earlier, on 2 November, I had written down that Easy CMS would not support edge runtimes. The reasons were concrete: passwords hashed with scrypt, image resizing with sharp, database drivers that open TCP sockets, email over SMTP, and uploads written to disk. None of those exist in a Cloudflare Worker the way they exist in Node.

What changed my mind was the [roadmap](/blog/more-than-a-cms). If Easy CMS is going to be a backend you write once in TypeScript, "once" has to include where it runs: a VPS with SQLite on disk, Bun, Deno, and a Worker with Turso and R2. So I wrote [ADR-0067](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0067-multi-runtime.md) and looked at how much of the core was really tied to Node.

The answer was less than I feared. The core imported `node:*` modules in 21 files. Most of them were HMACs, hashes and random values, which every one of these runtimes has. The parts that really needed a machine were few: disk storage, loading the config file, admin modules, backups' scratch files, and downloading a file from a URL.

## One folder for Node

The core already handled requests as `(Request) => Promise<Response>`, the Web standard, from the first versions. The work was everything around the handler. The goal is a core that uses Web APIs only (`fetch`, `Request` and `Response`, `crypto.subtle`, streams). The path there is one rule: only `packages/core/src/runtime/` may import `node:*`.

- `runtime/crypto.ts`, `runtime/bytes.ts` and `runtime/context.ts` may use `node:crypto`, `node:buffer` and `node:async_hooks`, which Node, Bun, Deno and Workers (with `nodejs_compat`) all have.
- `runtime/node/` holds what needs a disk or a socket: disk storage, files and modules, and downloads from a URL.
- Everywhere else in the core, Biome refuses `node:*` imports and the `Buffer` global, with a message that points to `runtime/bytes.ts`.

A lint rule only sees the source, so a test also walks the built package from `dist/index.js` and lists every Node module it reaches. The list must be exactly the three shared modules plus the server-only ones (`fs`, `path`, `http`, `net` and a few more). A new Node module makes the test fail, with a comment saying to put it behind `runtime/` and decide which list it belongs on.

I liked this split because it moves the decision to one place. `runtime/crypto.ts` still wraps `node:crypto` for hashes, HMAC, HKDF and AES-GCM, but each function can move to Web Crypto on its own without touching the rest of the core. When TC39's `AsyncContext` lands, it replaces `AsyncLocalStorage` in `runtime/context.ts` and nowhere else.

## Crypto: a smaller scrypt

Hashing a password was the first real conflict. Easy CMS used scrypt with N=2^17, r=8, p=1, which needs 128 MB of memory. A Worker has 128 MB in total.

1.44.0 changed the parameters to N=2^15, r=8, p=3, which needs 32 MB. OWASP counts both as equally strong: the extra parallelism makes up for the smaller memory cost. The trade-offs I accepted with it:

- **Old hashes still work.** Each hash stores its parameters (`scrypt$N$r$p$salt$hash`), so existing passwords verify, and the hash is replaced with the new parameters at the next successful sign-in.
- **A hash that asks for too much is refused.** One with N times r above the old setting is not computed at all, so a tampered hash can't make the server allocate a gigabyte.
- **Some reset links break once.** A password-reset link is tied to the current hash. A link sent before someone's first sign-in after the upgrade stops working when the hash changes. That is in the ADR as a known cost.

There is also a cost on Workers that no parameter fixes. Checking a password takes about 100 ms of CPU, and the Workers Free plan allows 10 ms per request. On Free, signing in fails with error 1102. The deploy guide says Workers Paid up front for that reason.

## The file system: what a Worker doesn't have

A Worker has no disk and no process that keeps running. Three things went wrong because of that, and each one is now a line in the 1.44.0 changelog.

**The config loader stopped the Worker at startup.** Easy CMS reads `easy-cms.config.ts` with jiti, and jiti was imported when the core loaded. Its CommonJS code requires `os`, and that was enough to stop the Worker before it served anything. Now jiti is loaded only when a config file is actually read, and the Worker never reads one: the build bundles the config into it.

**Migrations needed their files.** In production, Easy CMS compared the database with the migration files on disk before starting. A Worker can't read those files. Now a database whose last migration matches the config starts without them. A config that changed since that migration is still refused, with a 500 that says so, so you can't deploy a Worker ahead of its migrations by accident.

**Uploads need somewhere to go.** A Worker can't use disk storage, so `createWorker(config)` throws at startup when `upload.storage` isn't set, with an example using `s3Storage()` and an R2 bucket. The build checks the same thing before writing anything.

Two smaller pieces came with the build in 1.45.0. The admin is a Vue app that the Node server reads from a directory; on Workers, the admin handler gets a `readFile` option and reads the app through the Worker's `ASSETS` binding. And the client's IP for rate limits and the audit log comes from `CF-Connecting-IP`.

## Streams and the database

Streams were the easiest part, because the handler already spoke Web streams. On Node, `easy-cms serve` turns Node's request into a Web `Request` with `Readable.toWeb` and pipes the `Response` back with `Readable.fromWeb`. On Workers there is nothing to convert: `fetch` hands the handler a `Request` directly. Backups are compressed with the Web `CompressionStream`.

Realtime, which came in 1.47.0, needed one change for Workers. On a Node server one process can write a save into every open stream. On Workers, one request can't write to another request's stream, so each stream polls the events table itself. The smoke test covers that case.

The database was simpler than I expected, for one reason: SQLite in Easy CMS goes through libSQL, and the same `sqlite()` adapter takes a `libsql://` URL and an auth token. On Workers the database is Turso, reached over HTTP. Postgres needs a TCP socket, so it isn't part of the Workers setup today; the ADR lists Hyperdrive as the way to get there.

## The Worker itself

The build writes everything Wrangler needs:

```bash
npm install -D wrangler
npx easy-cms build --target workers
npx wrangler deploy
```

`.easy-cms/workers/` gets the Worker's entry and the admin app. The entry is three lines: it imports `createWorker` from `easy-cms/workers` and your config, and exports `createWorker(config)`. The Worker's `fetch` goes to the same standalone handler as `easy-cms serve`, and `scheduled` runs the job queue.

The first build also writes a `wrangler.jsonc`, and after that it is yours. It has `nodejs_compat`, the `ASSETS` binding, a Cron Trigger every minute for scheduled posts, webhook retries and queued emails, and aliases for packages that can't run on Workers (`sharp`, `@opentelemetry/api` and `drizzle-kit/api`). The aliases point at a stub that throws on import, which is what Easy CMS already handles when an optional package isn't installed. So the core goes on without them.

## Bun and Deno

Once the core had its `runtime/` folder, Bun and Deno needed no code of their own: the pull request that added them changed only the CI workflow and the smoke scripts. The CLI starts with `#!/usr/bin/env node`, so you have to name the runtime when you run it:

```sh
bunx --bun easy-cms migrate
bunx --bun easy-cms serve

deno run -A npm:easy-cms migrate
deno run -A npm:easy-cms serve
```

Both implement enough of Node's `http` and `fs` for `easy-cms serve`, migrations and disk storage. Without `--bun`, `bunx` would follow the shebang and quietly start Node, and the test would pass for the wrong runtime. That is why the smoke test runs exactly the commands the guide shows. A doc that says one thing while CI runs another is how support quietly stops being true.

## What still needs Node.js

This is the list I'd want to read before choosing a runtime:

- **Easy CMS inside Next.js or Nuxt** needs Node.js 22.12 or newer. Bun, Deno and Workers run the standalone server, not the framework integrations. Sites on the edge can still read content over REST with `@easy-cms/core/client`, which has no imports at all.
- **Image resizing** uses sharp. On Workers, `upload.imageSizes` makes no copies; images still get their width and height.
- **SMTP** needs Node. On Workers, use Resend, Postmark or Brevo from `@easy-cms/plugin-email`, which send over HTTP.
- **Disk storage** and **SQLite on a disk** need a disk, so on Workers it's Turso and R2 (or any S3 storage).
- **Backups** still write a scratch file before they compress it, and **downloads from a URL** use Node's `http` and `dns` to check addresses. Both live in `runtime/node/`. The ADR plans versions for Workers. Until a smoke test covers them, I don't list them as working there.
- **Other edge runtimes**, such as Vercel Edge Functions, are not supported.

The ADR also lists what comes after: Nuxt on Cloudflare through Nitro, Next.js through OpenNext, D1, and an adapter for image resizing.

## How CI proves it

ADR-0067 defines "supported" as a smoke test: start the server, wait for `/healthz`, create an admin, sign in, create, read, update and delete, upload, and read through REST. The CI workflow runs it as a matrix. On a pull request that changes code there are five jobs:

- Node with pnpm on Linux, and Node with npm on Windows
- Bun, installed with bun and run with `bunx --bun`
- Deno, installed with npm and run with `deno run -A npm:easy-cms`
- Cloudflare Workers, installed with npm and run in `wrangler dev`

On `main` the Node part grows to every package manager: npm, pnpm, Yarn stable, Yarn 1.22.22 and bun on Linux, and npm and pnpm on Windows. A pull request that only changes docs runs lint only.

![The smoke test on every pull request: five jobs (Node on Linux and Windows, Bun, Deno and Cloudflare Workers) publish the packages to a local registry, create a project, migrate, start the server and use it through REST; the Workers job also checks the admin from Workers Assets, the Cron Trigger and a realtime stream](/images/blog/four-runtimes/diagram-1.png)

Each job does what a new user would. The packages from the pull request are published to a local Verdaccio registry, so nothing from npmjs leaks in. Then `npm create easy-cms` (or `pnpm create`, `bun create`) makes a new project. The script checks the lockfile of that package manager exists and that the installed `@easy-cms/core` is the version just published. Then it runs `migrate:create init`, `migrate` and `admin:create` on the runtime, and starts the server.

Against the running server, the job:

1. waits for `/healthz`, for up to 120 seconds, and fails at once if the server exits;
2. signs in and keeps the CSRF token;
3. uploads a one-pixel PNG and downloads it again, byte for byte;
4. creates a post with that image as its cover, changes its title, and reads it back without signing in, the way a site would;
5. deletes the post and the image, and checks the post now answers 404.

The Workers job does more. It adds `@easy-cms/storage-s3` and Wrangler, starts sqld (the server Turso runs) and a local S3 server in Docker, and builds the Worker. After the steps above, it loads the admin from the `ASSETS` binding, calls `/__scheduled` to run the Cron Trigger and fails on any error the jobs print, and opens a realtime stream that must receive a post created through REST.

None of it needs a Cloudflare account. That is also the honest limit of the check: it runs workerd on the CI machine, and deploying to Cloudflare itself isn't part of it.

## What I'd do the same way again

Drawing the line at the folder level paid off more than any single fix. Most of the 21 files only needed a different import, and the problems that were left (jiti, migration files, scrypt memory) were each one small, separate change.

Writing "supported means a smoke test passes" into the ADR helped too. The ADR even says the word "Edge-ready" may only be used in marketing once the Workers smoke test passes in CI. The Workers smoke job was merged before the 1.45.0 release, and only then did the website say "Now runs on Cloudflare Workers, Bun and Deno".

## Try it

The guides are [Bun and Deno](/docs/standalone#bun-and-deno) and [Deploy on Cloudflare Workers](/docs/deploy/cloudflare-workers). To start a standalone project:

```bash
npm create easy-cms@latest my-cms
```

If you run Easy CMS on one of these runtimes and something on the "still needs Node" list matters to you, or you hit something the smoke test missed, tell me in [GitHub discussions](https://github.com/maritonx/easy-cms/discussions).
