import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PersonaPage } from '@/components/why/persona-page'
import { whyMetadata } from '@/components/why/why-metadata'
import { PERSONAS, persona } from '@/lib/why/copy'

export const dynamicParams = false

export function generateStaticParams() {
  return PERSONAS.map((p) => ({ persona: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/why/[persona]'>): Promise<Metadata> {
  const p = persona((await params).persona)
  return p ? whyMetadata({ locale: 'en', rest: p.slug, ...p.en.meta }) : {}
}

export default async function Page({ params }: PageProps<'/why/[persona]'>) {
  const p = persona((await params).persona)
  if (!p) notFound()
  return <PersonaPage persona={p} locale="en" />
}
