'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GITHUB_URL, localeOf, NAV, otherLanguagePath, VERSION } from '@/lib/site'
import { GitHubIcon, Logo } from './icons'
import { SearchDialog } from './search-dialog'
import { ThemeToggle } from './theme-toggle'
import { WhyMenu } from './why/why-menu'

export function SiteHeader() {
  const pathname = usePathname()
  const locale = localeOf(pathname)
  // Below 900px the menu folds behind a button; it closes on a new page and on Escape.
  const [open, setOpen] = useState(false)
  const [shownFor, setShownFor] = useState(pathname)
  if (shownFor !== pathname) {
    setShownFor(pathname)
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  const menuLabel = locale === 'th' ? (open ? 'ปิดเมนู' : 'เมนู') : open ? 'Close menu' : 'Menu'
  return (
    <header className={`site-header${open ? ' open' : ''}`}>
      <div className="wrap">
        <Link className="brand" href={locale === 'th' ? '/th' : '/'} aria-label="Easy CMS home">
          <Logo />
          Easy CMS <span className="ver">v{VERSION}</span>
        </Link>
        <nav className="nav" id="main-nav" aria-label={locale === 'th' ? 'เมนูหลัก' : 'Main'}>
          <WhyMenu key={pathname} locale={locale} pathname={pathname} />
          {NAV[locale].map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <SearchDialog />
          <Link
            className="lang-pill"
            href={otherLanguagePath(pathname)}
            hrefLang={locale === 'th' ? 'en' : 'th'}
            aria-label={locale === 'th' ? 'Read in English' : 'อ่านภาษาไทย'}
          >
            {locale === 'th' ? 'EN' : 'ไทย'}
          </Link>
          <ThemeToggle />
          <a className="gh-pill" href={GITHUB_URL}>
            <GitHubIcon />
            <span>GitHub</span>
          </a>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={menuLabel}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path className="m1" d="M4 7h16" />
              <path className="m2" d="M4 12h16" />
              <path className="m3" d="M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
