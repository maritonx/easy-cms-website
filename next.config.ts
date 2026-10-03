import { withEasyCMS } from '@easy-cms/next/config'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The admin route finds the admin app through @easy-cms/next's package.json at runtime; when
  // Next bundles the adapter that file isn't deployed and /admin fails on Vercel.
  serverExternalPackages: ['@easy-cms/next'],
}

export default withEasyCMS(nextConfig)
