import Link from 'next/link'
import { docHref, type Locale, WHY_OVERVIEW, WHY_UI, whyHref } from '@/lib/why/copy'
import { ArrowIcon } from '../icons'
import { StabilityNote } from '../stability-note'
import { WhyJsonLd } from './json-ld'
import { CompareCards, PersonaCards, WhyCta } from './parts'

/** /why and /th/why: what makes Easy CMS different, who it's for, how it compares. */
export function WhyOverview({ locale }: { locale: Locale }) {
  const t = WHY_OVERVIEW[locale]
  const ui = WHY_UI[locale]
  return (
    <>
      <WhyJsonLd rest="" locale={locale} />
      <section className="why-hero">
        <div className="wrap">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p className="lede">{t.lede}</p>
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.pillarsTitle}</h2>
          </div>
          <div className="why-points">
            {t.pillars.map((p) => (
              <Link key={p.title} className="why-point" href={docHref(p.doc, locale)}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
                <span className="why-more">
                  {ui.readDocs} <ArrowIcon />
                </span>
              </Link>
            ))}
          </div>
          <StabilityNote locale={locale} />
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.forTitle}</h2>
          </div>
          <PersonaCards locale={locale} />
        </div>
      </section>

      <section className="section flush-top">
        <div className="wrap">
          <div className="row-head">
            <div className="section-head">
              <h2>{t.compareTitle}</h2>
              <p>{t.compareLede}</p>
            </div>
            <Link className="btn" href={whyHref('compare', locale)}>
              {ui.allCompared} <ArrowIcon />
            </Link>
          </div>
          <CompareCards locale={locale} />
        </div>
      </section>

      <WhyCta locale={locale} from={`why-${locale}`} />
    </>
  )
}
