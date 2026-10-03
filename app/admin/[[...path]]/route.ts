import { APP_DIR } from '@easy-cms/admin'
import { createAdminRouteHandlers } from '@easy-cms/next'
import config from '../../../easy-cms.config'

// The Easy CMS admin UI (admin.path in easy-cms.config.ts). Until @easy-cms/next ships the fix
// (maritonx/easy-cms, branch fix/next-admin-app-dir), pass the admin package's own APP_DIR: the
// adapter's default lookup needs @easy-cms/next/package.json, which Vercel doesn't deploy. After
// that release, drop `appDir` and the direct @easy-cms/admin dependency.
export const { GET, HEAD } = createAdminRouteHandlers(config, { appDir: APP_DIR })
