import type { Metadata } from 'next'
import { PostPage, postMetadata } from '@/components/blog/post-page'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  return postMetadata((await params).slug, 'en')
}

export default async function Post({ params }: PageProps<'/blog/[slug]'>) {
  return <PostPage slug={(await params).slug} locale="en" />
}
