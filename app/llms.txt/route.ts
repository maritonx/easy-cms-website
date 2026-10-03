import { SITE_URL } from '@/easy-cms.config'
import { getPosts } from '@/lib/cms'
import { docsIndex, markdownURL } from '@/lib/docs/markdown'
import { SIDEBAR } from '@/lib/docs/sidebar'

export const dynamic = 'force-dynamic'

/** https://llmstxt.org: what Easy CMS is and where every docs page is, as markdown. */
export async function GET() {
  const [docs, posts] = await Promise.all([docsIndex(), getPosts(20)])
  const byHref = new Map(docs.map((d) => [d.href, d]))
  const lines = [
    '# Easy CMS',
    '',
    '> The embedded, code-first headless CMS for Nuxt and Next.js. It runs inside your app: the content model is TypeScript in your repo, the admin is at /admin, and pages read content with a typed Local API or REST, on your own database (SQLite or Postgres).',
    '',
    `All docs in one file: ${SITE_URL}/llms-full.txt`,
  ]
  for (const group of SIDEBAR) {
    lines.push('', `## ${group.title}`, '')
    for (const item of group.items) {
      const description = byHref.get(item.href)?.description
      lines.push(`- [${item.title}](${markdownURL(item.href)})${description ? `: ${description}` : ''}`)
    }
  }
  if (posts.length > 0) {
    lines.push('', '## Blog', '')
    for (const post of posts) {
      lines.push(`- [${post.title}](${SITE_URL}/blog/${post.slug})${post.excerpt ? `: ${post.excerpt}` : ''}`)
    }
  }
  return new Response(`${lines.join('\n')}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
