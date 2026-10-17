import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ComparePage } from '@/components/why/compare-pages'
import { whyMetadata } from '@/components/why/why-metadata'
import { COMPETITORS, competitor } from '@/lib/why/compare'
import { WHY_UI } from '@/lib/why/copy'

export const dynamicParams = false

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps<'/why/compare/[slug]'>): Promise<Metadata> {
  const c = competitor((await params).slug)
  if (!c) return {}
  return whyMetadata({ locale: 'en', rest: `compare/${c.slug}`, title: WHY_UI.en.vs(c.name), description: c.summary.en })
}

export default async function Page({ params }: PageProps<'/why/compare/[slug]'>) {
  const c = competitor((await params).slug)
  if (!c) notFound()
  return <ComparePage competitor={c} locale="en" />
}
