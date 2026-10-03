/**
 * Builds the docs search index (Pagefind) into public/pagefind before `next build`, which only
 * serves files that are in public/ when it builds. Each docs page is rendered with the same
 * pipeline as the site, so results link to the same headings.
 *
 *   tsx scripts/build-search.mts [--if-missing]
 */
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import * as pagefind from 'pagefind'
import { renderDocFile } from '../lib/docs/render'
import { ALL_DOCS } from '../lib/docs/sidebar'

const output = path.resolve(import.meta.dirname, '../public/pagefind')

if (process.argv.includes('--if-missing') && existsSync(path.join(output, 'pagefind.js'))) process.exit(0)

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const { index, errors } = await pagefind.createIndex({})
if (!index) throw new Error(`Pagefind: ${errors.join('; ')}`)

for (const doc of ALL_DOCS) {
  const rendered = await renderDocFile(doc.file)
  if (!rendered) throw new Error(`${doc.file}.md is missing; run pnpm docs:fetch`)
  const result = await index.addHTMLFile({
    url: doc.href,
    content: `<html lang="en"><head><title>${escape(rendered.title)}</title></head><body><main data-pagefind-body>${rendered.html}</main></body></html>`,
  })
  if (result.errors.length) throw new Error(`Pagefind, ${doc.href}: ${result.errors.join('; ')}`)
}

await rm(output, { recursive: true, force: true })
const written = await index.writeFiles({ outputPath: output })
if (written.errors.length) throw new Error(`Pagefind: ${written.errors.join('; ')}`)
await pagefind.close()
console.log(`Search index: ${ALL_DOCS.length} docs pages → public/pagefind`)
