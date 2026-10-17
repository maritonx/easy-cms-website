import type { Metadata } from 'next'
import { type Locale, whyHref } from '@/lib/why/copy'

/**
 * Metadata of a Why page: its title in full (the SEO titles are already "Easy CMS for …"), both
 * languages as alternates, and its own share image from /og/why.
 */
export function whyMetadata({ locale, rest, title, description }: { locale: Locale; rest: string; title: string; description: string }): Metadata {
  const en = whyHref(rest, 'en')
  const th = whyHref(rest, 'th')
  const url = locale === 'th' ? th : en
  const image = { url: `/og${url}`, width: 1200, height: 630, alt: title }
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: { en, th, 'x-default': en } },
    openGraph: {
      type: 'website',
      siteName: 'Easy CMS',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      title,
      description,
      url,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}
