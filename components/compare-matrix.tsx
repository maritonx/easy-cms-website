import Link from 'next/link'
import { COMPARED, HOME_COPY, type Locale, type Mark } from '@/lib/home-copy'
import { ArrowIcon } from './icons'

const MARK_PATHS: Record<Mark, string> = {
  yes: 'M5 12.5l4.5 4.5L19 7.5',
  part: 'M5 12h14',
  no: 'M7 7l10 10M17 7L7 17',
  unknown: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17.5v.01',
}

/** A compare mark: a different shape for each answer, and its name for screen readers. */
export function CompareMark({ mark, label }: { mark: Mark; label: string }) {
  return (
    <span className={`mk ${mark}`} role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d={MARK_PATHS[mark]} />
      </svg>
    </span>
  )
}

/**
 * Easy CMS head to head with Payload, Strapi, Directus and WordPress on four questions, our
 * column lifted. On the home page and the Why pages; `link` adds the button to /why/compare.
 */
export function CompareMatrix({ locale, link = true }: { locale: Locale; link?: boolean }) {
  const t = HOME_COPY[locale].compare
  return (
    <>
      <div className="vs-wrap">
        <table className="vs">
          <caption className="sr-only">{t.caption}</caption>
          <thead>
            <tr>
              <td />
              {COMPARED.map((name, i) => (
                <th scope="col" key={name} className={i === 0 ? 'us' : undefined}>
                  {i === 0 && <span className="us-tag">{t.pick}</span>}
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((row) => (
              <tr key={row.title}>
                <th scope="row">
                  <b>{row.title}</b>
                  <span>{row.sub}</span>
                </th>
                {row.cells.map(([mark, text], i) => (
                  <td key={COMPARED[i]} data-name={COMPARED[i]} className={i === 0 ? 'us' : undefined}>
                    <CompareMark mark={mark} label={t.marks[mark]} />
                    <span className="vs-t">{text}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="vs-foot">
        <p className="vs-tally">
          <b>{t.tally}</b> {t.tallyMore}
        </p>
        <p className="vs-note">{t.note}</p>
        {link && (
          <Link className="btn" href={locale === 'th' ? '/th/why/compare' : '/why/compare'}>
            {t.link} <ArrowIcon />
          </Link>
        )}
      </div>
    </>
  )
}
