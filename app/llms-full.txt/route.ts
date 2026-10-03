import { docsIndex, markdownURL } from '@/lib/docs/markdown'

// Every docs page's markdown in one file, for tools that read a whole site at once.
export const dynamic = 'force-static'

export async function GET() {
  const docs = await docsIndex()
  const body = docs
    .filter((d) => d.source)
    .map((d) => `<!-- ${markdownURL(d.href)} -->\n\n${d.source!.trim()}`)
    .join('\n\n---\n\n')
  return new Response(`${body}\n`, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
