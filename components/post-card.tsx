import Link from 'next/link'
import { BLOG_COPY, categoryLabel } from '@/lib/blog-copy'
import { mediaURL, type Post, postHref, postLanguage } from '@/lib/cms'
import { readingTime } from '@/lib/posts'
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

/** A post on a list, in the post's own language. */
export function PostCard({ post }: { post: Post }) {
  const locale = postLanguage(post)
  return (
    <Link className="post-card" href={postHref(post)} lang={locale}>
      <PostCover post={post} />
      <div className="body">
        <div className="meta">
          <span className="cat">{categoryLabel(post.category, locale)}</span>
          <span>{formatDate(post.publishedAt, locale)}</span>
        </div>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
      </div>
      <span className="read">
        {BLOG_COPY[locale].read(readingTime(post))} <ArrowIcon />
      </span>
    </Link>
  )
}
