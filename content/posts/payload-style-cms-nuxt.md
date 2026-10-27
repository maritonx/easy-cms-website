---
title: "Building a Payload-style CMS that lives inside your Nuxt app"
slug: payload-style-cms-nuxt
language: en
category: Engineering
publishedAt: 2026-10-26
coverText: "inside your app"
excerpt: "Easy CMS is an embedded, code-first headless CMS for Nuxt and Next.js. Content in TypeScript, an admin at /admin, no second server."
---
Nuxt has a great Git-based CMS. What it doesn't have is a mature CMS that lives inside your app and keeps content in a database, the way Payload does for Next.js. Payload runs *inside* a Next.js app. With Nuxt, it still runs *next to* your app.

I build websites for clients, some in Nuxt and some in Next.js, and I kept wanting that missing piece. So I built it: **Easy CMS**, an open-source (MIT) headless CMS that you install into a Nuxt or Next.js app with npm. Next.js developers are welcome too: both frameworks get the same features.

## The problem

My clients build their sites in Vue or React, and they want a back office their editors can use, in Thai and in English. For a developer, that back office should be just another npm package: versioned with the app, reviewed in pull requests and deployed with it.

Here's what a Nuxt developer could pick from (as of October 2026):

- **Nuxt Content + Nuxt Studio.** It's free, MIT and self-hosted, and it's excellent when your content is Markdown. But it's Git-based: an edit becomes a commit. It doesn't give you records in a database, roles, or data that users create.
- **Payload.** It's great, and you can [call its Local API from Nuxt](https://payloadcms.com/docs/local-api/outside-nextjs). But its admin is React and needs a Next.js (or, in the v4 beta, TanStack Start) host. That means two apps, two deploys, and an admin you can't extend with Vue.
- **Directus or Strapi.** Both are solid, but each is another server to deploy, update and keep in sync.
- **Sanity or Contentful.** Both work well, but your content lives on their cloud.

What I wanted was what Payload gives Next.js developers: content defined in code, an admin included, and one app to deploy. I wanted it for Nuxt too.

## What I built

Easy CMS runs inside your app's server. You describe your content in `easy-cms.config.ts`, and you get an admin at `/admin`, a typed Local API for your pages and a REST API at `/api/cms`.

![The Easy CMS dashboard](/screenshots/dashboard-en-light.webp)

## Try it in two minutes

Inside an existing Nuxt 4 or Next.js 15+ app (Node.js 22.12 or newer, 22.19 with Nuxt):

```bash
npm create easy-cms@latest
npm run dev   # open http://localhost:3000/admin
```

The command detects Nuxt or Next.js and installs the packages. It writes `easy-cms.config.ts` with a sample `posts` collection, puts a random secret in `.env`, and wires up the framework: a module for Nuxt, route handlers for Next.js. When you open `/admin`, it asks you to create the first admin.

The config is plain TypeScript:

```ts
// easy-cms.config.ts
import { defineConfig } from '@easy-cms/core'
import { sqlite } from '@easy-cms/db-sqlite'

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET!,
  db: sqlite({ url: 'file:./cms.db' }),
  collections: [
    {
      slug: 'posts',
      drafts: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', from: 'title' },
        { name: 'body', type: 'richText' },
      ],
    },
  ],
})
```

Reading content in Nuxt is a server route:

```ts
// server/api/posts.get.ts
export default defineEventHandler(async () => {
  const cms = await useEasyCMS()
  return cms.find('posts', { sort: '-createdAt', limit: 10 })
})
```

`find` returns only published documents by default. `post.title` is typed as `string` because the config says it's a required text field. In development the database schema follows the config: save the file, and the admin shows the new fields.

![Editing a post in the admin](/screenshots/edit-en-light.webp)

In Next.js, you call `getEasyCMS(config)` in a Server Component. With no framework at all, `npm create easy-cms@latest my-cms` gives you a standalone server on port 4000 that any frontend can call.

The admin covers what editors usually ask for: drafts and scheduled publishing, version history with restore, live preview, a media library with folders, roles set in the admin, single sign-on, an audit log, backups and a ⌘K command palette.

![The command palette](/screenshots/command-palette-en-light.webp)

## How it works

