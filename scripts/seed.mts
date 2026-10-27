/**
 * Fills an empty database with the site's starting content: releases from the Easy CMS
 * changelog, blog posts, showcase entries and the home page announcement.
 *
 *   pnpm seed            releases missing from the changelog; posts and showcase if empty
 *   pnpm seed --reset    delete what is there first
 */
import { readFileSync } from 'node:fs'
import { createEasyCMS, slugify } from '@easy-cms/core'
import { thaiPosts } from './posts-th.mjs'
import configModule from '../easy-cms.config'

// The config is a CommonJS module to Node here (the package isn't "type": "module").
const config = ((configModule as { default?: typeof configModule }).default ?? configModule)

const reset = process.argv.includes('--reset')

// Outside production, Easy CMS pushes the config's schema into the database at startup, which can
// drop columns. Only the local SQLite file may be seeded that way.
const url = process.env.DATABASE_URL ?? 'file:./cms.db'
if (!url.startsWith('file:') && process.env.NODE_ENV !== 'production') {
  console.error(
    `${url} is not a local file: run with NODE_ENV=production, after \`easy-cms migrate\`, so the schema isn't pushed into it.`,
  )
  process.exit(1)
}

// ---------- a tiny markdown-ish → Tiptap JSON, enough for seed posts ----------
type Node = Record<string, unknown>

/** `code`, **bold** and [links](/path) inside a line; the rest is plain text. */
function inline(text: string): Node[] {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`')) return { type: 'text', text: part.slice(1, -1), marks: [{ type: 'code' }] }
      if (part.startsWith('**') && part.endsWith('**')) return { type: 'text', text: part.slice(2, -2), marks: [{ type: 'bold' }] }
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
      if (link) return { type: 'text', text: link[1], marks: [{ type: 'link', attrs: { href: link[2] } }] }
      return { type: 'text', text: part }
    })
}

/** Blocks separated by blank lines; a fenced code block is one block, blank lines and all. */
function blocks(source: string) {
  const out: string[] = []
  let current: string[] = []
  let inCode = false
  const flush = () => {
    if (current.length) out.push(current.join('\n'))
    current = []
  }
  for (const line of source.trim().split('\n')) {
    if (line.startsWith('```')) {
      if (!inCode) flush()
      current.push(line)
      inCode = !inCode
      if (!inCode) flush()
    } else if (!inCode && line.trim() === '') {
      flush()
    } else {
      current.push(line)
    }
  }
  flush()
  return out
}

function richText(source: string) {
  const content: Node[] = []
  for (const block of blocks(source)) {
    if (block.startsWith('```')) {
      const [, language = '', code = ''] = /^```(\w*)\n([\s\S]*?)\n?```$/.exec(block) ?? []
      content.push({ type: 'codeBlock', attrs: { language }, content: [{ type: 'text', text: code }] })
    } else if (block.startsWith('## ')) {
      content.push({ type: 'heading', attrs: { level: 2 }, content: inline(block.slice(3)) })
    } else if (block.startsWith('- ')) {
      content.push({
        type: 'bulletList',
        content: block.split('\n').map((line) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: inline(line.replace(/^- /, '')) }],
        })),
      })
    } else {
      content.push({ type: 'paragraph', content: inline(block.replace(/\n/g, ' ')) })
    }
  }
  return { type: 'doc', content }
}

// ---------- content ----------
type ReleaseSeed = {
  version: string
  title: string
  date: string
  kind: string
  summary: string
  changes: string[]
  packages: string[]
  needsMigration: boolean
}

// 0.23 onwards, taken from the packages' CHANGELOG.md files in the Easy CMS repo (newest first).
const laterReleases: ReleaseSeed[] = JSON.parse(
  readFileSync(new URL('./releases.json', import.meta.url), 'utf8'),
)

const releases: ReleaseSeed[] = [
  ...laterReleases,
  {
    version: '0.22.2', title: 'The admin on Vercel', date: '2026-10-03', kind: 'patch',
    summary: 'The admin works on Vercel and other hosts that deploy only the files the build traces.',
    changes: [
      '`createAdminRouteHandlers()` looked for the admin app through `@easy-cms/next/package.json`, which Vercel doesn\'t deploy, so `/admin` answered 500 with "Cannot find module \'@easy-cms/next/package.json\'".',
      'It now uses the path `@easy-cms/admin` reports for itself, which the build traces, and falls back to the old lookup when that package was bundled.',
    ],
    packages: ['@easy-cms/next'], needsMigration: false,
  },
  {
    version: '0.22.1', title: 'Package READMEs', date: '2026-10-02', kind: 'patch',
    summary: 'Every package now explains what it does, how to install it with npm, pnpm, Yarn or Bun, and links to its guide.',
    changes: [], packages: ['@easy-cms/core'], needsMigration: false,
  },
  {
    version: '0.22.0', title: 'npm, pnpm, Yarn and Bun', date: '2026-10-01', kind: 'minor', summary: '',
    changes: [
      '`create-easy-cms --pm npm|pnpm|yarn|bun` picks the package manager. Without it, the project\'s `packageManager` field, then its lockfile, then the one you ran it with.',
      'The next steps it prints use that package manager, such as `bunx easy-cms migrate`.',
      'With Yarn 2 or later it writes `.yarnrc.yml` with `nodeLinker: node-modules`.',
      'The docs show every command for all four and keep the one you pick.',
    ],
    packages: ['create-easy-cms', '@easy-cms/core', '@easy-cms/nuxt'], needsMigration: false,
  },
  {
    version: '0.21.0', title: 'Nested pages', date: '2026-09-30', kind: 'minor', summary: '',
    changes: [
      'New `@easy-cms/plugin-nested-docs`: pages inside pages, each with a `parent`, its full `path` and `breadcrumbs`, per language.',
      'Moving a page updates the pages under it, and the redirects plugin redirects their old addresses.',
      'Relationship `filterOptions` and slug `uniqueWithin`.',
    ],
    packages: ['@easy-cms/plugin-nested-docs', '@easy-cms/core'], needsMigration: true,
  },
  {
    version: '0.20.0', title: 'Forms and email', date: '2026-09-29', kind: 'minor', summary: '',
    changes: [
      '`email` in the config: `smtp()` from the new `@easy-cms/email-smtp`, `consoleEmail()` for development, or your own adapter. Failed sends retry for about a day.',
      'New `@easy-cms/plugin-form-builder`: forms built in the admin, notification emails, CSV export, and bot protection with a honeypot, rate limits and optional Turnstile.',
    ],
    packages: ['@easy-cms/email-smtp', '@easy-cms/plugin-form-builder'], needsMigration: true,
  },
  {
    version: '0.19.0', title: 'Redirects', date: '2026-09-28', kind: 'minor', summary: '',
    changes: [
      'New `@easy-cms/plugin-redirects`: editors manage 301, 302, 307 and 308 redirects under Settings → Redirects.',
      'Automatic redirects when a published page\'s address changes, in every locale, without chains or loops.',
      '`resolveRedirect(cms, url)` serves them from memory in a Next.js 16 `proxy.ts`.',
    ],
    packages: ['@easy-cms/plugin-redirects'], needsMigration: true,
  },
]

