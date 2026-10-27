---
title: "Build a Nuxt blog end to end: drafts, live preview, SEO and deploy"
slug: nuxt-blog-end-to-end
language: en
category: Guide
publishedAt: 2026-11-09
coverText: "draft → deploy"
excerpt: "A Nuxt blog with a real content model, draft-aware pages, live preview, SEO fields and a sitemap, then migrations and a production deploy."
---
`npm run dev` and an admin at `/admin` is the easy part of a CMS. The questions that take the time come after it. Who can see a draft? What does the editor see before pressing Publish? What does Google see? And what happens to the database when you deploy a config change?

This post answers those questions with a small Nuxt blog. It has posts, categories and site settings, pages that show only published content, drafts with live preview for editors, SEO fields with a sitemap, and a deploy with migrations. The code comes from the [Nuxt example](https://github.com/maritonx/easy-cms/tree/main/examples/nuxt-blog) in the Easy CMS repository, trimmed down. Most of the ideas apply to any database-backed CMS you put behind a Nuxt site.

If you haven't seen Easy CMS before, [the first post in this series](FIRST_POST_URL) explains what it is. The short version: it's a headless CMS that runs inside your Nuxt or Next.js app.

## Setup

You need Node.js 22.19 or newer:

```bash
npx nuxi@latest init my-blog
cd my-blog
npx create-easy-cms --db sqlite --yes
npm install @easy-cms/richtext @easy-cms/plugin-seo
```

`create-easy-cms` adds the Nuxt module, writes `easy-cms.config.ts`, and puts a random `EASY_CMS_SECRET` in `.env`. SQLite keeps everything in `cms.db` until you deploy.

## The content model

A blog needs three things: categories, posts, and one set of site settings. In Easy CMS, settings like these go in a *global*, which is a single document instead of a list.

```ts
// easy-cms.config.ts
import { defineConfig } from '@easy-cms/core'
import { sqlite } from '@easy-cms/db-sqlite'

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET ?? '',
  db: sqlite({ url: process.env.DATABASE_URL ?? 'file:./cms.db' }),
  collections: [
    {
      slug: 'categories',
      admin: { editIn: 'drawer' }, // small: edit in a panel over the list
      useAsTitle: 'name',
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'slug', from: 'name' },
      ],
    },
    {
      slug: 'posts',
      drafts: true, // draft / published
      versions: true, // history, and drafts that don't touch the live post
      schedule: true, // publish or unpublish at a set time
      preview: ({ doc }) => (doc.slug ? `/posts/${doc.slug}` : null),
      useAsTitle: 'title',
      access: {
        // Visitors see published posts; logged-in editors see drafts too.
        read: ({ user }) => (user ? true : { status: { equals: 'published' } }),
      },
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 120 },
        { name: 'slug', type: 'slug', from: 'title' },
        { name: 'excerpt', type: 'textarea', maxLength: 300 },
        { name: 'cover', type: 'upload' },
        { name: 'body', type: 'richText' },
        { name: 'category', type: 'relationship', to: 'categories', admin: { position: 'sidebar' } },
        { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
      ],
    },
  ],
  globals: [
    {
      slug: 'site',
      access: { read: () => true },
      fields: [
        { name: 'siteName', type: 'text', defaultValue: 'My Blog' },
        { name: 'tagline', type: 'text' },
      ],
    },
  ],
})
```

Two parts of this matter more than they look.

- **The `access` lines are required for public content.** If you define no rule, only logged-in users are allowed. Categories and the site global are public on purpose.
- **The posts `read` rule returns a query, not a boolean.** For visitors it adds `status = published` to every read, including the REST API at `/api/cms/posts`. So you can't forget the filter on one endpoint.

In development the database follows the config, so new fields become columns when the server starts. Open `/admin`, create the first admin, and write a post.

## Pages that show only what visitors may see

Nuxt server routes get `useEasyCMS()` auto-imported. The list route is simple. `find` returns only published documents unless you ask for drafts:

```ts
// server/api/posts/index.get.ts
export default defineEventHandler(async () => {
  const cms = await useEasyCMS()
  const { docs } = await cms.find('posts', { sort: '-publishedAt', limit: 20 })
  // Send the list page only what it shows, not every post's body.
  return docs.map((post) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: typeof post.category === 'object' ? post.category?.name : null,
  }))
})
```

The single post route is where the bugs usually are. Editors should see their drafts on the real page and visitors shouldn't, and both use the same URL:

```ts
// server/api/posts/[slug].get.ts
export default defineEventHandler(async (event) => {
  const cms = await useEasyCMS()
  const user = await useEasyCMSUser(event) // the logged-in user, or null
  const { docs } = await cms.find('posts', {
    where: { slug: { equals: getRouterParam(event, 'slug') } },
    limit: 1,
    user,
    overrideAccess: false, // let the collection's read rule decide
    draft: user !== null, // editors get the pending draft
  })
  if (!docs[0]) throw createError({ statusCode: 404 })
  return docs[0]
})
```

These are the Local API options that matter here, with their defaults:

| Option | Default | Why it matters here |
|---|---|---|
| `overrideAccess` | `true` | The Local API trusts server code and skips access rules. |
| `user` | `null` | Who the rules are checked for. |
| `draft` | `false` | Include drafts: with versions, a published post's pending draft. |
| `depth` | `1` | Populates `category`, so you get its name instead of an id. |

The trap is the first row. If you write `draft: true` and leave `overrideAccess` at its default, every visitor can read drafts by guessing a slug. Passing `user` with `overrideAccess: false` lets the same rule that protects the REST API protect your page. CMSs with an in-process API often have the same default, so check it in whichever one you use.

The site name works the same way. A route returns `cms.findGlobal('site')`, and `app.vue` fetches it for the header and `useHead`.

## Drafts that don't take the live post down

With `drafts: true`, new posts start as drafts. `required` isn't enforced on drafts, so an editor can save half a post, and Publish checks everything.

`versions: true` is easy to skip, and I'd turn it on for any blog. Without versions, a document has one copy, so saving a published post as a draft *unpublishes* it. With versions, the draft is stored next to the live post. The site keeps showing the published version, and the admin marks the post as having **Unpublished changes**. Every save goes into a **History** panel (50 versions per document by default), and you can restore any of them.

![A post in the admin with its publishing panel and history](/screenshots/edit-en-light.webp)

`schedule: true` adds a **Schedule** button. A Nuxt server that keeps running checks for due jobs every minute by itself. On serverless hosts nothing keeps running, so a cron has to call `/api/cms/jobs/run`. I'll come back to that in the deploy section.

## Live preview

The `preview` function in the config tells the admin where a post is shown. The page needs one line:

```vue
<script setup lang="ts">
import { renderRichText } from '@easy-cms/richtext'

const route = useRoute()
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`, {
  headers: useRequestHeaders(['cookie']), // so editors see their drafts
})
useLivePreview(post) // auto-imported; does nothing outside the admin
const html = computed(() => renderRichText(post.value?.body))
</script>

