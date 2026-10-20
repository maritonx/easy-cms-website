import { SITE_URL } from '@/easy-cms.config'
import { getPosts, postHref } from '@/lib/cms'
import { docsIndex, markdownURL } from '@/lib/docs/markdown'
import { SIDEBAR } from '@/lib/docs/sidebar'
import { COMPETITORS } from '@/lib/why/compare'
import { COMPARE_OVERVIEW, PERSONAS, WHY_OVERVIEW, WHY_UI, whyHref } from '@/lib/why/copy'

export const dynamic = 'force-dynamic'

const whyMd = (rest: string, locale: 'en' | 'th' = 'en') => `${SITE_URL}${whyHref(rest, locale)}.md`

/**
 * https://llmstxt.org: what Easy CMS is, who it is for and how it compares, then every docs page
 * and recent posts, each linked as Markdown.
 */
export async function GET() {
  const [docs, posts] = await Promise.all([docsIndex(), getPosts(20)])
  const byHref = new Map(docs.map((d) => [d.href, d]))
  const lines = [
    '# Easy CMS',
    '',
    '> The embedded, code-first headless CMS for Nuxt and Next.js. It runs inside your app: the content model is TypeScript in your repo, the admin is at /admin, and pages read content with a typed Local API or REST, on your own database (SQLite or Postgres).',
    '',
    `All docs in one file: ${SITE_URL}/llms-full.txt`,
    '',
    '## Why Easy CMS',
    '',
    `- [${WHY_OVERVIEW.en.meta.title}](${whyMd('')}): ${WHY_OVERVIEW.en.meta.description}`,
    ...PERSONAS.map((p) => `- [${p.en.meta.title}](${whyMd(p.slug)}): ${p.en.meta.description}`),
    `- [${COMPARE_OVERVIEW.en.meta.title}](${whyMd('compare')}): ${COMPARE_OVERVIEW.en.meta.description}`,
    ...COMPETITORS.map((c) => `- [${WHY_UI.en.vs(c.name)}](${whyMd(`compare/${c.slug}`)}): ${c.summary.en}`),
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
      lines.push(`- [${post.title}](${SITE_URL}${postHref(post)}.md)${post.excerpt ? `: ${post.excerpt}` : ''}`)
    }
  }
  // The admin, the docs and these pages are in Thai too.
  lines.push(
    '',
    '## ภาษาไทย (Thai)',
    '',
    `- [${WHY_OVERVIEW.th.meta.title}](${whyMd('', 'th')}): ${WHY_OVERVIEW.th.meta.description}`,
    `- [${COMPARE_OVERVIEW.th.meta.title}](${whyMd('compare', 'th')})`,
    `- [เอกสารภาษาไทย](${markdownURL('/th/docs')}): every docs page in Thai, at /th/docs/<page>.md`,
    `- [บล็อกภาษาไทย](${SITE_URL}/th/blog)`,
  )
  return new Response(`${lines.join('\n')}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
