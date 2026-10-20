import { docMarkdown } from '@easy-cms/plugin-seo'
import { SITE_URL } from '@/easy-cms.config'
import { cms, getPost, postHref, postLanguage } from '@/lib/cms'

// Markdown versions of published posts at /blog/<slug>.md and /th/blog/<slug>.md (rewritten
// here in next.config.ts), for AI assistants and llms.txt.
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: RouteContext<'/blog-md/[...slug]'>) {
  const slug = (await params).slug
  const locale = slug[0] === 'th' && slug.length === 2 ? 'th' : 'en'
  const name = locale === 'th' ? slug[1] : slug.length === 1 ? slug[0] : null
  // getPost reads as a visitor: published posts only.
  const post = name ? await getPost(decodeURIComponent(name)) : null
  if (!post || postLanguage(post) !== locale) return new Response('Not found', { status: 404 })
  const text = docMarkdown(await cms(), { collection: 'posts', doc: post, url: `${SITE_URL}${postHref(post)}` })
  return new Response(text, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
