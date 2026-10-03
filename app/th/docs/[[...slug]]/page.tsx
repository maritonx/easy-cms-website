import type { Metadata } from 'next'
import { DocPage, docMetadata, docParams } from '@/components/docs/doc-page'

// The Thai docs: the same pages from website/th in the Easy CMS repo.
export const dynamicParams = false

export function generateStaticParams() {
  return docParams('th')
}

export async function generateMetadata({ params }: PageProps<'/th/docs/[[...slug]]'>): Promise<Metadata> {
  return docMetadata((await params).slug, 'th')
}

export default async function Page({ params }: PageProps<'/th/docs/[[...slug]]'>) {
  return <DocPage slug={(await params).slug} locale="th" />
}
