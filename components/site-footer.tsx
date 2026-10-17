import Link from 'next/link'
import { GITHUB_URL, NPM_URL } from '@/lib/site'
import { Logo } from './icons'

const COLUMNS_EN = [
  {
    title: 'Product',
    links: [
      ['/why', 'Why Easy CMS'],
      ['/why/compare', 'Compare'],
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
      ['/th/docs', 'เอกสารภาษาไทย'],
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

const COLUMNS_TH = [
  {
    title: 'ผลิตภัณฑ์',
    links: [
      ['/th/why', 'ทำไมต้อง Easy CMS'],
      ['/th/why/compare', 'เปรียบเทียบ'],
      ['/th#features', 'ฟีเจอร์'],
      ['/th#plugins', 'Plugin'],
      ['/th#admin', 'หน้า admin'],
      ['/changelog', 'Changelog'],
    ],
  },
  {
    title: 'เอกสาร',
    links: [
      ['/th/docs/getting-started', 'เริ่มใช้งาน'],
      ['/th/docs/next', 'Next.js'],
      ['/th/docs/nuxt', 'Nuxt'],
      ['/th/docs/reference/config', 'ข้อมูลอ้างอิง'],
      ['/docs', 'Docs in English'],
    ],
  },
  {
    title: 'แหล่งข้อมูล',
    links: [
      ['/th/blog', 'บล็อก'],
      ['/blog', 'Blog (English)'],
      ['/th/docs/recipes', 'สูตรสำเร็จ'],
      ['/showcase', 'ผลงาน'],
    ],
  },
  {
    title: 'ชุมชน',
    links: [
      [GITHUB_URL, 'GitHub'],
      [`${GITHUB_URL}/discussions`, 'Discussions'],
      [`${GITHUB_URL}/issues`, 'Issues'],
      [NPM_URL, 'npm'],
    ],
  },
]

export function SiteFooter({ lang = 'en' }: { lang?: 'en' | 'th' }) {
  const COLUMNS = lang === 'th' ? COLUMNS_TH : COLUMNS_EN
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" href={lang === 'th' ? '/th' : '/'}>
              <Logo />
              Easy CMS
            </Link>
            <p>
              {lang === 'th'
                ? 'headless CMS แบบ code-first ที่ฝังอยู่ในแอป Nuxt และ Next.js'
                : 'The embedded, code-first headless CMS for Nuxt and Next.js.'}
            </p>
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
          <span>{lang === 'th' ? 'สร้างด้วย Next.js และ Easy CMS' : 'Built with Next.js and Easy CMS'}</span>
        </div>
      </div>
    </footer>
  )
}
