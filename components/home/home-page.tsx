import Link from 'next/link'
import { jsonLdScript } from '@easy-cms/plugin-seo'
import { SITE_URL } from '@/easy-cms.config'
import { getPosts, getSite, type Post } from '@/lib/cms'
import { highlight } from '@/lib/highlight'
import { HOME_COPY, type HomeCopy, type Locale } from '@/lib/home-copy'
import { GITHUB_URL, NPM_URL, VERSION } from '@/lib/site'
import { DeployButtons } from '../deploy-buttons'
import { ArrowIcon, FeatureIcon, GitHubIcon } from '../icons'
import { PostCard } from '../post-card'
import { StabilityNote } from '../stability-note'
import { WhyStrip } from '../why/parts'
import { AdminShowcase } from './admin-showcase'
import { CodeSteps, type CodeStep } from './code-steps'
import { InstallCommand } from './install-command'

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

const PLUGIN_NAMES = [
  ['@easy-cms/plugin-seo', 'seo'],
  ['@easy-cms/plugin-form-builder', 'forms'],
  ['@easy-cms/plugin-redirects', 'seo'],
  ['@easy-cms/plugin-nested-docs', 'pages'],
  ['@easy-cms/plugin-multi-tenant', '0.44'],
  ['@easy-cms/plugin-ecommerce', '0.46'],
  ['@easy-cms/plugin-graphql', '0.43'],
  ['@easy-cms/plugin-mcp', 'ai'],
] as const

/** Copy text with `backticks` as code. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part,
      )}
    </>
  )
}

/** The code samples, in English apart from the comments. */
function samples(c: HomeCopy['code']['comments']) {
  return {
    config: `
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
})`,
    routes: `
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
export default withEasyCMS({ /* ${c.routes} */ })`,
    page: `
import { getEasyCMS } from '@easy-cms/next'
import config from '@/easy-cms.config'

export const dynamic = 'force-dynamic'

export default async function Posts() {
  const cms = await getEasyCMS(config)
  const { docs } = await cms.find('posts', { limit: 10 })

  return (
    <ul>
      {docs.map((post) => (
        // ${c.page}
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}`,
    hero: `
const cms = await getEasyCMS(config)
const { docs } = await cms.find('posts')
// ${c.hero}`,
  }
}

/** Three posts for the home page: in its language, then English ones while Thai posts are few. */
async function latestPosts(locale: Locale): Promise<Post[]> {
  const own = await getPosts(3, locale)
  if (locale === 'en' || own.length >= 3) return own
  return [...own, ...(await getPosts(3 - own.length, 'en'))]
}

