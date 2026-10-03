/** Links and facts used across the site. */
export const GITHUB_URL = 'https://github.com/maritonx/easy-cms'
export const NPM_URL = 'https://www.npmjs.com/org/easy-cms'
export const VERSION = '0.22'

export const NAV = [
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/changelog', label: 'Changelog' },
] as const

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
