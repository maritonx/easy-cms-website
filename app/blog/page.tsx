import type { Metadata } from 'next'
import Link from 'next/link'
import { BlogList } from '@/components/blog/blog-list'
import { PostCard, PostCover, readingTime } from '@/components/post-card'
import { getPosts } from '@/lib/cms'
import { formatDate } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Release write-ups, guides for real projects, and the reasoning behind Easy CMS.',
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default async function BlogPage() {
  const posts = await getPosts()
  const featured = posts.find((p) => p.featured) ?? posts[0]
  const rest = posts.filter((p) => p !== featured)

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Blog</span>
          <h1>Notes from building Easy CMS</h1>
          <p>Release write-ups, guides for real projects, and the reasoning behind the design. Published from Easy CMS itself.</p>
        </div>
      </div>
      <div className="wrap blog-body">
        {featured ? (
          <Link className="featured" href={`/blog/${featured.slug}`}>
            <PostCover post={featured} large />
            <div className="featured-copy">
              <div className="meta">
                <span className="cat">{featured.category}</span>
                <span>{formatDate(featured.publishedAt)}</span>
                <span>· {readingTime(featured)} min read</span>
              </div>
              <h2>{featured.title}</h2>
              {featured.excerpt && <p>{featured.excerpt}</p>}
              {featured.author && (
                <div className="author">
                  <span className="avatar">{initials(featured.author)}</span>
                  <span>{featured.author}<small>Maintainer</small></span>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <p className="empty">No posts yet. Publish one at <code>/admin</code>, or run <code>pnpm seed</code>.</p>
        )}
        {rest.length > 0 && (
          <BlogList
            cards={rest.map((post) => ({ id: post.id, category: post.category, node: <PostCard post={post} /> }))}
          />
        )}
      </div>
    </>
  )
}
