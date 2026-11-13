import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PluginPage } from '@/components/plugins/plugins-page'
import { plugin } from '@/lib/plugins'

// Shows the plugin's downloads from npm, kept for six hours (lib/npm-downloads.ts).
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = plugin((await params).slug)
  if (!p) return {}
  return {
    title: `${p.name.en} · Plugins`,
    description: p.summary.en,
    alternates: {
      canonical: `/plugins/${p.slug}`,
      languages: { en: `/plugins/${p.slug}`, th: `/th/plugins/${p.slug}`, 'x-default': `/plugins/${p.slug}` },
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const p = plugin((await params).slug)
  if (!p) notFound()
  return <PluginPage plugin={p} locale="en" />
}
