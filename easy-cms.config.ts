import { defineConfig } from '@easy-cms/core'
import { sqlite } from '@easy-cms/db-sqlite'

/** Visitors see published documents; logged-in editors see drafts too. */
const publishedOrEditor = ({ user }: { user: unknown }) =>
  user ? true : { status: { equals: 'published' } }

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET ?? '',
  // A local SQLite file in development; a Turso/libSQL URL in production.
  db: sqlite({ url: process.env.DATABASE_URL ?? 'file:./cms.db' }),
  admin: { locale: 'en', menu: ['posts', 'releases', 'showcase', 'media'] },
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
