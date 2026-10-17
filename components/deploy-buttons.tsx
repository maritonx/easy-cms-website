import Link from 'next/link'
import { DEPLOY_NETLIFY_URL, DEPLOY_VERCEL_URL } from '@/lib/site'

const COPY = {
  en: { vercel: 'Deploy to Vercel', netlify: 'Deploy to Netlify', lead: 'Or deploy a starter in one click:', what: 'What you get', docs: '/docs/one-click-deploy' },
  th: { vercel: 'Deploy ไป Vercel', netlify: 'Deploy ไป Netlify', lead: 'หรือ deploy starter ในคลิกเดียว:', what: 'deploy แล้วได้อะไร', docs: '/th/docs/one-click-deploy' },
} as const

function VercelLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 22.5 21h-21z" fill="currentColor" />
    </svg>
  )
}

function NetlifyLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="currentColor" />
    </svg>
  )
}

/**
 * One-click deploys of templates/next-starter to the visitor's own Vercel or Netlify, and what
 * they get. `compact` is the small line under the home page's main buttons. `from` names the
 * place for the analytics event.
 */
export function DeployButtons({ locale, from, compact }: { locale: 'en' | 'th'; from: string; compact?: boolean }) {
  const t = COPY[locale]
  const event = (provider: string) => ({
    'data-umami-event': 'deploy',
    'data-umami-event-provider': provider,
    'data-umami-event-from': from,
  })
  return (
    <div className={compact ? 'deploy-row compact' : 'deploy-row'}>
      {compact && <span className="deploy-lead">{t.lead}</span>}
      <a className="btn deploy-btn" href={DEPLOY_VERCEL_URL} {...event('vercel')}>
        <VercelLogo /> {t.vercel}
      </a>
      <a className="btn deploy-btn" href={DEPLOY_NETLIFY_URL} {...event('netlify')}>
        <NetlifyLogo /> {t.netlify}
      </a>
      <Link className="deploy-what" href={t.docs}>
        {t.what}
      </Link>
    </div>
  )
}
