import { withEasyCMS } from '@easy-cms/next/config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // app/global-not-found.tsx: the 404 for a site with two root layouts, (site) and th.
  experimental: { globalNotFound: true },
  // Markdown versions of the docs: /docs.md, /docs/next.md, /th/docs/next.md (app/docs-md).
  async rewrites() {
    return [
      { source: '/docs.md', destination: '/docs-md' },
      { source: '/th/docs.md', destination: '/docs-md/th' },
      { source: '/th/docs/:path((?:.*/)?[^/]+)\\.md', destination: '/docs-md/th/:path' },
      { source: '/docs/:path((?:.*/)?[^/]+)\\.md', destination: '/docs-md/:path' },
    ]
  },
}

export default withEasyCMS(nextConfig)
