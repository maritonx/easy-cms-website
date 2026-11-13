import Link from 'next/link'
import { Fragment } from 'react'
import { jsonLdScript } from '@easy-cms/plugin-seo'
import { SITE_URL } from '@/easy-cms.config'
import { getRoadmapLevels, getSite } from '@/lib/cms'
import { highlight } from '@/lib/highlight'
import { COMPARED, HOME_COPY, type Locale, type Mark } from '@/lib/home-copy'
import { npmDownloadsLastWeek } from '@/lib/npm-downloads'
import { GITHUB_URL, NPM_URL, SITE_REPO_URL, VERSION } from '@/lib/site'
import { type Brand, BrandLogo } from '../brand-logo'
import { DeployButtons } from '../deploy-buttons'
import { ArrowIcon, FeatureIcon, GitHubIcon } from '../icons'
import { StabilityNote } from '../stability-note'
import { AdminSpotlight } from './admin-spotlight'
import { AiChat } from './ai-chat'
import { CodeSteps, type CodeStep } from './code-steps'
import { HomeMotion } from './home-motion'
import { InstallCommand } from './install-command'
import { RuntimePicker } from './runtime-picker'

/** What Easy CMS is, for search results: free, MIT-licensed developer software. */
const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Easy CMS',
  description: 'The TypeScript backend with an admin built in: data, sign-in, files, jobs and an API from one config file.',
  url: SITE_URL,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Node.js 22.12 or later, Bun, Deno, Cloudflare Workers',
  softwareVersion: VERSION,
  license: 'https://opensource.org/licenses/MIT',
  downloadUrl: NPM_URL,
  sameAs: [GITHUB_URL],
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

const STACK: Brand[] = ['nextjs', 'nuxt', 'nodejs', 'bun', 'deno', 'cloudflareworkers', 'vercel', 'docker', 'postgresql', 'sqlite', 'turso']
const TESTED: Brand[] = ['nodejs', 'bun', 'deno', 'cloudflareworkers', 'sqlite', 'postgresql']
const AI_TOOLS: Brand[] = ['claude', 'cursor', 'copilot']
/** Test cases in the Easy CMS repo's unit, integration and e2e suites, rounded down (Nov 2026). */
const TESTS = '1,200+'

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

/** Text that may break only at its spaces: Thai would otherwise break inside a phrase. */
function Phrases({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="nw">{word}</span>
        </Fragment>
      ))}
    </>
  )
}

/** The code samples, in English apart from the comments. */
function samples(locale: Locale) {
  const t = HOME_COPY[locale]
  const c = t.code.comments
  const r = t.runtimes.comments
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
hooks: { beforeChange: [checkSlotIsFree] },
access: { delete: ({ user }) => user?.role === 'admin' },
actions: [{ name: 'remind', run: sendReminder }],
// ${c.hero}`,
    ai: `
const staff = ({ user }) => ['admin', 'front-desk'].includes(user?.role)

{ slug: 'bookings',
  fields: [
    { name: 'customer', type: 'relationship', to: 'customers' },
    { name: 'service', type: 'relationship', to: 'services' },
    { name: 'startsAt', type: 'date', required: true },
    { name: 'status', type: 'select', options: ['waiting', 'confirmed'] },
  ],
  access: {
    create: staff, update: staff,
    delete: ({ user }) => user?.role === 'admin',
  },
}`,
    runtimes: {
      vps: `
db: sqlite({ url: 'file:./cms.db' }),
upload: { dir: 'uploads' },
// ${r.vps}`,
      vercel: `
db: postgres({ url: process.env.DATABASE_URL }),
upload: { storage: vercelBlobStorage() },
// ${r.vercel}`,
      workers: `
db: sqlite({ url: process.env.DATABASE_URL }),
upload: { storage: s3Storage({ bucket, region: 'auto' }) },
// ${r.workers}`,
      docker: `
db: postgres({ url: process.env.DATABASE_URL }),
upload: { storage: s3Storage({ bucket: 'media' }) },
// ${r.docker}`,
      deno: `
db: sqlite({ url: 'file:./cms.db' }),
// ${r.deno}`,
    } as Record<string, string>,
  }
}

/** The logos on each host's card and the command that runs it there. */
const RUNTIME_RUN: Record<string, { logos: Brand[]; command: string }> = {
  vps: { logos: ['nodejs', 'bun', 'sqlite'], command: 'npx easy-cms serve --port 3000' },
  vercel: { logos: ['nextjs', 'vercel', 'postgresql'], command: 'vercel deploy' },
  workers: { logos: ['cloudflareworkers', 'turso'], command: 'npx easy-cms build --target workers && npx wrangler deploy' },
  docker: { logos: ['docker', 'postgresql'], command: 'docker run ghcr.io/maritonx/easy-cms:1' },
  deno: { logos: ['deno', 'sqlite'], command: 'deno run -A npm:easy-cms serve' },
}

