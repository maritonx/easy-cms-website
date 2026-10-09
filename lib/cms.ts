import 'server-only'
import type { CollectionDocument } from '@easy-cms/core'
import { getEasyCMS } from '@easy-cms/next'
import config from '@/easy-cms.config'

export type Post = CollectionDocument<typeof config, 'posts'>
export type Release = CollectionDocument<typeof config, 'releases'>
export type ShowcaseSite = CollectionDocument<typeof config, 'showcase'>

export const cms = () => getEasyCMS(config)

/** Published posts, newest first. */
export async function getPosts(limit = 50) {
  const { docs } = await (await cms()).find('posts', { sort: '-publishedAt', limit, depth: 1 })
  return docs
}

export async function getPost(slug: string) {
  const { docs } = await (await cms()).find('posts', {
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

/** Newest version first; several releases can share a date, so the version decides. */
export async function getReleases() {
  const { docs } = await (await cms()).find('releases', { limit: 500 })
  const parts = (v: string) => v.split('.').map(Number)
  return docs.sort((a, b) => {
    const [x, y] = [parts(a.version), parts(b.version)]
    return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]
  })
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