const posts = [
  {
    title: 'One installer for npm, pnpm, Yarn and Bun',
    // SEO fields (plugin-seo): 50–60 and 100–150 characters.
    meta: {
      title: 'Easy CMS 0.22: one installer for npm, pnpm, Yarn and Bun',
      description: 'create-easy-cms now detects your package manager, prints next steps in its own commands, and sets up Yarn 2+ for you.',
    },
    category: 'Release', publishedAt: '2026-10-01', coverText: '--pm bun', featured: true,
    excerpt: 'Easy CMS 0.22 picks your package manager from the lockfile or the --pm flag, prints the next steps in its own commands, and the docs remember the one you chose.',
    body: `Until 0.22, \`create-easy-cms\` assumed npm. It installed packages with npm and told you to run \`npx easy-cms migrate\`, even inside a pnpm workspace or a Bun project. Now it works in the package manager you already use.

## How it picks

- \`--pm npm|pnpm|yarn|bun\` when you pass it.
- Otherwise the project's \`packageManager\` field, then its lockfile.
- Otherwise the one you ran it with, so \`bun create easy-cms\` uses Bun.

\`\`\`bash
pnpm create easy-cms --db sqlite
\`\`\`

## Next steps in your own commands

The steps it prints at the end use that package manager: \`pnpm exec easy-cms migrate\`, \`yarn easy-cms migrate\`, \`bunx easy-cms migrate\`, \`bun run dev\`. When the package manager isn't installed, it says how to get it and prints the install commands instead of failing halfway.

## Yarn 2 and later

Easy CMS doesn't support Plug'n'Play, so with Yarn 2 or later the scaffolder writes \`.yarnrc.yml\` with \`nodeLinker: node-modules\` for you.

## The docs follow

Every command in the docs now has a tab for npm, pnpm, Yarn and Bun, translated the same way the scaffolder prints them. Pick one once and every page shows it.`,
  },
  {
    title: 'Nested pages, with paths and breadcrumbs',
    // SEO fields (plugin-seo): 50–60 and 100–150 characters.
    meta: {
      title: 'Nested pages with paths and breadcrumbs in Easy CMS 0.21',
      description: 'The nested-docs plugin gives each page a parent, a full path and breadcrumbs, and updates the pages below when one moves.',
    },
    category: 'Release', publishedAt: '2026-09-30', coverText: '/about/team',
    excerpt: 'About → Team → Engineering. The new plugin keeps every path and breadcrumb up to date when a page moves, in every language.',
    body: `Most sites have pages inside pages: About, then Team under it. Easy CMS 0.21 adds \`@easy-cms/plugin-nested-docs\` for that.

\`\`\`ts
import { nestedDocsPlugin } from '@easy-cms/plugin-nested-docs'

plugins: [nestedDocsPlugin({ collections: ['pages'] })]
\`\`\`

## What each page gets

- A \`parent\` field to pick the page above it.
- Its full \`path\`, such as \`/about/team\`, per language when the slug is localized.
- Its \`breadcrumbs\`, ready for navigation and for BreadcrumbList structured data.

## When a page moves

Give a page a new slug or a new parent and the pages under it get new paths too, when it is published. With the redirects plugin, their old addresses redirect to the new ones. A page can't be moved under itself, \`maxDepth\` limits how deep the tree goes, and a page with pages under it can't be deleted unless you choose \`onDeleteParent: 'orphan'\`.

## Reading the tree

\`findByPath()\` finds the page for an address, \`getTree()\` builds menus, and \`GET /api/cms/tree/:collection\` gives the same to other frontends. For pages that existed before the plugin, \`npx easy-cms nested:rebuild\` works out their paths. The plugin adds fields, so create a migration after installing it.

## Also in 0.21

- Relationship \`filterOptions\`: which documents a relationship may point to, checked on the server; the admin's picker offers only those.
- Slug \`uniqueWithin\`: slugs unique only among documents with the same value of another field, such as the same parent.`,
  },
  {
    title: 'Forms and email, built in',
    // SEO fields (plugin-seo): 50–60 and 100–150 characters.
    meta: {
      title: 'Forms and email built into Easy CMS 0.20: no third party',
      description: 'Editors build forms in the admin; submissions are validated, exported as CSV and kept from bots, and emails retry for a day.',
    },
    category: 'Release', publishedAt: '2026-09-29', coverText: '<easy-form>',
    excerpt: 'Editors build forms in the admin. Submissions are validated on the server, emails retry for a day, and bots meet a honeypot.',
    body: `A contact form shouldn't need a third-party service. Easy CMS 0.20 adds email to the core and a form builder plugin.

## Email

Set \`email\` in the config: \`smtp()\` from the new \`@easy-cms/email-smtp\` works with Gmail, SES, Resend, Mailgun or any SMTP server, \`consoleEmail()\` prints messages during development, or write your own adapter. \`cms.sendEmail()\` queues each message in the database and retries for about a day if sending fails. On serverless hosts, \`flushEmails()\` waits for them before the request ends.

## Forms

With \`@easy-cms/plugin-form-builder\`, editors build forms in the admin from field blocks: text, long text, email, number, phone, choice, checkbox, date and message. Each form has a confirmation message or a redirect, and notification emails that can include the answers.

- Submissions are validated on the server, stored without IP addresses and exported as CSV.
- A honeypot, a minimum time, a rate limit per visitor and optional Cloudflare Turnstile keep bots out.
- \`<easy-form form="contact">\` renders a form on any page; \`getForm()\` and \`submitForm()\` are there for your own components.

Both packages add tables, so create a migration after installing them.`,
  },
  {
    title: 'Why we put the CMS inside your app',
    // SEO fields (plugin-seo): 50–60 and 100–150 characters.
    meta: {
      title: 'Why Easy CMS runs inside your Next.js or Nuxt app server',
      description: 'A headless CMS without a second server: one deployment, one database, a typed Local API, and the trade-offs that come with it.',
    },
    category: 'Engineering', publishedAt: '2026-09-24', coverText: 'in-process',
    excerpt: 'A hosted headless CMS is a second service with its own deploy and database. Easy CMS is a package your app mounts instead. Here is what that changes.',
    body: `Most headless CMSs are a separate service. Your site calls it over HTTPS with a token, and you keep two deployments, two databases and two sets of credentials in step. Easy CMS takes the other route: it is an npm package that runs inside your Nuxt or Next.js server.

## One app, one database

The admin at \`/admin\` and the REST API at \`/api/cms\` are routes of your app. Your pages read content with the Local API, a function call in the same process, with no HTTP involved. Content lives in your database, SQLite or Postgres, in real tables and columns with an \`ecms_\` prefix, so you can still query it with SQL.

## The content model is code

Collections, fields, access rules and hooks go in \`easy-cms.config.ts\`. You review changes in pull requests, and production gets them as migrations you can read before they run.

\`\`\`ts
const cms = await getEasyCMS(config)
const { docs } = await cms.find('posts', { limit: 10 })
// docs[0].title is a string, typed from the config
\`\`\`

## Typed without a build step

Because the config is TypeScript, \`cms.find('posts')\` returns typed documents straight from it. There is no schema to download and no code generation to keep up to date.

## The trade-offs

- Editors can't change the content model themselves; a developer changes the config.
- It needs Node.js 22.12 or newer, so no edge runtimes.
- There is no GraphQL, and the plugin ecosystem is young.

If you build with Vite, React, Vue or a static site generator, the same core runs as a standalone server with REST.`,
  },
  {
    title: 'Moving from SQLite to Postgres',
    // SEO fields (plugin-seo): 50–60 and 100–150 characters.
    meta: {
      title: 'Move Easy CMS from SQLite to Postgres with easy-cms copy',
      description: 'Start on a SQLite file and move to Postgres later: one CLI command copies documents, versions and users, keeping every id.',
    },
    category: 'Guide', publishedAt: '2026-09-21', coverText: 'easy-cms copy',
    excerpt: 'Start on a SQLite file, grow into Postgres. One CLI command copies every document, version and user between the two.',
    body: `SQLite is a fine choice for one server with a disk. Move to Postgres when you deploy to serverless, run several servers, or your host offers managed Postgres with backups.

## Before launch

If the content so far is test content, switch the adapter to \`postgres()\`, replace the migrations with \`npx easy-cms migrate:create init\`, and start fresh. Migrations are written in one database's SQL, so the SQLite ones don't carry over.

## With content to keep

\`easy-cms copy\` moves documents, versions, users (logins keep working), globals and scheduled jobs. Ids stay the same, so relationships still point to the right documents.

- Back up first with \`npx easy-cms backup\`.
- Keep a second config for the old SQLite database next to the main one.
- Point the main config at Postgres, create its migrations and run them.
- Copy while nobody is editing, then check the admin, a few documents and a login.

\`\`\`bash
npx easy-cms copy --from easy-cms.old.config.ts
\`\`\`

The target must be empty, so running it twice by accident changes nothing. Uploads stay where they are, in \`uploads/\` or your bucket. The same command works from Postgres back to SQLite.

The recipe Move from SQLite to Postgres in the docs has every step.`,
  },
  {
    title: 'Rebuild a static site when an editor publishes',
    // SEO fields (plugin-seo): 50–60 and 100–150 characters.
    meta: {
      title: 'Rebuild a static site when an editor publishes in Easy CMS',
      description: 'Point an Easy CMS webhook at your host\'s deploy hook to rebuild only on publish, with signed requests and a day of retries.',
    },
    category: 'Guide', publishedAt: '2026-09-17', coverText: 'webhook ✓',
    excerpt: 'Point a webhook at your host\'s deploy hook and the site rebuilds when content goes live, and only then.',
    body: `A site generated at build time (Astro, Nuxt generate, a Next.js export, Hugo) can rebuild by itself when content is published.

## 1. Get a deploy hook

Netlify, Vercel and Cloudflare Pages each give you a URL that starts a build when it receives a POST. Keep it in an environment variable.

## 2. Call it when something goes live

\`\`\`ts
webhooks: [
  {
    url: process.env.DEPLOY_HOOK_URL as string,
    events: ['publish', 'unpublish', 'delete'],
    collections: ['posts', 'pages'],
  },
],
\`\`\`

Only changes visitors can see start a build, not every draft save. For collections without drafts, add \`update\` and \`create\`.

## Reliable delivery

Easy CMS sends the request after the change is saved and retries for about a day if the host is down, even across restarts. Every request is signed, so a receiver of your own can check it came from your CMS. Scheduled publishing sends \`publish\` too, so a post set for 9:00 rebuilds the site at 9:00.

The recipe Rebuild a static site on publish in the docs has the details.`,
  },
]