const MARK_PATHS: Record<Mark, string> = {
  yes: 'M5 12.5l4.5 4.5L19 7.5',
  part: 'M5 12h14',
  no: 'M7 7l10 10M17 7L7 17',
  unknown: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01',
}

/** A compare mark: a different shape for each answer, and its name for screen readers. */
function CompareMark({ mark, label }: { mark: Mark; label: string }) {
  return (
    <span className={`mk ${mark}`} role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d={MARK_PATHS[mark]} />
      </svg>
    </span>
  )
}

/** The home page in English (/) or Thai (/th). Reads the announcement and the roadmap's levels. */
export async function HomePage({ locale }: { locale: Locale }) {
  const t = HOME_COPY[locale]
  const code = samples(locale)
  const runtimeKeys = t.runtimes.options.map(([key]) => key)
  const [site, levels, downloads, configHtml, routesHtml, pageHtml, heroHtml, aiHtml, runtimeHtml] = await Promise.all([
    getSite(),
    getRoadmapLevels(),
    npmDownloadsLastWeek(),
    highlight(code.config, 'ts'),
    highlight(code.routes, 'ts'),
    highlight(code.page, 'tsx'),
    highlight(code.hero, 'ts'),
    highlight(code.ai, 'ts'),
    Promise.all(runtimeKeys.map((k) => highlight(code.runtimes[k] ?? '', 'ts'))),
  ])
  const announcement = site.announcement
  const docs = (page: string) => `${t.docs}/${page}`
  const shots = locale === 'th' ? 'th' : 'en'
  // Minor releases since 1.0: 1.46 is the 46th.
  const releases = Number(VERSION.split('.')[1] ?? 0)
  const complete = levels.filter((l) => l.status === 'complete').length

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
      <HomeMotion />
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
              <span><Phrases text={t.hero.title} /></span> <em><Phrases text={t.hero.accent} /></em>
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
              <img className="shot only-dark" src={`/screenshots/dashboard-${shots}-dark.webp`} alt={t.admin.title} fetchPriority="high" />
              <img className="shot only-light" src={`/screenshots/dashboard-${shots}-light.webp`} alt={t.admin.title} />
              {/* eslint-enable @next/next/no-img-element */}
            </div>
            <div className="float-code" data-type-lines>
              <div className="fname"><span>easy-cms.config.ts</span><span>collection: bookings</span></div>
              <div className="typing" dangerouslySetInnerHTML={{ __html: heroHtml }} />
            </div>
          </div>
        </div>
      </section>

      <div className="stack stack-logos">
        <div className="wrap">
          <span className="label">{t.stack.label}</span>
          <ul>
            {STACK.map((b) => <li key={b}><BrandLogo name={b} label /></li>)}
          </ul>
          <dl className="proof">
            {downloads !== null && (
              <div><dt>{t.stack.downloads}</dt><dd>{downloads.toLocaleString('en-US')}</dd></div>
            )}
            <div><dt>{t.stack.releases}</dt><dd>{releases}</dd></div>
            <div><dt>{t.stack.tests}</dt><dd>{TESTS}</dd></div>
            <div><dt>{t.stack.paywall}</dt><dd>0</dd></div>
          </dl>
          <a className="proof-link" href={SITE_REPO_URL}>{t.stack.source} <ArrowIcon /></a>
        </div>
      </div>

      <section className="section" id="code">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.code.eyebrow}</span>
            <h2>{t.code.title}</h2>
            <p>{t.code.text}</p>
          </div>
          <CodeSteps steps={steps} />
        </div>
      </section>

      <section className="section spot-band" id="admin">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.admin.eyebrow}</span>
            <h2>{t.admin.title} <em className="accent">{t.admin.accent}</em></h2>
            <p>{t.admin.text}</p>
          </div>
          <AdminSpotlight
            items={t.admin.items}
            lang={shots}
            labels={{ list: t.admin.eyebrow, language: t.admin.language, larger: t.admin.larger, close: t.admin.close }}
          />
        </div>
      </section>

      <section className="section" id="runtimes">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.runtimes.eyebrow}</span>
            <h2>{t.runtimes.title}</h2>
            <p>{t.runtimes.text}</p>
          </div>
          <RuntimePicker
            label={t.runtimes.eyebrow}
            guide={t.runtimes.guide}
            options={t.runtimes.options.map(([key, title, uses, page], i) => ({
              key,
              title,
              uses,
              logos: RUNTIME_RUN[key]?.logos ?? [],
              html: runtimeHtml[i] ?? '',
              command: RUNTIME_RUN[key]?.command ?? '',
              guide: docs(page),
            }))}
          />
          <div className="tested">
            <b>{t.runtimes.tested}</b>
            <div className="tested-logos">
              {TESTED.map((b) => <BrandLogo key={b} name={b} label />)}
            </div>
            <span>{t.runtimes.testedMore}</span>
          </div>
        </div>
      </section>

      <section className="section flush-top" id="features">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.backend.eyebrow}</span>
            <h2>{t.backend.title}</h2>
            <p>{t.backend.text}</p>
          </div>
          <div className="feat-groups">
            {t.backend.groups.map(([group, sub, items]) => (
              <div className="feat-group" key={group}>
                <div className="feat-label">
                  <h3>{group}</h3>
                  <p>{sub}</p>
                </div>
                <div className="features">
                  {items.map(([icon, title, text, page]) => (
                    <Link className="feature" href={docs(page)} key={title}>
                      <FeatureIcon name={icon} />
                      <h4>{title}</h4>
                      <p><Rich text={text} /></p>
                      <span className="go" aria-hidden="true"><ArrowIcon /></span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section flush-top" id="compare">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.compare.eyebrow}</span>
            <h2>{t.compare.title} <em className="accent">{t.compare.accent}</em></h2>
            <p>{t.compare.text}</p>
          </div>
          <div className="vs-wrap">
            <table className="vs">
              <caption className="sr-only">{t.compare.caption}</caption>
              <thead>
                <tr>
                  <td />
                  {COMPARED.map((name, i) => (
                    <th scope="col" key={name} className={i === 0 ? 'us' : undefined}>
                      {i === 0 && <span className="us-tag">{t.compare.pick}</span>}
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.compare.rows.map((row) => (
                  <tr key={row.title}>
                    <th scope="row"><b>{row.title}</b><span>{row.sub}</span></th>
                    {row.cells.map(([mark, text], i) => (
                      <td key={COMPARED[i]} data-name={COMPARED[i]} className={i === 0 ? 'us' : undefined}>
                        <CompareMark mark={mark} label={t.compare.marks[mark]} />
                        <span className="vs-t">{text}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="vs-foot">
            <p className="vs-tally"><b>{t.compare.tally}</b> {t.compare.tallyMore}</p>
            <p className="vs-note">{t.compare.note}</p>
            <Link className="btn" href={locale === 'th' ? '/th/why/compare' : '/why/compare'}>{t.compare.link} <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section className="section flush-top" id="ai">
        <div className="wrap ai-split">
          <div className="section-head">
            <span className="eyebrow">{t.ai.eyebrow}</span>
            <h2>{t.ai.title}</h2>
            <p><Rich text={t.ai.text} /></p>
            <div className="works-with">
              <span>{t.ai.worksWith}</span>
              {AI_TOOLS.map((b) => <BrandLogo key={b} name={b} label />)}
            </div>
            <div className="cta-row">
              <a className="btn" href="/llms.txt">{t.ai.open} <ArrowIcon /></a>
            </div>
          </div>
          <AiChat prompt={t.ai.prompt} html={aiHtml} labels={{ you: t.ai.you, added: t.ai.added, replay: t.ai.replay }} />
        </div>
      </section>

      {levels.length > 0 && (
        <section className="section flush-top" id="levels">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.levels.eyebrow}</span>
              <h2>{t.levels.title}</h2>
              <p>{t.levels.text(complete, levels.length)}</p>
            </div>
            <ol className="levels">
              {levels.map((l) => {
                const state = l.status === 'complete' ? 'done' : l.next ? 'is-next' : ''
                return (
                  <li key={l.id} className={state || undefined}>
                    <span className="dot" aria-hidden="true" />
                    <span className="num">{t.levels.level} {l.level}</span>
                    <h3>{locale === 'th' ? l.titleTh || l.title : l.title}</h3>
                    <p>{locale === 'th' ? l.summaryTh || l.summary : l.summary}</p>
                    <span className={`state${state ? ` ${state}` : ''}`}>
                      {state === 'done' ? t.levels.complete : state === 'is-next' ? t.levels.next : t.levels.progress}
                    </span>
                  </li>
                )
              })}
            </ol>
            <div className="cta-row" style={{ marginTop: 28 }}>
              <Link className="btn" href={locale === 'th' ? '/th/roadmap' : '/roadmap'}>{t.levels.link} <ArrowIcon /></Link>
            </div>
          </div>
        </section>
      )}

      <section className="section band-tint" id="performance">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.proven.eyebrow}</span>
            <h2>{t.proven.title}</h2>
            <p>{t.proven.text}</p>
          </div>
          <dl className="perf-stats">
            {t.proven.stats.map(([value, unit, label]) => (
              <div className="perf-stat" key={label}>
                <dt>{label}</dt>
                <dd>
                  {value}
                  {unit && <span className="unit">{unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="perf-setup">{t.proven.setup}</p>
          <p className="perf-limits">
            <Rich text={t.proven.limits} /> <Link href={docs(t.proven.page)}>{t.proven.link}</Link>
          </p>
          <div style={{ marginTop: 40 }}>
            <StabilityNote locale={locale} />
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap faq-split">
          <div className="section-head">
            <span className="eyebrow">{t.faq.eyebrow}</span>
            <h2>{t.faq.title}</h2>
            <p>
              {t.faq.text} <a href={`${GITHUB_URL}/discussions`}>{t.faq.ask}</a>.
            </p>
          </div>
          <div className="faq">
            {t.faq.items.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span className="plus" aria-hidden="true" />
                </summary>
                <p><Rich text={a} /></p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
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
