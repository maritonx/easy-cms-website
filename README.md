# easy-cms.io

The website for [Easy CMS](https://github.com/maritonx/easy-cms): home page, docs, blog, changelog
and showcase. It is a Next.js 16 app that runs Easy CMS itself.

| Part | Where the content lives |
|---|---|
| Home | `app/page.tsx`; the announcement badge and latest posts come from the CMS |
| Docs | Markdown in `content/docs/en`, built into static pages |
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

- `lib/docs/sidebar.ts` maps each file in `sidebar.json` to its URL (`guide/next` → `/docs/next`).
- `lib/docs/content.ts` turns VitePress syntax into HTML: `::: info|tip|warning|details`,
  `::: code-group`, `bash [pm]` blocks (one tab per package manager), `<Screenshot>`, fence titles
  and highlighted lines. Links between pages are rewritten to site URLs.
- `lib/docs/commands.ts` is copied from `create-easy-cms`, so the docs translate npm commands the
  same way the scaffolder does.

## Deploying

- Set `EASY_CMS_SECRET` (at least 32 characters) and `DATABASE_URL` (a Turso/libSQL URL, or switch
  to `@easy-cms/db-postgres`) in the host's environment, and `SITE_URL` to the public address.
- Before the first deploy: `pnpm exec easy-cms migrate:create init`, commit `easy-cms/migrations`,
  and run `pnpm exec easy-cms migrate` where you deploy.
- Uploads go to `uploads/` on disk; use `@easy-cms/storage-s3` on serverless hosts.

## Scripts

| Script | |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm docs:fetch` | Fetch the docs again |
| `pnpm seed` | Starting content for an empty database |
| `pnpm typecheck` | Route types and `tsc` |
| `pnpm lint` | ESLint |
