import { APP_DIR } from '@easy-cms/admin'
import { createAdminRouteHandlers } from '@easy-cms/next'
import config from '../../../easy-cms.config'

// The Easy CMS admin UI (admin.path in easy-cms.config.ts). EXPERIMENT: the admin package's own
// APP_DIR, which withEasyCMS() already traces, instead of @easy-cms/next's lookup through
// @easy-cms/next/package.json, which isn't deployed on Vercel.
export const { GET, HEAD } = createAdminRouteHandlers(config, { appDir: APP_DIR })
