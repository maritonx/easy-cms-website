import { SiteShell, siteMetadata } from '@/components/site-shell'

export const metadata = siteMetadata

// The English site: home, docs, blog, changelog, showcase.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell lang="en">{children}</SiteShell>
}
