import type { Metadata } from 'next'
import { RoadmapPage } from '@/components/roadmap/roadmap-page'
import { ROADMAP_COPY } from '@/lib/roadmap-copy'

// The roadmap in Thai; reads the levels from the CMS on every request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: ROADMAP_COPY.th.meta.title,
  description: ROADMAP_COPY.th.meta.description,
  alternates: { canonical: '/th/roadmap', languages: { en: '/roadmap', th: '/th/roadmap', 'x-default': '/roadmap' } },
}

export default function ThaiRoadmap() {
  return <RoadmapPage locale="th" />
}
