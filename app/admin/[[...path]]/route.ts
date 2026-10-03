import { join } from 'node:path'
import { createAdminRouteHandlers } from '@easy-cms/next'
import config from '../../../easy-cms.config'

// The Easy CMS admin UI (admin.path in easy-cms.config.ts). The app's directory is given here, and
// traced in next.config.ts, because Vercel only deploys traced files.
const handlers = createAdminRouteHandlers(config, {
  appDir: join(process.cwd(), 'node_modules/@easy-cms/admin/dist/app'),
})

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
