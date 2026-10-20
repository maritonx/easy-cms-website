import { SITE_URL } from '@/easy-cms.config'
import { CHECKED, COMPETITORS, type Competitor, competitor, EASY_CMS, type Product, ROWS } from './compare'
import {
  COMPARE_OVERVIEW,
  docHref,
  type Locale,
  PERSONAS,
  persona,
  WHY_OVERVIEW,
  WHY_UI,
  whyHref,
} from './copy'

/**
 * The Why pages as Markdown (/why.md, /th/why/compare/payload.md…), for AI assistants and
 * llms.txt: the same words as the pages, from the same data, with absolute links.
 */
const abs = (path: string) => `${SITE_URL}${path}`
const md = (rest: string, locale: Locale) => abs(`${whyHref(rest, locale)}.md`)
/** A table cell: no pipes or line breaks. */
const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ')

function head(title: string, description: string, rest: string, locale: Locale) {
  return [`# ${title}`, '', `> ${description}`, '', `Page: ${abs(whyHref(rest, locale))}`, '']
}

function table(products: readonly Product[], locale: Locale) {
  const ui = WHY_UI[locale]
  return [
    `| ${ui.feature} | ${products.map((p) => p.name).join(' | ')} |`,
    `|---|${products.map(() => '---').join('|')}|`,
    ...ROWS.map((row) => `| ${row.label[locale]} | ${products.map((p) => cell(p.cells[row.key][locale])).join(' | ')} |`),
  ]
}

function sources(competitors: readonly Competitor[], locale: Locale) {
  const ui = WHY_UI[locale]
  return [
    `## ${ui.sources}`,
    '',
    ui.checked(CHECKED),
    '',
    ...competitors.flatMap((c) => c.sources.map((s) => `- [${s.label}](${s.url})`)),
  ]
}

const list = (items: readonly string[]) => items.map((item) => `- ${item}`)

function overview(locale: Locale) {
  const t = WHY_OVERVIEW[locale]
  const ui = WHY_UI[locale]
  return [
    ...head(t.meta.title, t.meta.description, '', locale),
    t.lede,
    '',
    `## ${t.pillarsTitle}`,
    '',
    ...t.pillars.map((p) => `- **${p.title}:** ${p.body} ([${ui.readDocs}](${abs(docHref(p.doc, locale))}))`),
    '',
    `## ${t.forTitle}`,
    '',
    ...PERSONAS.map((p) => `- [${p[locale].meta.title}](${md(p.slug, locale)}): ${p[locale].lede}`),
    '',
    `## ${t.compareTitle}`,
    '',
    `${t.compareLede} [${ui.allCompared}](${md('compare', locale)})`,
    '',
    ...COMPETITORS.map((c) => `- [${ui.vs(c.name)}](${md(`compare/${c.slug}`, locale)}): ${c.summary[locale]}`),
    '',
    ui.honest,
  ]
}

function personaPage(slug: string, locale: Locale) {
  const p = persona(slug)
  if (!p) return null
  const t = p[locale]
  const ui = WHY_UI[locale]
  return [
    ...head(t.meta.title, t.meta.description, slug, locale),
    `**${t.title}** ${t.lede}`,
    '',
    `## ${t.problem.title}`,
    '',
    ...list(t.problem.items),
    '',
    `## ${t.pointsTitle}`,
    '',
    ...t.points.map((point) => `- **${point.title}:** ${point.body} ([${ui.readDocs}](${abs(docHref(point.doc, locale))}))`),
    '',
    `## ${ui.notFitTitle}`,
    '',
    ...list(t.notFit),
    '',
    ui.honest,
  ]
}

function compareOverview(locale: Locale) {
  const t = COMPARE_OVERVIEW[locale]
  const ui = WHY_UI[locale]
  return [
    ...head(t.meta.title, t.meta.description, 'compare', locale),
    t.lede,
    '',
    ...table([EASY_CMS, ...COMPETITORS], locale),
    '',
    ...COMPETITORS.map((c) => `- [${ui.vs(c.name)}](${md(`compare/${c.slug}`, locale)}): ${c.summary[locale]}`),
    '',
    ui.honest,
    '',
    ...sources(COMPETITORS, locale),
  ]
}

function comparePage(slug: string, locale: Locale) {
  const c = competitor(slug)
  if (!c) return null
  const ui = WHY_UI[locale]
  return [
    ...head(ui.vs(c.name), c.summary[locale], `compare/${slug}`, locale),
    ...table([EASY_CMS, c], locale),
    '',
    `## ${ui.chooseUs}`,
    '',
    ...list(c.chooseUs[locale]),
    '',
    `## ${ui.chooseThem(c.name)}`,
    '',
    ...list(c.chooseThem[locale]),
    '',
    ...(c.moveGuide ? [`${c.moveGuide.text[locale]} ${abs(docHref(c.moveGuide.doc, locale))}`, ''] : []),
    ui.honest,
    '',
    ...sources([c], locale),
  ]
}

/** The page after /why ('', 'developers', 'compare', 'compare/payload') as Markdown, or null. */
export function whyMarkdown(rest: string, locale: Locale): string | null {
  const [first, second, extra] = rest.split('/')
  let lines: string[] | null = null
  if (extra !== undefined) lines = null
  else if (rest === '') lines = overview(locale)
  else if (rest === 'compare') lines = compareOverview(locale)
  else if (first === 'compare' && second) lines = comparePage(second, locale)
  else if (!second) lines = personaPage(first, locale)
  return lines ? `${lines.join('\n')}\n` : null
}
