'use client'

import { useEffect, useState } from 'react'
import type { TocItem } from '@/lib/docs/content'

/** "On this page", highlighting the heading the reader is in. */
export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => h !== null)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null
  return (
    <aside className="toc" aria-label="On this page">
      <h5>On this page</h5>
      <ul>
        {items.map((item) => (
          <li key={item.id} className={`depth-${item.depth}`}>
            <a href={`#${item.id}`} className={item.id === active ? 'on' : undefined}>{item.text}</a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
