# easy-cms.io

The website for [Easy CMS](https://github.com/maritonx/easy-cms): home page, docs, blog, changelog
and showcase. It is a Next.js 16 app that runs Easy CMS itself.

| Part | Where the content lives |
|---|---|
| Home | `app/page.tsx`; the announcement badge and latest posts come from the CMS |
| Docs | Markdown from the Easy CMS repo, English at `/docs` and Thai at `/th/docs`, built into static pages |
| Blog, Changelog, Showcase | Easy CMS collections `posts`, `releases`, `showcase`, edited at `/admin` |

## Run it

```bash
pnpm install
pnpm seed
pnpm dev
```

`pnpm seed` creates the SQLite database (`cms.db`) and fills empty collections with the starting
posts, releases and showcase entries. `pnpm seed --reset` replaces them. Open `/admin` to create the
first admin user.

## Docs

The docs are written in the Easy CMS repo, next to the code: `website/guide`, `website/reference`,
`website/th` and `website/sidebar.json` (the navigation, shared with the VitePress site).
`scripts/fetch-docs.mjs` copies them into `content/docs`, and the admin screenshots into
`public/screenshots`. Neither is committed here.

| | Docs come from |
|---|---|
| `pnpm build` (always fetches) | the commit `@easy-cms/core@latest` was published from, read from its npm provenance |
| `DOCS_REF=main pnpm build` | a branch, tag or commit of `maritonx/easy-cms` |
| `DOCS_SOURCE=../EasyCMS` | a local checkout; put it in `.env.local` to write docs and see them here |

`pnpm dev` fetches only when `content/docs` is missing; `pnpm docs:fetch` fetches again.

Rendering:

- `lib/docs/sidebar.ts` maps each file in `sidebar.json` to its URL in each language (`guide/next` → `/docs/next` and `/th/docs/next`). `components/docs/doc-page.tsx` renders both; `lib/docs/i18n.ts` has the page's own words.
- `lib/docs/content.ts` turns VitePress syntax into HTML: `::: info|tip|warning|details`,
  `::: code-group`, `bash [pm]` blocks (one tab per package manager), `<Screenshot>`, fence titles
  and highlighted lines, and `{#id}` heading anchors (the Thai pages keep the English anchors).
  Links between pages are rewritten to site URLs in the page's language.
- `scripts/build-search.mts` builds the search indexes before `next build`: `public/pagefind`
  (English) and `public/pagefind-th` (Thai); the search dialog uses the one for the page's language.
- `lib/docs/commands.ts` is copied from `create-easy-cms`, so the docs translate npm commands the
  same way the scaffolder does.

## Deploying

Schema changes ship as migrations: after changing `easy-cms.config.ts`, run
`pnpm exec easy-cms migrate:create <name>` and commit `easy-cms/migrations`. Production runs
`easy-cms migrate` before the new version starts. A database made by development push (your local
`cms.db`) can't take migrations; production databases start empty and are migrated.

### Vercel (trial)

Uses a Turso database, since Vercel has no persistent disk. `vercel.json` runs the migrations
before each build.

1. Create a Turso database: `turso db create easy-cms-io`, then `turso db show --url easy-cms-io`
   and `turso db tokens create easy-cms-io`.
2. Import `maritonx/easy-cms-website` in Vercel and add these environment variables:

   | Variable | Value |
   |---|---|
   | `EASY_CMS_SECRET` | `openssl rand -hex 32` |
   | `DATABASE_URL` | the `libsql://…` URL |
   | `DATABASE_AUTH_TOKEN` | the Turso token |
   | `SITE_URL` | the deployment's address |
   | `DOCS_REF` | `main`, until an Easy CMS release includes `website/sidebar.json` |

3. Put `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in `.env.turso` (not committed), then fill the
   database once from your machine with `pnpm seed:turso`. `pnpm migrate:turso` runs pending
   migrations against it. Keep these out of `.env`: `pnpm dev` reads `.env` and would push the
   development schema into the Turso database. Open `/admin` to create the first admin.

Limits of the trial: uploads are not kept between deploys (add `@easy-cms/storage-s3` for that),
and Vercel Hobby crons run once a day, so scheduled publishing isn't on time.

### VPS (production)

One Node process with the SQLite file and uploads on the server's disk; no Turso or S3 needed.
Scheduled publishing works because the server keeps running.

- Node 22.12 or later; build on the server (or the same OS and architecture), since SQLite uses
  a native driver.
- `.env` with `EASY_CMS_SECRET` and `SITE_URL`; `DATABASE_URL` defaults to `file:./cms.db`.
- Deploy: `pnpm install --frozen-lockfile && pnpm exec easy-cms migrate && pnpm build`, then
  `NODE_ENV=production pnpm start` from the project root, under systemd or pm2, behind Caddy or
  nginx for HTTPS.
- Back up `cms.db` and `uploads/` (see the Backups guide).

## Scripts

| Script | |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm docs:fetch` | Fetch the docs again |
| `pnpm seed` | Starting content for an empty database |
| `pnpm migrate:turso` / `pnpm seed:turso` | The same against the Turso database in `.env.turso` |
| `pnpm typecheck` | Route types and `tsc` |
| `pnpm lint` | ESLint |
