---
title: "ทำบล็อก Nuxt ให้ครบจนขึ้น production: draft, live preview, SEO และ deploy"
slug: nuxt-blog-end-to-end-th
language: th
category: Guide
publishedAt: 2026-11-09
coverText: "draft → deploy"
excerpt: "บล็อก Nuxt ที่มี content model จริง หน้าเว็บที่แยก draft ออกจากของที่เผยแพร่แล้ว live preview, SEO, sitemap และการ deploy พร้อม migration"
---
ติดตั้ง CMS แล้วรัน `npm run dev` จนเปิด `/admin` ได้ เป็นส่วนที่ง่ายที่สุดแล้ว งานจริงเริ่มหลังจากนั้น ใครบ้างที่ควรเห็น draft? editor จะเห็นหน้าเว็บจริงก่อนกด Publish ได้ไหม? Google เห็นอะไร? แล้วตอน deploy config ที่เปลี่ยนไป database จะเป็นยังไง?

บทความนี้ตอบคำถามพวกนี้ผ่านบล็อก Nuxt เล็ก ๆ หนึ่งตัว ในบล็อกมีบทความ หมวดหมู่ และข้อมูลเว็บไซต์ หน้าเว็บแสดงเฉพาะเนื้อหาที่เผยแพร่แล้ว editor มี draft กับ live preview มี SEO กับ sitemap แล้วปิดท้ายด้วยการ deploy พร้อม migration โค้ดตัดมาจาก [ตัวอย่าง Nuxt](https://github.com/maritonx/easy-cms/tree/main/examples/nuxt-blog) ใน repo ของ Easy CMS แนวคิดส่วนใหญ่ใช้ได้กับ CMS ที่เก็บข้อมูลใน database ทุกตัวที่อยู่หลังเว็บ Nuxt

ถ้ายังไม่รู้จัก Easy CMS อ่าน[บทความแรกของซีรีส์นี้](FIRST_POST_URL)ก่อนได้ สรุปสั้น ๆ คือมันเป็น headless CMS ที่รันอยู่ในแอป Nuxt หรือ Next.js ของเราเอง

## เตรียมโปรเจกต์

ต้องใช้ Node.js 22.19 ขึ้นไป

```bash
npx nuxi@latest init my-blog
cd my-blog
npx create-easy-cms --db sqlite --yes
npm install @easy-cms/richtext @easy-cms/plugin-seo
```

`create-easy-cms` จะใส่ module ของ Nuxt ให้ เขียน `easy-cms.config.ts` และสุ่ม `EASY_CMS_SECRET` ใส่ `.env` ระหว่างพัฒนา SQLite เก็บทุกอย่างไว้ในไฟล์ `cms.db` ไฟล์เดียว ยังไม่ต้องตั้ง database server

## ออกแบบ content model

บล็อกหนึ่งตัวต้องมีสามอย่าง คือหมวดหมู่ บทความ และการตั้งค่าเว็บอีกหนึ่งชุด อย่างหลังนี้ใน Easy CMS เรียกว่า *global* คือเอกสารที่มีชิ้นเดียว ไม่ใช่รายการ

```ts
// easy-cms.config.ts
import { defineConfig } from '@easy-cms/core'
import { sqlite } from '@easy-cms/db-sqlite'

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET ?? '',
  db: sqlite({ url: process.env.DATABASE_URL ?? 'file:./cms.db' }),
  collections: [
    {
      slug: 'categories',
      admin: { editIn: 'drawer' }, // collection เล็ก: แก้ใน panel ที่เปิดทับรายการ
      useAsTitle: 'name',
      access: { read: () => true },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'slug', from: 'name' },
      ],
    },
    {
      slug: 'posts',
      drafts: true, // draft / published
      versions: true, // ประวัติ และ draft ที่ไม่กระทบบทความที่ออนไลน์อยู่
      schedule: true, // ตั้งเวลาเผยแพร่หรือถอน
      preview: ({ doc }) => (doc.slug ? `/posts/${doc.slug}` : null),
      useAsTitle: 'title',
      access: {
        // คนทั่วไปเห็นเฉพาะที่เผยแพร่แล้ว editor ที่ล็อกอินเห็น draft ด้วย
        read: ({ user }) => (user ? true : { status: { equals: 'published' } }),
      },
      fields: [
        { name: 'title', type: 'text', required: true, maxLength: 120 },
        { name: 'slug', type: 'slug', from: 'title' },
        { name: 'excerpt', type: 'textarea', maxLength: 300 },
        { name: 'cover', type: 'upload' },
        { name: 'body', type: 'richText' },
        { name: 'category', type: 'relationship', to: 'categories', admin: { position: 'sidebar' } },
        { name: 'publishedAt', type: 'date', admin: { position: 'sidebar' } },
      ],
    },
  ],
  globals: [
    {
      slug: 'site',
      access: { read: () => true },
      fields: [
        { name: 'siteName', type: 'text', defaultValue: 'บล็อกของฉัน' },
        { name: 'tagline', type: 'text' },
      ],
    },
  ],
})
```

มีสองจุดที่สำคัญกว่าที่เห็น

- **เนื้อหาสาธารณะต้องเขียน `access` เอง** ถ้าไม่ได้กำหนด rule ไว้ จะมีแค่ user ที่ล็อกอินแล้วที่อ่านได้ หมวดหมู่กับ global `site` เลยต้องเปิดให้อ่านได้อย่างตั้งใจ
- **rule `read` ของ posts คืนค่าเป็น query ไม่ใช่ boolean** สำหรับคนที่ไม่ได้ล็อกอิน มันจะเติมเงื่อนไข `status = published` ให้ทุกการอ่าน รวมถึง REST API ที่ `/api/cms/posts` ด้วย เราเลยไม่มีทางลืมใส่ filter ใน endpoint ใด endpoint หนึ่ง

ตอน dev database จะปรับตาม config เอง field ใหม่กลายเป็น column ตอน server start เปิด `/admin` สร้าง admin คนแรก แล้วลองเขียนบทความภาษาไทยดูสักเรื่อง

## หน้าเว็บที่แสดงเฉพาะสิ่งที่คนทั่วไปควรเห็น

ใน server route ของ Nuxt มี `useEasyCMS()` ให้ใช้เลยโดยไม่ต้อง import route รายการบทความเขียนง่าย เพราะ `find` คืนเฉพาะเอกสารที่เผยแพร่แล้ว ถ้าเราไม่ได้ขอ draft

```ts
// server/api/posts/index.get.ts
export default defineEventHandler(async () => {
  const cms = await useEasyCMS()
  const { docs } = await cms.find('posts', { sort: '-publishedAt', limit: 20 })
  // ส่งไปเฉพาะที่หน้ารายการใช้ ไม่ต้องส่ง body ของทุกบทความ
  return docs.map((post) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: typeof post.category === 'object' ? post.category?.name : null,
  }))
})
```

route ของบทความเดี่ยวคือจุดที่บั๊กมักซ่อนอยู่ editor ควรเห็น draft บนหน้าจริง แต่คนทั่วไปต้องไม่เห็น และทั้งสองฝั่งเปิด URL เดียวกัน

```ts
// server/api/posts/[slug].get.ts
export default defineEventHandler(async (event) => {
  const cms = await useEasyCMS()
  const user = await useEasyCMSUser(event) // user ที่ล็อกอินอยู่ หรือ null
  const { docs } = await cms.find('posts', {
    where: { slug: { equals: getRouterParam(event, 'slug') } },
    limit: 1,
    user,
    overrideAccess: false, // ให้ rule read ของ collection เป็นคนตัดสิน
    draft: user !== null, // editor ได้ draft ที่ยังไม่เผยแพร่
  })
  if (!docs[0]) throw createError({ statusCode: 404 })
  return docs[0]
})
```

option ของ Local API ที่เกี่ยวกับเรื่องนี้ และค่า default ของแต่ละตัว

| Option | Default | ทำไมถึงสำคัญ |
|---|---|---|
| `overrideAccess` | `true` | Local API เชื่อโค้ดฝั่ง server และข้าม access rule ทั้งหมด |
| `user` | `null` | ตรวจ rule ในนามของใคร |
| `draft` | `false` | รวม draft ด้วย ถ้าเปิด versions จะได้ draft ที่รอเผยแพร่ของบทความที่ออนไลน์อยู่ |
| `depth` | `1` | ดึง `category` มาเป็น object ได้ชื่อหมวดหมู่ ไม่ใช่แค่ id |

กับดักอยู่ที่แถวแรก ถ้าเขียน `draft: true` แต่ปล่อย `overrideAccess` เป็นค่า default ใครก็อ่าน draft ได้แค่เดา slug ให้ถูก การส่ง `user` คู่กับ `overrideAccess: false` ทำให้ rule เดียวกับที่คุม REST API มาคุมหน้าเว็บของเราด้วย CMS ที่มี API รันในโปรเซสเดียวกับแอปมักมี default แบบนี้เหมือนกัน ไม่ว่าจะใช้ตัวไหนก็ควรเช็กให้ดี

ชื่อเว็บก็ใช้วิธีเดียวกัน route หนึ่งคืน `cms.findGlobal('site')` แล้ว `app.vue` ดึงไปแสดงที่ header และใส่ใน `useHead`

## Draft ที่ไม่ทำให้บทความที่ออนไลน์อยู่หายไป

พอเปิด `drafts: true` บทความใหม่จะเริ่มเป็น draft ตอนเป็น draft ระบบยังไม่บังคับ `required` editor เลยบันทึกบทความที่เขียนไม่เสร็จได้ ส่วนตอนกด Publish ระบบจะตรวจทุกอย่าง

`versions: true` เป็น option ที่ข้ามไปได้ง่าย แต่ผมแนะนำให้เปิดในบล็อกทุกตัว ถ้าไม่มี versions เอกสารจะมีอยู่ชุดเดียว การบันทึกบทความที่เผยแพร่แล้วเป็น draft จึงเท่ากับ*ถอนบทความออกจากเว็บ* แต่ถ้าเปิด versions ระบบจะเก็บ draft แยกไว้ข้างบทความตัวจริง เว็บยังแสดงเวอร์ชันที่เผยแพร่อยู่ และ admin จะขึ้นว่ามี **Unpublished changes** ทุกครั้งที่บันทึกจะเก็บเข้าแผง **History** (default 50 เวอร์ชันต่อเอกสาร) และกู้คืนเวอร์ชันไหนก็ได้

![หน้าแก้ไขบทความใน admin พร้อมแผงเผยแพร่และประวัติ](/screenshots/edit-th-light.webp)

`schedule: true` จะเพิ่มปุ่ม **Schedule** เช่น ตั้งให้บทความขึ้นตอน 9 โมงเช้าพรุ่งนี้ Nuxt server ที่รันค้างไว้จะเช็กงานที่ถึงเวลาเองทุกนาที แต่บน serverless ไม่มีโปรเซสไหนรันค้าง ต้องมี cron มาเรียก `/api/cms/jobs/run` แทน เดี๋ยวจะพูดถึงอีกทีในส่วน deploy

## Live preview

function `preview` ใน config บอก admin ว่าบทความนี้แสดงอยู่ที่หน้าไหน ส่วนหน้าเว็บเพิ่มแค่บรรทัดเดียว

```vue
<script setup lang="ts">
import { renderRichText } from '@easy-cms/richtext'

const route = useRoute()
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`, {
  headers: useRequestHeaders(['cookie']), // ให้ editor เห็น draft ของตัวเอง
})
useLivePreview(post) // auto-import; นอก admin จะไม่ทำอะไร
const html = computed(() => renderRichText(post.value?.body))
</script>

