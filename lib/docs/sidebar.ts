/**
 * The docs navigation, from website/sidebar.json in the Easy CMS repo (the VitePress site reads
 * the same file). `file` is the markdown file under content/docs/<locale>, without `.md`; `href`
 * is where the page lives on this site: /docs/… in English, /th/docs/… in Thai.
 */
import navigation from '@/content/docs/sidebar.json'

export const LOCALES = ['en', 'th'] as const
export type Locale = (typeof LOCALES)[number]

export type DocLink = { title: string; file: string; href: string }
export type DocGroup = { title: string; items: DocLink[] }

const prefix = (locale: Locale) => (locale === 'th' ? '/th/docs' : '/docs')

/** guide/next → /docs/next, guide/recipes/index → /docs/recipes, reference/config → /docs/reference/config */
export function hrefFor(file: string, locale: Locale = 'en') {
  if (file === 'guide/what-is-easy-cms') return prefix(locale)
  const page = file.replace(/^guide\//, '').replace(/(^|\/)index$/, '')
  return `${prefix(locale)}/${page}`.replace(/\/$/, '')
}

export function sidebarFor(locale: Locale): DocGroup[] {
  return navigation.groups.map((group) => ({
    title: group.title[locale],
    items: group.items.map((item) => ({
      title: item.title[locale],
      file: item.path,
      href: hrefFor(item.path, locale),
    })),
  }))
}

export function docsFor(locale: Locale) {
  return sidebarFor(locale).flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })))
}

export const SIDEBAR = sidebarFor('en')
export const ALL_DOCS = docsFor('en')

/** The page's path segments under /docs (or /th/docs) → its sidebar entry and neighbours. */
export function findDoc(slug: string[] = [], locale: Locale = 'en') {
  const docs = docsFor(locale)
  const href = [prefix(locale), ...slug].join('/')
  const index = docs.findIndex((d) => d.href === href)
  if (index < 0) return null
  return { doc: docs[index], prev: docs[index - 1] ?? null, next: docs[index + 1] ?? null }
}

/** A markdown file (e.g. `guide/recipes/vercel`) → its URL in that locale, for links between pages. */
export function hrefForFile(file: string, locale: Locale = 'en') {
  return docsFor(locale).find((d) => d.file === file)?.href ?? null
}