<template>
  <article v-if="post">
    <p v-if="post.status === 'draft'"><strong>Draft preview</strong></p>
    <h1>{{ post.title }}</h1>
    <div v-html="html" />
  </article>
</template>
```

When the editor presses **Preview**, the admin opens your real page in a frame next to the form. On every change it sends the form to `POST /api/cms/posts/:id/preview`. The server returns the document as a normal read would, with relationships populated, and saves nothing. Then the admin posts that document to the frame with `postMessage`, and `useLivePreview` puts it into the ref, so the page re-renders.

![Live preview next to the form](/screenshots/preview-en-light.webp)

The design rule this forces on you is useful anywhere: **render from the document, not from the database**. The page gets the rich text as JSON, so `renderRichText` runs in the browser too. It escapes text and drops unsafe URLs, which is why `v-html` is safe here. Only users who may update a post can preview it.

## SEO fields and a sitemap

The SEO plugin adds a `meta` group (title, description, share image, and "Hide from search engines") to the collections and globals you choose. Here it's just posts:

```ts
// easy-cms.config.ts (add to the config above)
import { seoPlugin } from '@easy-cms/plugin-seo'

  admin: { siteURL: process.env.SITE_URL }, // the public address, for the sitemap
  plugins: [
    seoPlugin({
      collections: ['posts'],
      generateTitle: ({ doc }) => `${doc.title} | My Blog`,
      generateDescription: ({ doc }) => doc.excerpt,
      generateImage: ({ doc }) => doc.cover,
      generateURL: ({ doc }) => (doc.slug ? `/posts/${doc.slug}` : null),
    }),
  ],
