import source from '@/content/docs/source.json'

/** Which Easy CMS commit the docs were built from (written by scripts/fetch-docs.mjs). */
export const DOCS_SOURCE = source as { repo: string; ref: string; version: string | null; fetchedAt: string }

/** "Edit this page" goes to main, where docs changes are made. */
export const editURL = (file: string) => `https://github.com/${DOCS_SOURCE.repo}/edit/main/website/${file}.md`
