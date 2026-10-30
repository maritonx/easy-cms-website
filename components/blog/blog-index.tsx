import Link from 'next/link'
import { PostCard, PostCover } from '@/components/post-card'
import { readingTime } from '@/lib/posts'
import { BLOG_COPY, categoryLabel } from '@/lib/blog-copy'
import { getPosts, type Locale, postHref } from '@/lib/cms'
import { formatDate } from '@/lib/site'
import { BlogList } from './blog-list'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** /blog (posts in English) and /th/blog (posts in Thai): the featured post, then the rest. */
export async function BlogIndex({ locale }: { locale: Locale }) {
  const t = BLOG_COPY[locale]
  const posts = await getPosts(50, locale)
  const featured = posts.find((p) => p.featured) ?? posts[0]
  const rest = posts.filter((p) => p !== featured)

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.lede}</p>
          <Link className="other-lang" href={t.other.href}>
            {t.other.label}
          </Link>
        </div>
      </div>
      <div className="wrap blog-body">
        {featured ? (
          <Link className="featured" href={postHref(featured)}>
            <PostCover post={featured} large />
            <div className="featured-copy">
              <div className="meta">
                <span className="cat">{categoryLabel(featured.category, locale)}</span>
                <span>{formatDate(featured.publishedAt, locale)}</span>
                <span>· {t.minRead(readingTime(featured))}</span>
              </div>
              <h2>{featured.title}</h2>
              {featured.excerpt && <p>{featured.excerpt}</p>}
              {featured.author && (
                <div className="author">
                  <span className="avatar">{initials(featured.author)}</span>
                  <span>{featured.author}<small>{t.maintainer}</small></span>
                </div>
              )}
            </div>
          </Link>
        ) : (
          <p className="empty">{t.empty}</p>
        )}
        {rest.length > 0 && (
          <BlogList
            label={t.filters}
            labels={t.categories}
            cards={rest.map((post) => ({ id: post.id, category: post.category, node: <PostCard post={post} /> }))}
          />
        )}
      </div>
    </>
  )
}
