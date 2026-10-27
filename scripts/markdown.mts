// Markdown posts (content/posts/*.md) → Easy CMS rich text (Tiptap JSON), for the seed.
// GFM: headings, lists, quotes, code, images, tables; HTML (comments) is dropped.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

type Node = Record<string, unknown>
type Md = { type: string; children?: Md[]; value?: string; [key: string]: unknown }
type Mark = { type: string; attrs?: Record<string, unknown> }

const parser = unified().use(remarkParse).use(remarkGfm)

function inline(nodes: Md[] = [], marks: Mark[] = []): Node[] {
  return nodes.flatMap((n): Node[] => {
    const text = (value: string, extra: Mark[] = []) => {
      const all = [...marks, ...extra]
      return value ? [{ type: 'text', text: value, ...(all.length ? { marks: all } : {}) }] : []
    }
    switch (n.type) {
      case 'text':
        return text(String(n.value).replace(/\n/g, ' '))
      case 'inlineCode':
        return text(String(n.value), [{ type: 'code' }])
      case 'strong':
        return inline(n.children, [...marks, { type: 'bold' }])
      case 'emphasis':
        return inline(n.children, [...marks, { type: 'italic' }])
      case 'delete':
        return inline(n.children, [...marks, { type: 'strike' }])
      case 'link':
        return inline(n.children, [...marks, { type: 'link', attrs: { href: n.url } }])
      case 'break':
        return [{ type: 'hardBreak' }]
      default:
        return n.children ? inline(n.children, marks) : []
    }
  })
}

const image = (n: Md): Node => ({
  type: 'image',
  attrs: { src: n.url, alt: n.alt ?? '', title: n.title ?? null },
})

/** A paragraph; images in it become blocks of their own, as the editor keeps them. */
function paragraph(n: Md): Node[] {
  const out: Node[] = []
  let run: Md[] = []
  const flush = () => {
    const content = inline(run)
    if (content.some((c) => c.type !== 'text' || String(c.text).trim()))
      out.push({ type: 'paragraph', content })
    run = []
  }
  for (const child of n.children ?? []) {
    if (child.type === 'image') {
      flush()
      out.push(image(child))
    } else run.push(child)
  }
  flush()
  return out
}

function blocks(nodes: Md[] = []): Node[] {
  return nodes.flatMap((n): Node[] => {
    switch (n.type) {
      case 'heading':
        // The page has the post's title as its h1; sections start at h2.
        return [
          {
            type: 'heading',
            attrs: { level: Math.min(4, Math.max(2, Number(n.depth))) },
            content: inline(n.children),
          },
        ]
      case 'paragraph':
        return paragraph(n)
      case 'list':
        return [
          {
            type: n.ordered ? 'orderedList' : 'bulletList',
            ...(n.ordered ? { attrs: { start: n.start ?? 1 } } : {}),
            content: (n.children ?? []).map((item) => ({
              type: 'listItem',
              content: blocks(item.children),
            })),
          },
        ]
      case 'blockquote':
        return [{ type: 'blockquote', content: blocks(n.children) }]
      case 'code':
        return [
          {
            type: 'codeBlock',
            attrs: { language: n.lang ?? null },
            content: n.value ? [{ type: 'text', text: n.value }] : [],
          },
        ]
      case 'thematicBreak':
        return [{ type: 'horizontalRule' }]
      case 'image':
        return [image(n)]
      case 'table':
        return [
          {
            type: 'table',
            content: (n.children ?? []).map((row, i) => ({
              type: 'tableRow',
              content: (row.children ?? []).map((cell) => ({
                type: i === 0 ? 'tableHeader' : 'tableCell',
                attrs: { colspan: 1, rowspan: 1, colwidth: null },
                content: [{ type: 'paragraph', content: inline(cell.children) }],
              })),
            })),
          },
        ]
      default:
        // html (comments), definitions: not part of the post.
        return []
    }
  })
}

export function markdownToRichText(markdown: string): Node {
  return { type: 'doc', content: blocks(parser.parse(markdown).children as Md[]) }
}

export interface MarkdownPost {
  title: string
  slug: string
  language: 'en' | 'th'
  category: string
  publishedAt: string
  coverText: string
  excerpt: string
  body: string
}

/** `content/posts/*.md`: a front matter of plain `key: value` lines (JSON strings allowed), then Markdown. */
export function readMarkdownPosts(dir: string): MarkdownPost[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const text = readFileSync(join(dir, file), 'utf8')
      const match = /^---\n([\s\S]*?)\n---\n/.exec(text)
      if (!match) throw new Error(`${file}: no front matter`)
      const data: Record<string, string> = {}
      for (const line of (match[1] as string).split('\n')) {
        const at = line.indexOf(':')
        const key = line.slice(0, at).trim()
        const raw = line.slice(at + 1).trim()
        data[key] = raw.startsWith('"') ? JSON.parse(raw) : raw
      }
      return { ...(data as unknown as MarkdownPost), body: text.slice(match[0].length) }
    })
}
