import Link from 'next/link'
import { getRoadmapLevels, type RoadmapLevel } from '@/lib/cms'
import type { Locale } from '@/lib/home-copy'
import { ROADMAP_COPY } from '@/lib/roadmap-copy'
import { formatDate, GITHUB_URL, VERSION } from '@/lib/site'
import { ArrowIcon, GitHubIcon } from '../icons'
import { ClimbMotion } from './climb-motion'

/**
 * Where each camp sits on the mountain, in the drawing's 1200×520 units, and which side its tag
 * goes. Six levels: a seventh would need a new spot here.
 */
const CAMPS: Record<number, { x: number; y: number; side: 'l' | 'r' }> = {
  1: { x: 230, y: 468, side: 'l' },
  2: { x: 380, y: 414, side: 'l' },
  3: { x: 520, y: 332, side: 'l' },
  4: { x: 640, y: 252, side: 'l' },
  5: { x: 730, y: 174, side: 'l' },
  6: { x: 820, y: 72, side: 'r' },
}

const TRAIL = 'M150 514 C195 500 210 480 230 468 S330 436 380 414 S470 360 520 332 S600 282 640 252 S700 202 730 174 S790 112 820 72'

/** The same sky on every render: a small seeded random. */
function stars() {
  let seed = 6
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const out: { x: number; y: number; r: number; o: number }[] = []
  for (let i = 0; i < 150; i++) {
    const x = Math.round(-650 + rand() * 2500)
    const y = Math.round(8 + rand() * 222)
    const r = [0.8, 1, 1.2, 1.6][Math.floor(rand() * 4)]
    const o = [0.35, 0.5, 0.7, 0.9][Math.floor(rand() * 4)]
    // Not in front of the main peak.
    if (x > 600 && x < 1050 && y > 60 + Math.abs(x - 820) * 0.9) continue
    out.push({ x, y, r, o })
  }
  return out
}
const STARS = stars()

type State = 'done' | 'is-next' | ''
const stateOf = (l: RoadmapLevel): State => (l.status === 'complete' ? 'done' : l.next ? 'is-next' : '')

function Mountain() {
  return (
    <svg className="mtn-art" viewBox="0 0 1200 520" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="mtn-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f3a31" />
          <stop offset=".55" stopColor="#11211c" />
          <stop offset="1" stopColor="#08110e" />
        </linearGradient>
        <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fbfa5" stopOpacity=".16" />
          <stop offset="1" stopColor="#6fbfa5" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="trail-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#6fbfa5" />
          <stop offset="1" stopColor="#c8f0e1" />
        </linearGradient>
      </defs>
      <g fill="#cfe8de">
        {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />)}
      </g>
      <path fill="url(#mtn-far)" d="M-700 520 L-700 300 L-520 260 L-380 310 L-220 250 L-90 300 L0 340 L110 290 L200 330 L320 240 L410 290 L500 230 L560 260 L640 200 L720 250 L760 230 L800 260 L900 210 L990 250 L1080 190 L1200 250 L1330 210 L1460 280 L1600 230 L1900 300 L1900 520 Z" />
      <path fill="#0d1a16" stroke="#6fbfa5" strokeOpacity=".12" d="M-700 520 L-700 430 L-560 390 L-430 420 L-300 370 L-160 410 L0 420 L90 380 L170 410 L260 360 L330 400 L380 520 Z M900 520 L960 330 L1010 360 L1090 290 L1200 350 L1320 300 L1460 370 L1640 320 L1900 380 L1900 520 Z" />
      <path fill="url(#mtn-g)" stroke="#6fbfa5" strokeOpacity=".45" strokeWidth="1.5" strokeLinejoin="round" d="M40 520 L300 420 L360 398 L450 350 L520 310 L600 262 L660 216 L720 160 L770 120 L820 64 L870 110 L905 96 L980 172 L1080 262 L1200 330 L1340 400 L1500 440 L1900 470 L1900 520 Z" />
      <path fill="none" stroke="#6fbfa5" strokeOpacity=".1" d="M820 64 L760 260 L700 520 M905 96 L880 300 L900 520 M600 262 L560 420 L580 520" />
      <path fill="#e4eee9" opacity=".9" d="M820 64 L792 96 L805 92 L814 105 L826 90 L838 99 L848 91 Z" />
      <path fill="none" stroke="#6fbfa5" strokeOpacity=".22" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" d={TRAIL} />
      <path className="trail" pathLength={1} fill="none" stroke="url(#trail-g)" strokeWidth="2.5" strokeLinecap="round" d={TRAIL} />
      <g className="summit-flag" stroke="#e4eee9" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M820 66 V22" />
        <path d="M820 23 L850 31 L820 40" strokeDasharray="3 3" />
      </g>
    </svg>
  )
}

const CHECK = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)

