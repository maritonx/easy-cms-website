import Link from 'next/link'
import { ArrowIcon } from '@/components/icons'

export default function NotFound() {
  return (
    <div className="page-head" style={{ borderBottom: 0 }}>
      <div className="wrap">
        <span className="eyebrow">404</span>
        <h1>This page isn&apos;t here.</h1>
        <p>It may have moved when the docs came over from the old site. Try the docs index or the home page.</p>
        <div className="cta-row">
          <Link className="btn primary" href="/docs">Docs <ArrowIcon /></Link>
          <Link className="btn" href="/">Home</Link>
        </div>
      </div>
    </div>
  )
}
