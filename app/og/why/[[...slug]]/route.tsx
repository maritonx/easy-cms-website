import { WHY_RESTS } from '@/lib/why/copy'
import { whyImage } from '@/lib/why/og'

// The share image of each English Why page: /og/why, /og/why/compare/payload. Rendered at build time.
export const dynamicParams = false

export function generateStaticParams() {
  return WHY_RESTS.map((rest) => ({ slug: rest ? rest.split('/') : [] }))
}

export async function GET(_req: Request, { params }: RouteContext<'/og/why/[[...slug]]'>) {
  return whyImage(((await params).slug ?? []).join('/'), 'en')
}
