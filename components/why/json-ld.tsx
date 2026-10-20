import { jsonLdScript } from '@easy-cms/plugin-seo'
import type { Locale } from '@/lib/why/copy'
import { whyJsonLd } from '@/lib/why/json-ld'

/** The page's structured data (lib/why/json-ld.ts) as script tags. */
export function WhyJsonLd({ rest, locale }: { rest: string; locale: Locale }) {
  return whyJsonLd(rest, locale).map((data, i) => (
    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
  ))
}
