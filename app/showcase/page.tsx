import type { Metadata } from 'next'
import { getShowcase, mediaURL } from '@/lib/cms'
import { GITHUB_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Showcase',
  description: 'Sites and starters built with Easy CMS.',
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
        <a className="site-card submit" href={`${GITHUB_URL}/discussions`}>
          <h2>Built something?</h2>
          <p>Share it in GitHub Discussions and we will add it here.</p>
        </a>
      </div>
    </>
  )
}
