import { SITE_URL } from '@/easy-cms.config'

/**
 * A page's Markdown version (/docs/next.md, /blog/x.md, /why.md), with a `Link: <page>;
 * rel="canonical"` header naming the HTML page at `href` (e.g. /docs/next), so search engines
 * that find the Markdown copy count it as that page, not a second one.
 */
export function markdownResponse(text: string, href: string): Response {
  // URL() percent-encodes Thai in a path: header values are ASCII.
  const page = new URL(href, SITE_URL).href
  return new Response(text, {
    headers: { 'content-type': 'text/markdown; charset=utf-8', link: `<${page}>; rel="canonical"` },
  })
}
