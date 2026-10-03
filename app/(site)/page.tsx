import type { Metadata } from 'next'
import Link from 'next/link'
import { jsonLdScript } from '@easy-cms/plugin-seo'
import { AdminShowcase } from '@/components/home/admin-showcase'
import { CodeSteps, type CodeStep } from '@/components/home/code-steps'
import { InstallCommand } from '@/components/home/install-command'
import { ArrowIcon, FeatureIcon, GitHubIcon } from '@/components/icons'
import { PostCard } from '@/components/post-card'
import { getPosts, getSite } from '@/lib/cms'
import { highlight } from '@/lib/highlight'
import { SITE_URL } from '@/easy-cms.config'
import { GITHUB_URL, NPM_URL, VERSION } from '@/lib/site'

// Reads the latest posts and the announcement from the CMS on every request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { alternates: { canonical: '/' } }

/** What Easy CMS is, for search results: free, MIT-licensed developer software on Node.js. */
const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Easy CMS',
  description: 'The embedded, code-first headless CMS for Nuxt and Next.js.',
  url: SITE_URL,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Node.js 22.12 or later',
  softwareVersion: VERSION,
  license: 'https://opensource.org/licenses/MIT',
  downloadUrl: NPM_URL,
  sameAs: [GITHUB_URL],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

const CONFIG_CODE = `
import { defineConfig } from '@easy-cms/core'
import { postgres } from '@easy-cms/db-postgres'
import { seoPlugin } from '@easy-cms/plugin-seo'

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET!,
  db: postgres({ url: process.env.DATABASE_URL! }),
  localization: { locales: ['en', 'th'], defaultLocale: 'en' },
  collections: [
    {
      slug: 'posts',
      drafts: true, versions: true, schedule: true,
      useAsTitle: 'title',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'slug', type: 'slug', from: 'title' },
        { name: 'body', type: 'richText', localized: true },
      ],
    },
  ],
  plugins: [seoPlugin({ collections: ['posts'] })],
})`

const ROUTES_CODE = `
// app/admin/[[...path]]/route.ts
import { createAdminRouteHandlers } from '@easy-cms/next'
import config from '@/easy-cms.config'

export const { GET, HEAD } = createAdminRouteHandlers(config)


// app/api/cms/[[...path]]/route.ts
import { createRouteHandlers } from '@easy-cms/next'
import config from '@/easy-cms.config'

export const { GET, HEAD, POST, PATCH, PUT, DELETE, OPTIONS } =
  createRouteHandlers(config)


// next.config.ts
import { withEasyCMS } from '@easy-cms/next/config'
export default withEasyCMS({ /* your Next config */ })`

const PAGE_CODE = `
import { getEasyCMS } from '@easy-cms/next'
import config from '@/easy-cms.config'

export const dynamic = 'force-dynamic'

export default async function Posts() {
  const cms = await getEasyCMS(config)
  const { docs } = await cms.find('posts', { limit: 10 })

  return (
    <ul>
      {docs.map((post) => (
        // post.title: string, typed from your config
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}`

const HERO_CODE = `
const cms = await getEasyCMS(config)
const { docs } = await cms.find('posts')
// docs: Post[], typed from your config`

const FEATURES = [
  ['history', 'Drafts and version history', 'Edit a published post without touching the live page. Compare versions and restore any of them.'],
  ['preview', 'Live preview', 'Your real page sits next to the form and updates as editors type, before anything is published.'],
  ['calendar', 'Scheduled publishing', 'Publish or unpublish at a set time. Due jobs run every minute on the server you already have.'],
  ['language', 'Localized content', 'One value per language, with translation status in every list. The admin speaks English and Thai.'],
  ['media', 'Media library', 'Uploads on disk or on S3, R2 and MinIO, with image sizes generated for you.'],
  ['lock', 'Access control in code', 'Rules are functions per collection, document and field. API keys get per-collection permissions.'],
  ['link', 'Signed webhooks', 'Tell your build, search index or Slack when content changes. Every request is signed.'],
  ['seo', 'SEO out of the box', 'Sitemaps, hreflang, JSON-LD and llms.txt from the content you already have.'],
  ['chip', 'MCP for AI assistants', 'Let Claude and other assistants read and draft content through an MCP server, limited by API key.'],
] as const

