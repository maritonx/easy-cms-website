'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GITHUB_URL, localeOf, NAV, otherLanguagePath, VERSION } from '@/lib/site'
import { GitHubIcon, Logo } from './icons'
import { SearchDialog } from './search-dialog'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  const pathname = usePathname()
  const locale = localeOf(pathname)
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href={locale === 'th' ? '/th' : '/'} aria-label="Easy CMS home">
          <Logo />
          Easy CMS <span className="ver">v{VERSION}</span>
        </Link>
        <nav className="nav" aria-label={locale === 'th' ? 'เมนูหลัก' : 'Main'}>
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
        </div>
      </div>
    </header>
  )
}
