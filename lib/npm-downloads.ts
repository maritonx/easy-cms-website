import 'server-only'

/** The CLI package everyone installs (`npx easy-cms`, `npm create easy-cms` pulls it in). */
const URL = 'https://api.npmjs.org/downloads/point/last-week/easy-cms'
/** npm updates the count once a day; ask again after six hours. */
const MAX_AGE = 6 * 60 * 60 * 1000

let cached: { at: number; value: number | null } | null = null

/**
 * Downloads of `easy-cms` in the last week, from npm's public API, kept in memory for six hours.
 * Null when npm doesn't answer within two seconds: the home page then leaves the number out.
 */
export async function npmDownloadsLastWeek(): Promise<number | null> {
  if (cached && Date.now() - cached.at < MAX_AGE) return cached.value
  let value: number | null = null
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(2000), cache: 'no-store' })
    if (res.ok) {
      const { downloads } = (await res.json()) as { downloads?: unknown }
      value = typeof downloads === 'number' ? downloads : null
    }
  } catch {
    value = null
  }
  // A failed answer is kept for a minute only, so one slow call doesn't hide the number for hours.
  cached = { at: value === null ? Date.now() - MAX_AGE + 60_000 : Date.now(), value }
  return value
}