/** /roadmap and /th/roadmap: the six levels from the `roadmap-levels` collection, as a climb. */
export async function RoadmapPage({ locale }: { locale: Locale }) {
  const t = ROADMAP_COPY[locale]
  const levels = await getRoadmapLevels()
  const title = (l: RoadmapLevel) => (locale === 'th' ? l.titleTh || l.title : l.title)
  const text = (row: { text?: unknown; textTh?: unknown }) => String((locale === 'th' && row.textTh) || row.text || '')
  const stateLabel = (s: State) => (s === 'done' ? t.states.complete : s === 'is-next' ? t.states.next : t.states.progress)
  const complete = levels.filter((l) => l.status === 'complete').length
  const updated = levels.map((l) => String(l.updatedAt ?? '')).sort().at(-1)
  const docs = locale === 'th' ? '/th/docs' : '/docs'
  // Next: what is still to build on each level that isn't complete, the level being built first.
  const upcoming = levels
    .filter((l) => l.status !== 'complete' && (l.stillToBuild ?? []).length > 0)
    .sort((a, b) => Number(Boolean(b.next)) - Number(Boolean(a.next)) || Number(a.level) - Number(b.level))
    .flatMap((l) => (l.stillToBuild ?? []).slice(0, 1).map((row) => ({ level: l.level, title: text(row) })))

  return (
    <>
      <section className="rm-climb spot-band">
        <ClimbMotion />
        <div className="wrap">
          <div className="climb-head">
            <div>
              <span className="eyebrow">{t.eyebrow}</span>
              <h1>
                {t.title} <em>{t.accent}</em>
              </h1>
            </div>
            <div>
              <p className="lede">{t.lede}</p>
              <dl className="rm-facts">
                <div><dt>{t.facts.reached}</dt><dd>{t.facts.of(complete, levels.length)}</dd></div>
                <div><dt>{t.facts.version}</dt><dd>{VERSION}</dd></div>
                {updated && <div><dt>{t.facts.updated}</dt><dd>{formatDate(updated, locale)}</dd></div>}
              </dl>
            </div>
          </div>
          <nav className="mtn" aria-label={t.nav}>
            <Mountain />
            <ol className="camps">
              {levels.map((l, i) => {
                const spot = CAMPS[Number(l.level)]
                if (!spot) return null
                const s = stateOf(l)
                return (
                  <li
                    key={l.id}
                    className={`camp ${s || 'prog'} side-${spot.side}`}
                    style={{ '--x': `${(spot.x / 12).toFixed(2)}%`, '--y': `${(spot.y / 5.2).toFixed(2)}%`, '--i': i } as React.CSSProperties}
                  >
                    <a href={`#level-${l.level}`}>
                      <span className="pin">{s === 'done' ? CHECK : l.level}</span>
                      <span className="tag">
                        <span className="tn">{t.level} {l.level}</span>
                        <b>{title(l)}</b>
                        <span className={`state${s ? ` ${s}` : ''}`}>{stateLabel(s)}</span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </nav>
          <div className="mtn-legend" aria-hidden="true">
            <span className="lg done">{t.legend.reached}</span>
            <span className="lg is-next">{t.legend.next}</span>
            <span className="lg prog">{t.legend.progress}</span>
            <span className="lg flag">{t.legend.flag}</span>
          </div>
          <ol className="ladder" aria-label={t.nav}>
            {levels.map((l) => {
              const s = stateOf(l)
              return (
                <li key={l.id}>
                  <span className="num">{l.level}</span>
                  <span><b>{title(l)}</b><small>{locale === 'th' ? l.summaryTh || l.summary : l.summary}</small></span>
                  <span className={`state${s ? ` ${s}` : ''}`}>{stateLabel(s)}</span>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <section className="section" id="levels">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">{t.levels.eyebrow}</span>
            <h2>{t.levels.title}</h2>
            <p>
              {t.levels.text}{' '}
              <a href={`${GITHUB_URL}/blob/main/docs/ROADMAP.md`}>{t.levels.github}</a>.
            </p>
          </div>
          <ol className="lv">
            {levels.map((l) => {
              const s = stateOf(l)
              const now = l.worksToday ?? []
              const todo = l.stillToBuild ?? []
              return (
                <li key={l.id} id={`level-${l.level}`} className={s || undefined}>
                  <div className="name">
                    <span className="pin" aria-hidden="true">{l.level}</span>
                    <span className="num">{t.level} {l.level}</span>
                    <h3>{title(l)}</h3>
                    <span className={`state${s ? ` ${s}` : ''}`}>{stateLabel(s)}</span>
                  </div>
                  <div>
                    <h4>{t.levels.now}</h4>
                    <ul>{now.map((row, i) => <li key={i}>{text(row)}</li>)}</ul>
                  </div>
                  <div>
                    <h4>{t.levels.todo}</h4>
                    <ul className="todo">
                      {todo.length > 0 ? todo.map((row, i) => <li key={i}>{text(row)}</li>) : <li>{t.levels.nothingLeft}</li>}
                    </ul>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="section flush-top" id="next">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">{t.next.eyebrow}</span>
              <h2>{t.next.title}</h2>
              <p>{t.next.text}</p>
            </div>
            <div className="next-up">
              {upcoming.map((u) => (
                <article key={`${u.level}-${u.title}`}>
                  <span className="lvl">{t.level} {u.level}</span>
                  <h3>{u.title}</h3>
                  <a className="when" href={`${GITHUB_URL}/issues`}>{t.next.open}</a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" id="summit">
        <div className="wrap">
          <div className="summit">
            <div className="section-head">
              <span className="eyebrow">{t.summit.eyebrow}</span>
              <h2>{t.summit.title}</h2>
              <p>{t.summit.text}</p>
            </div>
            <ol className="vows">
              {t.summit.vows.map(([title, body], i) => (
                <li key={title}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </li>
              ))}
            </ol>
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
              <Link className="btn primary" href={`${docs}/getting-started`}>{t.final.start} <ArrowIcon /></Link>
              <a className="btn" href={GITHUB_URL}><GitHubIcon /> {t.final.star}</a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