/** The home page in English (/) or Thai (/th). Reads the latest posts and the announcement. */
export async function HomePage({ locale }: { locale: Locale }) {
  const t = HOME_COPY[locale]
  const code = samples(t.code.comments)
  const [posts, site, configHtml, routesHtml, pageHtml, heroHtml] = await Promise.all([
    latestPosts(locale),
    getSite(),
    highlight(code.config, 'ts'),
    highlight(code.routes, 'ts'),
    highlight(code.page, 'tsx'),
    highlight(code.hero, 'ts'),
  ])
  const announcement = site.announcement
  const docs = (page: string) => `${t.docs}/${page}`
  const shots = locale === 'th' ? 'th' : 'en'

  const files = ['easy-cms.config.ts', 'app/admin/[[...path]]/route.ts', 'app/posts/page.tsx']
  const html = [configHtml, routesHtml, pageHtml]
  const steps: CodeStep[] = t.code.steps.map(([title, text], i) => ({
    key: ['config', 'routes', 'page'][i],
    title,
    text: <Rich text={text} />,
    file: files[i],
    html: html[i],
  }))

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
              <span>{t.hero.title}</span> <em>{t.hero.accent}</em>
            </h1>
            <p className="lede">
              <Rich text={t.hero.lede} />
            </p>
            <InstallCommand copyLabel={t.copy} copiedLabel={t.copied} from={`home-${locale}`} />
            <div className="cta-row">
              <Link className="btn primary" href={docs('getting-started')}>
                {t.hero.start} <ArrowIcon />
              </Link>
              <a className="btn" href={GITHUB_URL}>
                <GitHubIcon /> {t.hero.star}
              </a>
            </div>
            <DeployButtons locale={locale} from={`home-hero-${locale}`} compact />
            <div className="hero-meta">
              {t.hero.meta.map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
          <div className="hero-visual">
            <div className="window">
              <div className="window-bar">
                <div className="dots"><i /><i /><i /></div>
                <div className="url">localhost:3000<b>/admin</b></div>
              </div>
              {/* eslint-disable @next/next/no-img-element -- static screenshots, one per theme */}
              <img className="shot only-dark" src={`/screenshots/dashboard-${shots}-dark.webp`} alt={t.admin.alts[0]} fetchPriority="high" />
              <img className="shot only-light" src={`/screenshots/dashboard-${shots}-light.webp`} alt={t.admin.alts[0]} />
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
          <span className="label">{t.stackLabel}</span>
          <ul>
            <li>Next.js <small>15+</small></li>
            <li>Nuxt</li>
            <li>PostgreSQL</li>
            <li>SQLite <small>· Turso</small></li>
            <li>PGlite</li>
            <li>S3 <small>· R2 · MinIO</small></li>
            <li>Vercel <small>· Netlify</small></li>
          </ul>
        </div>
      </div>

      <WhyStrip locale={locale} />

      <section className="section" id="why">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.why.eyebrow}</span>
            <h2>{t.why.title}</h2>
            <p>{t.why.text}</p>
          </div>
          <div className="compare">
            <div className="arch">
              <div><div className="tag">{t.why.hosted.tag}</div><h3>{t.why.hosted.title}</h3></div>
              <div className="diagram">
                <div className="node"><b>{t.why.hosted.app}</b><div className="chips"><span className="chip">pages</span><span className="chip">fetch()</span></div></div>
                <div className="link-line">{t.why.hosted.link}</div>
                <div className="split-row">
                  <div className="node"><b>{t.why.hosted.service}</b><span>{t.why.hosted.serviceNote}</span></div>
                  <div className="node"><b>{t.why.hosted.db}</b><span>{t.why.hosted.dbNote}</span></div>
                </div>
              </div>
              <ul>
                {t.why.hosted.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
            <div className="arch is-ours">
              <div><div className="tag">Easy CMS</div><h3>{t.why.ours.title}</h3></div>
              <div className="diagram">
                <div className="node solid">
                  <b>{t.why.ours.app}</b>
                  <div className="chips"><span className="chip">pages → getEasyCMS()</span><span className="chip">/admin</span><span className="chip">/api/cms</span></div>
                  <div className="chips"><span className="chip">@easy-cms/next</span><span className="chip">@easy-cms/core</span></div>
                </div>
                <div className="link-line">{t.why.ours.link}</div>
                <div className="node solid"><b>{t.why.ours.db}</b><span><Rich text={t.why.ours.dbNote} /></span></div>
              </div>
              <ul>
                {t.why.ours.points.map((p) => <li key={p}><Rich text={p} /></li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section flush-top" id="code">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.code.eyebrow}</span>
            <h2>{t.code.title}</h2>
            <p>{t.code.text}</p>
          </div>
          <CodeSteps steps={steps} />
        </div>
      </section>

      <section className="section flush-top" id="features">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.features.eyebrow}</span>
            <h2>{t.features.title}</h2>
          </div>
          <div className="features">
            {t.features.items.map(([icon, title, text]) => (
              <div className="feature" key={title}>
                <FeatureIcon name={icon} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section flush-top" id="performance">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.performance.eyebrow}</span>
            <h2>{t.performance.title}</h2>
            <p>{t.performance.text}</p>
          </div>
          <dl className="perf-stats">
            {t.performance.stats.map(([value, unit, label]) => (
              <div className="perf-stat" key={label}>
                <dt>{label}</dt>
                <dd>
                  {value}
                  {unit && <span className="unit">{unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="perf-setup">{t.performance.setup}</p>
          <p className="perf-limits"><Rich text={t.performance.limits} /></p>
          <div className="cta-row" style={{ marginTop: 20 }}>
            <Link className="btn" href={docs(t.performance.page)}>
              {t.performance.link} <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="section flush-top" id="plugins">
        <div className="wrap plugins-grid">
          <div className="section-head">
            <span className="eyebrow">{t.plugins.eyebrow}</span>
            <h2><Rich text={t.plugins.title} /></h2>
            <p>{t.plugins.text}</p>
            <div className="cta-row" style={{ marginTop: 8 }}>
              <Link className="btn" href={docs('plugins')}>{t.plugins.browse} <ArrowIcon /></Link>
            </div>
          </div>
          <div className="plugin-list">
            {PLUGIN_NAMES.map(([name, since], i) => (
              <div className="plugin" key={name}>
                <code>{name}</code>
                <p>{t.plugins.items[i]}</p>
                <span className="since">{since}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section showcase-band" id="admin">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.admin.eyebrow}</span>
            <h2>{t.admin.title}</h2>
            <p>{t.admin.text}</p>
          </div>
          <AdminShowcase labels={t.admin.tabs} alts={t.admin.alts} lang={shots} />
          <div className="lang-note">
            <span>{t.admin.note}</span>
            <span>· admin.locale: &apos;en&apos; | &apos;th&apos;</span>
          </div>
        </div>
      </section>

      <section className="section" id="blog">
        <div className="wrap">
          <div className="row-head">
            <div className="section-head">
              <span className="eyebrow">{t.blog.eyebrow}</span>
              <h2>{t.blog.title}</h2>
              {t.blog.note && <p>{t.blog.note}</p>}
            </div>
            <Link className="btn" href={locale === 'th' ? '/th/blog' : '/blog'}>{t.blog.all} <ArrowIcon /></Link>
          </div>
          {posts.length > 0 ? (
            <div className="post-grid">
              {posts.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <p className="empty"><Rich text={t.blog.empty} /></p>
          )}
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <StabilityNote locale={locale} />
          <div className="final-box">
            <div>
              <h2>{t.final.title}</h2>
              <p>{t.final.text}</p>
            </div>
            <div className="cta-row">
              <Link className="btn primary" href={docs('getting-started')}>{t.final.guide} <ArrowIcon /></Link>
              <a className="btn" href={GITHUB_URL}><GitHubIcon /> {t.final.source}</a>
              <DeployButtons locale={locale} from={`home-final-${locale}`} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
