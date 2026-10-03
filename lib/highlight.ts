import 'server-only'
import { codeToHtml } from 'shiki'

/** The theme for every code panel; panels stay dark in both site themes. */
export const CODE_THEME = 'vitesse-dark'

export function highlight(code: string, lang: string) {
  return codeToHtml(code.trim(), { lang, theme: CODE_THEME })
}
