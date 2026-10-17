import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PersonaPage } from '@/components/why/persona-page'
import { whyMetadata } from '@/components/why/why-metadata'
import { PERSONAS, persona } from '@/lib/why/copy'

export const dynamicParams = false

export function generateStaticParams() {
  return PERSONAS.map((p) => ({ persona: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/th/why/[persona]'>): Promise<Metadata> {
  const p = persona((await params).persona)
  return p ? whyMetadata({ locale: 'th', rest: p.slug, ...p.th.meta }) : {}
}

export default async function Page({ params }: PageProps<'/th/why/[persona]'>) {
  const p = persona((await params).persona)
  if (!p) notFound()
  return <PersonaPage persona={p} locale="th" />
}
