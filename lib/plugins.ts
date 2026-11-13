/**
 * The plugins and adapters on /plugins, grouped, in English and Thai. Every feature line follows
 * the plugin's own docs page in the Easy CMS repo (website/guide/<doc>.md) and its package
 * description; nothing here is promised that the docs don't describe.
 */
import type { Locale } from './home-copy'

type T = { en: string; th: string }
type List = { en: readonly string[]; th: readonly string[] }

export type PluginGroup = 'content' | 'ai' | 'business' | 'operations' | 'api'

export type Plugin = {
  slug: string
  pkg: string
  group: PluginGroup
  /** A FeatureIcon name. */
  icon: string
  experimental?: boolean
  /** The docs page, as in docHref: 'seo' → /docs/seo. */
  doc: string
  name: T
  summary: T
  features: List
  /** How it goes into easy-cms.config.ts. */
  usage: string
}

export const PLUGIN_GROUPS: readonly { key: PluginGroup; title: T; text: T }[] = [
  { key: 'content', title: { en: 'Content & SEO', th: 'เนื้อหาและ SEO' }, text: { en: 'Pages, forms and what search engines see.', th: 'หน้าเว็บ ฟอร์ม และสิ่งที่ search engine เห็น' } },
  { key: 'ai', title: { en: 'AI & automation', th: 'AI และงานอัตโนมัติ' }, text: { en: 'Writing, agents, social posts and alerts.', th: 'การเขียน agent โพสต์โซเชียล และการแจ้งเตือน' } },
  { key: 'business', title: { en: 'Business', th: 'ธุรกิจ' }, text: { en: 'Sell things, or run many sites from one CMS.', th: 'ขายของ หรือดูแลหลายเว็บจาก CMS เดียว' } },
  { key: 'operations', title: { en: 'Operations', th: 'งานปฏิบัติการ' }, text: { en: 'Email that arrives and backups you can restore.', th: 'อีเมลที่ส่งถึง และ backup ที่กู้คืนได้' } },
  { key: 'api', title: { en: 'APIs', th: 'API' }, text: { en: 'More ways for other apps to read the data.', th: 'ช่องทางเพิ่มให้แอปอื่นอ่านข้อมูล' } },
]

