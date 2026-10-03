import { createAdminRouteHandlers } from '@easy-cms/next'
import config from '../../../easy-cms.config'

// The Easy CMS admin UI (admin.path in easy-cms.config.ts).
export const { GET, HEAD } = createAdminRouteHandlers(config)
