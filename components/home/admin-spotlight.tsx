'use client'

import { useRef, useState } from 'react'
import { FeatureIcon } from '../icons'

/** Each screen zooms to the part that matters, and its callout sits there. */
const FRAMES: Record<string, { icon: string; zoom: number; origin: string; x: number; y: number }> = {
  ai: { icon: 'spark', zoom: 1.35, origin: '30% 58%', x: 22, y: 60 },
  integrations: { icon: 'api', zoom: 1.25, origin: '60% 62%', x: 62, y: 66 },
  preview: { icon: 'layout', zoom: 1, origin: '50% 0', x: 64, y: 22 },
  roles: { icon: 'shield', zoom: 1.15, origin: '40% 10%', x: 55, y: 30 },
  audit: { icon: 'clock', zoom: 1.15, origin: '40% 10%', x: 60, y: 24 },
  backups: { icon: 'db', zoom: 1.15, origin: '40% 10%', x: 58, y: 28 },
}

type Item = readonly [string, string, string, string]

/**
 * The admin on a dark stage: a list of features beside one large window showing the chosen screen
 * (the admin's dark theme, in English or Thai). A click on the window opens it full size.
 */
export function AdminSpotlight({
  items,
  lang: initialLang,
  labels,
}: {
  items: readonly Item[]
  lang: 'en' | 'th'
  labels: { list: string; language: string; larger: string; close: string }
}) {
  const [active, setActive] = useState(0)
  const [lang, setLang] = useState(initialLang)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const dialog = useRef<HTMLDialogElement>(null)
  const src = (key: string) => `/screenshots/${key}-${lang}-dark.webp`
  const [key, title] = items[active]

  function onKey(e: React.KeyboardEvent, i: number) {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + items.length) % items.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="spot">
      <div className="spot-list">
        <div role="tablist" aria-label={labels.list} aria-orientation="vertical" className="spot-tabs">
          {items.map(([k, t, line], i) => (
            <button
              key={k}
              ref={(el) => {
                tabs.current[i] = el
              }}
              type="button"
              className="spot-item"
              role="tab"
              id={`sp-${k}`}
              aria-controls="spot-stage"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <FeatureIcon name={FRAMES[k]?.icon ?? 'spark'} />
              <span>
                <b>{t}</b>
                <span className="spot-line">{line}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="seg seg-lang" role="group" aria-label={labels.language}>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
          <button type="button" aria-pressed={lang === 'th'} onClick={() => setLang('th')}>ไทย</button>
        </div>
      </div>
      <div className="spot-stage" id="spot-stage" role="tabpanel" aria-labelledby={`sp-${key}`}>
        <div className="window spot-window">
          <div className="window-bar">
            <div className="dots"><i /><i /><i /></div>
            <div className="url">your-app.com<b>/admin</b></div>
          </div>
          <button type="button" className="spot-frames" aria-label={`${labels.larger}: ${title}`} onClick={() => dialog.current?.showModal()}>
            {items.map(([k, t, , callout], i) => {
              const f = FRAMES[k] ?? { zoom: 1, origin: '0 0', x: 50, y: 50 }
              return (
                <span
                  key={k}
                  className={`spot-frame${i === active ? ' on' : ''}`}
                  style={{ '--z': f.zoom, '--o': f.origin } as React.CSSProperties}
                  aria-hidden={i !== active}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static screenshots */}
                  <img src={src(k)} alt={i === active ? t : ''} loading={i === 0 ? 'eager' : 'lazy'} />
                  <span className="spot-callout" style={{ left: `${f.x}%`, top: `${f.y}%` }}>{callout}</span>
                </span>
              )
            })}
          </button>
        </div>
        <div className="spot-glow" aria-hidden="true" />
      </div>
      <dialog className="lightbox" ref={dialog} aria-label={title} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <form method="dialog">
          <button className="lightbox-close" aria-label={labels.close}>×</button>
        </form>
        {/* eslint-disable-next-line @next/next/no-img-element -- static screenshot */}
        <img src={src(key)} alt={title} />
      </dialog>
    </div>
  )
}
