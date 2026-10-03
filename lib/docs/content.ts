import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Element, Root } from 'hast'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { cache } from 'react'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { CODE_THEME } from '@/lib/highlight'
import { PACKAGE_MANAGERS, translateCommands } from './commands'
import { hrefForFile } from './sidebar'

const ROOT = path.join(process.cwd(), 'content/docs/en')

export type TocItem = { id: string; text: string; depth: 2 | 3 }
export type RenderedDoc = { title: string; html: string; toc: TocItem[] }

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * ```bash [pm]
 * npx easy-cms migrate
 * ```
 * becomes a code group with the command for npm, pnpm, Yarn and Bun, as on the VitePress site.
 */
function expandPackageManagerBlocks(source: string) {
  return source.replace(
    /^([ \t]*)(`{3,})(\w+) \[pm\]\n([\s\S]*?)\n\1\2[ \t]*$/gm,
    (_, indent: string, fence: string, lang: string, body: string) => {
      const code = body
        .split('\n')
        .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
        .join('\n')
      const blocks = PACKAGE_MANAGERS.map(
        (pm) => `${fence}${lang} [${pm}]\n${translateCommands(code, pm) ?? code}\n${fence}`,
      )
      return ['::: code-group pm', ...blocks, ':::'].join('\n\n')
    },
  )
}

const CALLOUT_TITLES: Record<string, string> = { info: 'Info', tip: 'Tip', warning: 'Warning', danger: 'Danger' }

/**
 * VitePress syntax that plain markdown doesn't know, rewritten line by line outside code fences:
 * `::: info|tip|warning|details|code-group` containers, `<Screenshot>`, and fence titles
 * (```ts [file.ts]) and line highlights (```ts{2,4}).
 */
function vitepressToMarkdown(source: string) {
  const out: string[] = []
  let fence: string | null = null
  const open: string[] = []

  for (const line of expandPackageManagerBlocks(source).split('\n')) {
    const fenceMatch = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line)
    if (fence) {
      out.push(line)
      if (fenceMatch && fenceMatch[2] === fence && !fenceMatch[3].trim()) fence = null
      continue
    }
    if (fenceMatch) {
      fence = fenceMatch[2]
      const meta = /^(\w+)?(\{[\d,\s-]+\})?(?:\s+\[([^\]]+)\])?\s*$/.exec(fenceMatch[3])
      if (meta) {
        const [, lang = 'txt', lines, title] = meta
        const parts = [lang, lines, title && `title="${title.replace(/"/g, "'")}"`].filter(Boolean)
        out.push(`${fenceMatch[1]}${fence}${parts.join(' ')}`)
      } else {
        out.push(line)
      }
      continue
    }

    const container = /^\s*:::\s*([\w-]+)?\s*(.*)$/.exec(line)
    if (container) {
      const [, kind, rest] = container
      if (!kind) {
        const closing = open.pop()
        if (closing) out.push('', closing, '')
        continue
      }
      if (kind === 'v-pre') {
        open.push('')
      } else if (kind === 'code-group') {
        out.push('', `<div class="code-group"${rest === 'pm' ? ' data-pm' : ''}>`, '')
        open.push('</div>')
      } else if (kind === 'details') {
        out.push('', `<details><summary>${escapeHtml(rest || 'Details')}</summary>`, '')
        open.push('</details>')
      } else {
        const title = rest || CALLOUT_TITLES[kind] || kind
        out.push('', `<div class="callout ${kind}"><p class="callout-title">${escapeHtml(title)}</p>`, '')
        open.push('</div>')
      }
      continue
    }

    const shot = /^\s*<Screenshot\s+name="([^"]+)"(?:\s+alt="([^"]*)")?\s*\/>\s*$/.exec(line)
    if (shot) {
      const [, name, alt = ''] = shot
      out.push(
        `<p class="screenshot"><img class="only-dark" src="/screenshots/${name}-en-dark.webp" alt="${escapeHtml(alt)}" loading="lazy"><img class="only-light" src="/screenshots/${name}-en-light.webp" alt="${escapeHtml(alt)}" loading="lazy"></p>`,
      )
      continue
    }
    out.push(line)
  }
  return out.join('\n')
}

const textOf = (node: Element | Root): string =>
  node.children
    .map((child) => (child.type === 'text' ? child.value : 'children' in child ? textOf(child as Element) : ''))
    .join('')

/** Links between docs pages (./local-api, ../next, /guide/x) → site URLs; tables get a scroller. */
function rehypeDocs(file: string, toc: TocItem[]) {
  return () => (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'a' && typeof node.properties.href === 'string') {
        const href = node.properties.href
        if (!/^(https?:|mailto:|#)/.test(href)) {
          const [target, hash] = href.split('#')
          const resolved = target.startsWith('/')
            ? target.slice(1)
            : path.posix.normalize(path.posix.join(path.posix.dirname(file), target))
          const clean = resolved.replace(/\.(md|html)$/, '').replace(/\/$/, '/index')
          const site = hrefForFile(clean) ?? hrefForFile(`${clean}/index`)
          if (site) node.properties.href = hash ? `${site}#${hash}` : site
        }
      }
      if ((node.tagName === 'h2' || node.tagName === 'h3') && typeof node.properties.id === 'string') {
        toc.push({ id: node.properties.id, text: textOf(node), depth: node.tagName === 'h2' ? 2 : 3 })
      }
      if (node.tagName === 'table' && parent && index !== undefined) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'] },
          children: [node],
        }
      }
    })
  }
}

/** One docs page (`guide/next`) as HTML, its title and its table of contents. */
export const renderDoc = cache(async (file: string): Promise<RenderedDoc | null> => {
  let source: string
  try {
    source = await readFile(path.join(ROOT, `${file}.md`), 'utf8')
  } catch {
    return null
  }
  const title = /^#\s+(.+)$/m.exec(source)?.[1]?.trim() ?? file
  const toc: TocItem[] = []
  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    // Before rehype-raw, which drops the fence meta (titles, highlighted lines) it reads.
    .use(rehypePrettyCode, { theme: CODE_THEME, keepBackground: false, defaultLang: 'txt' })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeDocs(file, toc))
    .use(rehypeStringify)
    .process(vitepressToMarkdown(source))
  return { title: title.replace(/`/g, ''), html: String(html), toc }
})
