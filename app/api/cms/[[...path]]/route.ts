import { createRouteHandlers } from '@easy-cms/next'
import config from '../../../../easy-cms.config'

// The Easy CMS REST API (routes.api in easy-cms.config.ts).
export const { GET, HEAD, POST, PATCH, PUT, DELETE, OPTIONS } = createRouteHandlers(config)
