import type { Metadata } from 'next'
import { HomePage } from '@/components/home/home-page'

// Reads the latest posts and the announcement from the CMS on every request.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  alternates: { canonical: '/', languages: { en: '/', th: '/th', 'x-default': '/' } },
}

export default function Home() {
  return <HomePage locale="en" />
}
