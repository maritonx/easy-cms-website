'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { type Brand, BrandLogo } from '../brand-logo'
import { ArrowIcon } from '../icons'

export type RuntimeOption = {
  key: string
  title: string
  uses: string
  logos: readonly Brand[]
  /** The config for this host, highlighted on the server. */
  html: string
  command: string
  guide: string
}

/** "Pick where it runs": one card per kind of host, its config and command beside them. */
export function RuntimePicker({ options, label, guide }: { options: RuntimeOption[]; label: string; guide: string }) {
  const [active, setActive] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  function onKey(e: React.KeyboardEvent, i: number) {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + options.length) % options.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="picker">
      <div className="pick-list" role="tablist" aria-label={label} aria-orientation="vertical">
        {options.map((o, i) => (
          <button
            key={o.key}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            className="pick"
            role="tab"
            id={`rt-${o.key}`}
            aria-controls={`rp-${o.key}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="pick-logos" aria-hidden="true">
              {o.logos.map((l) => <BrandLogo key={l} name={l} />)}
            </span>
            <span className="pick-text">
              <b>{o.title}</b>
              <span>{o.uses}</span>
            </span>
          </button>
        ))}
      </div>
      <div>
        {options.map((o, i) => (
          <div className="pick-pane" role="tabpanel" id={`rp-${o.key}`} aria-labelledby={`rt-${o.key}`} hidden={i !== active} key={o.key}>
            <div className="float-code">
              <div className="fname"><span>easy-cms.config.ts</span><span>{o.uses}</span></div>
              <div dangerouslySetInnerHTML={{ __html: o.html }} />
            </div>
            <div className="pick-cmd"><span>$</span><code>{o.command}</code></div>
            <Link className="why-more" href={o.guide}>{guide} <ArrowIcon /></Link>
          </div>
        ))}
      </div>
    </div>
  )
}
