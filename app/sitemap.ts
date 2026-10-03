import type { MetadataRoute } from 'next'
import { sitemap } from '@easy-cms/plugin-seo'
import { SITE_URL } from '@/easy-cms.config'
import { cms } from '@/lib/cms'
import { ALL_DOCS, hrefFor } from '@/lib/docs/sidebar'

export const dynamic = 'force-dynamic'

/** The fixed pages and the docs, plus the blog posts Easy CMS knows about (published, not hidden). */
export default async function Sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['/', '/blog', '/changelog', '/showcase'].map((p) => ({ url: `${SITE_URL}${p}` }))
  // Each docs page in English and Thai, each listing the other as an alternate.
  const docs = ALL_DOCS.flatMap((d) => {
    const languages = { en: `${SITE_URL}${hrefFor(d.file, 'en')}`, th: `${SITE_URL}${hrefFor(d.file, 'th')}` }
    return [
      { url: languages.en, alternates: { languages } },
      { url: languages.th, alternates: { languages } },
    ]
  })
  const all = [...pages, ...docs, ...((await sitemap(await cms())) as MetadataRoute.Sitemap)]
  return all.filter((entry, i) => all.findIndex((e) => e.url === entry.url) === i)
}
