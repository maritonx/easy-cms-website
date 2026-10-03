import 'server-only'
import { cache } from 'react'
import { renderDocFile } from './render'

export type { RenderedDoc, TocItem } from './render'

/** One docs page as HTML in a locale, rendered once per request. */
export const renderDoc = cache(renderDocFile)
