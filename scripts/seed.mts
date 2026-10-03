/**
 * Fills an empty database with the site's starting content: releases from the Easy CMS
 * changelog, blog posts, showcase entries and the home page announcement.
 *
 *   pnpm seed            only collections that are still empty
 *   pnpm seed --reset    delete what is there first
 */
import { createEasyCMS } from '@easy-cms/core'
import configModule from '../easy-cms.config'

// The config is a CommonJS module to Node here (the package isn't "type": "module").
const config = ((configModule as { default?: typeof configModule }).default ?? configModule)

const reset = process.argv.includes('--reset')

// ---------- a tiny markdown-ish → Tiptap JSON, enough for seed posts ----------
type Node = Record<string, unknown>

function inline(text: string): Node[] {
  return text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('`') && part.endsWith('`')
        ? { type: 'text', text: part.slice(1, -1), marks: [{ type: 'code' }] }
        : { type: 'text', text: part },
    )
}

function richText(source: string) {
  const content: Node[] = []
  const blocks = source.trim().split(/\n{2,}(?![^`]*```)/)
  for (const block of blocks) {
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
const releases = [
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
    category: 'Release', publishedAt: '2026-10-01', coverText: '--pm bun', featured: true,
    excerpt: 'Easy CMS 0.22 picks your package manager from the lockfile or the --pm flag, prints the next steps in its own commands, and the docs remember the one you chose.',
    body: `Until now, \`create-easy-cms\` assumed npm. It installed with npm and told you to run \`npx easy-cms migrate\`, even in a pnpm workspace. 0.22 fixes that.

## How it picks

- \`--pm npm|pnpm|yarn|bun\` when you pass it.
- Otherwise the \`packageManager\` field in package.json, then the lockfile.
- Otherwise the one you ran it with, so \`bun create easy-cms\` uses Bun.

\`\`\`bash
pnpm create easy-cms --db sqlite
\`\`\`

## The docs follow

Every command in the docs now has a tab for each package manager, and the one you pick sticks on every page.`,
  },
  {
    title: 'Nested pages, with paths and breadcrumbs',
    category: 'Release', publishedAt: '2026-09-30', coverText: '/about/team',
    excerpt: 'About → Team → Engineering. The new plugin keeps every path and breadcrumb up to date when a page moves, in every language.',
    body: `\`@easy-cms/plugin-nested-docs\` gives each document a \`parent\`, its full \`path\` and its \`breadcrumbs\`.

\`\`\`ts
import { nestedDocsPlugin } from '@easy-cms/plugin-nested-docs'

plugins: [nestedDocsPlugin({ collections: ['pages'] })]
\`\`\`

When a page gets a new slug or parent, the pages under it are updated when it is published. With the redirects plugin, their old addresses redirect.`,
  },
  {
    title: 'Forms and email, built in',
    category: 'Release', publishedAt: '2026-09-29', coverText: '<easy-form>',
    excerpt: 'Editors build forms in the admin. Submissions are validated on the server, emails retry for a day, and bots meet a honeypot.',
    body: `Two packages land together: \`@easy-cms/email-smtp\` and \`@easy-cms/plugin-form-builder\`.

- Editors build forms from field blocks: text, email, number, choice, date and more.
- Submissions are validated on the server and exported as CSV.
- A honeypot, a minimum time, a rate limit and optional Cloudflare Turnstile keep bots out.

Render a form on any page with \`<easy-form form="contact">\`.`,
  },
  {
    title: 'Why we put the CMS inside your app',
    category: 'Engineering', publishedAt: '2026-09-24', coverText: 'in-process',
    excerpt: 'A second service means a second deploy, a second database and a network hop on every render. Here is what we gained by removing it.',
    body: `Most headless CMSs are a separate service. Your site calls it over HTTPS with a token, and you keep two deployments and two databases in step.

## One deployment

Easy CMS is a package. The admin and the REST API are route handlers in your app, and your pages read content with an in-process call.

## Types from the config

Because the content model is TypeScript in your repo, \`cms.find('posts')\` returns typed documents with no generation step.`,
  },
  {
    title: 'Moving from SQLite to Postgres',
    category: 'Guide', publishedAt: '2026-09-21', coverText: 'easy-cms copy',
    excerpt: 'Start on a SQLite file, grow into Postgres. The CLI copies every collection, version and upload between databases.',
    body: `Start with a SQLite file in development and on a small site. When you outgrow it, copy everything to Postgres with the CLI.

The full steps are in the recipe **Move from SQLite to Postgres** in the docs.`,
  },
  {
    title: 'Rebuild a static site when an editor publishes',
    category: 'Guide', publishedAt: '2026-09-17', coverText: 'webhook ✓',
    excerpt: 'Signed webhooks trigger a deploy the moment content goes live, and only then.',
    body: `Webhooks are signed, so the receiver can check they came from your CMS. Point one at your host's deploy hook and filter on publish events.

The recipe **Rebuild a static site on publish** in the docs has the whole setup.`,
  },
]

const showcase = [
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
    name: 'easy-cms.io', url: 'https://easy-cms.io', order: 4,
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
  for (const row of rows) await cms.create(collection, { ...toData(row), status: 'published' } as never)
  console.log(`${collection}: ${rows.length} added`)
}

await fill('releases', releases, (r) => ({
  ...r,
  changes: r.changes.map((text) => ({ text })),
  packages: r.packages.map((name) => ({ name })),
}))
await fill('posts', posts, (p) => ({ ...p, body: richText(p.body) }))
await fill('showcase', showcase, (s) => s)

await cms.updateGlobal('site', {
  siteName: 'Easy CMS',
  announcement: { badge: '0.22', label: 'npm, pnpm, Yarn and Bun in one installer', href: '/changelog' },
})
console.log('site: announcement set')

await cms.destroy()