export const PLUGINS: readonly Plugin[] = [
  {
    slug: 'seo', pkg: '@easy-cms/plugin-seo', group: 'content', icon: 'seo', doc: 'seo',
    name: { en: 'SEO', th: 'SEO' },
    summary: { en: 'Meta fields with length meters and a search preview, sitemaps and structured data.', th: 'field meta พร้อมตัววัดความยาวและตัวอย่างผลค้นหา sitemap และ structured data' },
    features: {
      en: ['A meta title, description and share image on each document, with length meters', 'A preview of the search result as you type', 'Generators that fill the fields from the document', 'A sitemap, robots.txt and JSON-LD structured data', 'Page metadata for Next.js and Nuxt'],
      th: ['meta title, description และรูปสำหรับแชร์ในทุกเอกสาร พร้อมตัววัดความยาว', 'ตัวอย่างผลค้นหาขณะพิมพ์', 'ตัวช่วยเติม field จากเนื้อหาเอกสาร', 'sitemap, robots.txt และ structured data แบบ JSON-LD', 'metadata ของหน้าสำหรับ Next.js และ Nuxt'],
    },
    usage: "seoPlugin({ collections: ['posts'] })",
  },
  {
    slug: 'redirects', pkg: '@easy-cms/plugin-redirects', group: 'content', icon: 'link', doc: 'redirects',
    name: { en: 'Redirects', th: 'Redirect' },
    summary: { en: '301s managed in the admin, added by themselves when a page’s address changes.', th: 'จัดการ 301 ในหน้า admin และเพิ่มให้เองเมื่อที่อยู่ของหน้าเปลี่ยน' },
    features: {
      en: ['Redirects edited in the admin by people who aren’t developers', 'A redirect added by itself when a page’s address changes', 'Served by your Next.js or Nuxt app', 'Works per tenant with the multi-tenant plugin'],
      th: ['แก้ redirect ในหน้า admin ได้โดยไม่ต้องเป็นนักพัฒนา', 'เพิ่ม redirect ให้เองเมื่อที่อยู่ของหน้าเปลี่ยน', 'ให้บริการผ่านแอป Next.js หรือ Nuxt ของคุณ', 'แยกตาม tenant ได้เมื่อใช้คู่กับ plugin multi-tenant'],
    },
    usage: "redirectsPlugin({ collections: ['pages'] })",
  },
  {
    slug: 'nested-docs', pkg: '@easy-cms/plugin-nested-docs', group: 'content', icon: 'layout', doc: 'nested-docs',
    name: { en: 'Nested pages', th: 'หน้าซ้อนกัน' },
    summary: { en: 'A parent for each page, breadcrumbs and full paths kept up to date, and a tree in the admin.', th: 'หน้าแม่ของแต่ละหน้า breadcrumb และ path เต็มที่อัปเดตเอง และมุมมองแบบต้นไม้ใน admin' },
    features: {
      en: ['A parent field and a tree view in the admin', 'Breadcrumbs and full paths kept up to date when pages move', 'Find a page by its address in one query', 'Menus built from the tree', 'Per language with localization'],
      th: ['field หน้าแม่ และมุมมองแบบต้นไม้ในหน้า admin', 'breadcrumb และ path เต็มอัปเดตเองเมื่อย้ายหน้า', 'หาหน้าจากที่อยู่ได้ใน query เดียว', 'สร้างเมนูจากต้นไม้ของหน้า', 'แยกตามภาษาเมื่อเปิด localization'],
    },
    usage: "nestedDocsPlugin({ collections: ['pages'] })",
  },
  {
    slug: 'forms', pkg: '@easy-cms/plugin-form-builder', group: 'content', icon: 'preview', doc: 'forms',
    name: { en: 'Form builder', th: 'ตัวสร้างฟอร์ม' },
    summary: { en: 'Forms built in the admin, submissions, email notifications and spam protection.', th: 'สร้างฟอร์มในหน้า admin เก็บข้อมูลที่ส่งมา แจ้งเตือนทางอีเมล และกันสแปม' },
    features: {
      en: ['Build contact and sign-up forms in the admin', 'Submissions at a glance, exported as CSV', 'An email for each submission', 'Spam protection', 'An <easy-form> element for any page'],
      th: ['สร้างฟอร์มติดต่อและฟอร์มสมัครในหน้า admin', 'ดูข้อมูลที่ส่งมาได้ทันที และ export เป็น CSV', 'อีเมลแจ้งทุกครั้งที่มีคนส่ง', 'กันสแปม', 'element <easy-form> ใช้ได้กับทุกหน้า'],
    },
    usage: "formBuilderPlugin({ defaultTo: 'hello@example.com' })",
  },
  {
    slug: 'ai', pkg: '@easy-cms/plugin-ai', group: 'ai', icon: 'spark', doc: 'ai',
    name: { en: 'AI', th: 'AI' },
    summary: { en: 'Claude, GPT, Gemini or an OpenAI-compatible provider for alt text, SEO and translation.', th: 'Claude, GPT, Gemini หรือผู้ให้บริการที่เข้ากับ OpenAI สำหรับ alt text, SEO และการแปล' },
    features: {
      en: ['Connect a provider on the Integrations page, key encrypted', 'Alt text for images', 'SEO titles and descriptions', 'Translation between your locales', 'Daily limits per person and per role'],
      th: ['เชื่อมผู้ให้บริการในหน้า Integrations โดย key ถูกเข้ารหัส', 'alt text สำหรับรูป', 'SEO title และ description', 'แปลระหว่างภาษาของคุณ', 'โควตารายวันต่อคนและต่อบทบาท'],
    },
    usage: 'aiPlugin()',
  },
  {
    slug: 'mcp', pkg: '@easy-cms/plugin-mcp', group: 'ai', icon: 'chip', doc: 'mcp', experimental: true,
    name: { en: 'MCP server', th: 'MCP server' },
    summary: { en: 'Let AI assistants read and write content through MCP, with API keys under your roles.', th: 'ให้ผู้ช่วย AI อ่านและเขียนเนื้อหาผ่าน MCP ด้วย API key ภายใต้บทบาทของคุณ' },
    features: {
      en: ['An MCP endpoint for Claude, Cursor and other assistants', 'Tools to find, read, create, change and publish documents', 'API keys that carry a role, like a person', 'Safety limits on what an assistant may do'],
      th: ['endpoint MCP สำหรับ Claude, Cursor และผู้ช่วยอื่น', 'tool สำหรับค้นหา อ่าน สร้าง แก้ และเผยแพร่เอกสาร', 'API key ที่มีบทบาทเหมือนคน', 'ขีดจำกัดความปลอดภัยว่าผู้ช่วยทำอะไรได้'],
    },
    usage: 'mcpPlugin()',
  },
  {
    slug: 'social', pkg: '@easy-cms/plugin-social', group: 'ai', icon: 'link', doc: 'social',
    name: { en: 'Social posts', th: 'โพสต์โซเชียล' },
    summary: { en: 'Write a post once and send it to several channels, with schedules, retries and a status each.', th: 'เขียนโพสต์ครั้งเดียวแล้วส่งไปหลายช่องทาง ตั้งเวลา ลองใหม่ และดูสถานะแต่ละช่องทาง' },
    features: {
      en: ['A Facebook Page, a LINE Official Account and X as channels', 'Webhooks to Make, n8n or Zapier', 'Write the post with AI', 'Schedules, retries and a status per channel'],
      th: ['ช่องทาง Facebook Page, LINE Official Account และ X', 'webhook ไป Make, n8n หรือ Zapier', 'เขียนโพสต์ด้วย AI', 'ตั้งเวลา ลองใหม่ และสถานะของแต่ละช่องทาง'],
    },
    usage: "socialPlugin({ collections: ['posts'] })",
  },
  {
    slug: 'notify', pkg: '@easy-cms/plugin-notify', group: 'ai', icon: 'clock', doc: 'notifications',
    name: { en: 'Notifications', th: 'การแจ้งเตือน' },
    summary: { en: 'Telegram messages to admins when a form is submitted, an order comes in or something fails.', th: 'ส่งข้อความ Telegram หา admin เมื่อมีคนส่งฟอร์ม มีคำสั่งซื้อ หรือมีอะไรผิดพลาด' },
    features: {
      en: ['Connect a Telegram bot in the admin', 'Messages for form submissions, orders and failures', 'A failed message retried after 1, 5 and 30 minutes'],
      th: ['เชื่อม Telegram bot ในหน้า admin', 'ข้อความเมื่อมีการส่งฟอร์ม คำสั่งซื้อ และข้อผิดพลาด', 'ข้อความที่ส่งไม่ได้ลองใหม่หลัง 1, 5 และ 30 นาที'],
    },
    usage: 'notifyPlugin()',
  },
  {
    slug: 'ecommerce', pkg: '@easy-cms/plugin-ecommerce', group: 'business', icon: 'media', doc: 'ecommerce', experimental: true,
    name: { en: 'Shop', th: 'ร้านค้า' },
    summary: { en: 'Products and variants, carts, checkout with Stripe or bank transfer, orders and stock.', th: 'สินค้าและตัวเลือก ตะกร้า ชำระเงินด้วย Stripe หรือโอนเงิน คำสั่งซื้อ และสต็อก' },
    features: {
      en: ['Products and variants, prices in several currencies', 'Carts, guests included, and customer accounts', 'Checkout with Stripe or bank transfer', 'Orders and stock in the admin', 'React and Vue hooks for your pages'],
      th: ['สินค้าและตัวเลือก ราคาหลายสกุลเงิน', 'ตะกร้า รวมถึงผู้ซื้อที่ไม่ได้สมัคร และบัญชีลูกค้า', 'ชำระเงินด้วย Stripe หรือโอนเงิน', 'คำสั่งซื้อและสต็อกในหน้า admin', 'hook สำหรับ React และ Vue'],
    },
    usage: "ecommercePlugin({ currencies: { supported: ['THB', 'USD'] } })",
  },
  {
    slug: 'multi-tenant', pkg: '@easy-cms/plugin-multi-tenant', group: 'business', icon: 'shield', doc: 'multi-tenant',
    name: { en: 'Multi-tenant', th: 'หลาย tenant' },
    summary: { en: 'Several sites or clients in one CMS, each with its own content, members and roles.', th: 'หลายเว็บหรือหลายลูกค้าใน CMS เดียว แต่ละรายมีเนื้อหา สมาชิก และบทบาทของตัวเอง' },
    features: {
      en: ['Each tenant with its own content, members and roles', 'A tenant switcher in the admin', 'Works with nested pages, redirects and forms', 'One deployment for every client'],
      th: ['แต่ละ tenant มีเนื้อหา สมาชิก และบทบาทของตัวเอง', 'ตัวสลับ tenant ในหน้า admin', 'ใช้คู่กับหน้าซ้อนกัน redirect และฟอร์มได้', 'deploy ครั้งเดียวสำหรับทุกลูกค้า'],
    },
    usage: "multiTenantPlugin({ collections: ['posts', 'pages', 'media'] })",
  },
  {
    slug: 'backups', pkg: '@easy-cms/plugin-backups', group: 'operations', icon: 'db', doc: 'backups',
    name: { en: 'Backups', th: 'Backup' },
    summary: { en: 'Backups to Google Drive or S3-compatible storage, connected and restored from the admin.', th: 'backup ไป Google Drive หรือที่เก็บแบบ S3 เชื่อมและกู้คืนจากหน้า admin' },
    features: {
      en: ['Google Drive, Cloudflare R2, Backblaze B2 or AWS S3', 'Start a backup or schedule one from the admin', 'Restore from the admin', 'Encrypted when you set a key'],
      th: ['Google Drive, Cloudflare R2, Backblaze B2 หรือ AWS S3', 'เริ่ม backup หรือตั้งเวลาได้จากหน้า admin', 'กู้คืนจากหน้า admin', 'เข้ารหัสเมื่อคุณตั้ง key'],
    },
    usage: 'backupsPlugin()',
  },
  {
    slug: 'email', pkg: '@easy-cms/plugin-email', group: 'operations', icon: 'clock', doc: 'email',
    name: { en: 'Email providers', th: 'ผู้ให้บริการอีเมล' },
    summary: { en: 'Resend, Postmark, Brevo or SMTP, chosen in the admin, with delivery events and a suppression list.', th: 'Resend, Postmark, Brevo หรือ SMTP เลือกในหน้า admin พร้อมสถานะการส่งและรายชื่อที่งดส่ง' },
    features: {
      en: ['Resend, Postmark, Brevo or SMTP, chosen in the admin', 'Queued and retried', 'An email log with delivery events', 'Bounced addresses kept off the list'],
      th: ['Resend, Postmark, Brevo หรือ SMTP เลือกในหน้า admin', 'เข้าคิวและลองใหม่ให้เอง', 'log อีเมลพร้อมสถานะการส่ง', 'ที่อยู่ที่ตีกลับถูกงดส่ง'],
    },
    usage: 'emailPlugin()',
  },
  {
    slug: 'graphql', pkg: '@easy-cms/plugin-graphql', group: 'api', icon: 'api', doc: 'graphql', experimental: true,
    name: { en: 'GraphQL', th: 'GraphQL' },
    summary: { en: 'Queries and mutations for every collection and global, with the same access rules as REST.', th: 'query และ mutation สำหรับทุก collection และ global ใช้กฎสิทธิ์เดียวกับ REST' },
    features: {
      en: ['A schema built from your config', 'Queries and mutations for every collection and global', 'The same access rules as REST', 'Caps on depth, documents and list size', 'Works with codegen tools'],
      th: ['schema ที่สร้างจาก config ของคุณ', 'query และ mutation สำหรับทุก collection และ global', 'กฎสิทธิ์เดียวกับ REST', 'จำกัดความลึก จำนวนเอกสาร และขนาดรายการ', 'ใช้กับเครื่องมือ codegen ได้'],
    },
    usage: 'graphqlPlugin()',
  },
]

