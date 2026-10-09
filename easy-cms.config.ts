import { defineConfig } from '@easy-cms/core'
import { sqlite } from '@easy-cms/db-sqlite'
import { seoPlugin } from '@easy-cms/plugin-seo'
import { vercelBlobStorage } from '@easy-cms/storage-vercel-blob'

/** The public address: absolute links in the sitemap, share tags and llms.txt. */
export const SITE_URL = process.env.SITE_URL ?? 'https://easy-cms.io'

/**
 * Where uploads go: Vercel Blob on Vercel, whose disk doesn't keep files (without a Blob store
 * uploads fail saying to connect one); the `uploads` folder everywhere else, such as a VPS.
 */
const onVercel = Boolean(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN)

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
  admin: { locale: 'en', siteUrl: SITE_URL, menu: ['posts', 'releases', 'showcase', 'media'] },
  collections: [
    {
      slug: 'posts',
      labels: { singular: 'Post', plural: 'Posts' },
      icon: 'newspaper',
      drafts: true,
      versions: true,
      schedule: true,
      // Live preview in the admin: the page that shows a post.
      preview: ({ doc }) => (doc.slug ? `/blog/${doc.slug}` : null),
      useAsTitle: 'title',
      access: { read: publishedOrEditor },
      fields: [
        { name: 'title', type: 'text', required: true },
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
      icon: 'tag',
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
      icon: 'star',
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
      position: 'sidebar',
      generateTitle: ({ doc }) => (doc.title ? `${doc.title} · Easy CMS` : null),
      generateDescription: ({ doc }) => (doc.excerpt as string | undefined) ?? null,
      generateImage: ({ doc }) => (doc.cover as number | undefined) ?? null,
      generateURL: ({ doc, collection }) =>
        collection === 'posts' ? (doc.slug ? `${SITE_URL}/blog/${doc.slug}` : null) : `${SITE_URL}/`,
      // app/llms.txt builds its own file with the docs; this keeps the plugin's routes quiet.
      llms: false,
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
