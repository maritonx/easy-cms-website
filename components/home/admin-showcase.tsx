'use client'

import { useState } from 'react'

const SCREENS = [
  { key: 'dashboard', path: '/admin' },
  { key: 'edit', path: '/admin/collections/posts/12' },
  { key: 'translate', path: '/admin/collections/posts' },
  { key: 'media', path: '/admin/collections/media' },
] as const

/** Admin screenshots by tab; `lang` picks the admin's language in the screenshots. */
export function AdminShowcase({
  labels,
  alts,
  lang,
}: {
  labels: readonly string[]
  alts: readonly string[]
  lang: 'en' | 'th'
}) {
  const [active, setActive] = useState(0)
  const screen = SCREENS[active]
  return (
    <>
      <div className="seg" role="tablist" aria-label={labels.join(', ')}>
        {SCREENS.map((s, i) => (
          <button key={s.key} role="tab" aria-selected={i === active} onClick={() => setActive(i)}>
            {labels[i]}
          </button>
        ))}
      </div>
      <div className="window" style={{ marginTop: 24 }}>
        <div className="window-bar">
          <div className="dots"><i /><i /><i /></div>
          <div className="url">your-site.com<b>{screen.path}</b></div>
        </div>
        {/* eslint-disable @next/next/no-img-element -- static screenshots, one per theme */}
        <img className="shot only-dark" src={`/screenshots/${screen.key}-${lang}-dark.webp`} alt={alts[active]} />
        <img className="shot only-light" src={`/screenshots/${screen.key}-${lang}-light.webp`} alt={alts[active]} />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
    </>
  )
}
