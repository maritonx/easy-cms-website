import Link from 'next/link'
import { highlight } from '@/lib/highlight'
import { docHref, type Locale, type Persona, WHY_UI, whyHref } from '@/lib/why/copy'
import { ArrowIcon } from '../icons'
import { StabilityNote } from '../stability-note'
import { HonestNote, PersonaCards, WhyCta } from './parts'

/** The developer page's sample: the content model, and a page reading it with types. */
const CODE = `
// easy-cms.config.ts
export default defineConfig({
  db: sqlite({ url: 'file:./data/cms.db' }),
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

// app/posts/page.tsx
const cms = await getEasyCMS(config)
const { docs } = await cms.find('posts', { limit: 10 })
docs[0].title // string`

/** /why/developers, /why/teams, /why/agencies, and their Thai pages. */
export async function PersonaPage({ persona, locale }: { persona: Persona; locale: Locale }) {
  const t = persona[locale]
  const ui = WHY_UI[locale]
  const codeHtml = 'code' in persona.show ? await highlight(CODE, 'ts') : null
  return (
    <>
      <section className="why-hero">
        <div className="wrap">
          <Link className="why-crumb" href={whyHref('', locale)}>
            {ui.menu}
          </Link>
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p className="lede">{t.lede}</p>
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap why-split">
          <div className="why-problem">
            <h2>{t.problem.title}</h2>
            <ul>
              {t.problem.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="why-visual">
            {codeHtml ? (
              <div className="editor">
                <div className="editor-tabs">
                  <span className="why-file">easy-cms.config.ts · app/posts/page.tsx</span>
                </div>
                <div className="panel" dangerouslySetInnerHTML={{ __html: codeHtml }} />
              </div>
            ) : 'screenshot' in persona.show ? (
              <div className="window">
                <div className="window-bar">
                  <div className="dots"><i /><i /><i /></div>
                  <div className="url">your-site.com<b>{persona.show.path}</b></div>
                </div>
                {/* eslint-disable @next/next/no-img-element -- static screenshots, one per theme */}
                <img className="shot only-dark" src={`/screenshots/${persona.show.screenshot}-${locale}-dark.webp`} alt={t.points[0].title} />
                <img className="shot only-light" src={`/screenshots/${persona.show.screenshot}-${locale}-light.webp`} alt={t.points[0].title} />
                {/* eslint-enable @next/next/no-img-element */}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.pointsTitle}</h2>
          </div>
          <div className="why-points">
            {t.points.map((p) => (
              <Link key={p.title} className="why-point" href={docHref(p.doc, locale)}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <span className="why-more">
                  {ui.readDocs} <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
          {persona.slug === 'agencies' && <StabilityNote locale={locale} />}
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <div className="why-notfit">
            <h2>{ui.notFitTitle}</h2>
            <ul>
              {t.notFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <HonestNote locale={locale} />
          </div>
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <div className="row-head">
            <div className="section-head">
              <h2>{ui.forPages}</h2>
            </div>
            <Link className="btn" href={whyHref('compare', locale)}>
              {ui.seeComparisons} <ArrowIcon />
            </Link>
          </div>
          <PersonaCards locale={locale} except={persona.slug} />
        </div>
      </section>

      <WhyCta locale={locale} from={`why-${persona.slug}-${locale}`} />
    </>
  )
}
