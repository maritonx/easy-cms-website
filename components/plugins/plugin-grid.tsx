'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { FeatureIcon } from '../icons'

export type PluginCard = {
  slug: string
  pkg: string
  group: string
  icon: string
  name: string
  summary: string
  experimental: boolean
  downloads: number | null
  href: string
}

/**
 * The plugin cards by group, with a group filter and a search box. Without script every group
 * shows, so the page works as plain links.
 */
export function PluginGrid({
  cards,
  groups,
  labels,
}: {
  cards: PluginCard[]
  groups: { key: string; title: string; text: string }[]
  labels: { all: string; search: string; none: string; experimental: string; stable: string; downloads: string }
}) {
  const [group, setGroup] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = useMemo(
    () =>
      cards.filter(
        (c) => (!group || c.group === group) && (!q || `${c.name} ${c.pkg} ${c.summary}`.toLowerCase().includes(q)),
      ),
    [cards, group, q],
  )

  return (
    <>
      <div className="pl-tools">
        <div className="pl-filter" role="group" aria-label={labels.all}>
          <button type="button" aria-pressed={group === null} onClick={() => setGroup(null)}>
            {labels.all} <span>{cards.length}</span>
          </button>
          {groups.map((g) => (
            <button key={g.key} type="button" aria-pressed={group === g.key} onClick={() => setGroup(group === g.key ? null : g.key)}>
              {g.title} <span>{cards.filter((c) => c.group === g.key).length}</span>
            </button>
          ))}
        </div>
        <input
          className="pl-search"
          type="search"
          placeholder={labels.search}
          aria-label={labels.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {shown.length === 0 && <p className="pl-none" role="status">{labels.none}</p>}
      {groups.map((g) => {
        const inGroup = shown.filter((c) => c.group === g.key)
        if (inGroup.length === 0) return null
        return (
          <section className="pl-group" key={g.key} aria-labelledby={`pl-${g.key}`}>
            <div className="pl-group-head">
              <h2 id={`pl-${g.key}`}>{g.title}</h2>
              <p>{g.text}</p>
            </div>
            <div className="pl-cards">
              {inGroup.map((c) => (
                <Link className="pl-card" href={c.href} key={c.slug}>
                  <div className="pl-card-top">
                    <span className="pl-icon"><FeatureIcon name={c.icon} /></span>
                    <span className={`pl-status${c.experimental ? ' exp' : ''}`}>
                      {c.experimental ? labels.experimental : labels.stable}
                    </span>
                  </div>
                  <h3>{c.name}</h3>
                  <code>{c.pkg}</code>
                  <p>{c.summary}</p>
                  {c.downloads !== null && (
                    <span className="pl-dl">
                      <b>{c.downloads.toLocaleString('en-US')}</b> {labels.downloads}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}
