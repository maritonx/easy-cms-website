'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GITHUB_URL, NAV, VERSION } from '@/lib/site'
import { GitHubIcon, Logo, SearchIcon } from './icons'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  const pathname = usePathname()
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="Easy CMS home">
          <Logo />
          Easy CMS <span className="ver">v{VERSION}</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <Link className="search-btn" href="/docs" aria-label="Search docs">
            <SearchIcon width={15} height={15} />
            <span>Search docs</span>
            <kbd>⌘K</kbd>
          </Link>
          <ThemeToggle />
          <a className="gh-pill" href={GITHUB_URL}>
            <GitHubIcon />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}
