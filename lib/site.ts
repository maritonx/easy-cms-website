/** Links and facts used across the site. */
export const GITHUB_URL = 'https://github.com/maritonx/easy-cms'
export const NPM_URL = 'https://www.npmjs.com/org/easy-cms'
export const VERSION = '1.7'
/** This site's own source: it is built with Easy CMS. */
export const SITE_REPO_URL = 'https://github.com/maritonx/easy-cms-website'
export const DISCUSSIONS_URL = `${GITHUB_URL}/discussions`
/** Deploys templates/next-starter to the visitor's own Vercel (docs/one-click-deploy). */
export const DEPLOY_VERCEL_URL =
  'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmaritonx%2Feasy-cms%2Ftree%2Fmain%2Ftemplates%2Fnext-starter&project-name=easy-cms&repository-name=easy-cms&env=EASY_CMS_SETUP_CODE&envDescription=A+code+you+choose%3A+you+type+it+to+create+the+first+admin+at+%2Fadmin&envLink=https%3A%2F%2Feasy-cms-website.vercel.app%2Fdocs%2Fone-click-deploy&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%2C%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22public%22%7D%5D'
/** The same starter on the visitor's own Netlify (docs/one-click-deploy). */
export const DEPLOY_NETLIFY_URL =
  'https://app.netlify.com/start/deploy?repository=https://github.com/maritonx/easy-cms&create_from_path=templates/next-starter'
/** The public admin demo; null until it is up, which hides the "Try the demo" buttons. */
export const DEMO_URL: string | null = null

/**
 * Umami Cloud (cookieless, so no consent banner). It only counts visits on the live host, not
 * localhost or Vercel previews. Buttons with data-umami-event are counted as events.
 */
export const UMAMI = {
  src: 'https://cloud.umami.is/script.js',
  websiteId: 'c4f47abf-51c6-49f6-a035-04bbe033db62',
  domains: 'easy-cms-website.vercel.app',
}

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
    { href: '/th/blog', label: 'บล็อก' },
    { href: '/showcase', label: 'ผลงาน' },
    { href: '/changelog', label: 'Changelog' },
  ],
} as const

/** A page's language from its path: /th and /th/… are Thai. */
export const localeOf = (pathname: string) => (pathname === '/th' || pathname.startsWith('/th/') ? 'th' : 'en')

/** English pages that have a Thai version at /th plus the same path. */
const BILINGUAL = /^\/(docs|why)(\/|$)|^\/blog$/

/**
 * The same page in the other language: the home page, the docs, the Why pages and the blog exist in both;
 * any other English page switches to the Thai home page.
 */
export function otherLanguagePath(pathname: string) {
  // A post is in one language only: switch to the other language's blog.
  if (pathname.startsWith('/th/blog/')) return '/blog'
  if (pathname.startsWith('/blog/')) return '/th/blog'
  if (localeOf(pathname) === 'th') return pathname.replace(/^\/th(?=\/|$)/, '') || '/'
  if (pathname === '/') return '/th'
  return BILINGUAL.test(pathname) ? `/th${pathname}` : '/th'
}

/**
 * "Oct 1, 2026" (or "1 ต.ค. 2569" in Thai) from an ISO date, in UTC so the day doesn't shift with
 * the server's zone.
 */
export function formatDate(iso: string | null | undefined, locale: 'en' | 'th' = 'en') {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
