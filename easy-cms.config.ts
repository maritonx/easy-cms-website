import { google } from '@easy-cms/auth-oauth'
import { consoleEmail, defineConfig } from '@easy-cms/core'
import { sqlite } from '@easy-cms/db-sqlite'
import { smtp } from '@easy-cms/email-smtp'
import { seoPlugin } from '@easy-cms/plugin-seo'
import { vercelBlobStorage } from '@easy-cms/storage-vercel-blob'

/**
 * The public address: absolute links in the sitemap, share tags and llms.txt. The Vercel address
 * until the project has a domain of its own.
 */
export const SITE_URL = process.env.SITE_URL ?? 'https://easy-cms-website.vercel.app'

/**
 * Where uploads go: Vercel Blob on Vercel, whose disk doesn't keep files (without a Blob store
 * uploads fail saying to connect one); the `uploads` folder everywhere else, such as a VPS.
 */
const onVercel = Boolean(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN)

/**
 * Sign in to the admin with Google, configured by GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
 * (production). Only people who already have an account get in, after linking Google on their
 * Account page; passwords stay for admins, as a way in when Google is down.
 *
 * The provider is always in the config, so the schema (its `user-identities` table) is the same
 * everywhere: production refuses to start when the config and the migrations differ. Without the
 * variables (development, previews, scripts) the Google button can't work, and everyone keeps
 * signing in with a password.
 */
const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
const googleProvider = google({
  clientId: process.env.GOOGLE_CLIENT_ID || 'not-configured',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-configured',
})

/** A post's address: Thai posts are under /th/blog, the rest under /blog. */
export const postPath = (doc: { slug?: unknown; language?: unknown }) =>
  doc.slug ? `${doc.language === 'th' ? '/th' : ''}/blog/${doc.slug}` : null

/**
 * IndexNow: tells Bing (which feeds ChatGPT search and Copilot), Yandex and others about a post the
 * moment it is published, changed or removed. The key is public by design: search engines check
 * it at /<key>.txt, served from public/.
 */
const INDEXNOW_KEY = '4a949fdd-6370-4270-b108-b6fa543cffbc'

/** Visitors see published documents; logged-in editors see drafts too. */
const publishedOrEditor = ({ user }: { user: unknown }) =>
  user ? true : { status: { equals: 'published' } }

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET ?? '',
  // A SQLite file (development, a VPS) or a Turso/libSQL URL with its token (serverless hosts).
  db: sqlite({
    url: process.env.DATABASE_URL ?? 'file:./cms.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  }),
  ...(onVercel ? { upload: { storage: vercelBlobStorage() } } : {}),
  // The public address: absolute media URLs, email links, the sitemap and robots.txt.
  serverURL: SITE_URL,
  // Invitations and password links through Gmail's SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER,
  // SMTP_PASSWORD with an app password, SMTP_FROM) where they're set; printed to the log
  // elsewhere. Always set, so the email queue's table is in the schema everywhere.
  email: process.env.SMTP_HOST ? smtp() : consoleEmail(),
  admin: { locale: 'en', siteURL: SITE_URL },
  auth: { providers: [googleProvider], ...(googleConfigured ? { password: false } : {}) },
  collections: [
    {
      slug: 'posts',
      labels: { singular: 'Post', plural: 'Posts' },
      admin: { icon: 'newspaper', order: 1 },
      drafts: true,
      versions: true,
      schedule: true,
      // Live preview in the admin: the page that shows a post.
      preview: ({ doc }) => postPath(doc),
      useAsTitle: 'title',
      access: { read: publishedOrEditor },
      fields: [
        { name: 'title', type: 'text', required: true },
        // Each post is written in one language, and listed on that language's blog. A Thai
        // title makes a Thai slug; type a Latin one for a shorter address.
        {
          name: 'language',
          type: 'select',
          required: true,
          defaultValue: 'en',
          options: [
            { label: 'English', value: 'en' },
            { label: 'ไทย', value: 'th' },
          ],
        },
        { name: 'slug', type: 'slug', from: 'title' },
        { name: 'excerpt', type: 'textarea', maxLength: 280 },
        {
          name: 'category',
          type: 'select',
          required: true,
          defaultValue: 'Release',
          options: ['Release', 'Guide', 'Engineering', 'Community'],
        },
        { name: 'publishedAt', type: 'date', required: true },
        { name: 'author', type: 'text', defaultValue: 'Kanawoot K.' },
        // Short monospace text drawn on the generated cover when there is no image.
        { name: 'coverText', type: 'text', maxLength: 24 },
        { name: 'cover', type: 'upload' },
        // The post at the top of /blog.
        { name: 'featured', type: 'boolean' },
        { name: 'body', type: 'richText' },
      ],
    },
    {
      slug: 'releases',
      labels: { singular: 'Release', plural: 'Releases' },
      admin: { icon: 'tag', order: 2 },
      drafts: true,
      useAsTitle: 'version',
      access: { read: publishedOrEditor },
      fields: [
        { name: 'version', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'date', type: 'date', required: true },
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'minor',
          options: ['patch', 'minor', 'major'],
        },
        { name: 'summary', type: 'textarea' },
        { name: 'changes', type: 'array', fields: [{ name: 'text', type: 'textarea', required: true }] },
        { name: 'packages', type: 'array', fields: [{ name: 'name', type: 'text', required: true }] },
        { name: 'needsMigration', type: 'boolean' },
      ],
    },
    {
      slug: 'showcase',
      labels: { singular: 'Showcase site', plural: 'Showcase' },
      admin: { icon: 'star', order: 3 },
      drafts: true,
      useAsTitle: 'name',
      access: { read: publishedOrEditor },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        { name: 'description', type: 'textarea', maxLength: 200 },
        { name: 'image', type: 'upload' },
        {
          name: 'stack',
          type: 'select',
          hasMany: true,
          options: ['Next.js', 'Nuxt', 'Standalone', 'Postgres', 'SQLite', 'S3 / R2'],
        },
        // Lower comes first.
        { name: 'order', type: 'number', defaultValue: 100 },
      ],
    },
  ],
  plugins: [
    seoPlugin({
      collections: ['posts'],
      globals: ['site'],
      generateTitle: ({ doc }) => (doc.title ? `${doc.title} · Easy CMS` : null),
      generateDescription: ({ doc }) => (doc.excerpt as string | undefined) ?? null,
      generateImage: ({ doc }) => (doc.cover as number | undefined) ?? null,
      generateURL: ({ doc, collection }) =>
        collection === 'posts' ? (postPath(doc) ? `${SITE_URL}${postPath(doc)}` : null) : `${SITE_URL}/`,
      // app/llms.txt builds its own file with the docs; this keeps the plugin's routes quiet.
      llms: false,
      indexNow: { key: INDEXNOW_KEY },
    }),
  ],
  globals: [
    {
      slug: 'site',
      access: { read: () => true },
      fields: [
        { name: 'siteName', type: 'text', defaultValue: 'Easy CMS' },
        {
          // The badge above the home page headline.
          name: 'announcement',
          type: 'group',
          fields: [
            { name: 'badge', type: 'text' },
            { name: 'label', type: 'text' },
            { name: 'href', type: 'text' },
          ],
        },
      ],
    },
  ],
})
