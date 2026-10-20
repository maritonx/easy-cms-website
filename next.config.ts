import { withEasyCMS } from '@easy-cms/next/config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // app/global-not-found.tsx: the 404 for a site with two root layouts, (site) and th.
  experimental: { globalNotFound: true },
  // Markdown versions for AI assistants: the docs (/docs/next.md, /th/docs/next.md), the Why
  // pages (/why/compare/payload.md) and posts (/blog/hello.md).
  async rewrites() {
    return [
      { source: '/docs.md', destination: '/docs-md' },
      { source: '/th/docs.md', destination: '/docs-md/th' },
      { source: '/th/docs/:path((?:.*/)?[^/]+)\\.md', destination: '/docs-md/th/:path' },
      { source: '/docs/:path((?:.*/)?[^/]+)\\.md', destination: '/docs-md/:path' },
      // The Why pages (app/why-md) and published posts (app/blog-md).
      { source: '/why.md', destination: '/why-md' },
      { source: '/th/why.md', destination: '/why-md/th' },
      { source: '/th/why/:path((?:.*/)?[^/]+)\\.md', destination: '/why-md/th/:path' },
      { source: '/why/:path((?:.*/)?[^/]+)\\.md', destination: '/why-md/:path' },
      { source: '/th/blog/:slug([^/]+)\\.md', destination: '/blog-md/th/:slug' },
      { source: '/blog/:slug([^/]+)\\.md', destination: '/blog-md/:slug' },
    ]
  },
}

export default withEasyCMS(nextConfig)
