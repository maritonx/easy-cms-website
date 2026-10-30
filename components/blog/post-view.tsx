'use client'
import { useLivePreview } from '@easy-cms/next/live-preview'
import { renderRichText } from '@easy-cms/richtext'
import Link from 'next/link'
import { BLOG_COPY, categoryLabel } from '@/lib/blog-copy'
import type { Locale, Post } from '@/lib/cms'
import { readingTime } from '@/lib/posts'
import { formatDate } from '@/lib/site'

/** A post's HTML; wide tables scroll in a box of their own on narrow screens. */
function postHtml(body: Post['body']): string {
  return renderRichText(body)
    .replaceAll('<table>', '<div class="table-wrap"><table>')
    .replaceAll('</table>', '</table></div>')
}

/**
 * The article. In the admin's live preview it follows the form as you type, unsaved; `preview`
 * (opened with a preview token) says readers don't see this version yet.
 */
export function PostView({ post: initial, locale, preview }: { post: Post; locale: Locale; preview: boolean }) {
  const post = useLivePreview(initial)
  const t = BLOG_COPY[locale]
  return (
    <article className="wrap article">
      <header className="article-head">
        {preview && (
          <p className="preview-note" role="status">
            {t.preview}
          </p>
        )}
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
