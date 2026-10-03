'use client'

import { usePathname, useRouter } from 'next/navigation'
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

const loaded = new Map<string, Promise<Pagefind | null>>()

/** The index scripts/build-search.mts writes: public/pagefind (English), public/pagefind-th (Thai). */
function loadPagefind(locale: 'en' | 'th') {
  const url = locale === 'th' ? '/pagefind-th/pagefind.js' : '/pagefind/pagefind.js'
  let pf = loaded.get(url)
  if (!pf) {
    pf = import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)
      .then(async (module: Pagefind) => {
        await module.options({ excerptLength: 18 })
        return module
      })
      .catch(() => null)
    loaded.set(url, pf)
  }
  return pf
}

const LABELS = {
  en: {
    button: 'Search docs',
    placeholder: 'Search the docs',
    missing: 'The search index isn’t built yet: run pnpm docs:fetch.',
    none: (q: string) => `Nothing in the docs matches “${q}”.`,
    hint: 'Search every guide, recipe and reference page.',
  },
  th: {
    button: 'ค้นหาเอกสาร',
    placeholder: 'ค้นหาในเอกสาร',
    missing: 'ยังไม่ได้สร้างดัชนีค้นหา: รัน pnpm docs:fetch',
    none: (q: string) => `ไม่พบ “${q}” ในเอกสาร`,
    hint: 'ค้นหาทุกหน้าคู่มือ สูตรสำเร็จ และข้อมูลอ้างอิง',
  },
}

export function SearchDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()
  // Thai pages search the Thai docs; everything else the English ones.
  const locale = usePathname().startsWith('/th/') ? 'th' : 'en'
  const t = LABELS[locale]
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle')
  const [active, setActive] = useState(0)

  const open = useCallback(() => {
    dialog.current?.showModal()
    input.current?.select()
    setState((s) => (s === 'idle' ? 'loading' : s))
    void loadPagefind(locale).then((pf) => setState(pf ? 'ready' : 'unavailable'))
  }, [locale])

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
      const pf = await loadPagefind(locale)
      const search = pf && query.trim() ? await pf.debouncedSearch(query) : null
      if (cancelled || (query.trim() && search === null)) return
      const data = search ? await Promise.all(search.results.slice(0, 8).map((r) => r.data())) : []
      if (cancelled) return
      setResults(
        data.map((d) => ({
          url: clean(d.url),
          title: d.meta.title ?? clean(d.url),
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
  }, [query, state, locale])

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
      <button className="search-btn" type="button" onClick={open} aria-label={t.button}>
        <SearchIcon width={15} height={15} />
        <span>{t.button}</span>
        <kbd>⌘K</kbd>
      </button>
      <dialog
        ref={dialog}
        className="search-dialog"
        aria-label={t.button}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="search-box">
          <div className="search-input">
            <SearchIcon width={18} height={18} />
            <input
              ref={input}
              id="docs-search"
              type="search"
              placeholder={t.placeholder}
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
              <p className="search-note">{t.missing}</p>
            )}
            {state === 'ready' && query.trim() && results.length === 0 && (
              <p className="search-note">{t.none(query)}</p>
            )}
            {state === 'ready' && !query.trim() && (
              <p className="search-note">{t.hint}</p>
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
