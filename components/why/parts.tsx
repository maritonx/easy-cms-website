import Link from 'next/link'
import { COMPETITORS, type Product, ROWS } from '@/lib/why/compare'
import { type Locale, PERSONAS, WHY_UI, whyHref } from '@/lib/why/copy'
import { DEMO_URL, DEPLOY_VERCEL_URL, DISCUSSIONS_URL } from '@/lib/site'
import { InstallCommand } from '../home/install-command'
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

/** A strip on the home page: who Easy CMS is for, and the comparisons. */
export function WhyStrip({ locale }: { locale: Locale }) {
  const t = WHY_UI[locale]
  return (
    <div className="why-strip">
      <div className="wrap">
        <div>
          <span className="label">{t.forTitle}</span>
          <ul>
            {PERSONAS.map((p) => (
              <li key={p.slug}>
                <Link href={whyHref(p.slug, locale)}>{p[locale].menu.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <span className="label">{t.compareTitle}</span>
          <ul>
            {COMPETITORS.map((c) => (
              <li key={c.slug}>
                <Link href={whyHref(`compare/${c.slug}`, locale)}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** The note the comparisons and "When it isn't a fit" carry: Easy CMS is young. */
export function HonestNote({ locale }: { locale: Locale }) {
  return <p className="why-honest">{WHY_UI[locale].honest}</p>
}

/**
 * The closing call to action: the create command to copy, a starter to deploy, the demo once it
 * is up, and where to ask. `from` names the page for the analytics events.
 */
export function WhyCta({ locale, from }: { locale: Locale; from: string }) {
  const t = WHY_UI[locale]
  return (
    <section className="section why-cta">
      <div className="wrap">
        <div>
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaLede}</p>
        </div>
        <div className="why-cta-actions">
          <InstallCommand copyLabel={t.copy} copiedLabel={t.copied} from={from} />
          <div className="cta-row">
            <a className="btn primary" href={DEPLOY_VERCEL_URL} data-umami-event="deploy-vercel" data-umami-event-from={from}>
              {t.deploy} <ArrowIcon />
            </a>
            {DEMO_URL && (
              <a className="btn" href={DEMO_URL} data-umami-event="open-demo" data-umami-event-from={from}>
                {t.demo}
              </a>
            )}
            <Link className="btn" href={locale === 'th' ? '/th/docs/getting-started' : '/docs/getting-started'}>
              {t.docs}
            </Link>
          </div>
          <a className="why-ask" href={DISCUSSIONS_URL}>
            {t.questions} →
          </a>
        </div>
      </div>
    </section>
  )
}
