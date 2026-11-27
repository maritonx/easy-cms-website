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

### Server (production)

easycms.dev runs on a Hetzner Cloud server (CAX11, arm64, Ubuntu) with Docker: the `web`
container (this app, `Dockerfile`) and Caddy for HTTPS, defined in `deploy/compose.yaml`. The
SQLite database and uploads are files on the server's disk; no Turso, Blob store or S3.

On the server, `/srv/easycms` holds:

| | |
|---|---|
| `compose.yaml`, `Caddyfile` | copied from `deploy/` on every deploy |
| `studio/`, `studio.caddy` | Studio's files and site blocks, from the Easy CMS repo's releases |
| `.env` | the production variables, written by hand (mode 600, never committed) |
| `data/cms.db` | the database |
| `uploads/` | uploaded files |

`.github/workflows/deploy.yml` deploys every push to `main`: it builds the image on an arm64
runner, pushes it to `ghcr.io/maritonx/easy-cms-website` (tagged `latest` and the commit), and
the server pulls it and restarts `web`, which runs `easy-cms migrate` before it serves. It needs
the repository secrets `DEPLOY_HOST`, `DEPLOY_SSH_KEY` (the `deploy` user's key) and
`DEPLOY_KNOWN_HOSTS` (`ssh-keyscan <host>`).

The server's `.env`:

| Variable | Value |
|---|---|
| `EASY_CMS_SECRET` | the production secret: settings such as the Resend key are encrypted with it |
| `SITE_ADDRESS` | `easycms.dev, www.easycms.dev` (Caddy gets the certificates); `:80` to test on the IP |
| `CRON_SECRET` | what cron-job.org sends to `/api/cms/jobs/run` every minute |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in for the admin and Drive backups |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile on the contact form |
| `EASY_CMS_BACKUP_KEY` | optional: encrypts backups |

### Studio

Studio (`studio.easycms.dev`, its sandbox at `sandbox.easycms.dev`) is built in the Easy CMS
repo: its release workflow copies the files to `/srv/easycms/studio/` and its site blocks, with
their headers, to `/srv/easycms/studio.caddy`, which the Caddyfile imports, then reloads Caddy.
Here it needs only DNS records for `studio` and `sandbox` pointing at this server.

The sandbox runs code from shared links on a subdomain of this site. Its session cookies are
`__Host-` cookies, which subdomains never get; keep it that way: no cookie with
`Domain=easycms.dev` on this site.

Day to day, from the server (`ssh deploy@<host>`, `cd /srv/easycms`):

- Logs: `docker compose logs -f web`
- Starting content (new releases, posts): `docker compose exec web node --import tsx scripts/seed.mts`
- Roll back: `WEB_IMAGE=ghcr.io/maritonx/easy-cms-website:<commit> docker compose up -d web`
- Back up: Settings → Backups in the admin, or copy `data/cms.db` and `uploads/`

Without Docker, the same app runs as one Node process: Node 22.12 or later, `.env` with
`EASY_CMS_SECRET` and `SITE_URL`, then `pnpm install --frozen-lockfile && pnpm exec easy-cms
migrate && pnpm build` and `NODE_ENV=production pnpm start`, behind Caddy or nginx. Build on
the server's OS and architecture, since SQLite uses a native driver.

Until November 2026 the site ran on Vercel with a Turso database; `pnpm migrate:turso` and
`pnpm seed:turso` still reach that database while it exists.

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