const PLUGINS = [
  ['@easy-cms/plugin-seo', 'Meta fields, sitemaps, hreflang and JSON-LD.', 'seo'],
  ['@easy-cms/plugin-form-builder', 'Editors build forms; submissions are validated, stored and exported as CSV.', '0.20'],
  ['@easy-cms/plugin-redirects', '301 to 308 redirects, created automatically when a page moves.', '0.19'],
  ['@easy-cms/plugin-nested-docs', 'Pages inside pages, with paths and breadcrumbs per language.', '0.21'],
  ['@easy-cms/plugin-mcp', 'An MCP server so AI assistants can work with your content.', 'ai'],
] as const

export default async function Home() {
  const [posts, site, configHtml, routesHtml, pageHtml, heroHtml] = await Promise.all([
    getPosts(3),
    getSite(),
    highlight(CONFIG_CODE, 'ts'),
    highlight(ROUTES_CODE, 'ts'),
    highlight(PAGE_CODE, 'tsx'),
    highlight(HERO_CODE, 'ts'),
  ])
  const announcement = site.announcement

  const steps: CodeStep[] = [
    {
      key: 'config',
      title: 'Define your content',
      text: <>Collections, fields, drafts and locales in <code>easy-cms.config.ts</code>.</>,
      file: 'easy-cms.config.ts',
      html: configHtml,
    },
    {
      key: 'routes',
      title: 'Mount the admin and API',
      text: <>Two route handlers serve <code>/admin</code> and <code>/api/cms</code>.</>,
      file: 'app/admin/[[...path]]/route.ts',
      html: routesHtml,
    },
    {
      key: 'page',
      title: 'Read it in a Server Component',
      text: <><code>getEasyCMS()</code> returns documents typed from your config.</>,
      file: 'app/posts/page.tsx',
      html: pageHtml,
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareJsonLd) }} />
      <section className="hero">
        <div className="wrap">
          <div className="hero-copy">
            {announcement?.label && (
              <Link className="badge" href={announcement.href || '/changelog'}>
                {announcement.badge && <b>{announcement.badge}</b>}
                {announcement.label} <ArrowIcon />
              </Link>
            )}
            <h1>
              Your Next.js app is <em>already a CMS.</em>
            </h1>
            <p className="lede">
              Easy CMS runs inside your Next.js or Nuxt app. Define content in TypeScript, and you get an
              admin at <code>/admin</code>, a typed API and REST, on one deployment and your own database.
            </p>
            <InstallCommand />
            <div className="cta-row">
              <Link className="btn primary" href="/docs/getting-started">
                Get started <ArrowIcon />
              </Link>
              <a className="btn" href={GITHUB_URL}>
                <GitHubIcon /> Star on GitHub
              </a>
            </div>
            <div className="hero-meta">
              <span>MIT licensed</span>
              <span>Next.js 15+ · Nuxt</span>
              <span>Admin in English &amp; ไทย</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="window">
              <div className="window-bar">
                <div className="dots"><i /><i /><i /></div>
                <div className="url">localhost:3000<b>/admin</b></div>
              </div>
              {/* eslint-disable @next/next/no-img-element -- static screenshots, one per theme */}
              <img className="shot only-dark" src="/screenshots/dashboard-en-dark.webp" alt="Easy CMS admin dashboard" fetchPriority="high" />
              <img className="shot only-light" src="/screenshots/dashboard-en-light.webp" alt="Easy CMS admin dashboard" />
              {/* eslint-enable @next/next/no-img-element */}
            </div>
            <div className="float-code">
              <div className="fname"><span>app/page.tsx</span><span>Server Component</span></div>
              <div dangerouslySetInnerHTML={{ __html: heroHtml }} />
            </div>
          </div>
        </div>
      </section>

      <div className="stack">
        <div className="wrap">
          <span className="label">Runs with</span>
          <ul>
            <li>Next.js <small>15+</small></li>
            <li>Nuxt</li>
            <li>PostgreSQL</li>
            <li>SQLite <small>· Turso</small></li>
            <li>PGlite</li>
            <li>S3 <small>· R2 · MinIO</small></li>
            <li>Vercel</li>
          </ul>
        </div>
      </div>

      <section className="section" id="why">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Embedded, not hosted</span>
            <h2>No second server to run, pay for or keep in sync.</h2>
            <p>
              A typical headless CMS is another service with its own database and API keys. Easy CMS is an
              npm package your app mounts, so content ships with the code that renders it.
            </p>
          </div>
          <div className="compare">
            <div className="arch">
              <div><div className="tag">A hosted headless CMS</div><h3>Two apps, two databases</h3></div>
              <div className="diagram">
                <div className="node"><b>Your Next.js app</b><div className="chips"><span className="chip">pages</span><span className="chip">fetch()</span></div></div>
                <div className="link-line">HTTPS · API token · rate limits</div>
                <div className="split-row">
                  <div className="node"><b>CMS service</b><span>separate deploy</span></div>
                  <div className="node"><b>CMS database</b><span>not yours</span></div>
                </div>
              </div>
              <ul>
                <li>Schema lives in a web UI, not in your repo</li>
                <li>Types generated in a separate step</li>
                <li>A network hop on every page render</li>
              </ul>
            </div>
            <div className="arch is-ours">
              <div><div className="tag">Easy CMS</div><h3>One app, one database</h3></div>
              <div className="diagram">
                <div className="node solid">
                  <b>Your Next.js app</b>
                  <div className="chips"><span className="chip">pages → getEasyCMS()</span><span className="chip">/admin</span><span className="chip">/api/cms</span></div>
                  <div className="chips"><span className="chip">@easy-cms/next</span><span className="chip">@easy-cms/core</span></div>
                </div>
                <div className="link-line">in-process call · no network</div>
                <div className="node solid"><b>Your database</b><span>Postgres or SQLite · only <code>ecms_</code> tables</span></div>
              </div>
              <ul>
                <li>Content model in <code>easy-cms.config.ts</code>, reviewed in PRs</li>
                <li>Types come straight from the config, no build step</li>
                <li>Deploys wherever your app already runs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section flush-top" id="code">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Code-first</span>
            <h2>Three files and your app has a CMS.</h2>
            <p>
              Describe collections and fields in TypeScript. The admin forms, validation, access rules and
              the typed API are built from that one file.
            </p>
          </div>
          <CodeSteps steps={steps} />
        </div>
      </section>

      <section className="section flush-top" id="features">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Built in</span>
            <h2>What editors expect, what developers can review.</h2>
          </div>
          <div className="features">
            {FEATURES.map(([icon, title, text]) => (
              <div className="feature" key={title}>
                <FeatureIcon name={icon} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section flush-top" id="plugins">
        <div className="wrap plugins-grid">
          <div className="section-head">
            <span className="eyebrow">Official plugins</span>
            <h2>Add a feature with one line in <code style={{ fontSize: '.8em' }}>plugins</code>.</h2>
            <p>
              Each plugin adds its own collections, admin screens and API routes, and ships its migration.
              Write your own with the same hooks.
            </p>
            <div className="cta-row" style={{ marginTop: 8 }}>
              <Link className="btn" href="/docs/plugins">Browse plugins <ArrowIcon /></Link>
            </div>
          </div>
          <div className="plugin-list">
            {PLUGINS.map(([name, text, since]) => (
              <div className="plugin" key={name}>
                <code>{name}</code>
                <p>{text}</p>
                <span className="since">{since}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section showcase-band" id="admin">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">The admin</span>
            <h2>An admin your editors will actually like.</h2>
            <p>Generated from your config, in light and dark, English and Thai. Nothing to design or host.</p>
          </div>
          <AdminShowcase />
          <div className="lang-note">
            <span>Switch the site theme to see the admin in light or dark</span>
            <span>· admin.locale: &apos;en&apos; | &apos;th&apos;</span>
          </div>
        </div>
      </section>

      <section className="section" id="blog">
        <div className="wrap">
          <div className="row-head">
            <div className="section-head">
              <span className="eyebrow">From the blog</span>
              <h2>Latest releases and guides</h2>
            </div>
            <Link className="btn" href="/blog">All posts <ArrowIcon /></Link>
          </div>
          {posts.length > 0 ? (
            <div className="post-grid">
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <p className="empty">No posts yet. Publish one at <code>/admin</code>, or run <code>pnpm seed</code>.</p>
          )}
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <div className="final-box">
            <div>
              <h2>Ship content with the code that renders it.</h2>
              <p>
                Scaffold a Next.js or Nuxt project with Easy CMS in about a minute. It is MIT licensed and
                runs on your own infrastructure.
              </p>
            </div>
            <div className="cta-row">
              <Link className="btn primary" href="/docs/getting-started">Read the guide <ArrowIcon /></Link>
              <a className="btn" href={GITHUB_URL}><GitHubIcon /> View source</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