<template>
  <article v-if="post">
    <p v-if="post.status === 'draft'"><strong>Draft preview</strong></p>
    <h1>{{ post.title }}</h1>
    <div v-html="html" />
  </article>
</template>
```

พอ editor กด **Preview** admin จะเปิดหน้าเว็บจริงใน frame ข้าง ๆ ฟอร์ม ทุกครั้งที่แก้ฟอร์ม admin จะส่งข้อมูลไปที่ `POST /api/cms/posts/:id/preview` server คืนเอกสารกลับมาเหมือนการอ่านปกติ (populate relationship ให้ด้วย) โดยไม่บันทึกอะไรเลย จากนั้น admin ส่งเอกสารนั้นเข้า frame ด้วย `postMessage` แล้ว `useLivePreview` ก็เอาไปใส่ใน ref หน้าเว็บจึง render ใหม่

![Live preview ข้างฟอร์มแก้ไข](/screenshots/preview-th-light.webp)

ข้อบังคับที่ live preview ทำให้เราต้องทำ ใช้ได้กับทุกโปรเจกต์ คือ **render จากเอกสารที่ได้รับ ไม่ใช่จาก database** หน้าเว็บได้ rich text มาเป็น JSON `renderRichText` จึงต้องรันใน browser ได้ด้วย มัน escape ข้อความและตัด URL ที่ไม่ปลอดภัยออก การใช้ `v-html` ตรงนี้จึงปลอดภัย และมีแค่ user ที่มีสิทธิ์แก้บทความเท่านั้นที่ preview ได้

## SEO และ sitemap

plugin SEO จะเพิ่ม group `meta` (title, description, รูปตอนแชร์ และ "Hide from search engines") ให้ collection หรือ global ที่เราเลือก ในตัวอย่างนี้ใส่แค่ posts

```ts
// easy-cms.config.ts (เพิ่มใน config ด้านบน)
import { seoPlugin } from '@easy-cms/plugin-seo'

  admin: { siteURL: process.env.SITE_URL }, // ที่อยู่จริงของเว็บ ใช้ใน sitemap
  plugins: [
    seoPlugin({
      collections: ['posts'],
      generateTitle: ({ doc }) => `${doc.title} | บล็อกของฉัน`,
      generateDescription: ({ doc }) => doc.excerpt,
      generateImage: ({ doc }) => doc.cover,
      generateURL: ({ doc }) => (doc.slug ? `/posts/${doc.slug}` : null),
    }),
  ],
