import { renderRichText } from '@easy-cms/richtext'
import { jsonLdScript, seoMeta } from '@easy-cms/plugin-seo'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { readingTime } from '@/components/post-card'
import config from '@/easy-cms.config'
import { BLOG_COPY, categoryLabel } from '@/lib/blog-copy'
import { getPost, type Locale, type Post, postHref, postLanguage } from '@/lib/cms'
import { POST_COVERS } from '@/lib/post-covers'
import { formatDate } from '@/lib/site'

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

/** The post at this address, or null; a post asked for under the other language's blog is null too. */
async function postAt(slug: string, locale: Locale) {
  const post = await getPost(decodeURIComponent(slug))
  return post && postLanguage(post) === locale ? post : null
}

export async function postMetadata(slug: string, locale: Locale): Promise<Metadata> {
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

/** A post's HTML; wide tables scroll in a box of their own on narrow screens. */
function postHtml(body: Post['body']): string {
  return renderRichText(body)
    .replaceAll('<table>', '<div class="table-wrap"><table>')
    .replaceAll('</table>', '</table></div>')
}

/** /blog/<slug> and /th/blog/<slug>. A post under the wrong language's blog moves to its own. */
export async function PostPage({ slug, locale }: { slug: string; locale: Locale }) {
  const post = await getPost(decodeURIComponent(slug))
  if (!post) notFound()
  if (postLanguage(post) !== locale) permanentRedirect(postHref(post))
  const t = BLOG_COPY[locale]

  return (
    <article className="wrap article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(seoFor(post).jsonLd) }} />
      <header className="article-head">
        <Link className="back-link" href={locale === 'th' ? '/th/blog' : '/blog'}>{t.back}</Link>
        <div className="meta">
          <span className="cat">{categoryLabel(post.category, locale)}</span>
          <span>{formatDate(post.publishedAt, locale)}</span>
          <span>· {t.minRead(readingTime(post))}</span>
          {post.author && <span>· {post.author}</span>}
        </div>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: postHtml(post.body) }} />
    </article>
  )
}
