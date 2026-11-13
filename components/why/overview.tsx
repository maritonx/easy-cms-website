import Link from 'next/link'
import { getRoadmapLevels } from '@/lib/cms'
import { docHref, type Locale, WHY_OVERVIEW, WHY_UI } from '@/lib/why/copy'
import { CompareMatrix } from '../compare-matrix'
import { ArrowIcon, FeatureIcon } from '../icons'
import { LevelsStrip } from '../levels-strip'
import { StabilityNote } from '../stability-note'
import { WhyJsonLd } from './json-ld'
import { CompareCards, PersonaCards, WhyCta } from './parts'

/**
 * /why and /th/why: more than a CMS. The pieces a backend usually takes beside the one config
 * that replaces them, six reasons, the head-to-head table, the levels, who it's for.
 */
export async function WhyOverview({ locale }: { locale: Locale }) {
  const t = WHY_OVERVIEW[locale]
  const ui = WHY_UI[locale]
  const docs = locale === 'th' ? '/th/docs' : '/docs'
  const levels = await getRoadmapLevels()
  return (
    <>
      <WhyJsonLd rest="" locale={locale} />
      <section className="why-hero why-hero-big">
        <div className="wrap">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>
            {t.title} <em>{t.accent}</em>
          </h1>
          <p className="lede">{t.lede}</p>
          <div className="cta-row">
            <Link className="btn primary" href={`${docs}/getting-started`}>
              {t.start} <ArrowIcon />
            </Link>
            <a className="btn" href="#compare">
              {t.compare}
            </a>
          </div>
        </div>
      </section>

      <section className="section flush-top" id="stack">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.stack.title}</h2>
            <p>{t.stack.text}</p>
          </div>
          <div className="stitch">
            <div className="stitch-side usual">
              <p className="stitch-label">
                <b>{t.stack.usual}</b> {t.stack.usualNote}
              </p>
              <ul>
                {t.stack.parts.map(([name, what]) => (
                  <li key={name}>
                    <b>{name}</b>
                    <span>{what}</span>
                    <i>{t.stack.bill}</i>
                  </li>
                ))}
              </ul>
              <p className="stitch-total">{t.stack.totalUsual}</p>
            </div>
            <div className="stitch-arrow" aria-hidden="true">
              <ArrowIcon />
            </div>
            <div className="stitch-side ours">
              <p className="stitch-label">
                <b>{t.stack.ours}</b> {t.stack.oursNote}
              </p>
              <div className="stitch-file">
                <div className="fname">
                  <span>easy-cms.config.ts</span>
                </div>
                <ul>
                  {t.stack.parts.map(([name, , key]) => (
                    <li key={name}>
                      <span className="stitch-check" aria-hidden="true">✓</span>
                      <code>{key}</code>
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="stitch-total">{t.stack.totalOurs}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section flush-top" id="reasons">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.pillarsTitle}</h2>
          </div>
          <div className="reasons">
            {t.pillars.map((p, i) => (
              <Link key={p.title} className="reason" href={docHref(p.doc, locale)}>
                <span className="reason-num">{String(i + 1).padStart(2, '0')}</span>
                <FeatureIcon name={p.icon} />
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <span className="reason-proof">{p.proof}</span>
                <span className="why-more">
                  {ui.readDocs} <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
          <div style={{ marginTop: 40 }}>
            <StabilityNote locale={locale} />
          </div>
        </div>
      </section>

      <section className="section" id="compare">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{ui.compareTitle}</span>
            <h2>{t.compareTitle}</h2>
            <p>{t.compareLede}</p>
          </div>
          <CompareMatrix locale={locale} />
          <div style={{ marginTop: 48 }}>
            <CompareCards locale={locale} />
          </div>
        </div>
      </section>

      <LevelsStrip locale={locale} levels={levels} />

      <section className="section flush-top">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.forTitle}</h2>
          </div>
          <PersonaCards locale={locale} />
        </div>
      </section>

      <WhyCta locale={locale} from={`why-${locale}`} />
    </>
  )
}
