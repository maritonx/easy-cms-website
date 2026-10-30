import { jsonLdScript, seoMeta } from '@easy-cms/plugin-seo'
import type { Metadata } from 'next'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { PostView } from '@/components/blog/post-view'
import config from '@/easy-cms.config'
import { cms, getPost, type Locale, type Post, postHref, postLanguage } from '@/lib/cms'
import { POST_COVERS } from '@/lib/post-covers'

/** Title, description, share tags, canonical link and BlogPosting JSON-LD from the SEO fields. */
function seoFor(post: Post) {
  return seoMeta(post, {
    config,
    url: (p) => postHref(p as Post),
    type: 'article',
    author: (p) => (p.author as string | undefined) ?? 'Easy CMS',
    siteName: 'Easy CMS',
  })
}

/** The preview token the admin's live preview adds to the address. */
export const PREVIEW_PARAM = 'easy-cms-preview'

/**
 * The post at this address, or with a valid preview token, the post the token opens in its
 * current draft (the admin's preview of an unpublished post or of unsaved changes).
 */
async function loadPost(slug: string, token: string | undefined) {
  const db = await cms()
  const target = token ? db.verifyPreviewToken(token) : null
  if (target && 'collection' in target && target.collection === 'posts') {
    const draft = await db.findById('posts', target.id, { depth: 1, draft: true })
    if (draft) return { post: draft, preview: true }
  }
  const post = await getPost(decodeURIComponent(slug))
  return post ? { post, preview: false } : null
}

/** The post at this address, or null; a post asked for under the other language's blog is null too. */
async function postAt(slug: string, locale: Locale) {
  const post = await getPost(decodeURIComponent(slug))
  return post && postLanguage(post) === locale ? post : null
}

export async function postMetadata(slug: string, locale: Locale, token?: string): Promise<Metadata> {
  // A preview is never indexed, and has no share tags.
  const found = token ? await loadPost(slug, token) : null
  if (found?.preview) return { title: found.post.title, robots: { index: false, follow: false } }
  const post = await postAt(slug, locale)
  if (!post) return {}
  const seo = seoFor(post)
  const meta = seo.next as Metadata
  // A meta title from the SEO fields is complete; the post title gets the site's template.
  const metaTitle = (post as { meta?: { title?: string | null } }).meta?.title
  // Without a share image of its own, the post uses its imported cover, else the site's.
  const cover = POST_COVERS[String(post.slug)]
  const images = seo.image ? meta.openGraph?.images : [cover ?? '/og/site']
  return {
    ...meta,
    title: metaTitle ? { absolute: metaTitle } : post.title,
    openGraph: { ...meta.openGraph, images, locale: locale === 'th' ? 'th_TH' : 'en_US' },
    alternates: { ...meta.alternates, types: { 'text/markdown': `${postHref(post)}.md` } },
    twitter: { ...meta.twitter, card: 'summary_large_image', images },
  }
}

/** /blog/<slug> and /th/blog/<slug>. A post under the wrong language's blog moves to its own. */
export async function PostPage({ slug, locale, token }: { slug: string; locale: Locale; token?: string }) {
  const found = await loadPost(slug, token)
  if (!found) notFound()
  const { post, preview } = found
  if (postLanguage(post) !== locale) {
    if (preview) redirect(`${postHref(post)}?${PREVIEW_PARAM}=${encodeURIComponent(token ?? '')}`)
    permanentRedirect(postHref(post))
  }

  return (
    <>
      {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(seoFor(post).jsonLd) }} />}
      <PostView post={post} locale={locale} preview={preview} />
    </>
  )
}
