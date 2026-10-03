import type { Metadata } from 'next'
import { jsonLdScript } from '@easy-cms/plugin-seo'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE_URL } from '@/easy-cms.config'
import { renderDoc } from '@/lib/docs/content'
import { DOC_LABELS } from '@/lib/docs/i18n'
import { describe, docSource } from '@/lib/docs/markdown'
import { docsFor, findDoc, hrefFor, type Locale, sidebarFor } from '@/lib/docs/sidebar'
import { DOCS_SOURCE, editURL } from '@/lib/docs/source'
import { VERSION } from '@/lib/site'
import { DocEnhancer } from './doc-enhancer'
import { DocsNav } from './docs-nav'
import { Toc } from './toc'

/** Every docs page of a locale, as `[[...slug]]` params. */
export function docParams(locale: Locale) {
  const depth = locale === 'th' ? 3 : 2
  return docsFor(locale).map((d) => ({ slug: d.href.split('/').slice(depth) }))
}

async function load(slug: string[] | undefined, locale: Locale) {
  const found = findDoc(slug, locale)
  if (!found) return null
  const rendered = await renderDoc(found.doc.file, locale)
  return rendered && { ...found, rendered }
}

/** /docs/next → /og/docs/next, /th/docs/next → /og/docs/th/next (app/og/docs). */
const ogImage = (href: string, locale: Locale) =>
  locale === 'th' ? href.replace(/^\/th\/docs/, '/og/docs/th') : `/og${href}`

export async function docMetadata(slug: string[] | undefined, locale: Locale): Promise<Metadata> {
  const page = await load(slug, locale)
  if (!page) return {}
  const source = await docSource(page.doc.file, locale)
  const description = (source && describe(source)) ?? undefined
  const en = hrefFor(page.doc.file, 'en')
  const image = { url: ogImage(page.doc.href, locale), width: 1200, height: 630, alt: page.rendered.title }
  return {
    title: page.rendered.title,
    description,
    openGraph: {
      type: 'article',
      siteName: 'Easy CMS',
      title: page.rendered.title,
      description,
      url: page.doc.href,
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      alternateLocale: locale === 'th' ? 'en_US' : 'th_TH',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: page.rendered.title, description, images: [image.url] },
    alternates: {
      canonical: page.doc.href,
      languages: { en, th: hrefFor(page.doc.file, 'th'), 'x-default': en },
      types: { 'text/markdown': `${page.doc.href}.md` },
    },
  }
}

export async function DocPage({ slug, locale }: { slug: string[] | undefined; locale: Locale }) {
  const page = await load(slug, locale)
  if (!page) notFound()
  const { doc, prev, next, rendered } = page
  const t = DOC_LABELS[locale]
  const groups = sidebarFor(locale)
  const languages = (
    <nav className="lang-switch" aria-label={t.language}>
      <Link href={hrefFor(doc.file, 'en')} aria-current={locale === 'en' ? 'true' : undefined} hrefLang="en">
        English
      </Link>
      <Link href={hrefFor(doc.file, 'th')} aria-current={locale === 'th' ? 'true' : undefined} hrefLang="th">
        ไทย
      </Link>
    </nav>
  )

  // TechArticle and its place in the docs, for search results.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: rendered.title,
        inLanguage: locale,
        url: `${SITE_URL}${doc.href}`,
        isPartOf: { '@type': 'WebSite', name: 'Easy CMS', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'Easy CMS', url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { name: t.docs, url: hrefFor('guide/what-is-easy-cms', locale) },
          { name: doc.group, url: groups.find((g) => g.title === doc.group)?.items[0]?.href ?? doc.href },
          { name: doc.title, url: doc.href },
        ].map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: `${SITE_URL}${item.url}` })),
      },
    ],
  }

  return (
    <div className="wrap docs-layout" lang={locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <aside className="docs-side" aria-label={t.navigation}>
        {languages}
        <DocsNav groups={groups} />
      </aside>

      <article className="doc">
        <details className="mobile-docnav">
          <summary>{doc.group} › {doc.title}</summary>
          <div className="docs-side-inner">
            {languages}
            <DocsNav groups={groups} />
          </div>
        </details>
        <div className="crumbs">
          <span>{t.docs}</span><span>/</span><span>{doc.group}</span><span>/</span><span>{doc.title}</span>
        </div>
        <div className="prose" dangerouslySetInnerHTML={{ __html: rendered.html }} />
        <DocEnhancer html={rendered.html} />

        <nav className="doc-pager" aria-label={`${t.previous} / ${t.next}`}>
          {prev && <Link href={prev.href}><small>{t.previous}</small><b>{prev.title}</b></Link>}
          {next && <Link className="next" href={next.href}><small>{t.next}</small><b>{next.title}</b></Link>}
        </nav>
        <div className="doc-foot">
          <a href={editURL(doc.file, locale)}>{t.edit}</a>
          <span>Easy CMS v{DOCS_SOURCE.version ?? VERSION}</span>
        </div>
      </article>

      <Toc items={rendered.toc} label={t.onThisPage} />
    </div>
  )
}
