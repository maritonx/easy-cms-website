import 'server-only'
import type { CollectionDocument } from '@easy-cms/core'
import { getEasyCMS } from '@easy-cms/next'
import config from '@/easy-cms.config'
import { postLanguage } from './posts'

export type Post = CollectionDocument<typeof config, 'posts'>
export type Release = CollectionDocument<typeof config, 'releases'>
export type ShowcaseSite = CollectionDocument<typeof config, 'showcase'>

export const cms = () => getEasyCMS(config)

export type Locale = 'en' | 'th'

/** Published posts, newest first: those in one language, or all of them. */
export async function getPosts(limit = 50, language?: Locale) {
  const { docs } = await (await cms()).find('posts', {
    sort: '-publishedAt',
    limit,
    depth: 1,
    ...(language ? { where: { language: { equals: language } } } : {}),
  })
  return docs
}

export { postLanguage } from './posts'

/** Where a post is read: /blog/<slug>, or /th/blog/<slug> for a Thai post. */
export const postHref = (post: Post) => `${postLanguage(post) === 'th' ? '/th' : ''}/blog/${post.slug}`

export async function getPost(slug: string) {
  const { docs } = await (await cms()).find('posts', {
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

/**
 * Newest version first; several releases can share a date, so the version decides. A
 * prerelease (1.0.0-rc.0) comes just below its release (1.0.0), newest prerelease first.
 */
export async function getReleases() {
  const { docs } = await (await cms()).find('releases', { limit: 500 })
  return docs.sort((a, b) => compareVersions(b.version, a.version))
}

/** Semver order: by major, minor and patch, then a release above its prereleases. */
export function compareVersions(a: string, b: string): number {
  const [coreA, preA = ''] = a.split('-', 2) as [string, string?]
  const [coreB, preB = ''] = b.split('-', 2) as [string, string?]
  const [x, y] = [coreA.split('.').map(Number), coreB.split('.').map(Number)]
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0)
  if (preA === preB) return 0
  if (!preA) return 1
  if (!preB) return -1
  return preA.localeCompare(preB, 'en', { numeric: true })
}

export async function getShowcase() {
  const { docs } = await (await cms()).find('showcase', { sort: 'order', limit: 100, depth: 1 })
  return docs
}

export async function getSite() {
  return (await cms()).findGlobal('site')
}

/** The URL of an upload field's media document, when it was populated (depth ≥ 1). */
export function mediaURL(value: unknown): string | null {
  if (value && typeof value === 'object' && 'url' in value && typeof value.url === 'string') {
    return value.url
  }
  return null
}
