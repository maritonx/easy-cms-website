import Link from 'next/link'
import { CHECKED, COMPETITORS, type Competitor, EASY_CMS } from '@/lib/why/compare'
import { COMPARE_OVERVIEW, type Locale, WHY_UI, whyHref } from '@/lib/why/copy'
import { CompareCards, CompareTable, HonestNote, WhyCta } from './parts'

/** "17 October 2026" or "17 ตุลาคม 2569" style dates for "last checked". */
const checkedOn = (locale: Locale) =>
  new Date(`${CHECKED}T00:00:00Z`).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

function Sources({ competitors, locale }: { competitors: readonly Competitor[]; locale: Locale }) {
  const ui = WHY_UI[locale]
  return (
    <div className="why-sources">
      <h2>{ui.sources}</h2>
      <p>{ui.checked(checkedOn(locale))}</p>
      <ul>
        {competitors.flatMap((c) =>
          c.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="noopener">
                {s.label}
              </a>
            </li>
          )),
        )}
      </ul>
    </div>
  )
}

function Hero({ locale, eyebrow, title, lede }: { locale: Locale; eyebrow: string; title: string; lede: string }) {
  return (
    <section className="why-hero">
      <div className="wrap">
        <Link className="why-crumb" href={whyHref('', locale)}>
          {WHY_UI[locale].menu}
        </Link>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="lede">{lede}</p>
      </div>
    </section>
  )
}

/** /why/compare: everything in one table. */
export function CompareOverview({ locale }: { locale: Locale }) {
  const t = COMPARE_OVERVIEW[locale]
  return (
    <>
      <Hero locale={locale} eyebrow={t.eyebrow} title={t.title} lede={t.lede} />
      <section className="section flush-top">
        <div className="wrap">
          <CompareTable products={[EASY_CMS, ...COMPETITORS]} locale={locale} />
          <HonestNote locale={locale} />
        </div>
      </section>
      <section className="section flush-top">
        <div className="wrap">
          <CompareCards locale={locale} />
        </div>
      </section>
      <section className="section flush-top">
        <div className="wrap">
          <Sources competitors={COMPETITORS} locale={locale} />
        </div>
      </section>
      <WhyCta locale={locale} />
    </>
  )
}

/** /why/compare/payload and the others: summary, table, when to choose which, sources. */
export function ComparePage({ competitor: c, locale }: { competitor: Competitor; locale: Locale }) {
  const ui = WHY_UI[locale]
  return (
    <>
      <Hero locale={locale} eyebrow={ui.compareTitle} title={ui.vs(c.name)} lede={c.summary[locale]} />
      <section className="section flush-top">
        <div className="wrap">
          <CompareTable products={[EASY_CMS, c]} locale={locale} />
          <HonestNote locale={locale} />
        </div>
      </section>
      <section className="section flush-top">
        <div className="wrap why-choose">
          <div className="ours">
            <h2>{ui.chooseUs}</h2>
            <ul>
              {c.chooseUs[locale].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>{ui.chooseThem(c.name)}</h2>
            <ul>
              {c.chooseThem[locale].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="section flush-top">
        <div className="wrap">
          <Sources competitors={[c]} locale={locale} />
        </div>
      </section>
      <section className="section flush-top">
        <div className="wrap">
          <div className="section-head">
            <h2>{ui.otherComparisons}</h2>
          </div>
          <CompareCards locale={locale} except={c.slug} />
        </div>
      </section>
      <WhyCta locale={locale} secondary={{ href: whyHref('compare', locale), label: ui.allCompared }} />
    </>
  )
}