export type Adapter = { pkg: string; doc: string; summary: T }

export const ADAPTER_GROUPS: readonly { title: T; items: readonly Adapter[] }[] = [
  {
    title: { en: 'Frameworks', th: 'Framework' },
    items: [
      { pkg: '@easy-cms/next', doc: 'next', summary: { en: 'Next.js route handlers and getEasyCMS()', th: 'route handler ของ Next.js และ getEasyCMS()' } },
      { pkg: '@easy-cms/nuxt', doc: 'nuxt', summary: { en: 'The Nuxt module and useEasyCMS()', th: 'module ของ Nuxt และ useEasyCMS()' } },
      { pkg: 'easy-cms', doc: 'cli', summary: { en: 'The CLI: serve, migrate, build for Workers', th: 'CLI: serve, migrate และ build สำหรับ Workers' } },
    ],
  },
  {
    title: { en: 'Databases', th: 'ฐานข้อมูล' },
    items: [
      { pkg: '@easy-cms/db-postgres', doc: 'databases', summary: { en: 'Postgres, Neon, Supabase or PGlite', th: 'Postgres, Neon, Supabase หรือ PGlite' } },
      { pkg: '@easy-cms/db-sqlite', doc: 'databases', summary: { en: 'A SQLite file or Turso (libSQL)', th: 'ไฟล์ SQLite หรือ Turso (libSQL)' } },
    ],
  },
  {
    title: { en: 'File storage', th: 'ที่เก็บไฟล์' },
    items: [
      { pkg: '@easy-cms/storage-s3', doc: 'uploads', summary: { en: 'AWS S3, Cloudflare R2, MinIO', th: 'AWS S3, Cloudflare R2, MinIO' } },
      { pkg: '@easy-cms/storage-vercel-blob', doc: 'uploads', summary: { en: 'Vercel Blob', th: 'Vercel Blob' } },
      { pkg: '@easy-cms/storage-netlify-blobs', doc: 'uploads', summary: { en: 'Netlify Blobs', th: 'Netlify Blobs' } },
    ],
  },
  {
    title: { en: 'Sign-in, email and fields', th: 'ล็อกอิน อีเมล และ field' },
    items: [
      { pkg: '@easy-cms/auth-oauth', doc: 'sso', summary: { en: 'Google, Microsoft, GitHub or any OpenID Connect provider', th: 'Google, Microsoft, GitHub หรือ OpenID Connect เจ้าไหนก็ได้' } },
      { pkg: '@easy-cms/email-smtp', doc: 'email', summary: { en: 'SMTP: Gmail, Amazon SES, Mailgun and others', th: 'SMTP: Gmail, Amazon SES, Mailgun และอื่นๆ' } },
      { pkg: '@easy-cms/fields', doc: 'field-types', summary: { en: 'Extra field types, starting with a colour picker', th: 'field เพิ่มเติม เริ่มจากตัวเลือกสี' } },
      { pkg: '@easy-cms/richtext', doc: 'rich-text', summary: { en: 'Rich text to safe HTML', th: 'แปลง rich text เป็น HTML ที่ปลอดภัย' } },
    ],
  },
]

