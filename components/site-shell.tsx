import type { Metadata } from 'next'
import { jsonLdScript, siteJsonLd } from '@easy-cms/plugin-seo'
import { Bricolage_Grotesque, Geist, Geist_Mono, IBM_Plex_Sans_Thai } from 'next/font/google'
import { SITE_URL } from '@/easy-cms.config'
import { GITHUB_URL } from '@/lib/site'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'
import { themeScript } from './theme-toggle'
import '@/app/globals.css'

const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'] })
const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
// Thai glyphs, after the Latin faces in each stack (Geist and Bricolage have none).
const thai = IBM_Plex_Sans_Thai({ variable: '--font-thai', subsets: ['thai'], weight: ['400', '500', '600', '700'] })

/** Metadata every page starts from; app/(site) and app/th each add their language. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Easy CMS: the embedded headless CMS for Next.js and Nuxt',
    template: '%s · Easy CMS',
  },
  description:
    'Easy CMS runs inside your Next.js or Nuxt app. Define content in TypeScript and get an admin, a typed API and REST on one deployment and your own database.',
  icons: { icon: '/logo.svg' },
  openGraph: {
    siteName: 'Easy CMS',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/og/site', width: 1200, height: 630, alt: 'Easy CMS: your Next.js app is already a CMS' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og/site'] },
}

/**
 * The document around every page. English and Thai pages have their own root layouts, so each
 * gets the right <html lang> for search engines and screen readers.
 */
export function SiteShell({ lang, children }: { lang: 'en' | 'th'; children: React.ReactNode }) {
  return (
    <html
      lang={lang}
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} ${thai.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript(
              siteJsonLd({ name: 'Easy CMS', url: SITE_URL, logo: `${SITE_URL}/logo.svg`, sameAs: [GITHUB_URL] }),
            ),
          }}
        />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
