import type { Metadata } from 'next'
import NotFound from '@/app/(site)/not-found'
import { SiteShell, siteMetadata } from '@/components/site-shell'

// Addresses no route matches. With two root layouts ((site) and th) there is no single layout
// for Next to build a 404 from, so this page brings its own (next.config.ts: globalNotFound).
export const metadata: Metadata = { ...siteMetadata, title: 'Page not found', robots: { index: false } }

export default function GlobalNotFound() {
  return (
    <SiteShell lang="en">
      <NotFound />
    </SiteShell>
  )
}