export const plugin = (slug: string) => PLUGINS.find((p) => p.slug === slug) ?? null

export const PLUGINS_COPY: Record<
  Locale,
  {
    meta: { title: string; description: string }
    eyebrow: string
    title: string
    lede: string
    all: string
    search: string
    none: string
    experimental: string
    stable: string
    downloads: string
    adaptersTitle: string
    adaptersText: string
    back: string
    features: string
    install: string
    config: string
    docs: string
    npm: string
    trend: string
    downloadsNote: string
  }
> = {
  en: {
    meta: {
      title: 'Plugins',
      description: 'Every Easy CMS plugin by group: SEO, forms, AI, MCP, social posts, a shop, multi-tenant, backups, email and GraphQL. All MIT.',
    },
    eyebrow: 'Plugins',
    title: 'Add what your app needs. All MIT.',
    lede: 'Each plugin is an npm package you add to the config. They use the same roles, jobs and admin as everything else, so nothing runs beside your app.',
    all: 'All',
    search: 'Search plugins',
    none: 'No plugin matches that.',
    experimental: 'Experimental',
    stable: 'Stable',
    downloads: 'downloads last week',
    adaptersTitle: 'Adapters',
    adaptersText: 'Where it runs, where data and files go, and how people sign in.',
    back: 'All plugins',
    features: 'What it does',
    install: 'Install',
    config: 'In easy-cms.config.ts',
    docs: 'Read the guide',
    npm: 'On npm',
    trend: 'Downloads, last 30 days',
    downloadsNote: 'From npm. Counts include automated installs, such as CI.',
  },
  th: {
    meta: {
      title: 'Plugin',
      description: 'plugin ทั้งหมดของ Easy CMS แยกตามกลุ่ม: SEO, ฟอร์ม, AI, MCP, โพสต์โซเชียล, ร้านค้า, หลาย tenant, backup, อีเมล และ GraphQL เป็น MIT ทั้งหมด',
    },
    eyebrow: 'Plugin',
    title: 'เพิ่มสิ่งที่แอปต้องมี เป็น MIT ทั้งหมด',
    lede: 'แต่ละ plugin เป็นแพ็กเกจ npm ที่เพิ่มลงใน config ใช้บทบาท คิวงาน และหน้า admin เดียวกับส่วนอื่น จึงไม่มีอะไรต้องรันแยกจากแอป',
    all: 'ทั้งหมด',
    search: 'ค้นหา plugin',
    none: 'ไม่พบ plugin ที่ตรงกัน',
    experimental: 'ทดลอง',
    stable: 'เสถียร',
    downloads: 'ดาวน์โหลดสัปดาห์ที่แล้ว',
    adaptersTitle: 'Adapter',
    adaptersText: 'รันที่ไหน ข้อมูลและไฟล์ไปเก็บที่ไหน และผู้ใช้ล็อกอินอย่างไร',
    back: 'plugin ทั้งหมด',
    features: 'ทำอะไรได้บ้าง',
    install: 'ติดตั้ง',
    config: 'ใน easy-cms.config.ts',
    docs: 'อ่านคู่มือ',
    npm: 'บน npm',
    trend: 'ยอดดาวน์โหลด 30 วันล่าสุด',
    downloadsNote: 'ข้อมูลจาก npm ตัวเลขรวมการติดตั้งอัตโนมัติ เช่น CI',
  },
}