```

`doc` ใน generator ไม่ได้มี type ตาม collection เพราะ plugin ถูกสร้างก่อน config ที่มันอยู่ข้างใน เลยคืน field ตามที่อ่านได้ไปตรง ๆ ไม่ต้อง cast: ข้อความสำหรับ title, description และที่อยู่ของหน้า ส่วนรูปคืนเป็น id ของ media หรือ media document ทั้งก้อนก็ได้ ถ้าคืนค่าแบบอื่น plugin จะถือว่าไม่มีอะไรแนะนำ

editor จะได้แถบวัดความยาว (default คือ title 50–60 ตัวอักษร และ description 100–150 ตัวอักษร) ตัวที่คนเขียนภาษาไทยน่าจะชอบคือ ตัวนับนี้นับพยัญชนะกับสระบนล่างและวรรณยุกต์เป็นตัวเดียว ไม่นับเกินเหมือน `.length` ของ JavaScript นอกจากนี้ยังมีตัวอย่างผลค้นหา และปุ่ม Generate ที่ส่งฟอร์มที่ยังไม่บันทึกไปให้ generator ของเราบน server

![ฟิลด์ SEO พร้อมแถบวัดความยาวและตัวอย่างผลค้นหา](/screenshots/seo-th-light.webp)

ฝั่งหน้าเว็บ `seoMeta` อ่านค่าจาก field เหล่านี้ ถ้าว่างก็ใช้ title กับ excerpt ของบทความแทน

```ts
// app/pages/posts/[slug].vue ต่อจาก useFetch
import { seoMeta } from '@easy-cms/plugin-seo'