// Posts about 0.33 to 0.47, drafts until the author has read them.
const newPosts = [
  {
    title: 'Roles, single sign-on and an audit log',
    category: 'Release', publishedAt: '2026-10-05', coverText: 'auth.rbac', status: 'draft',
    meta: {
      title: 'Easy CMS roles, single sign-on and audit log for teams',
      description: 'Roles you tick in the admin, sign-in with Google, Microsoft or GitHub, and a signed audit log of who changed what: Easy CMS 0.33 to 0.36.',
    },
    excerpt: 'Easy CMS 0.33 to 0.36 make it ready for teams: roles you set up in the admin, sign-in with your company account, and a record of who changed what.',
    body: `A CMS for one developer can trust everyone who logs in. A CMS for a team can't. Four releases, 0.33 to 0.36, add what a team needs, and each is off until you turn it on.

## Roles from the admin

\`\`\`ts
auth: { rbac: true },
\`\`\`

Admins get Settings → Roles: add a role and tick Read, Create, Update, Delete and Publish per collection and global, plus admin pages. Permissions are checked on the server on top of your access rules, so both must allow. When roles are first turned on, they keep everything they could do before; nothing changes until an admin unticks something.

0.34 adds the details teams ask for next:

- **Own documents only:** writers read every post but change, publish and delete only theirs.
- **Field permissions:** per role, each field can be editable, read only or hidden.
- **Deleting a user** asks who gets the documents they owned.

## Single sign-on

The new \`@easy-cms/auth-oauth\` package adds "Sign in with…" for Google, Microsoft (Entra ID), GitHub or any OpenID Connect provider.

\`\`\`ts
import { google } from '@easy-cms/auth-oauth'

auth: { providers: [google()] }, // reads GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
\`\`\`

\`auth.allowSignUp\` gives people from your domains an account on their first sign-in, and \`auth.password: false\` keeps passwords for admins only.

## An audit log

With \`audit: true\`, Easy CMS records changes to documents (each field's value before and after), sign-ins, failed logins, roles, backups and deliveries, with who, how and from where. Settings → Audit log has filters and CSV export. Entries can't be edited through Easy CMS, each is signed with the secret, and a daily check finds edited or missing ones.

Each of these adds a table: create a migration when you turn it on. The Roles, Single sign-on and Audit log guides have the details.`,
  },
  {
    title: 'A media library for real sites',
    category: 'Release', publishedAt: '2026-10-08', coverText: 'upload.folders', status: 'draft',
    meta: {
      title: 'Easy CMS media library: folders, bulk upload, private files',
      description: 'Folders, bulk upload, private files with signed links and large files straight to S3 or Vercel Blob: the media library in Easy CMS 0.38 to 0.41.',
    },
    excerpt: 'Folders, several files at a time, private folders and files too big for your host\'s request limit: the media library grew up in 0.38 to 0.41.',
    body: `A blog's media library can be a flat list. A company site's can't: hundreds of images, PDFs for download, files only staff should see. Four releases changed that.

## Folders (0.38)

\`\`\`ts
upload: { folders: true },
\`\`\`

The Media page gets a folder tree. Drag files onto folders or use Move to…, upload into the open folder, and browse folders from upload fields' pickers. Deleting a folder moves what it held up to its parent. With roles on, admins choose which roles may view, edit or manage each folder.

## Several files at once (0.39)

Drop many files and they upload three at a time, each with its progress, and each can be cancelled or retried. Files over the size limit are refused before they are sent. Easy CMS now recognises Word, Excel, PowerPoint, OpenDocument, zip, audio, video and CSV files from their contents, and a file's page previews it: players for audio and video, the browser's PDF viewer, the start of a text file.

## Private folders (0.40)

Tick Private on a folder and its files are kept apart. They are served only to users who may see them, or through a signed link from \`cms.signedMediaURL()\` that expires (at most 7 days). Upload fields can name a folder, such as \`folder: 'banners'\`, made the first time it is needed.

## Large files straight to storage (0.41)

Hosts limit request sizes, about 4.5 MB on Vercel. With S3, R2, MinIO or Vercel Blob, the admin now sends files over 4 MB from the browser straight to the storage. The server still checks each file's size and type from its contents, and deletes what fails.

The Uploads & media guide covers every option.`,
  },
  {
    title: 'Deploy Easy CMS in one click',
    category: 'Release', publishedAt: '2026-10-06', coverText: 'deploy ✓', status: 'draft',
    meta: {
      title: 'Deploy Easy CMS to Vercel or Netlify with a single click',
      description: 'A deploy button copies a Next.js starter with its admin, creates the database and file storage, and asks only for a setup code: Easy CMS 0.37.',
    },
    excerpt: 'A button that copies a Next.js blog with its admin to your GitHub and deploys it, database and file storage included. You type one thing: a setup code.',
    body: `Trying a CMS used to mean cloning a repository, creating a database and setting environment variables. Since 0.37, the README and the docs have deploy buttons for Vercel and Netlify.

## What the button does

It copies the starter in \`templates/next-starter\` to a new repository of yours and deploys it: a Next.js blog with its admin, posts, categories, media, SEO, roles and an audit log, with sample posts.

- **On Vercel:** a Neon Postgres database and a Vercel Blob store for uploads, both created by the button.
- **On Netlify:** Netlify Database (Postgres) and Netlify Blobs, created on first use.

## The setup code

On a freshly deployed site, whoever opens \`/admin\` first could make themselves admin. So the only thing you fill in is a setup code, \`EASY_CMS_SETUP_CODE\`: any phrase you choose. Creating the first admin needs it, and wrong codes are rate-limited. The same setting, \`auth.setupCode\`, works on any host.

## New storage packages

The button needs somewhere to keep uploads on platforms without a disk, so 0.37 adds two packages:

- \`@easy-cms/storage-vercel-blob\`: uploads in Vercel Blob, public on the CDN or private behind the API.
- \`@easy-cms/storage-netlify-blobs\`: uploads in Netlify Blobs, served through the API.

Then open \`/admin\`, create your admin with the code, and replace the sample posts with your own. The One-click deploy guide has the buttons and what to do if something doesn't work.`,
  },
  {
    title: 'Multi-tenant sites and a shop',
    category: 'Release', publishedAt: '2026-10-09', coverText: 'tenants', status: 'draft',
    meta: {
      title: 'Multi-tenant sites and an ecommerce shop in Easy CMS 0.46',
      description: 'Run many sites or clients from one Easy CMS, and sell with products, carts and Stripe or PromptPay checkout: the multi-tenant and ecommerce plugins.',
    },
    excerpt: 'Two new plugins: run several sites or clients from one CMS, and sell from your site with carts, Stripe, PromptPay or bank transfer.',
    body: `Agencies run many small sites; shops need more than posts. Two plugins arrived in 0.44 to 0.46, and they work together.

## Multi-tenant

\`\`\`ts
import { multiTenantPlugin } from '@easy-cms/plugin-multi-tenant'

plugins: [
  multiTenantPlugin({
    collections: ['posts', 'pages', 'media'], // each document belongs to one tenant
    globals: ['site-settings'], // one value per tenant
  }),
],
\`\`\`

You get a \`tenants\` collection, members with a role in each tenant, a tenant switcher in the admin, and frontends that name their tenant by header, \`?tenant=\` or domain. Since 0.45, uploads, media folders, nested pages, redirects and forms work per tenant too, and admins of a tenant see its own audit log.

## A shop

\`@easy-cms/plugin-ecommerce\` adds products with variants and prices in several currencies, carts that guests keep, and checkout with Stripe (card and PromptPay) or bank transfer. Orders are made exactly once however often a payment is confirmed, and stock is taken safely and put back on a cancel or refund. Customers get accounts and order emails, and pages get a client with React hooks and Vue composables. With the multi-tenant plugin, each tenant is a shop of its own.

## New in the core

Both plugins are built on pieces you can use yourself: \`onRequest\` gives each request a \`context\` that access rules and hooks receive, site members (\`auth.members\`) sign in on the site and never get into the admin, and \`events\` with \`cms.emit()\` send your own webhooks. One change to note: \`isLoggedIn\` no longer counts members; \`isSignedIn\` does.

The Multi-tenant, Ecommerce and Members guides have the setup.`,
  },
  {
    title: 'Easy CMS 1.0',
    category: 'Release', publishedAt: '2026-10-17', coverText: '1.0', status: 'draft',
    meta: {
      title: 'Easy CMS 1.0: the embedded CMS for Next.js and Nuxt is stable',
      description: 'Easy CMS 1.0 is the first version meant for production: breaking changes only in a major release, upgrades tested from old releases, and a security review behind it.',
    },
    excerpt: 'Easy CMS 1.0 is out. What 1.0 promises, what it took to get here, and how to upgrade from 0.x.',
    body: `Easy CMS 1.0 is out: the first version meant for production use. It is the same CMS that ran inside your Next.js or Nuxt app before, with one thing added: a promise about what stays the same.

## What 1.0 promises

From 1.0, breaking changes come only in a major release, each with an upgrade guide. Minor releases add features and patch releases fix bugs. The promise covers what you write against: the config, the Local API, REST routes and their error codes, the CLI, the adapters, and your data. Upgrades migrate the database forward, and every commit is tested by upgrading databases made by releases back to 0.10.

Names that change keep working until the next major, with a warning in the log, so an upgrade never breaks quietly. The shop, GraphQL and MCP plugins stay experimental for now: they are tested with real services and clients, but may still change in a minor release.

## How it got here

The road to 1.0 added no features. It settled the names 1.0 keeps (0.60), went through a self-review against OWASP ASVS level 1 and fixed what it found (0.62 to 0.66), tested the plugins against Stripe, a GraphQL client with codegen and Claude, and checked Getting started word for word on a fresh Ubuntu with npm, pnpm, Yarn and Bun.

## Upgrading from 0.x

Back up, upgrade every package together, start the app, and follow From 0.x to 1.0 in the upgrade guide. Most apps only change their config: the app names each renamed option when it starts. This site went from 0.68 to 1.0 without a migration.

## Starting fresh

\`npm create easy-cms@latest\` adds it to a Next.js or Nuxt project, or makes a standalone server. Getting started takes about five minutes.`,
  },
  {
    title: 'The new admin',
    category: 'Release', publishedAt: '2026-10-09', coverText: '⌘K', status: 'draft',
    meta: {
      title: 'The new Easy CMS admin: menu groups, ⌘K and edit layouts',
      description: 'Menu groups that fold, ⌘K search and commands, tabs and conditional fields on edit pages: the Easy CMS 0.47 admin, with no database changes.',
    },
    excerpt: 'Easy CMS 0.47 rebuilds the admin around a growing site: menu groups, ⌘K, badges, and edit pages with tabs and fields that show when they apply.',
    body: `With roles, media folders, a shop and multi-tenant sites, the admin's flat menu had grown long. 0.47 reorganises it, and your config keeps working as it is. Nothing changes in the database.

## A menu that groups

The menu has groups that fold, two levels deep: Content, the media library, each plugin's group (Shop › Catalog, Sales, Customers) and Settings. Each person can fold groups, pin items and collapse the menu to icons. Badges show what needs attention, such as orders to send, and a + creates a document from the menu.

\`\`\`ts
admin: {
  badge: { where: { status: { equals: 'paid' } }, label: { en: 'to send', th: 'รอจัดส่ง' } },
},
\`\`\`

## ⌘K

Search and commands from anywhere: go to a page, create a document, find documents by title in every collection, reopen recent ones, and run commands, including plugins' own. ⌘S saves, ⌘⇧P publishes, and ? lists every shortcut.

## Edit pages that fit the content

- \`admin.layout\` arranges fields into tabs, sections that fold and rows.
- \`admin.condition\` shows a field only when it applies; the server reads it too, so a hidden field isn't required.
- \`admin.description\` puts help below a field, and \`admin.width\` sets its width.

A failed save lists what to fix and opens the right tab, and unsaved changes are kept in the browser and offered back. The SEO plugin now puts its fields in an SEO tab.

The Admin guide has every option.`,
  },
  {
    title: 'Easy CMS 1.4: background work you can see, and safe on several servers',
    slug: 'easy-cms-1-4',
    category: 'Release', publishedAt: '2026-10-18', coverText: 'jobs ✓', status: 'draft',
    meta: {
      title: 'Easy CMS 1.4: Settings → Jobs, times of day, and background work that runs once',
      description: 'What changed from Easy CMS 1.0 to 1.4: an admin that shows when it is loading, background work claimed so it never runs twice, and a Jobs page to see, run, pause and reschedule it.',
    },
    excerpt: 'Four releases since 1.0: an admin that shows when it is loading, background work that runs once however many servers you have, and Settings → Jobs.',
    body: `Easy CMS 1.0 came out on 17 October. Four minor releases followed, all without breaking changes. Here is what they add, and what to do when you upgrade.

## Background work runs once (1.3)

Easy CMS does work in the background: scheduled publishing, webhook and email retries, scheduled backups, and the \`jobs\` your config or plugins add, such as the shop's payment check. Until 1.3, two servers sharing a database could both pick up the same piece of work. So could the built-in scheduler and a cron in one server. The result was a post published twice, a webhook sent twice, or two backups.

Now every piece of work is claimed in the database before it runs, so it runs once. If a server stops halfway, its work goes back to the queue. Clicking Retry twice on a failed delivery sends it once.

Apps with \`jobs\`, shops included, need one migration when they upgrade to 1.3: run \`easy-cms migrate:create\`, then \`easy-cms migrate\`.

## Settings → Jobs (1.4)

A new page shows the background work. It lists every job with its schedule, when it last ran, its result (with the error when it failed) and when it runs next. A second tab shows scheduled publishing that is waiting, running or failed. **Run due jobs now** runs whatever is due.

The page also says when jobs last ran. If nothing has run them for 10 minutes, it warns you. On serverless hosts this usually means the cron is missing.

Admins can pause a job, for example while a service it calls is down, and resume it later. A paused job shows on the dashboard so it isn't forgotten. Jobs marked \`adminSchedule: true\` can be rescheduled from the page.

## Jobs at a time of day

A job can now run at a set time in your time zone:

\`\`\`ts
export default defineConfig({
  timeZone: 'Asia/Bangkok',
  jobs: [
    { name: 'sitemap:refresh', at: '02:00', adminSchedule: true, run: refreshSitemap },
  ],
})
\`\`\`

If the time is missed, for example during a deploy, the job runs once as soon as jobs run again. \`timeZone\` also applies to \`backups.at\`.

## The admin shows when it is loading (1.2)

The dashboard, lists, forms and settings pages show skeletons in the shape of their content while they load, and a thin bar runs at the top when you change pages. Quick pages show nothing: indicators appear only after 250 ms. They stay still if you turn on reduced motion, and screen readers hear "Loading…" once. The back button on a document returns to its list again, with the same filters and page.

## Also

- The shop rechecks payments that are still pending after checkout (1.1), for when the page was closed before the payment came through.
- GraphQL create inputs mark required fields inside groups and rows as required (1.1).
- Dropdowns show the same arrow in every browser (1.3).

## Upgrading

Upgrade every package together:

\`\`\`bash
npm install @easy-cms/core@latest easy-cms@latest
npx easy-cms migrate
\`\`\`

The [Jobs guide](/docs/jobs) has the details, and the [changelog](/changelog) lists every release.`,
  },
  {
    title: 'Easy CMS 1.7: ready to run on several servers',
    slug: 'easy-cms-1-7',
    category: 'Release', publishedAt: '2026-10-25', coverText: 'readyz ✓', status: 'draft',
    meta: {
      title: 'Easy CMS 1.7: Postgres poolers, JSON logs, health checks and a Docker image',
      description: 'What changed from Easy CMS 1.4 to 1.7: Postgres pool options and PgBouncer, JSON logs with request ids, health checks in every setup, an official Docker image, and a tested setup for several servers.',
    },
    excerpt: 'Three releases since 1.4 make Easy CMS ready to run on several servers: Postgres poolers, JSON logs with request ids, health checks, and an official Docker image.',
    body: `Easy CMS 1.4 made background work run once however many servers share a database. Three releases since finish the job: everything a team needs to run Easy CMS on several servers behind a load balancer, and to know what it is doing there. None of them breaks anything, and none needs a migration.

## A setup that is tested, not assumed

The new [Reference architecture](/docs/deploy/production) page says what is supported when one server isn't enough: Postgres, S3-compatible storage for uploads, any number of identical instances behind a load balancer without sticky sessions, and a CDN in front. It also says plainly what is single-server only (SQLite on a disk, uploads on a disk) and what isn't supported (several regions, read replicas).

CI now checks this on every change. It starts two instances on one Postgres and one bucket behind a round-robin proxy, logs in on one and uses the session on the other, uploads through one and downloads through the other, counts failed logins across both, and runs scheduled publishing on both at once to check each post is published once.

## Postgres connection options (1.5)

\`postgres()\` takes \`prepare\`, \`statementTimeoutMs\`, \`idleTimeoutMs\`, \`connectTimeoutMs\` and \`applicationName\`. Connections show up as \`easy-cms\` in \`pg_stat_activity\`.

\`\`\`ts
db: postgres({ url: process.env.DATABASE_POOLER_URL, max: 2, prepare: false })
\`\`\`

On serverless hosts and with many instances, connect through a pooler. CI runs every Postgres test through PgBouncer in transaction mode. The [Databases](/docs/databases#connections) guide explains pool sizes, and when to turn off prepared statements.

Organisations that want the CMS kept apart from business data can give it a schema and a role of its own. The new [Database isolation](/docs/database-isolation) guide shows four levels, from a shared database to a server of its own, with the SQL to move an existing site.

## JSON logs and request ids (1.6)

\`\`\`ts
logs: { format: 'json' }
\`\`\`

Or set \`EASY_CMS_LOG_FORMAT=json\` on the host. Every line becomes one JSON object, with the time, level, message and the error's stack, ready for Datadog, Loki or CloudWatch. Every API response carries an \`X-Request-Id\` header, every line logged while answering it has the same id, and an id your load balancer sends is kept. With JSON logs each request also gets a line with its path, status and duration. See [Logs](/docs/deployment#logs).

## Health checks (1.7)

Every setup now answers two probes under the API:

- \`/api/cms/healthz\` answers \`ok\` while the process runs, without touching the database.
- \`/api/cms/readyz\` answers \`200\` when the database answers and no migration is pending, and \`503\` otherwise.

Point the load balancer, or Kubernetes' readiness probe, at \`readyz\`, and liveness at \`healthz\`. They answer even when the CMS can't start, and stay out of the request log. See [Health checks](/docs/deployment#health-checks).

## An official Docker image

\`ghcr.io/maritonx/easy-cms\` runs \`easy-cms serve\` with the SQLite and Postgres adapters, S3 storage and SMTP email. Add your config and migrations:

\`\`\`dockerfile
FROM ghcr.io/maritonx/easy-cms:1
COPY easy-cms.config.ts ./
COPY easy-cms ./easy-cms
\`\`\`

It runs as a non-root user, checks \`/readyz\`, and comes for amd64 and arm64. Each release builds it. See [Docker](/docs/deploy/docker#the-official-image).

## Also

- Logging out on a page with unsaved changes asks first, and staying keeps you logged in (1.4.3).
- Reads with \`locale: 'all'\` are typed as they return (1.4.2).

## Upgrading

Upgrade every package together. There is no migration:

\`\`\`bash
npm install @easy-cms/core@latest easy-cms@latest
\`\`\`

The [changelog](/changelog) lists every release.`,
  },
  {
    title: 'Run Easy CMS on several servers with Docker and Postgres',
    slug: 'run-easy-cms-on-several-servers',
    category: 'Guide', publishedAt: '2026-10-25', coverText: 'app1 + app2', status: 'draft',
    meta: {
      title: 'Run Easy CMS on several servers: Docker Compose, Postgres, S3 and a load balancer',
      description: 'A step-by-step setup with Docker Compose: two Easy CMS instances from the official image, Postgres, S3 storage and Caddy as the load balancer, with migrations run once.',
    },
    excerpt: 'Two Easy CMS instances behind a load balancer, on one Postgres and one bucket, with Docker Compose. Stop either one and the site keeps answering.',
    body: `One server is enough for most sites. A second one lets you deploy without downtime and keeps the site up when a server fails. This guide sets up two Easy CMS instances with Docker Compose: the official image, Postgres, a bucket for uploads, and Caddy in front.

It uses the standalone server (\`easy-cms serve\`). A Next.js or Nuxt app works the same way: run several copies of your app's image instead.

## What you need

- Docker with Compose
- An S3-compatible bucket and its keys: S3, Cloudflare R2, or MinIO. Uploads can't live on a server's disk once there are two servers.
- A project with \`easy-cms.config.ts\` and its migrations in \`easy-cms/migrations\` (run \`easy-cms migrate:create init\` once in development)

## 1. The config

Everything comes from the environment, so both instances run the same image:

\`\`\`ts
import { defineConfig } from '@easy-cms/core'
import { postgres } from '@easy-cms/db-postgres'
import { s3Storage } from '@easy-cms/storage-s3'

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET as string,
  serverURL: process.env.SERVER_URL,
  db: postgres({ url: process.env.DATABASE_URL as string, max: 5 }),
  upload: {
    storage: s3Storage({
      bucket: process.env.S3_BUCKET as string,
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }),
  },
  collections: [
    { slug: 'posts', drafts: true, schedule: true, fields: [{ name: 'title', type: 'text' }] },
  ],
})
\`\`\`

## 2. The image

The official image holds Easy CMS and its adapters. Yours adds the config and the migrations:

\`\`\`dockerfile
FROM ghcr.io/maritonx/easy-cms:1
COPY easy-cms.config.ts ./
COPY easy-cms ./easy-cms
\`\`\`

## 3. Compose

\`compose.yaml\` runs Postgres, a one-off \`migrate\` service, two instances and the load balancer:

\`\`\`yaml
x-app: &app
  build: .
  environment:
    EASY_CMS_SECRET: \${EASY_CMS_SECRET:?set EASY_CMS_SECRET in .env}
    SERVER_URL: \${SERVER_URL:-http://localhost:8080}
    DATABASE_URL: postgres://cms:\${POSTGRES_PASSWORD:?}@db:5432/cms
    S3_BUCKET: \${S3_BUCKET:?}
    S3_REGION: \${S3_REGION:-auto}
    S3_ENDPOINT: \${S3_ENDPOINT:-}
    S3_ACCESS_KEY_ID: \${S3_ACCESS_KEY_ID:?}
    S3_SECRET_ACCESS_KEY: \${S3_SECRET_ACCESS_KEY:?}
    # Migrations run once, in the migrate service.
    EASY_CMS_MIGRATE: "false"
  depends_on:
    migrate:
      condition: service_completed_successfully
  restart: unless-stopped

services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: cms
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?}
      POSTGRES_DB: cms
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cms -d cms"]
      interval: 5s
      retries: 10
    restart: unless-stopped

  migrate:
    <<: *app
    entrypoint: ["easy-cms", "migrate"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app1: *app
  app2: *app

  lb:
    image: caddy:2
    ports:
      - "8080:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
    depends_on: [app1, app2]
    restart: unless-stopped

volumes:
  pgdata:
\`\`\`

The instances wait for \`migrate\`, so the database is up to date before either serves a request, and the migration runs once rather than in both.

## 4. The load balancer

Caddy sends requests to both instances in turn, and stops sending to one whose \`/readyz\` doesn't answer \`200\`:

\`\`\`txt
:80 {
	reverse_proxy app1:4000 app2:4000 {
		lb_policy round_robin
		health_uri /readyz
		health_interval 5s
	}
}
\`\`\`

No sticky sessions are needed: sessions, sign-in limits and the job queue live in Postgres, so either instance can answer any request.

## 5. Start it

Put the secrets in \`.env\` next to \`compose.yaml\`:

\`\`\`bash
printf 'EASY_CMS_SECRET=%s\\nPOSTGRES_PASSWORD=%s\\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 16)" > .env
\`\`\`

Add \`S3_BUCKET\`, \`S3_ACCESS_KEY_ID\` and \`S3_SECRET_ACCESS_KEY\`, and for R2 or MinIO \`S3_ENDPOINT\` too. Then:

\`\`\`bash
docker compose up -d --build
docker compose exec app1 easy-cms admin:create --email you@example.com
\`\`\`

Open \`http://localhost:8080/admin\` and log in. Uploads go to the bucket, so a file uploaded while one instance answered is served by the other.

## 6. Check it

Stop one instance and keep using the admin:

\`\`\`bash
docker compose stop app1
\`\`\`

Within a few seconds Caddy notices that \`app1\` doesn't answer \`/readyz\` and sends everything to \`app2\`. Start it again with \`docker compose start app1\`.

## Deploying a new version

Rebuild, migrate once, then replace the instances one at a time, so one is always serving:

\`\`\`bash
docker compose build
docker compose run --rm migrate
docker compose up -d --no-deps app1
docker compose up -d --no-deps app2
\`\`\`

## Before going live

- Put HTTPS in front: with a domain in the Caddyfile instead of \`:80\`, Caddy gets a certificate by itself. Set \`SERVER_URL\` to the public address.
- Keep instances × \`max\` connections well under Postgres's \`max_connections\`, and add PgBouncer when there are many instances. See [Connections](/docs/databases#connections).
- Turn on JSON logs (\`EASY_CMS_LOG_FORMAT=json\`) if you collect logs, and back up the database and the bucket.

The [Reference architecture](/docs/deploy/production) page lists everything that is supported, and the [Docker guide](/docs/deploy/docker) covers a single server.`,
  },
  {
    title: 'Easy CMS 1.13: built for a million documents',
    slug: 'easy-cms-1-13',
    category: 'Release', publishedAt: '2026-10-27', coverText: '1,000,000', status: 'draft',
    meta: {
      title: 'Easy CMS 1.13: cursors, Thai trigram search, HTTP caching, an outbox and search adapters',
      description: 'What changed from Easy CMS 1.7 to 1.13, measured against 1,000,000 posts: lists that count less, cursor pagination, trigram indexes for Thai, HTTP caching for a CDN, an outbox for after hooks, and search adapters.',
    },
    excerpt: 'Six releases since 1.7 for collections of a million posts: cursors, Thai search with trigram indexes, HTTP caching, an outbox and search adapters.',
    body: `Easy CMS 1.7 made it ready to run on several servers. The six releases since are about size: a collection of 1,000,000 documents. A load test at that size came first, to show where the time goes, and none of the releases breaks anything.

## What a million posts looks like

A nightly load test fills Postgres 17 with 1,000,000 posts and sends 20 requests at once from a 4-core GitHub runner. On 1.10, the p95 times were:

- A post by id or slug: **22 ms**
- The first page of a list: **28 ms**
- The next page by cursor, deep in the list: **29 ms**
- Thai \`like\` search with a trigram index: **69 ms**
- Save a draft, with a version: **89 ms**

Some things are still slow, and the [Databases](/docs/databases#at-1000000-posts) guide lists them too: a random page by number deep in the list takes seconds, and so do queries inside blocks.

## Lists count less (1.8)

Counting a million rows for every page is the cost of \`totalDocs\`. \`count: false\` (REST \`?count=false\`) skips it, for archives and infinite scroll. Counts of the same list are now reused for \`countCacheSeconds\` (5 by default), so a list many people open is counted once in that time.

## Cursor pagination (1.9)

\`\`\`ts
const page = await cms.find('posts', { cursor: '', limit: 20 })
const next = await cms.find('posts', { cursor: page.nextCursor, limit: 20 })
\`\`\`

Each page takes as long as the first, however deep. \`maxPage\` keeps API clients from paging deep by number. See [find results](/docs/local-api#find-results).

## Thai search with trigram indexes (1.10)

\`\`\`ts
{ name: 'title', type: 'text', index: 'trigram' }
\`\`\`

On Postgres, a GIN \`pg_trgm\` index lets \`like\` find any part of a text without reading every row, in Thai as in English. At a million posts, a Thai search takes 69 ms (p95). See [Search with like](/docs/databases#search-with-like).

## HTTP caching for a CDN (1.11)

\`\`\`ts
httpCache: { sMaxAge: 60, staleWhileRevalidate: 600, purge: (tags) => tags.forEach((tag) => revalidateTag(tag)) }
\`\`\`

Public reads of published content get \`s-maxage\`, an \`ETag\` and cache tags, so a CDN can answer them. Saving, publishing or deleting purges just the tags that changed. Anything with a login or drafts stays \`no-store\`. See [HTTP caching](/docs/deployment#http-caching).

## An outbox for after hooks (1.12)

\`\`\`ts
outbox: true
\`\`\`

Hooks, webhooks and cache purges are written in the same transaction as the save, then run after it commits and retried until they succeed. A save that succeeds always gets its side effects. Failed entries show in Settings → Jobs → Outbox. Hooks must be safe to run twice. See [Outbox](/docs/hooks#outbox).

## Search adapters (1.13)

\`\`\`ts
search: memorySearch(),
collections: [{ slug: 'posts', search: { fields: ['title', 'body'] }, /* … */ }],
\`\`\`

\`cms.search()\` and \`GET /api/cms/search\` find published documents across fields and collections, best match first, with the reader's access. \`memorySearch()\` splits Thai into words with \`Intl.Segmenter\`, so \`น้ำท่วม\` finds \`ข่าวน้ำท่วมกรุงเทพมหานคร\`. It suits development and small sites. Adapters for search engines implement \`SearchAdapter\`. See [Search](/docs/search).

## Upgrading

Upgrade every package together. All of this is off until you turn it on. Only \`outbox: true\` needs a migration:

\`\`\`bash
npm install @easy-cms/core@latest easy-cms@latest
\`\`\`

The [changelog](/changelog) lists every release.`,
  },
]

