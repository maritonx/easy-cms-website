import 'server-only'

/** npm updates the counts once a day; ask again after six hours. */
const MAX_AGE = 6 * 60 * 60 * 1000
/** A failed answer is kept for a minute only, so one slow call doesn't hide a number for hours. */
const RETRY_AFTER = 60 * 1000

const cache = new Map<string, { at: number; ok: boolean; value: unknown }>()

/** npm's public downloads API, kept in memory; null when npm doesn't answer within two seconds. */
async function fromNpm<T>(path: string, pick: (body: unknown) => T | null): Promise<T | null> {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.at < (hit.ok ? MAX_AGE : RETRY_AFTER)) return hit.value as T | null
  let value: T | null = null
  try {
    const res = await fetch(`https://api.npmjs.org/downloads/${path}`, { signal: AbortSignal.timeout(2000), cache: 'no-store' })
    if (res.ok) value = pick(await res.json())
  } catch {
    value = null
  }
  cache.set(path, { at: Date.now(), ok: value !== null, value })
  return value
}

/** Downloads of one package in the last week. */
export function weeklyDownloads(pkg: string) {
  return fromNpm(`point/last-week/${pkg}`, (body) => {
    const n = (body as { downloads?: unknown }).downloads
    return typeof n === 'number' ? n : null
  })
}

/** Downloads per day over the last 30 days, oldest first. */
export function dailyDownloads(pkg: string) {
  return fromNpm(`range/last-month/${pkg}`, (body) => {
    const days = (body as { downloads?: unknown }).downloads
    if (!Array.isArray(days)) return null
    return days.map((d) => ({ day: String(d.day), downloads: Number(d.downloads) || 0 }))
  })
}

/** The CLI package everyone installs (`npx easy-cms`; `npm create easy-cms` pulls it in). */
export const npmDownloadsLastWeek = () => weeklyDownloads('easy-cms')
