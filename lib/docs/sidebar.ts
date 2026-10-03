/**
 * The docs navigation, from website/sidebar.json in the Easy CMS repo (the VitePress site reads
 * the same file). `file` is the markdown file under content/docs/en, without `.md`; `href` is
 * where the page lives on this site.
 */
import navigation from '@/content/docs/sidebar.json'

export type DocLink = { title: string; file: string; href: string }
export type DocGroup = { title: string; items: DocLink[] }

/** guide/next → /docs/next, guide/recipes/index → /docs/recipes, reference/config → /docs/reference/config */
function hrefFor(file: string) {
  if (file === 'guide/what-is-easy-cms') return '/docs'
  const page = file.replace(/^guide\//, '').replace(/(^|\/)index$/, '')
  return `/docs/${page}`.replace(/\/$/, '')
}

export const SIDEBAR: DocGroup[] = navigation.groups.map((group) => ({
  title: group.title.en,
  items: group.items.map((item) => ({ title: item.title.en, file: item.path, href: hrefFor(item.path) })),
}))

export const ALL_DOCS = SIDEBAR.flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })))

/** `/docs/a/b` → its sidebar entry. */
export function findDoc(slug: string[] = []) {
  const href = ['/docs', ...slug].join('/')
  const index = ALL_DOCS.findIndex((d) => d.href === href)
  if (index < 0) return null
  return { doc: ALL_DOCS[index], prev: ALL_DOCS[index - 1] ?? null, next: ALL_DOCS[index + 1] ?? null }
}

/** A markdown file (e.g. `guide/recipes/vercel`) → its URL, for links between pages. */
export function hrefForFile(file: string) {
  return ALL_DOCS.find((d) => d.file === file)?.href ?? null
}
