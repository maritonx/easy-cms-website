import Link from 'next/link'
import { COMPETITORS, type Product, ROWS } from '@/lib/why/compare'
import { type Locale, PERSONAS, WHY_UI, whyHref } from '@/lib/why/copy'
import { ArrowIcon } from '../icons'

/** The three personas as cards, linking to their pages. */
export function PersonaCards({ locale, except }: { locale: Locale; except?: string }) {
  return (
    <div className="why-cards">
      {PERSONAS.filter((p) => p.slug !== except).map((p) => (
        <Link key={p.slug} className="why-card" href={whyHref(p.slug, locale)}>
          <span className="cat">{p[locale].eyebrow}</span>
          <h3>{p[locale].title}</h3>
          <p>{p[locale].menu.hint}</p>
          <span className="why-more">
            {p[locale].menu.label} <ArrowIcon />
          </span>
        </Link>
      ))}
    </div>
  )
}

/** The comparisons as cards: "Easy CMS vs Payload" and its one-paragraph summary. */
export function CompareCards({ locale, except }: { locale: Locale; except?: string }) {
  const t = WHY_UI[locale]
  return (
    <div className="why-cards compare">
      {COMPETITORS.filter((c) => c.slug !== except).map((c) => (
        <Link key={c.slug} className="why-card" href={whyHref(`compare/${c.slug}`, locale)}>
          <h3>{t.vs(c.name)}</h3>
          <p>{c.summary[locale]}</p>
          <span className="why-more">
            {t.compareTitle} <ArrowIcon />
          </span>
        </Link>
      ))}
    </div>
  )
}

/** The comparison table: one row per question, one column per product, Easy CMS first. */
export function CompareTable({ products, locale }: { products: readonly Product[]; locale: Locale }) {
  const t = WHY_UI[locale]
  return (
    <div className="compare-scroll" role="region" aria-label={t.compareTitle} tabIndex={0}>
      <table className="compare-table" data-cols={products.length}>
        <thead>
          <tr>
            <th scope="col">{t.feature}</th>
            {products.map((p, i) => (
              <th key={p.name} scope="col" className={i === 0 ? 'ours' : undefined}>
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label[locale]}</th>
              {products.map((p, i) => (
                <td key={p.name} className={i === 0 ? 'ours' : undefined}>
                  {p.cells[row.key][locale]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The note every Why page carries: Easy CMS is young. */
export function HonestNote({ locale }: { locale: Locale }) {
  return <p className="why-honest">{WHY_UI[locale].honest}</p>
}

/** The closing call to action. */
export function WhyCta({ locale, secondary }: { locale: Locale; secondary?: { href: string; label: string } }) {
  const t = WHY_UI[locale]
  return (
    <section className="section why-cta">
      <div className="wrap">
        <h2>{t.ctaTitle}</h2>
        <p>
          <code>npm create easy-cms@latest</code>
          {t.ctaLede.replace('npm create easy-cms@latest', '')}
        </p>
        <div className="cta-row">
          <Link className="btn primary" href={locale === 'th' ? '/th/docs/getting-started' : '/docs/getting-started'}>
            {t.getStarted} <ArrowIcon />
          </Link>
          {secondary && (
            <Link className="btn" href={secondary.href}>
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
