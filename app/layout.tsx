import type { Metadata } from 'next'
import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { themeScript } from '@/components/theme-toggle'
import './globals.css'

const bricolage = Bricolage_Grotesque({ variable: '--font-bricolage', subsets: ['latin'] })
const geist = Geist({ variable: '--font-geist', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? 'https://easy-cms.io'),
  title: {
    default: 'Easy CMS: the embedded headless CMS for Next.js and Nuxt',
    template: '%s · Easy CMS',
  },
  description:
    'Easy CMS runs inside your Next.js or Nuxt app. Define content in TypeScript and get an admin, a typed API and REST on one deployment and your own database.',
  icons: { icon: '/logo.svg' },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
