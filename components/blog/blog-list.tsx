'use client'

import { useState } from 'react'

const FILTERS = ['all', 'Release', 'Guide', 'Engineering', 'Community'] as const

/** Category chips over server-rendered cards; each card carries its category. */
export function BlogList({
  cards,
  labels,
  label,
}: {
  cards: { id: string | number; category: string; node: React.ReactNode }[]
  labels: Record<(typeof FILTERS)[number], string>
  label: string
}) {
  const [filter, setFilter] = useState<string>('all')
  const present = new Set(cards.map((c) => c.category))
  const shown = cards.filter((c) => filter === 'all' || c.category === filter)
  return (
    <>
      <div className="filters" role="group" aria-label={label}>
        {FILTERS.filter((value) => value === 'all' || present.has(value)).map((value) => (
          <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {labels[value]}
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