```

The plugin is set up before the config it belongs to, so `doc` isn't typed from the collection. A generator can return a field as it reads it: text for the title, description and address, a media id or media document for the image. Any other value suggests nothing.

Editors get length meters (50–60 characters for titles and 100–150 for descriptions by default, counting a Thai letter with its marks as one), a search result preview, and Generate buttons. The buttons run your generators on the server with the unsaved form.

![SEO fields with length meters and a search preview](/screenshots/seo-en-light.webp)

On the page, `seoMeta` reads those fields and falls back to the post's own title and excerpt:

```ts
// app/pages/posts/[slug].vue, after useFetch
import { seoMeta } from '@easy-cms/plugin-seo'

const seo = seoMeta(post.value ?? {}, {
  siteURL: useRequestURL().origin,
  url: (p) => `/posts/${p.slug}`,
  type: 'article',
})
useSeoMeta(seo.nuxt) // title, description, Open Graph, robots
useHead(seo.head) // canonical link, BlogPosting JSON-LD
```

`useRequestURL()` is fine when every page is rendered per request. If a CDN caches your pages, pass your public address instead, for the same reason as the sitemap below: the `Host` header comes from the client.

The sitemap is a server route:

```ts
// server/routes/sitemap.xml.ts
import { sitemapXml } from '@easy-cms/plugin-seo'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return sitemapXml(await useEasyCMS(), { page: getQuery(event).page as string | undefined })
})
```

It reads posts *as a visitor*, without a login, so drafts stay out. So does anything your read rule hides, and any post marked "Hide from search engines". Over 50,000 addresses it becomes a sitemap index. Its addresses must be absolute, which is what `admin.siteURL` is for: put `SITE_URL=http://localhost:3000` in `.env` while you develop, and the public address in production. Without it, the sitemap answers 500 as soon as a post is published, and the error tells you to set `admin.siteURL`. Don't take the address from the request instead. A client can send any `Host` header, and a sitemap is often cached. The Nuxt example did that before 1.4.2. `robotsTxt` from the same package keeps crawlers out of `/admin/` and `/api/cms/` but lets them load uploaded images.

One design point worth copying: `generateURL` is the only place the post's address is defined. The admin's search preview, the sitemap and the hreflang links all use it, so they can't disagree with each other.

## Migrations: where development and production differ

The SEO plugin adds columns to `ecms_posts`. In development that just happens. In production, nothing changes the schema on its own. Easy CMS refuses to start when migrations are pending, or when the config changed without one: the API answers 500 and the log says what to run.

```bash
npx easy-cms migrate:create init   # after your first model, and after every change
git add easy-cms/migrations        # review the SQL, then commit
npx easy-cms migrate               # where you deploy, before the new version starts
npx easy-cms migrate:status        # what's applied and what's pending
```

The Nuxt example has 22 migrations, from `20260925091723_init` to `20261009020143_audit_scope`. Each one is a `.sql` file with a `.json` snapshot of the schema next to it. Most are a handful of statements, and some are one line:

