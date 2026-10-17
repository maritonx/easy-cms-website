import 'server-only'
import { ImageResponse } from 'next/og'
import { SITE_URL } from '@/easy-cms.config'
import { ogFonts } from '@/lib/og'
import { competitor } from './compare'
import { COMPARE_OVERVIEW, type Locale, persona, WHY_OVERVIEW, WHY_UI, whyHref } from './copy'

/** The kicker and the title of a Why page, or null when there is no such page. */
export function whyCard(rest: string, locale: Locale) {
  const ui = WHY_UI[locale]
  if (rest === '') return { kicker: ui.menu, title: WHY_OVERVIEW[locale].title }
  if (rest === 'compare') return { kicker: ui.compareTitle, title: COMPARE_OVERVIEW[locale].title }
  const [first, second] = rest.split('/')
  if (first === 'compare' && second) {
    const c = competitor(second)
    return c ? { kicker: ui.compareTitle, title: ui.vs(c.name) } : null
  }
  const p = persona(first)
  return p && !second ? { kicker: p[locale].eyebrow, title: p[locale].title } : null
}

/** The share image of a Why page: its kicker and title on the site's dark backdrop. */
export async function whyImage(rest: string, locale: Locale) {
  const card = whyCard(rest, locale)
  if (!card) return new Response('Not found', { status: 404 })
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
            {card.kicker}
          </div>
          <div style={{ fontSize: card.title.length > 40 ? 64 : 80, fontWeight: 700, lineHeight: 1.1 }}>{card.title}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#5f746c' }}>
          {new URL(SITE_URL).host}
          {whyHref(rest, locale)}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await ogFonts() },
  )
}

