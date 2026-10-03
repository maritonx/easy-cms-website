import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
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

export async function docMetadata(slug: string[] | undefined, locale: Locale): Promise<Metadata> {
  const page = await load(slug, locale)
  if (!page) return {}
  const source = await docSource(page.doc.file, locale)
  const en = hrefFor(page.doc.file, 'en')
  return {
    title: page.rendered.title,
    description: (source && describe(source)) ?? undefined,
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

  return (
    <div className="wrap docs-layout" lang={locale}>
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