```sql
-- easy-cms/migrations/20261004041909_category_color.sql
-- Easy CMS migration 20261004041909_category_color (sqlite)
-- Generated from the config; review before deploying.
ALTER TABLE `ecms_categories` ADD `color` text;
```

The history also shows which changes need a migration. Adding a field does, and so does turning on a feature: `versions` created `ecms_document_versions`, and `schedule` created `ecms_scheduled_jobs`. Upgrading Easy CMS can need one too. The SEO plugin's "Hide from search engines" checkbox arrived as a new `meta_noindex` column.

Three things to know before your first deploy:

- **Renames lose data in development.** Development push drops the old column and adds a new one. When the data matters, run `migrate:create` in a terminal. It asks whether a field that disappeared was renamed.
- **A database created by development push can't take migrations.** Run them against a fresh database. Don't copy your laptop's `cms.db` to the server.
- **Each migration runs in one transaction.** A failing one is rolled back and isn't recorded.

## Deploying the Nuxt build

The cheapest setup that works is one Linux server with SQLite and uploads on its disk. A server that keeps running also runs scheduled jobs by itself. The VPS guide uses a systemd unit that migrates before every start:

```ini
# /etc/systemd/system/easy-cms.service (excerpt)
[Service]
User=cms
WorkingDirectory=/srv/site
Environment=NODE_ENV=production
EnvironmentFile=/srv/site/.env
ExecStartPre=/usr/bin/npx easy-cms migrate
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
```

Each line in that unit is there because of a mistake that's easy to make:

- **Nuxt's production server doesn't read `.env`.** Without `EnvironmentFile`, the API answers 500 and the log says `secret: is required`.
- **Start from the project root.** `file:./cms.db`, the migrations and `uploads/` resolve from the working directory.
- **Build on the server's OS and architecture.** The SQLite driver ships native files.

Set `EASY_CMS_SETUP_CODE` until the first admin exists. Otherwise whoever opens `/admin` first on a fresh site can make themselves admin. Behind Caddy or nginx, set `easyCms: { trustProxy: true }` in `nuxt.config.ts` so login rate limits see each visitor's IP.

Serverless works too, but it needs more pieces:

| | One server (VPS, Docker) | Vercel / Netlify |
|---|---|---|
| Database | SQLite file on the disk, or Postgres | Hosted Postgres (Neon, Netlify Database), or Turso on Vercel |
| Uploads | `uploads/` on the disk | Vercel Blob, Netlify Blobs, or S3 |
| Scheduled posts | The server runs them every minute | A cron calling `/api/cms/jobs/run` with `CRON_SECRET` |
| Migrations | `ExecStartPre`, or before `node` in a container | Before the build: `npx easy-cms migrate && npm run build` |

On Vercel's Hobby plan, cron jobs run at most once a day, so a post scheduled for 9:00 can go out hours late unless something else calls the endpoint. Edge runtimes aren't supported at all.

[TODO: your story — which host you'd pick for a small Nuxt blog and why, 1 line]

## What I'd tell you before you start

- **Editors can't change the content model.** Fields are code, so adding one means a developer, a migration and a deploy. That's the point of a code-first CMS, but it's a real cost for a team that wants to add fields itself.
- **Plan the database for your host.** SQLite on a disk is simple until you move to serverless, and then you need Postgres or Turso. `easy-cms copy` can move content between databases, but it's easier to pick right the first time.
- **Turn on versions early.** Adding them later is one more migration, and without them, a draft unpublishes the live post.

The [tutorial](/docs/tutorial) has the same steps for Next.js. The example also shows nested pages, forms built in the admin, redirects, and a Thai and English version of every post.

---

Easy CMS is MIT-licensed: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [docs](/docs). If you try it, tell me what got in your way in the [feedback issue](https://github.com/maritonx/easy-cms/issues/137).

*I drafted this post with Claude, working from the project's design docs and git history. The decisions, and the mistakes, are mine.*
