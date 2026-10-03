import { renderRichText } from '@easy-cms/richtext'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readingTime } from '@/components/post-card'
import { getPost } from '@/lib/cms'
import { formatDate } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = await getPost(decodeURIComponent((await params).slug))
  if (!post) return {}
  return { title: post.title, description: post.excerpt ?? undefined }
}

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const post = await getPost(decodeURIComponent((await params).slug))
  if (!post) notFound()

  return (
    <article className="wrap article">
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