```
┌────────────────── your Nuxt / Next.js app ──────────────────┐
│  pages ──► Local API (typed)      browsers ──► /api/cms      │
│  editors ──► /admin                                          │
│                  @easy-cms/nuxt | @easy-cms/next             │
│                        @easy-cms/core                        │
│          SQLite / Postgres (ecms_ tables) · uploads          │
└──────────────────────────────────────────────────────────────┘
```

- **The core is framework-free.** `@easy-cms/core` is plain TypeScript built on the Web-standard `Request` and `Response`. Config, validation, access control, hooks, drafts and both APIs all live there.
- **Each adapter is thin.** The Nuxt module and the Next.js route handlers mostly mount one handler. That's why both frameworks get the same features.
- **The Local API skips HTTP.** Your pages call `cms.find()` directly, and you deploy one app.
- **Your data stays in your database.** Easy CMS uses SQLite (a file, or Turso) or Postgres, through Drizzle. It writes to real tables and columns with an `ecms_` prefix, so you can still query them with SQL.
- **The admin comes prebuilt.** It's a Vue app that reads your config from the API and draws the forms, so you never build it.

This has a cost: every feature has to work through two frameworks and a standalone server. So adapters stay as thin as possible, and end-to-end tests cover all three.

## Where it fits

Here's how it compares, as of October 2026. Each of these tools is good at something:

| | Runs inside a Nuxt app | Content stored in | Admin UI | Access control | License |
|---|---|---|---|---|---|
| Nuxt Content + Studio | ✅ | Git (files) | Vue | Login, no roles | MIT |
| Payload | Local API, or a separate app | Database | React | In code | MIT |
| Directus | Separate server | Database | Vue | Roles in the admin | Source-available |
| Strapi | Separate server | Database | React | Roles in the admin | MIT (Community Edition) |
| **Easy CMS** | ✅ (Next.js too) | Database | Vue | Roles in the admin + rules in code | MIT |

If your content is Markdown that lives in Git, use Nuxt Studio. If you're on Next.js and want the biggest ecosystem, Payload is the safe choice. Easy CMS is for content that lives in a database, with roles and an admin, inside a Nuxt or Next.js app. Other young projects are exploring this space too, like [nuxt-cms](https://github.com/xleddyl/nuxt-cms).

## How it was built: with AI, and with receipts

Easy CMS 1.0 came out on October 17, 22 days after the first commit. That's fast, and you should be suspicious of it. Here's the honest picture.

I build it alone, in my spare time. About half of the more than 500 commits were co-written with Claude Code, and the trailers are in the git history for anyone to check. What keeps that safe is the process around the code:

- **56 architecture decision records.** Every decision that matters has its reasons written down, in Thai, my first language.
- **900+ tests.** There are unit and integration tests, Playwright end-to-end tests, smoke tests of `create-easy-cms` with npm, pnpm, Yarn and Bun, and upgrade tests. The upgrade tests migrate databases created by older releases on every CI run.
- **A self-review against OWASP ASVS Level 1.** It's my own review, not an external audit.

That review found the worst bug so far. In the multi-tenant plugin, one helper decided two things: whether a user could *read* every tenant, and whether they had *access* to every tenant. The code looked reasonable. But once sites could have members, a customer who signed up on a shop passed that check. They could then edit other users, including the admin's password. The review flagged it as critical. The fix split the helper in two, added a test that fails on the old code, and shipped in 0.47.3 the same day.

Less dramatically, a rename of config options before 1.0 touched 139 files and missed three fields in the starter template. CI caught it when the template failed to build.

AI makes it cheap to write code that looks right. Tests, written decisions and reviews are how you find the code that only looks right.

## When it's not a fit

- **Editors can't change the content model.** It's code, so a developer has to.
- **No edge runtimes.** It needs Node.js 22.12 or newer (22.19 with Nuxt). MySQL isn't supported either.
- **No big marketplace.** There aren't many ready-made integrations yet.
- **Some plugins are experimental.** The shop, GraphQL and MCP plugins may still change in a minor release. Everything else follows the [1.0 stability promise](/docs/versioning): breaking changes only in a major release, with an upgrade guide.

## Try it, and tell me where it got in your way

Run `npm create easy-cms@latest` in a Nuxt or Next.js app, or click a Deploy button in the README to get a blog with its admin on Vercel or Netlify. Then tell me what got in your way in the [1.0 feedback issue](https://github.com/maritonx/easy-cms/issues/137). A rough sentence is fine.

- Repository: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms)
- Docs (English and Thai): [easy-cms-website.vercel.app/docs](/docs)

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
