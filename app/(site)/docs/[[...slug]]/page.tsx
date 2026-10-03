import type { Metadata } from 'next'
import { DocPage, docMetadata, docParams } from '@/components/docs/doc-page'

// Docs are markdown fetched at build time: built once, no database.
export const dynamicParams = false

export function generateStaticParams() {
  return docParams('en')
}

export async function generateMetadata({ params }: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  return docMetadata((await params).slug, 'en')
}

export default async function Page({ params }: PageProps<'/docs/[[...slug]]'>) {
  return <DocPage slug={(await params).slug} locale="en" />
}
