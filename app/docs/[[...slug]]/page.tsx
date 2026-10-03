import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DocEnhancer } from '@/components/docs/doc-enhancer'
import { DocsNav } from '@/components/docs/docs-nav'
import { Toc } from '@/components/docs/toc'
import { renderDoc } from '@/lib/docs/content'
import { ALL_DOCS, findDoc, SIDEBAR } from '@/lib/docs/sidebar'
import { DOCS_SOURCE, editURL } from '@/lib/docs/source'
import { VERSION } from '@/lib/site'

// Docs are markdown in git: built once, no database.
export const dynamicParams = false

export function generateStaticParams() {
  return ALL_DOCS.map((d) => ({ slug: d.href.split('/').slice(2) }))
}

async function load(params: PageProps<'/docs/[[...slug]]'>['params']) {
  const found = findDoc((await params).slug)
  if (!found) return null
  const rendered = await renderDoc(found.doc.file)
  return rendered && { ...found, rendered }
}

export async function generateMetadata({ params }: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const page = await load(params)
  return page ? { title: page.rendered.title } : {}
}

export default async function DocPage({ params }: PageProps<'/docs/[[...slug]]'>) {
  const page = await load(params)
  if (!page) notFound()
  const { doc, prev, next, rendered } = page

  return (
    <div className="wrap docs-layout">
      <aside className="docs-side" aria-label="Docs navigation">
        <DocsNav groups={SIDEBAR} />
      </aside>

      <article className="doc">
        <details className="mobile-docnav">
          <summary>{doc.group} › {doc.title}</summary>
          <div className="docs-side-inner"><DocsNav groups={SIDEBAR} /></div>
        </details>
        <div className="crumbs">
          <span>Docs</span><span>/</span><span>{doc.group}</span><span>/</span><span>{doc.title}</span>
        </div>
        <div className="prose" dangerouslySetInnerHTML={{ __html: rendered.html }} />
        <DocEnhancer html={rendered.html} />

        <nav className="doc-pager" aria-label="Previous and next page">
          {prev && <Link href={prev.href}><small>← Previous</small><b>{prev.title}</b></Link>}
          {next && <Link className="next" href={next.href}><small>Next →</small><b>{next.title}</b></Link>}
        </nav>
        <div className="doc-foot">
          <a href={editURL(doc.file)}>Edit this page on GitHub</a>
          <span>Easy CMS v{DOCS_SOURCE.version ?? VERSION}</span>
        </div>
      </article>

      <Toc items={rendered.toc} />
    </div>
  )
}
