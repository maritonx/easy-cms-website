import type { Metadata } from 'next'
import { PREVIEW_PARAM, PostPage, postMetadata } from '@/components/blog/post-page'

export const dynamic = 'force-dynamic'

/** The admin's preview token, when the admin's live preview opened this page. */
async function tokenOf(searchParams: PageProps<'/blog/[slug]'>['searchParams']) {
  const token = (await searchParams)[PREVIEW_PARAM]
  return typeof token === 'string' ? token : undefined
}

export async function generateMetadata({ params, searchParams }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  return postMetadata((await params).slug, 'en', await tokenOf(searchParams))
}

export default async function Post({ params, searchParams }: PageProps<'/blog/[slug]'>) {
  return <PostPage slug={(await params).slug} locale="en" token={await tokenOf(searchParams)} />
}
