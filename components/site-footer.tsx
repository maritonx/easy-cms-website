import Link from 'next/link'
import { GITHUB_URL, NPM_URL } from '@/lib/site'
import { Logo } from './icons'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      ['/#features', 'Features'],
      ['/#plugins', 'Plugins'],
      ['/#admin', 'Admin'],
      ['/changelog', 'Changelog'],
    ],
  },
  {
    title: 'Docs',
    links: [
      ['/docs/getting-started', 'Getting started'],
      ['/docs/next', 'Next.js'],
      ['/docs/nuxt', 'Nuxt'],
      ['/docs/reference/config', 'Reference'],
    ],
  },
  {
    title: 'Resources',
    links: [
      ['/blog', 'Blog'],
      ['/docs/recipes', 'Recipes'],
      ['/showcase', 'Showcase'],
    ],
  },
  {
    title: 'Community',
    links: [
      [GITHUB_URL, 'GitHub'],
      [`${GITHUB_URL}/discussions`, 'Discussions'],
      [`${GITHUB_URL}/issues`, 'Issues'],
      [NPM_URL, 'npm'],
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" href="/">
              <Logo />
              Easy CMS
            </Link>
            <p>The embedded, code-first headless CMS for Nuxt and Next.js.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map(([href, label]) => (
                  <li key={href}>
                    {href.startsWith('http') ? <a href={href}>{label}</a> : <Link href={href}>{label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span>© 2026 Kanawoot K. · MIT License</span>
          <span>Built with Next.js and Easy CMS</span>
        </div>
      </div>
    </footer>
  )
}
