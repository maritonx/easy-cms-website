import { robotsTxt } from '@easy-cms/plugin-seo'
import config from '@/easy-cms.config'

// Keeps crawlers out of /admin and the API (uploads stay reachable) and points to the sitemap.
// SITE_ENV=staging keeps them out of everything, e.g. on preview deployments.
export function GET() {
  const text = robotsTxt({ config, disallowAll: process.env.SITE_ENV === 'staging' })
  return new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