const seo = seoMeta(post.value ?? {}, {
  siteURL: useRequestURL().origin,
  url: (p) => `/posts/${p.slug}`,
  type: 'article',
})
useSeoMeta(seo.nuxt) // title, description, Open Graph, robots
useHead(seo.head) // canonical link, BlogPosting JSON-LD
```

`useRequestURL()` ใช้ได้ถ้าทุกหน้า render ใหม่ทุก request แต่ถ้ามี CDN cache หน้าเว็บไว้ ให้ส่งที่อยู่จริงของเว็บแทน ด้วยเหตุผลเดียวกับ sitemap ด้านล่าง คือ header `Host` มาจากฝั่ง client

sitemap เป็น server route หนึ่งไฟล์

```ts
// server/routes/sitemap.xml.ts
import { sitemapXml } from '@easy-cms/plugin-seo'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return sitemapXml(await useEasyCMS(), { page: getQuery(event).page as string | undefined })
})
```

sitemap อ่านบทความ*ในฐานะคนทั่วไป* คือไม่ได้ล็อกอิน draft เลยไม่หลุดเข้าไป อะไรที่ rule `read` ซ่อนไว้ หรือบทความที่ติ๊ก "Hide from search engines" ก็ไม่หลุดเหมือนกัน ถ้ามีเกิน 50,000 URL มันจะแตกเป็น sitemap index ให้เอง URL ใน sitemap ต้องเป็น absolute ซึ่งเป็นหน้าที่ของ `admin.siteURL` ตอนพัฒนาให้ใส่ `SITE_URL=http://localhost:3000` ใน `.env` พอขึ้น production ก็เปลี่ยนเป็นที่อยู่จริง ถ้าไม่ได้ตั้ง พอมีบทความเผยแพร่แล้ว sitemap จะตอบ 500 พร้อม error ที่บอกให้ไปตั้ง `admin.siteURL` อย่าเอาที่อยู่มาจาก request แทน เพราะ client ส่ง header `Host` เป็นอะไรก็ได้ และ sitemap มักถูก cache ไว้ ตัวอย่าง Nuxt ใน repo เองก็เคยทำแบบนั้น จนมาแก้ใน 1.4.2 ส่วน `robotsTxt` จาก package เดียวกันจะกัน crawler ออกจาก `/admin/` และ `/api/cms/` แต่ยังให้โหลดรูปที่อัปโหลดไว้ได้

