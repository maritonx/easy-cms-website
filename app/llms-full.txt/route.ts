import { docsIndex, markdownURL } from '@/lib/docs/markdown'
import { WHY_RESTS, whyHref } from '@/lib/why/copy'
import { whyMarkdown } from '@/lib/why/markdown'

// Every docs page's markdown in one file, then the Why pages (who it's for, how it compares),
// for tools that read a whole site at once.
export const dynamic = 'force-static'

export async function GET() {
  const docs = await docsIndex()
  const pages = [
    ...docs.filter((d) => d.source).map((d) => ({ href: d.href, text: d.source! })),
    ...WHY_RESTS.map((rest) => ({ href: whyHref(rest, 'en'), text: whyMarkdown(rest, 'en') ?? '' })),
  ]
  const body = pages.map((p) => `<!-- ${markdownURL(p.href)} -->\n\n${p.text.trim()}`).join('\n\n---\n\n')
  return new Response(`${body}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
