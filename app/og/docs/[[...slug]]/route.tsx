import { ImageResponse } from 'next/og'
import { describe, docSource } from '@/lib/docs/markdown'
import { docsFor, findDoc, type Locale } from '@/lib/docs/sidebar'
import { ogFonts } from '@/lib/og'

// The share image of each docs page: /og/docs/next, /og/docs/th/next. Rendered at build time.
export const dynamicParams = false

export function generateStaticParams() {
  return [
    ...docsFor('en').map((d) => ({ slug: d.href.split('/').slice(2) })),
    ...docsFor('th').map((d) => ({ slug: ['th', ...d.href.split('/').slice(3)] })),
  ]
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

/** The font has no ⌘; spelled out, the image needs no font from the network. */
const plain = (text: string) => text.replace(/⌘\s?/g, 'Cmd+')

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[[...slug]]'>) {
  const slug = (await params).slug ?? []
  const locale: Locale = slug[0] === 'th' ? 'th' : 'en'
  const found = findDoc(locale === 'th' ? slug.slice(1) : slug, locale)
  if (!found) return new Response('Not found', { status: 404 })
  const { doc } = found
  const source = await docSource(doc.file, locale)
  const description = source ? plain(describe(source) ?? '') || null : null

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'radial-gradient(70% 90% at 85% 0%, #1d3a31 0%, #0b1210 70%)',
          color: '#e4eee9',
          fontFamily: 'Plex',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 30, fontWeight: 700 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#4f9e86',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 7,
              padding: '0 15px',
            }}
          >
            <div style={{ width: 26, height: 10, borderRadius: 5, background: '#fff' }} />
            <div style={{ width: 19, height: 10, borderRadius: 5, background: '#fff' }} />
            <div style={{ width: 26, height: 10, borderRadius: 5, background: '#fff' }} />
          </div>
          <span>Easy CMS</span>
          <span style={{ color: '#5f746c', fontWeight: 500 }}>{locale === 'th' ? 'เอกสาร' : 'Docs'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Letter spacing and capitals are for Latin only; spacing pulls Thai vowel marks apart. */}
          <div
            style={{
              fontSize: 26,
              color: '#6fbfa5',
              fontWeight: 500,
              ...(locale === 'en' ? { letterSpacing: 2, textTransform: 'uppercase' as const } : {}),
            }}
          >
            {doc.group}
          </div>
          <div style={{ fontSize: doc.title.length > 30 ? 64 : 80, fontWeight: 700, lineHeight: 1.1 }}>{plain(doc.title)}</div>
          {description && (
            <div style={{ fontSize: 28, color: '#8fa49c', lineHeight: 1.45, maxWidth: 1000 }}>{clip(description, 150)}</div>
          )}
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#5f746c' }}>easy-cms.io{doc.href}</div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts() },
  )
}
