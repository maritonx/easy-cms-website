import { join } from 'node:path'
import { createAdminRouteHandlers } from '@easy-cms/next'
import config from '../../../easy-cms.config'

// The Easy CMS admin UI (admin.path in easy-cms.config.ts). The app's directory is given here, and
// traced in next.config.ts, because Vercel only deploys traced files. It needs @easy-cms/admin as a
// direct dependency: pnpm links only those into node_modules.
export const { GET, HEAD } = createAdminRouteHandlers(config, {
  appDir: join(process.cwd(), 'node_modules/@easy-cms/admin/dist/app'),
})