const showcase = [
  {
    name: 'Next.js starter (one-click deploy)', url: 'https://github.com/maritonx/easy-cms/tree/main/templates/next-starter', order: 0,
    description: 'A Next.js blog with its admin, roles and audit log. One button deploys it to Vercel or Netlify with a database and file storage.',
    stack: ['Next.js', 'Postgres'],
  },
  {
    name: 'Next.js blog example', url: 'https://github.com/maritonx/easy-cms/tree/main/examples/next-blog', order: 1,
    description: 'Posts, pages, categories and forms in Thai and English, with SEO, redirects, nested pages and MCP.',
    stack: ['Next.js', 'Postgres'],
  },
  {
    name: 'Nuxt blog example', url: 'https://github.com/maritonx/easy-cms/tree/main/examples/nuxt-blog', order: 2,
    description: 'The same blog on Nuxt with the Easy CMS module and useEasyCMS().',
    stack: ['Nuxt', 'SQLite'],
  },
  {
    name: 'Standalone server', url: 'https://github.com/maritonx/easy-cms/tree/main/examples/standalone', order: 3,
    description: 'Easy CMS as its own server with REST, for Vite, React, Vue, mobile or static sites.',
    stack: ['Standalone', 'SQLite'],
  },
  {
    name: 'Easy CMS website', url: 'https://easy-cms-website.vercel.app', order: 4,
    description: 'This site. The blog, changelog and showcase are Easy CMS collections in a Next.js app.',
    stack: ['Next.js', 'SQLite'],
  },
]

