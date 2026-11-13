import type { Metadata } from 'next'
import { RoadmapPage } from '@/components/roadmap/roadmap-page'
import { ROADMAP_COPY } from '@/lib/roadmap-copy'

// Reads the levels from the CMS on every request, so a save in the admin shows at once.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: ROADMAP_COPY.en.meta.title,
  description: ROADMAP_COPY.en.meta.description,
  alternates: { canonical: '/roadmap', languages: { en: '/roadmap', th: '/th/roadmap', 'x-default': '/roadmap' } },
}

export default function Roadmap() {
  return <RoadmapPage locale="en" />
}
