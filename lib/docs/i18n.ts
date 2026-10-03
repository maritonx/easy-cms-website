import type { Locale } from './sidebar'

/** The docs pages' own words; the content and the sidebar titles come from the Easy CMS repo. */
export const DOC_LABELS: Record<
  Locale,
  {
    docs: string
    navigation: string
    onThisPage: string
    previous: string
    next: string
    edit: string
    language: string
  }
> = {
  en: {
    docs: 'Docs',
    navigation: 'Docs navigation',
    onThisPage: 'On this page',
    previous: '← Previous',
    next: 'Next →',
    edit: 'Edit this page on GitHub',
    language: 'Language',
  },
  th: {
    docs: 'เอกสาร',
    navigation: 'เมนูเอกสาร',
    onThisPage: 'ในหน้านี้',
    previous: '← ก่อนหน้า',
    next: 'ถัดไป →',
    edit: 'แก้ไขหน้านี้บน GitHub',
    language: 'ภาษา',
  },
}
