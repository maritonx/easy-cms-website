import { WHY_RESTS } from '@/lib/why/copy'
import { whyMarkdown } from '@/lib/why/markdown'

// Markdown versions of the Why pages at /why.md, /why/compare/payload.md and /th/why/….md
// (rewritten here in next.config.ts), for AI assistants and llms.txt. Rendered at build time.
export const dynamicParams = false

// /why-md/th/developers is the Thai page; the first segment picks the locale.
export function generateStaticParams() {
  return WHY_RESTS.flatMap((rest) => {
    const parts = rest ? rest.split('/') : []
    return [{ slug: parts }, { slug: ['th', ...parts] }]
  })
}

export async function GET(_req: Request, { params }: RouteContext<'/why-md/[[...slug]]'>) {
  const slug = (await params).slug ?? []
  const th = slug[0] === 'th'
  const text = whyMarkdown((th ? slug.slice(1) : slug).join('/'), th ? 'th' : 'en')
  if (!text) return new Response('Not found', { status: 404 })
  return new Response(text, { headers: { 'content-type': 'text/markdown; charset=utf-8' } })
}
