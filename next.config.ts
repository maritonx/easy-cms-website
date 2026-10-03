import { withEasyCMS } from '@easy-cms/next/config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The admin app the /admin route serves (appDir in app/admin/[[...path]]/route.ts).
  outputFileTracingIncludes: {
    '/admin/**': ['./node_modules/@easy-cms/admin/dist/app/**'],
  },
}

export default withEasyCMS(nextConfig)