// ---------- run ----------
const cms = await createEasyCMS(config)

async function fill<T>(collection: 'posts' | 'releases' | 'showcase', rows: T[], toData: (row: T) => Record<string, unknown>) {
  if (reset) {
    const { docs } = await cms.find(collection, { limit: 1000, draft: true })
    for (const doc of docs) await cms.delete(collection, doc.id)
  } else if ((await cms.count(collection)) > 0) {
    console.log(`${collection}: has documents, skipped (use --reset to replace them)`)
    return
  }
  for (const row of rows) {
    const status = (row as { status?: string }).status ?? 'published'
    await cms.create(collection, { ...toData(row), status } as never)
  }
  console.log(`${collection}: ${rows.length} added`)
}

const releaseData = (r: (typeof releases)[number]) => ({
  ...r,
  changes: r.changes.map((text) => ({ text })),
  packages: r.packages.map((name) => ({ name })),
})
if (reset) {
  await fill('releases', releases, releaseData)
} else {
  // Releases come from the changelog: add the versions that aren't there yet, keep the rest.
  const { docs } = await cms.find('releases', { limit: 1000, draft: true })
  const known = new Set(docs.map((d) => d.version))
  const missing = releases.filter((r) => !known.has(r.version))
  for (const r of missing) await cms.create('releases', { ...releaseData(r), status: 'published' } as never)
  console.log(`releases: ${missing.length ? missing.map((r) => r.version).join(', ') + ' added' : 'up to date'}`)
}
/** A seeded post's slug: its own (Thai posts have Latin ones), or made from the title. */
const slugOf = (p: { title: string; slug?: string }) => p.slug ?? slugify(p.title)
const laterPosts = [...newPosts, ...thaiPosts]
const allPosts = [...laterPosts, ...posts]
await fill('posts', allPosts, (p) => ({ ...p, body: richText(p.body) }))

