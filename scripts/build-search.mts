/**
 * Builds the docs search indexes (Pagefind), public/pagefind for English and public/pagefind-th
 * for Thai, before `next build`, which only
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
import { docsFor, LOCALES, type Locale } from '../lib/docs/sidebar'

const outputFor = (locale: Locale) =>
  path.resolve(import.meta.dirname, '../public', locale === 'en' ? 'pagefind' : `pagefind-${locale}`)

if (
  process.argv.includes('--if-missing') &&
  LOCALES.every((locale) => existsSync(path.join(outputFor(locale), 'pagefind.js')))
) {
  process.exit(0)
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')

for (const locale of LOCALES) {
  const { index, errors } = await pagefind.createIndex({})
  if (!index) throw new Error(`Pagefind: ${errors.join('; ')}`)
  const docs = docsFor(locale)
  for (const doc of docs) {
    const rendered = await renderDocFile(doc.file, locale)
    if (!rendered) throw new Error(`${locale}/${doc.file}.md is missing; run pnpm docs:fetch`)
    const result = await index.addHTMLFile({
      url: doc.href,
      content: `<html lang="${locale}"><head><title>${escape(rendered.title)}</title></head><body><main data-pagefind-body>${rendered.html}</main></body></html>`,
    })
    if (result.errors.length) throw new Error(`Pagefind, ${doc.href}: ${result.errors.join('; ')}`)
  }
  const output = outputFor(locale)
  await rm(output, { recursive: true, force: true })
  const written = await index.writeFiles({ outputPath: output })
  if (written.errors.length) throw new Error(`Pagefind: ${written.errors.join('; ')}`)
  console.log(`Search index: ${docs.length} ${locale} docs pages → public/${path.basename(output)}`)
}
await pagefind.close()
