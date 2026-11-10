import type { Metadata } from 'next'
import { Privacy } from '@/components/privacy'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What easycms.dev and its admin keep, why, and where.',
  alternates: { canonical: '/privacy', languages: { th: '/th/privacy' } },
}

export default function PrivacyPage() {
  return <Privacy locale="en" />
}
