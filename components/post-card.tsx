import Link from 'next/link'
import { mediaURL, type Post } from '@/lib/cms'
import { formatDate } from '@/lib/site'
import { ArrowIcon } from './icons'

/** The cover: the uploaded image, or the post's short code-like text on ruled lines. */
export function PostCover({ post, large }: { post: Post; large?: boolean }) {
  const image = mediaURL(post.cover)
  const alt = post.category !== 'Release'
  return (
    <div className={`post-cover${alt ? ' alt' : ''}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploads are served by Easy CMS
        <img src={image} alt="" />
      ) : (
        <span style={large ? { fontSize: 44 } : undefined}>{post.coverText || post.category}</span>
      )}
    </div>
  )
}

export function readingTime(post: Post) {
  const words = JSON.stringify(post.body ?? '').split(/\s+/).length
  return Math.max(2, Math.round(words / 220))
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link className="post-card" href={`/blog/${post.slug}`}>
      <PostCover post={post} />
      <div className="body">
        <div className="meta">
          <span className="cat">{post.category}</span>
          <span>{formatDate(post.publishedAt)}</span>
        </div>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
      </div>
      <span className="read">
        Read · {readingTime(post)} min <ArrowIcon />
      </span>
    </Link>
  )
}
