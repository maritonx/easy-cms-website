import { withEasyCMS } from '@easy-cms/next/config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Markdown versions of the docs: /docs.md and /docs/next.md (app/docs-md).
  async rewrites() {
    return [
      { source: '/docs.md', destination: '/docs-md' },
      { source: '/docs/:path((?:.*/)?[^/]+)\\.md', destination: '/docs-md/:path' },
    ]
  },
}

export default withEasyCMS(nextConfig)
