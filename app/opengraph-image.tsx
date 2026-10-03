import { ImageResponse } from 'next/og'

// The share image for pages without their own (posts use their SEO image when set).
export const alt = 'Easy CMS: the embedded, code-first headless CMS for Next.js and Nuxt'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  const rule = (width: number) => (
    <div style={{ width, height: 14, borderRadius: 7, background: '#ffffff' }} />
  )
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'radial-gradient(70% 90% at 85% 0%, #1d3a31 0%, #0b1210 70%)',
          color: '#e4eee9',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              background: '#4f9e86',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 9,
              padding: '0 20px',
            }}
          >
            {rule(36)}
            {rule(27)}
            {rule(36)}
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Easy CMS</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Your Next.js app is
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: '#6fbfa5' }}>
            already a CMS.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#8fa49c' }}>
          <span>npm create easy-cms@latest</span>
          <span>easy-cms.io</span>
        </div>
      </div>
    ),
    size,
  )
}
