import Link from 'next/link'
import type { Locale } from '@/lib/home-copy'
import { highlight } from '@/lib/highlight'
import { dailyDownloads, weeklyDownloads } from '@/lib/npm-downloads'
import { ADAPTER_GROUPS, type Plugin, PLUGIN_GROUPS, PLUGINS, PLUGINS_COPY } from '@/lib/plugins'
import { docHref } from '@/lib/why/copy'
import { ArrowIcon, FeatureIcon } from '../icons'
import { PluginGrid } from './plugin-grid'

const base = (locale: Locale) => (locale === 'th' ? '/th/plugins' : '/plugins')
const npmUrl = (pkg: string) => `https://www.npmjs.com/package/${pkg}`

/** /plugins and /th/plugins: every plugin as a card by group, then the adapters. */
export async function PluginsPage({ locale }: { locale: Locale }) {
  const t = PLUGINS_COPY[locale]
  const downloads = await Promise.all(PLUGINS.map((p) => weeklyDownloads(p.pkg)))
  const cards = PLUGINS.map((p, i) => ({
    slug: p.slug,
    pkg: p.pkg,
    group: p.group,
    icon: p.icon,
    name: p.name[locale],
    summary: p.summary[locale],
    experimental: Boolean(p.experimental),
    downloads: downloads[i] ?? null,
    href: `${base(locale)}/${p.slug}`,
  }))
  const groups = PLUGIN_GROUPS.map((g) => ({ key: g.key, title: g.title[locale], text: g.text[locale] }))
  return (
    <>
      <section className="why-hero">
        <div className="wrap">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p className="lede">{t.lede}</p>
        </div>
      </section>
      <section className="section flush-top">
        <div className="wrap">
          <PluginGrid
            cards={cards}
            groups={groups}
            labels={{ all: t.all, search: t.search, none: t.none, experimental: t.experimental, stable: t.stable, downloads: t.downloads }}
          />
          <p className="pl-note">{t.downloadsNote}</p>
        </div>
      </section>
      <section className="section" id="adapters">
        <div className="wrap">
          <div className="section-head">
            <h2>{t.adaptersTitle}</h2>
            <p>{t.adaptersText}</p>
          </div>
          <div className="pl-adapters">
            {ADAPTER_GROUPS.map((g) => (
              <div key={g.title.en}>
                <h3>{g.title[locale]}</h3>
                <ul>
                  {g.items.map((a) => (
                    <li key={a.pkg}>
                      <Link href={docHref(a.doc, locale)}>
                        <code>{a.pkg}</code>
                        <span>{a.summary[locale]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

/** A small line of the last 30 days' downloads, drawn on the server. */
function Sparkline({ days, label }: { days: { day: string; downloads: number }[]; label: string }) {
  const w = 320
  const h = 64
  const max = Math.max(1, ...days.map((d) => d.downloads))
  const step = days.length > 1 ? w / (days.length - 1) : w
  const points = days.map((d, i) => `${(i * step).toFixed(1)},${(h - 4 - (d.downloads / max) * (h - 8)).toFixed(1)}`)
  const total = days.reduce((sum, d) => sum + d.downloads, 0)
  return (
    <figure className="pl-spark">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${label}: ${total.toLocaleString('en-US')}`} preserveAspectRatio="none">
        <polyline points={`0,${h} ${points.join(' ')} ${w},${h}`} className="area" />
        <polyline points={points.join(' ')} className="line" />
      </svg>
      <figcaption>
        {label} · <b>{total.toLocaleString('en-US')}</b>
      </figcaption>
    </figure>
  )
}

/** /plugins/seo and the others: what it does, how to add it, its downloads. */
export async function PluginPage({ plugin: p, locale }: { plugin: Plugin; locale: Locale }) {
  const t = PLUGINS_COPY[locale]
  const group = PLUGIN_GROUPS.find((g) => g.key === p.group)
  const [week, days, usageHtml] = await Promise.all([
    weeklyDownloads(p.pkg),
    dailyDownloads(p.pkg),
    highlight(`import { defineConfig } from '@easy-cms/core'\nimport { ${p.usage.split('(')[0]} } from '${p.pkg}'\n\nexport default defineConfig({\n  // …\n  plugins: [${p.usage}],\n})`, 'ts'),
  ])
  const others = PLUGINS.filter((o) => o.group === p.group && o.slug !== p.slug)
  return (
    <>
      <section className="why-hero pl-hero">
        <div className="wrap">
          <Link className="why-crumb" href={base(locale)}>
            {t.back}
          </Link>
          <span className="eyebrow">{group?.title[locale]}</span>
          <div className="pl-title">
            <span className="pl-icon big"><FeatureIcon name={p.icon} /></span>
            <h1>{p.name[locale]}</h1>
            <span className={`pl-status${p.experimental ? ' exp' : ''}`}>{p.experimental ? t.experimental : t.stable}</span>
          </div>
          <p className="lede">{p.summary[locale]}</p>
          <div className="pl-meta">
            <code>{p.pkg}</code>
            {week !== null && (
              <span>
                <b>{week.toLocaleString('en-US')}</b> {t.downloads}
              </span>
            )}
          </div>
        </div>
      </section>
      <section className="section flush-top">
        <div className="wrap pl-detail">
          <div>
            <h2>{t.features}</h2>
            <ul className="pl-features">
              {p.features[locale].map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="cta-row" style={{ marginTop: 28 }}>
              <Link className="btn primary" href={docHref(p.doc, locale)}>
                {t.docs} <ArrowIcon />
              </Link>
              <a className="btn" href={npmUrl(p.pkg)}>
                {t.npm}
              </a>
            </div>
          </div>
          <div className="pl-side">
            <h3>{t.install}</h3>
            <div className="pick-cmd"><span>$</span><code>npm install {p.pkg}</code></div>
            <h3>{t.config}</h3>
            <div className="float-code pl-code">
              <div className="fname"><span>easy-cms.config.ts</span></div>
              <div dangerouslySetInnerHTML={{ __html: usageHtml }} />
            </div>
            {days && days.length > 1 && <Sparkline days={days} label={t.trend} />}
            <p className="pl-note">{t.downloadsNote}</p>
          </div>
        </div>
      </section>
      {others.length > 0 && (
        <section className="section flush-top">
          <div className="wrap">
            <div className="section-head">
              <h2>{group?.title[locale]}</h2>
            </div>
            <div className="pl-cards">
              {others.map((o) => (
                <Link className="pl-card" href={`${base(locale)}/${o.slug}`} key={o.slug}>
                  <div className="pl-card-top">
                    <span className="pl-icon"><FeatureIcon name={o.icon} /></span>
                  </div>
                  <h3>{o.name[locale]}</h3>
                  <code>{o.pkg}</code>
                  <p>{o.summary[locale]}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
