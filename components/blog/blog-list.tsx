'use client'

import { useState } from 'react'

const FILTERS = [
  ['all', 'All'],
  ['Release', 'Releases'],
  ['Guide', 'Guides'],
  ['Engineering', 'Engineering'],
  ['Community', 'Community'],
] as const

/** Category chips over server-rendered cards; each card carries its category. */
export function BlogList({ cards }: { cards: { id: string | number; category: string; node: React.ReactNode }[] }) {
  const [filter, setFilter] = useState<string>('all')
  const present = new Set(cards.map((c) => c.category))
  const shown = cards.filter((c) => filter === 'all' || c.category === filter)
  return (
    <>
      <div className="filters" role="group" aria-label="Filter posts">
        {FILTERS.filter(([value]) => value === 'all' || present.has(value)).map(([value, label]) => (
          <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      <div className="post-grid">
        {shown.map((c) => (
          <div key={c.id} style={{ display: 'grid' }}>{c.node}</div>
        ))}
      </div>
    </>
  )
}
