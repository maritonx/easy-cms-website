import type { Metadata } from 'next'
import { getShowcase, mediaURL } from '@/lib/cms'
import { DISCUSSIONS_URL, SITE_REPO_URL } from '@/lib/site'

/** A new post in the Show and tell category of the Easy CMS discussions. */
const SUBMIT_URL = `${DISCUSSIONS_URL}/new?category=show-and-tell`

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Showcase',
  description: 'Sites and starters built with Easy CMS.',
  alternates: { canonical: '/showcase' },
}

export default async function ShowcasePage() {
  const sites = await getShowcase()
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Showcase</span>
          <h1>Built with Easy CMS</h1>
          <p>Sites, starters and examples that run Easy CMS inside their own app.</p>
          <div className="cta-row">
            <a className="btn primary" href={SUBMIT_URL} data-umami-event="submit-showcase">
              Submit your project
            </a>
            <a className="btn" href={SITE_REPO_URL}>
              This site runs on Easy CMS: view its source
            </a>
          </div>
        </div>
      </div>
      <div className="wrap site-grid">
        {sites.map((site) => {
          const image = mediaURL(site.image)
          return (
            <a className="site-card" key={site.id} href={site.url}>
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploads are served by Easy CMS */}
                {image ? <img src={image} alt="" /> : <span>{new URL(site.url).hostname}</span>}
              </div>
              <h2>{site.name}</h2>
              {site.description && <p>{site.description}</p>}
              {site.stack && site.stack.length > 0 && (
                <div className="chips">{site.stack.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
              )}
            </a>
          )
        })}
        <a className="site-card submit" href={SUBMIT_URL}>
          <h2>Built something?</h2>
          <p>Post it in Show and tell on GitHub Discussions and we will add it here.</p>
        </a>
      </div>
    </>
  )
}