// Posts added to the seed later: created by slug when missing, with their own status (drafts).
if (!reset) {
  const { docs } = await cms.find('posts', { limit: 1000, draft: true })
  const known = new Set(docs.map((d) => d.slug))
  const missing = laterPosts.filter((p) => !known.has(slugOf(p)))
  for (const p of missing) await cms.create('posts', { ...p, body: richText(p.body) } as never)
  console.log(`posts: ${missing.length ? `${missing.length} new as drafts` : 'no new posts'}`)
}

// SEO fields for posts that already exist (by slug), where they are still empty; what editors
// wrote in the admin stays.
{
  const { docs } = await cms.find('posts', { limit: 1000, draft: true })
  const bySlug = new Map(allPosts.map((p) => [slugOf(p), p.meta]))
  let filled = 0
  for (const doc of docs) {
    const seo = bySlug.get(String(doc.slug))
    const meta = (doc as { meta?: { title?: string | null; description?: string | null } }).meta ?? {}
    if (!seo || (meta.title && meta.description)) continue
    await cms.update('posts', doc.id, {
      meta: { ...meta, title: meta.title || seo.title, description: meta.description || seo.description },
      status: doc.status,
    } as never)
    filled++
  }
  console.log(`posts: SEO fields filled on ${filled}`)
}
// Posts from before the language field: English. The migration fills published rows; this fills
// drafts, whose latest version was saved without it.
{
  const { docs } = await cms.find('posts', { limit: 1000, draft: true })
  const untagged = docs.filter((d) => !d.language)
  for (const doc of untagged) await cms.update('posts', doc.id, { language: 'en', status: doc.status } as never)
  console.log(`posts: language set on ${untagged.length}`)
}
await fill('showcase', showcase, (s) => s)
if (!reset) {
  // Entries added to the seed later, by address.
  const { docs } = await cms.find('showcase', { limit: 1000, draft: true })
  // This site's entry was seeded with a domain the project doesn't have yet.
  for (const doc of docs.filter((d) => d.url === 'https://easy-cms.io')) {
    await cms.update('showcase', doc.id, {
      name: 'Easy CMS website',
      url: 'https://easy-cms-website.vercel.app',
      status: 'published',
    } as never)
    doc.url = 'https://easy-cms-website.vercel.app'
    console.log('showcase: this site now points to easy-cms-website.vercel.app')
  }
  const known = new Set(docs.map((d) => d.url))
  const missing = showcase.filter((s) => !known.has(s.url))
  for (const s of missing) await cms.create('showcase', { ...s, status: 'published' } as never)
  console.log(`showcase: ${missing.length ? missing.map((s) => s.name).join(', ') + ' added' : 'up to date'}`)
}

await cms.updateGlobal('site', {
  siteName: 'Easy CMS',
  announcement: { badge: '1.0', label: 'Easy CMS 1.0 is out: stable from here on', href: '/changelog#v1.0.0' },
})
console.log('site: announcement set')

await cms.destroy()