จุดที่น่าเอาไปใช้: ที่อยู่ของบทความถูกกำหนดที่ `generateURL` ที่เดียว ตัวอย่างผลค้นหาใน admin, sitemap และลิงก์ hreflang ใช้ค่าจากตรงนี้ทั้งหมด ทั้งสามที่จึงไม่มีวันชี้ไปคนละ URL

## Migration: จุดที่ dev กับ production ต่างกัน

plugin SEO เพิ่ม column ใน `ecms_posts` ตอน dev มันเพิ่มให้เอง แต่ใน production ไม่มีอะไรเปลี่ยน schema เองเลย ถ้ามี migration ค้างอยู่ หรือ config เปลี่ยนแต่ไม่มี migration ตาม Easy CMS จะไม่ยอม start โดย API จะตอบ 500 และ log จะบอกว่าต้องรันคำสั่งอะไร

```bash
npx easy-cms migrate:create init   # หลังสร้าง model แรก และทุกครั้งที่แก้
git add easy-cms/migrations        # อ่าน SQL ก่อน แล้วค่อย commit
npx easy-cms migrate               # บนเครื่องที่ deploy ก่อนเวอร์ชันใหม่ start
npx easy-cms migrate:status        # ดูว่าอันไหนรันแล้ว อันไหนค้าง
```

ตัวอย่าง Nuxt มี migration 22 ชุด ตั้งแต่ `20260925091723_init` ถึง `20261009020143_audit_scope` แต่ละชุดเป็นไฟล์ `.sql` คู่กับ snapshot ของ schema เป็น `.json` ส่วนใหญ่สั้นแค่นี้

```sql
-- easy-cms/migrations/20261004041909_category_color.sql
-- Easy CMS migration 20261004041909_category_color (sqlite)
-- Generated from the config; review before deploying.
ALTER TABLE `ecms_categories` ADD `color` text;
```

ประวัตินี้ยังบอกด้วยว่าการเปลี่ยนแบบไหนต้องมี migration เพิ่ม field ต้องมี เปิด feature ก็ต้องมี เช่น `versions` สร้างตาราง `ecms_document_versions` และ `schedule` สร้าง `ecms_scheduled_jobs` การอัปเกรด Easy CMS เองก็อาจต้องมีด้วย เช่น checkbox "Hide from search engines" ของ plugin SEO มาเป็น column ใหม่ชื่อ `meta_noindex`

สามเรื่องที่ควรรู้ก่อน deploy ครั้งแรก

- **ตอน dev การเปลี่ยนชื่อ field ทำให้ข้อมูลหาย** ระบบจะ drop column เก่าแล้วเพิ่ม column ใหม่ ถ้าข้อมูลสำคัญ ให้รัน `migrate:create` ใน terminal มันจะถามว่า field ที่หายไปถูกเปลี่ยนชื่อหรือเปล่า
- **database ที่ถูกสร้างจากการ sync ตอน dev รับ migration ไม่ได้** ให้รัน migration กับ database ใหม่ อย่า copy `cms.db` จากเครื่องตัวเองขึ้น server
- **migration แต่ละชุดรันใน transaction เดียว** ถ้าพังกลางทาง จะ rollback และไม่ถูกบันทึกว่ารันแล้ว

## Deploy Nuxt build

แบบที่ถูกที่สุดและใช้ได้จริงคือ Linux server เครื่องเดียว เก็บ SQLite กับไฟล์อัปโหลดไว้บน disk server ที่รันค้างไว้จะจัดการงานที่ตั้งเวลาไว้เองด้วย คู่มือ VPS ใช้ systemd unit ที่รัน migrate ก่อน start ทุกครั้ง

