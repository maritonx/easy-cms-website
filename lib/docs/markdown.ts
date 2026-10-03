import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { SITE_URL } from '@/easy-cms.config'
import { ALL_DOCS } from './sidebar'

const ROOT = path.join(process.cwd(), 'content/docs/en')

/** A docs page's markdown as written, for /docs/….md and llms-full.txt. */
export async function docSource(file: string) {
  try {
    return await readFile(path.join(ROOT, `${file}.md`), 'utf8')
  } catch {
    return null
  }
}

/** `/docs/next` → `https://easy-cms.io/docs/next.md` */
export const markdownURL = (href: string) => `${SITE_URL}${href}.md`

/**
 * The first lines of a page's "What you'll learn" box, or its first paragraph: a description for
 * search results and llms.txt.
 */
export function describe(source: string) {
  const learn = /^::: info[^\n]*\n([\s\S]*?)\n\s*(?:\n|:::)/m.exec(source)?.[1]
  const firstParagraph = source
    .replace(/^#.*$/m, '')
    .replace(/^:::[\s\S]*?^:::\s*$/gm, '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .find((p) => p && !/^[#<`|>-]/.test(p))
  const text = (learn ?? firstParagraph ?? '').replace(/\s+/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  return text.replace(/[*`]/g, '').trim() || null
}

export async function docsIndex() {
  return Promise.all(
    ALL_DOCS.map(async (doc) => {
      const source = await docSource(doc.file)
      return { ...doc, description: source ? describe(source) : null, source }
    }),
  )
}
