import { SITE_URL } from '@/easy-cms.config'
import { competitor } from './compare'
import { type Locale, persona, WHY_UI, whyHref } from './copy'

/**
 * Structured data for the Why pages: where each sits (BreadcrumbList) and, on the persona and
 * comparison pages, the questions they answer (FAQPage), which search and AI answers read.
 */
const abs = (path: string) => `${SITE_URL}${path}`
const join = (items: readonly string[]) => items.join(' ')

function breadcrumb(locale: Locale, trail: { name: string; path: string }[]) {
  const ui = WHY_UI[locale]
  const items = [
    { name: 'Easy CMS', path: locale === 'th' ? '/th' : '/' },
    { name: ui.menu, path: whyHref('', locale) },
    ...trail,
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  }
}

function faq(locale: Locale, qa: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: qa.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

/** The JSON-LD objects for the page after /why, in the page's language. */
export function whyJsonLd(rest: string, locale: Locale): Record<string, unknown>[] {
  const ui = WHY_UI[locale]
  const [first, second] = rest.split('/')
  if (rest === '') return [breadcrumb(locale, [])]
  const compareCrumb = { name: ui.compareTitle, path: whyHref('compare', locale) }
  if (rest === 'compare') return [breadcrumb(locale, [compareCrumb])]
  if (first === 'compare' && second) {
    const c = competitor(second)
    if (!c) return []
    const vs = ui.vs(c.name)
    const qa =
      locale === 'th'
        ? [
            { q: `Easy CMS กับ ${c.name} ต่างกันอย่างไร`, a: c.summary.th },
            { q: `เมื่อไรควรเลือก Easy CMS แทน ${c.name}`, a: join(c.chooseUs.th) },
            { q: `เมื่อไรควรเลือก ${c.name} แทน Easy CMS`, a: join(c.chooseThem.th) },
          ]
        : [
            { q: `What is the difference between Easy CMS and ${c.name}?`, a: c.summary.en },
            { q: `When should I choose Easy CMS over ${c.name}?`, a: join(c.chooseUs.en) },
            { q: `When should I choose ${c.name} over Easy CMS?`, a: join(c.chooseThem.en) },
          ]
    return [breadcrumb(locale, [compareCrumb, { name: vs, path: whyHref(rest, locale) }]), faq(locale, qa)]
  }
  const p = persona(first)
  if (!p || second) return []
  const t = p[locale]
  const helps = `${t.lede} ${t.points.map((point) => `${point.title}: ${point.body}`).join(' ')}`
  const qa =
    locale === 'th'
      ? [
          { q: `Easy CMS ช่วย${t.menu.label}อย่างไร`, a: helps },
          { q: `เมื่อไรที่ Easy CMS ไม่เหมาะกับ${t.menu.label}`, a: join(t.notFit) },
        ]
      : [
          { q: `How does Easy CMS help ${t.menu.label.toLowerCase()}?`, a: helps },
          { q: `When isn't Easy CMS a fit for ${t.menu.label.toLowerCase()}?`, a: join(t.notFit) },
        ]
  return [breadcrumb(locale, [{ name: t.menu.label, path: whyHref(rest, locale) }]), faq(locale, qa)]
}
