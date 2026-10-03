import type { Metadata } from 'next'
import { getReleases } from '@/lib/cms'
import { formatDate } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Every Easy CMS release, with the changes and the packages it touched.',
  alternates: { canonical: '/changelog' },
}

/** `code` spans in changelog text, written with backticks in the CMS. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part,
      )}
    </>
  )
}

export default async function ChangelogPage() {
  const releases = await getReleases()
  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <span className="eyebrow">Changelog</span>
          <h1>What changed, release by release</h1>
          <p>Every package is versioned with Changesets. Releases that need a migration say so.</p>
        </div>
      </div>
      <div className="wrap releases">
        {releases.length === 0 && (
          <p className="empty">No releases yet. Add one at <code>/admin</code>, or run <code>pnpm seed</code>.</p>
        )}
        {releases.map((release) => (
          <div className="release" key={release.id} id={`v${release.version}`}>
            <div className="rel-side">
              <span className="v">{release.version}</span>
              <time dateTime={release.date}>{formatDate(release.date)}</time>
              <span className={`kind ${release.kind}`}>{release.kind}</span>
            </div>
            <div className="rel-body">
              <h2>{release.title}</h2>
              {release.summary && <p><Inline text={release.summary} /></p>}
              {release.changes && release.changes.length > 0 && (
                <ul>
                  {release.changes.map((change) => (
                    <li key={change.id}><Inline text={change.text} /></li>
                  ))}
                </ul>
              )}
              {(release.packages?.length || release.needsMigration) && (
                <div className="pkgs">
                  {release.packages?.map((p) => <span className="chip" key={p.id}>{p.name}</span>)}
                  {release.needsMigration && <span className="chip warn">needs migration</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
