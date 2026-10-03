import { docSource } from '@/lib/docs/markdown'
import { docsFor, findDoc, type Locale } from '@/lib/docs/sidebar'

// Markdown versions of the docs pages at /docs/….md (rewritten here in next.config.ts), for AI
// assistants and llms.txt.
export const dynamicParams = false

// /docs-md/th/next is the Thai page; the first segment picks the locale.
export function generateStaticParams() {
  return [
    ...docsFor('en').map((d) => ({ slug: d.href.split('/').slice(2) })),
    ...docsFor('th').map((d) => ({ slug: ['th', ...d.href.split('/').slice(3)] })),
  ]
}

export async function GET(_req: Request, { params }: RouteContext<'/docs-md/[[...slug]]'>) {
  const slug = (await params).slug ?? []
  const locale: Locale = slug[0] === 'th' ? 'th' : 'en'
  const found = findDoc(locale === 'th' ? slug.slice(1) : slug, locale)
  const source = found && (await docSource(found.doc.file, locale))
  if (!source) return new Response('Not found', { status: 404 })
  return new Response(source, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
