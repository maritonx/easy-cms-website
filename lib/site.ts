/** Links and facts used across the site. */
export const GITHUB_URL = 'https://github.com/maritonx/easy-cms'
export const NPM_URL = 'https://www.npmjs.com/org/easy-cms'
export const VERSION = '0.68'

/** The main menu; Thai pages link to the Thai docs, the rest of the site is in English. */
export const NAV = {
  en: [
    { href: '/docs', label: 'Docs' },
    { href: '/blog', label: 'Blog' },
    { href: '/showcase', label: 'Showcase' },
    { href: '/changelog', label: 'Changelog' },
  ],
  th: [
    { href: '/th/docs', label: 'เอกสาร' },
    { href: '/blog', label: 'บล็อก' },
    { href: '/showcase', label: 'ผลงาน' },
    { href: '/changelog', label: 'Changelog' },
  ],
} as const

/** A page's language from its path: /th and /th/… are Thai. */
export const localeOf = (pathname: string) => (pathname === '/th' || pathname.startsWith('/th/') ? 'th' : 'en')

/**
 * The same page in the other language: the home page and the docs exist in both; any other
 * English page switches to the Thai home page.
 */
export function otherLanguagePath(pathname: string) {
  if (localeOf(pathname) === 'th') return pathname.replace(/^\/th(?=\/|$)/, '') || '/'
  return pathname === '/' || pathname === '/docs' || pathname.startsWith('/docs/') ? `/th${pathname === '/' ? '' : pathname}` : '/th'
}

/** "Oct 1, 2026" from an ISO date, in UTC so the day doesn't shift with the server's zone. */
export function formatDate(iso: string | null | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
