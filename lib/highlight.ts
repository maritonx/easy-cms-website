import 'server-only'
import { codeToHtml } from 'shiki'
import { CODE_THEME } from './code-theme'

export function highlight(code: string, lang: string) {
  return codeToHtml(code.trim(), { lang, theme: CODE_THEME })
}
