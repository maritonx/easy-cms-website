import { docSource } from '@/lib/docs/markdown'
import { ALL_DOCS, findDoc } from '@/lib/docs/sidebar'

// Markdown versions of the docs pages at /docs/….md (rewritten here in next.config.ts), for AI
// assistants and llms.txt.
export const dynamicParams = false

export function generateStaticParams() {
  return ALL_DOCS.map((d) => ({ slug: d.href.split('/').slice(2) }))
}

export async function GET(_req: Request, { params }: RouteContext<'/docs-md/[[...slug]]'>) {
  const found = findDoc((await params).slug)
  const source = found && (await docSource(found.doc.file))
  if (!source) return new Response('Not found', { status: 404 })
  return new Response(source, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
