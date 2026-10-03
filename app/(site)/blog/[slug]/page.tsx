import { renderRichText } from '@easy-cms/richtext'
import { jsonLdScript, seoMeta } from '@easy-cms/plugin-seo'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readingTime } from '@/components/post-card'
import config from '@/easy-cms.config'
import { getPost, type Post } from '@/lib/cms'
import { formatDate } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** Title, description, share tags, canonical link and BlogPosting JSON-LD from the SEO fields. */
function seoFor(post: Post) {
  return seoMeta(post, {
    config,
    url: (p) => `/blog/${p.slug}`,
    type: 'article',
    author: (p) => (p.author as string | undefined) ?? 'Easy CMS',
    siteName: 'Easy CMS',
  })
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = await getPost(decodeURIComponent((await params).slug))
  if (!post) return {}
  const seo = seoFor(post)
  const meta = seo.next as Metadata
  // A meta title from the SEO fields is complete; the post title gets the site's template.
  const metaTitle = (post as { meta?: { title?: string | null } }).meta?.title
  // Without a share image of its own, the post uses the site's (app/og/site).
  const images = seo.image ? meta.openGraph?.images : ['/og/site']
  return {
    ...meta,
    title: metaTitle ? { absolute: metaTitle } : post.title,
    openGraph: { ...meta.openGraph, images },
    twitter: { ...meta.twitter, card: 'summary_large_image', images },
  }
}

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const post = await getPost(decodeURIComponent((await params).slug))
  if (!post) notFound()

  return (
    <article className="wrap article">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(seoFor(post).jsonLd) }} />
      <header className="article-head">
        <Link className="back-link" href="/blog">← All posts</Link>
        <div className="meta">
          <span className="cat">{post.category}</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span>· {readingTime(post)} min read</span>
          {post.author && <span>· {post.author}</span>}
        </div>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
      </header>
      <div className="prose" dangerouslySetInnerHTML={{ __html: renderRichText(post.body) }} />
    </article>
  )
}
