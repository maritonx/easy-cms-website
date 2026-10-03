'use client'

import { useState } from 'react'

const SCREENS = [
  { key: 'dashboard', label: 'Dashboard', path: '/admin', alt: 'The Easy CMS admin dashboard' },
  { key: 'edit', label: 'Editing a post', path: '/admin/collections/posts/12', alt: 'Editing a post in the admin' },
  { key: 'translate', label: 'Translations', path: '/admin/collections/posts', alt: 'Translation status in the posts list' },
  { key: 'media', label: 'Media', path: '/admin/collections/media', alt: 'The media library' },
] as const

export function AdminShowcase() {
  const [active, setActive] = useState<string>(SCREENS[0].key)
  const screen = SCREENS.find((s) => s.key === active) ?? SCREENS[0]
  return (
    <>
      <div className="seg" role="tablist" aria-label="Admin screen">
        {SCREENS.map((s) => (
          <button key={s.key} role="tab" aria-selected={s.key === active} onClick={() => setActive(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="window" style={{ marginTop: 24 }}>
        <div className="window-bar">
          <div className="dots"><i /><i /><i /></div>
          <div className="url">your-site.com<b>{screen.path}</b></div>
        </div>
        {/* eslint-disable @next/next/no-img-element -- static screenshots, one per theme */}
        <img className="shot only-dark" src={`/screenshots/${screen.key}-en-dark.webp`} alt={screen.alt} />
        <img className="shot only-light" src={`/screenshots/${screen.key}-en-light.webp`} alt={screen.alt} />
        {/* eslint-enable @next/next/no-img-element */}
      </div>
    </>
  )
}
