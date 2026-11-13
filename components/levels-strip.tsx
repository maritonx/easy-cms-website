import Link from 'next/link'
import type { RoadmapLevel } from '@/lib/cms'
import { HOME_COPY, type Locale } from '@/lib/home-copy'
import { ArrowIcon } from './icons'

/**
 * The six levels as a track, from the `roadmap-levels` collection; nothing until they are seeded.
 * On the home page and /why.
 */
export function LevelsStrip({
  locale,
  levels,
  className = 'section flush-top',
}: {
  locale: Locale
  levels: readonly RoadmapLevel[]
  className?: string
}) {
  if (levels.length === 0) return null
  const t = HOME_COPY[locale].levels
  const complete = levels.filter((l) => l.status === 'complete').length
  return (
    <section className={className} id="levels">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.text(complete, levels.length)}</p>
        </div>
        <ol className="levels">
          {levels.map((l) => {
            const state = l.status === 'complete' ? 'done' : l.next ? 'is-next' : ''
            return (
              <li key={l.id} className={state || undefined}>
                <span className="dot" aria-hidden="true" />
                <span className="num">
                  {t.level} {l.level}
                </span>
                <h3>{locale === 'th' ? l.titleTh || l.title : l.title}</h3>
                <p>{locale === 'th' ? l.summaryTh || l.summary : l.summary}</p>
                <span className={`state${state ? ` ${state}` : ''}`}>
                  {state === 'done' ? t.complete : state === 'is-next' ? t.next : t.progress}
                </span>
              </li>
            )
          })}
        </ol>
        <div className="cta-row" style={{ marginTop: 28 }}>
          <Link className="btn" href={locale === 'th' ? '/th/roadmap' : '/roadmap'}>
            {t.link} <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  )
}
