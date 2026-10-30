/** The blog's words: /blog in English, /th/blog in Thai. Posts themselves are in one language. */
export const BLOG_COPY = {
  en: {
    meta: {
      title: 'Blog',
      description: 'Release write-ups, guides for real projects, and the reasoning behind Easy CMS.',
    },
    eyebrow: 'Blog',
    title: 'Notes from building Easy CMS',
    lede: 'Release write-ups, guides for real projects, and the reasoning behind the design. Published from Easy CMS itself.',
    other: { href: '/th/blog', label: 'บทความภาษาไทย →' },
    empty: 'No posts yet. Publish one at `/admin`, or run `pnpm seed`.',
    minRead: (n: number) => `${n} min read`,
    read: (n: number) => `Read · ${n} min`,
    back: '← All posts',
    preview: 'Preview: readers don’t see this version until it’s published.',
    maintainer: 'Maintainer',
    filters: 'Filter posts',
    categories: { all: 'All', Release: 'Releases', Guide: 'Guides', Engineering: 'Engineering', Community: 'Community' },
    category: { Release: 'Release', Guide: 'Guide', Engineering: 'Engineering', Community: 'Community' },
  },
  th: {
    meta: {
      title: 'บล็อก',
      description: 'บทความภาษาไทยเกี่ยวกับ Easy CMS: เลือก CMS ให้ทีม ตั้งค่าใช้งานจริง และเรื่องเบื้องหลังการออกแบบ',
    },
    eyebrow: 'บล็อก',
    title: 'บทความภาษาไทย',
    lede: 'คู่มือสำหรับทีมไทย การเลือก CMS และการตั้งค่าใช้งานจริง เผยแพร่จาก Easy CMS เอง',
    other: { href: '/blog', label: 'Posts in English →' },
    empty: 'ยังไม่มีบทความภาษาไทย ระหว่างนี้อ่านบทความภาษาอังกฤษได้ที่ /blog',
    minRead: (n: number) => `อ่าน ${n} นาที`,
    read: (n: number) => `อ่าน · ${n} นาที`,
    back: '← บทความทั้งหมด',
    preview: 'ตัวอย่าง: ผู้อ่านจะยังไม่เห็นฉบับนี้จนกว่าจะเผยแพร่',
    maintainer: 'ผู้ดูแลโปรเจกต์',
    filters: 'กรองบทความ',
    categories: { all: 'ทั้งหมด', Release: 'Release', Guide: 'คู่มือ', Engineering: 'วิศวกรรม', Community: 'ชุมชน' },
    category: { Release: 'Release', Guide: 'คู่มือ', Engineering: 'วิศวกรรม', Community: 'ชุมชน' },
  },
} as const

export type BlogCopy = (typeof BLOG_COPY)[keyof typeof BLOG_COPY]

/** A category's label in a language; unknown ones as they are. */
export const categoryLabel = (category: string, locale: 'en' | 'th') =>
  (BLOG_COPY[locale].category as Record<string, string>)[category] ?? category
