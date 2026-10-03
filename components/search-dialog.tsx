'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SearchIcon } from './icons'

type SubResult = { title: string; url: string; excerpt: string }
type Result = { url: string; title: string; excerpt: string; subResults: SubResult[] }

type Pagefind = {
  options: (o: Record<string, unknown>) => Promise<void>
  debouncedSearch: (q: string) => Promise<{ results: { data: () => Promise<PagefindData> }[] } | null>
}
type PagefindData = {
  url: string
  meta: { title?: string }
  excerpt: string
  sub_results: SubResult[]
}

/** Pagefind writes /docs/next.html; the site's address is /docs/next. */
const clean = (url: string) => url.replace(/\.html(?=$|#)/, '').replace(/^\/index$/, '/')

let pagefind: Promise<Pagefind | null> | undefined

/** The index scripts/build-search.mts writes to public/pagefind. */
function loadPagefind() {
  const url = '/pagefind/pagefind.js'
  pagefind ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)
    .then(async (module: Pagefind) => {
      await module.options({ excerptLength: 18 })
      return module
    })
    .catch(() => null)
  return pagefind
}

export function SearchDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle')
  const [active, setActive] = useState(0)

  const open = useCallback(() => {
    dialog.current?.showModal()
    input.current?.select()
    setState((s) => (s === 'idle' ? 'loading' : s))
    void loadPagefind().then((pf) => setState(pf ? 'ready' : 'unavailable'))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (state !== 'ready') return
    let cancelled = false
    void (async () => {
      const pf = await loadPagefind()
      const search = pf && query.trim() ? await pf.debouncedSearch(query) : null
      if (cancelled || (query.trim() && search === null)) return
      const data = search ? await Promise.all(search.results.slice(0, 8).map((r) => r.data())) : []
      if (cancelled) return
      setResults(
        data.map((d) => ({
          url: clean(d.url),
          title: d.meta.title?.replace(/ · Easy CMS$/, '') ?? clean(d.url),
          excerpt: d.excerpt,
          // Headings inside the page; the page's own title is the result itself.
          subResults: d.sub_results
            .filter((s) => s.url !== d.url && s.title !== d.meta.title)
            .slice(0, 3)
            .map((s) => ({ ...s, url: clean(s.url) })),
        })),
      )
      setActive(0)
    })()
    return () => {
      cancelled = true
    }
  }, [query, state])

  function go(url: string) {
    dialog.current?.close()
    router.push(url)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      go(results[active].url)
    }
  }

  return (
    <>
      <button className="search-btn" type="button" onClick={open} aria-label="Search docs">
        <SearchIcon width={15} height={15} />
        <span>Search docs</span>
        <kbd>⌘K</kbd>
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-label="Search docs"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="search-box">
          <div className="search-input">
            <SearchIcon width={18} height={18} />
            <input
              ref={input}
              id="docs-search"
              type="search"
              placeholder="Search the docs"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              aria-controls="search-results"
            />
            <kbd>esc</kbd>
          </div>
          <div className="search-results" id="search-results">
            {state === 'unavailable' && (
              <p className="search-note">The search index isn&apos;t built yet: run <code>pnpm docs:fetch</code>.</p>
            )}
            {state === 'ready' && query.trim() && results.length === 0 && (
              <p className="search-note">Nothing in the docs matches &ldquo;{query}&rdquo;.</p>
            )}
            {state === 'ready' && !query.trim() && (
              <p className="search-note">Search every guide, recipe and reference page.</p>
            )}
            <ul>
              {results.map((r, i) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    className={i === active ? 'on' : undefined}
                    onMouseEnter={() => setActive(i)}
                    onClick={(e) => {
                      e.preventDefault()
                      go(r.url)
                    }}
                  >
                    <b>{r.title}</b>
                    {/* Pagefind's excerpt is escaped text with <mark> around the matches. */}
                    <span dangerouslySetInnerHTML={{ __html: r.excerpt }} />
                  </a>
                  {r.subResults.length > 0 && (
                    <ul className="search-sub">
                      {r.subResults.map((s) => (
                        <li key={s.url}>
                          <a
                            href={s.url}
                            onClick={(e) => {
                              e.preventDefault()
                              go(s.url)
                            }}
                          >
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </dialog>
    </>
  )
}
