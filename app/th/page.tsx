import type { Metadata } from 'next'
import { HomePage } from '@/components/home/home-page'
import { HOME_COPY } from '@/lib/home-copy'

// The home page in Thai; reads the latest posts and the announcement on every request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: HOME_COPY.th.meta.title },
  description: HOME_COPY.th.meta.description,
  alternates: { canonical: '/th', languages: { en: '/', th: '/th', 'x-default': '/' } },
}

export default function ThaiHome() {
  return <HomePage locale="th" />
}
