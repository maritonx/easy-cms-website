import { createAdminRouteHandlers } from '@easy-cms/next'
import config from '../../../easy-cms.config'

// The Easy CMS admin UI (admin.path in easy-cms.config.ts).
const handlers = createAdminRouteHandlers(config)

// TEMPORARY: show why /admin fails on Vercel; remove once found.
function debug(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('[admin]', error)
      const e = error as Error & { code?: string; path?: string }
      return new Response(`[admin debug] ${e.name}: ${e.message}${e.code ? ` (${e.code})` : ''}`, {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      })
    }
  }
}

export const GET = debug(handlers.GET)
export const HEAD = debug(handlers.HEAD)
