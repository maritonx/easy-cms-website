import type { Metadata } from 'next'
import { BlogIndex } from '@/components/blog/blog-index'
import { BLOG_COPY } from '@/lib/blog-copy'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...BLOG_COPY.th.meta,
  alternates: { canonical: '/th/blog', languages: { en: '/blog', th: '/th/blog', 'x-default': '/blog' } },
}

export default function Blog() {
  return <BlogIndex locale="th" />
}