```ini
# /etc/systemd/system/easy-cms.service (บางส่วน)
[Service]
User=cms
WorkingDirectory=/srv/site
Environment=NODE_ENV=production
EnvironmentFile=/srv/site/.env
ExecStartPre=/usr/bin/npx easy-cms migrate
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
```

แต่ละบรรทัดมีไว้กันความผิดพลาดที่เจอกันบ่อย

- **production server ของ Nuxt ไม่อ่าน `.env`** ถ้าไม่มี `EnvironmentFile` API จะตอบ 500 และ log ขึ้นว่า `secret: is required`
- **ต้อง start จาก root ของโปรเจกต์** `file:./cms.db`, migration และ `uploads/` อ้างอิงจาก working directory
- **build บน OS และ architecture เดียวกับ server** driver ของ SQLite มีไฟล์ native ติดมาด้วย build บน Mac แล้วเอาขึ้น Linux จะใช้ไม่ได้

ตั้ง `EASY_CMS_SETUP_CODE` ไว้จนกว่าจะสร้าง admin คนแรกเสร็จ ไม่อย่างนั้นใครเปิด `/admin` ของเว็บใหม่ก่อนก็ตั้งตัวเองเป็น admin ได้ ถ้าวางไว้หลัง Caddy หรือ nginx ให้ใส่ `easyCms: { trustProxy: true }` ใน `nuxt.config.ts` เพื่อให้การจำกัดจำนวนครั้ง login เห็น IP ของผู้ใช้แต่ละคน

serverless ก็ใช้ได้ แต่ต้องมีชิ้นส่วนเพิ่ม

| | Server เครื่องเดียว (VPS, Docker) | Vercel / Netlify |
|---|---|---|
| Database | ไฟล์ SQLite บน disk หรือ Postgres | Postgres แบบ hosted (Neon, Netlify Database) หรือ Turso บน Vercel |
| ไฟล์อัปโหลด | `uploads/` บน disk | Vercel Blob, Netlify Blobs หรือ S3 |
| บทความที่ตั้งเวลา | server รันเองทุกนาที | cron เรียก `/api/cms/jobs/run` พร้อม `CRON_SECRET` |
| Migration | `ExecStartPre` หรือก่อน `node` ใน container | ก่อน build: `npx easy-cms migrate && npm run build` |

บน Vercel แพ็กเกจ Hobby cron รันได้วันละครั้งเท่านั้น บทความที่ตั้งไว้ 9 โมงอาจขึ้นช้าไปหลายชั่วโมง ถ้าไม่มีอย่างอื่นมาเรียก endpoint และ edge runtime ยังไม่รองรับเลย

[TODO: เรื่องของคุณ — ถ้าทำบล็อก Nuxt เล็ก ๆ ให้ลูกค้าไทย จะเลือก host ไหนและเพราะอะไร, 1 บรรทัด]

## สิ่งที่อยากบอกก่อนเริ่ม

- **editor แก้ content model เองไม่ได้** field เป็นโค้ด การเพิ่ม field หนึ่งตัวจึงต้องมี developer, migration และ deploy นี่คือแนวคิดของ CMS แบบ code-first แต่ก็เป็นต้นทุนจริงสำหรับทีมที่อยากเพิ่ม field เอง
- **วางแผน database ให้เข้ากับ host** SQLite บน disk ง่ายมาก จนวันที่ย้ายไป serverless แล้วต้องเปลี่ยนเป็น Postgres หรือ Turso คำสั่ง `easy-cms copy` ย้ายเนื้อหาข้าม database ได้ แต่เลือกให้ถูกตั้งแต่แรกง่ายกว่า
- **เปิด versions ตั้งแต่แรก** มาเปิดทีหลังก็แค่ migration เพิ่มอีกชุด แต่ระหว่างที่ยังไม่เปิด การบันทึก draft จะถอนบทความที่ออนไลน์อยู่ออก

[tutorial](/th/docs/tutorial) มีขั้นตอนเดียวกันสำหรับ Next.js ด้วย ส่วนตัวอย่างใน repo ยังมีหน้าซ้อนหน้า (nested pages) ฟอร์มที่สร้างใน admin, redirect และบทความสองภาษาไทยกับอังกฤษ

---

Easy CMS เป็น open source แบบ MIT: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสาร](/th/docs) ถ้าลองใช้แล้วติดตรงไหน บอกผมได้ที่ [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137) เขียนสั้น ๆ ภาษาไทยก็ได้

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
