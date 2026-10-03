import type { Metadata } from 'next'
import { SiteShell, siteMetadata } from '@/components/site-shell'

export const metadata: Metadata = {
  ...siteMetadata,
  openGraph: { ...siteMetadata.openGraph, locale: 'th_TH' },
}

// The Thai pages (/th/docs), with <html lang="th">.
export default function ThaiLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="th">{children}</SiteShell>
}
