'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { COMPETITORS } from '@/lib/why/compare'
import { type Locale, PERSONAS, WHY_UI, whyHref } from '@/lib/why/copy'

/**
 * "Why Easy CMS" in the header: who it's for and the comparisons, in two columns. On narrow
 * screens the panel opens below the menu instead of over the page.
 */
export function WhyMenu({ locale, pathname }: { locale: Locale; pathname: string }) {
  const t = WHY_UI[locale]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const current = pathname.startsWith(whyHref('', locale))

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)
  return (
    <div className="why-menu" ref={ref}>
      <button
        type="button"
        className="why-trigger"
        aria-expanded={open}
        aria-controls={id}
        data-current={current || undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {t.menu}
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="why-panel" id={id} hidden={!open}>
        <div>
          <p className="why-panel-title">{t.forTitle}</p>
          <ul>
            {PERSONAS.map((p) => (
              <li key={p.slug}>
                <Link href={whyHref(p.slug, locale)} onClick={close}>
                  <b>{p[locale].menu.label}</b>
                  <span>{p[locale].menu.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="why-panel-all" href={whyHref('', locale)} onClick={close}>
            {t.overview} →
          </Link>
        </div>
        <div>
          <p className="why-panel-title">{t.compareTitle}</p>
          <ul className="why-panel-compare">
            {COMPETITORS.map((c) => (
              <li key={c.slug}>
                <Link href={whyHref(`compare/${c.slug}`, locale)} onClick={close}>
                  <b>{t.vs(c.name)}</b>
                </Link>
              </li>
            ))}
          </ul>
          <Link className="why-panel-all" href={whyHref('compare', locale)} onClick={close}>
            {t.allCompared} →
          </Link>
        </div>
      </div>
    </div>
  )
}
