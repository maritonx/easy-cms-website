---
title: "ย้ายเว็บ WordPress ด้วยสคริปต์ที่รันซ้ำได้จนถึงวันเปิดเว็บใหม่"
slug: wordpress-migration-th
language: th
category: Guide
publishedAt: 2026-12-21
coverText: "wp → easy-cms"
excerpt: "สคริปต์ import จาก WordPress REST API ที่รันซ้ำได้ ย้ายบทความ หมวดหมู่ รูป และทำ 301 จาก URL เดิม รวมถึง slug ภาษาไทย"
---
คนทำเว็บไทยหลายคนน่าจะมีเว็บ WordPress อยู่ในมืออย่างน้อยหนึ่งเว็บ และวันหนึ่งลูกค้าหรือทีมอาจอยากย้ายไปเป็น Nuxt หรือ Next.js ที่ทีมเขียนเองได้ทั้งหมด

วิธีที่คนส่วนใหญ่เริ่มคือ **Tools → Export** ได้ไฟล์ XML มาหนึ่งไฟล์ import เข้าระบบใหม่ แล้วใช้เวลาเป็นสัปดาห์ไล่แก้สิ่งที่ออกมาเพี้ยน ระหว่างนั้นทีมเนื้อหาก็ยังโพสต์บนเว็บเก่าต่อ พอถึงวันเปิดเว็บใหม่ ไฟล์ export ก็เก่าไปแล้ว ต้องมีคนนั่ง copy บทความล่าสุดด้วยมือ

ผมชอบอีกแบบมากกว่า คือเขียนสคริปต์ที่อ่านจากเว็บ WordPress ตัวจริงแล้วเขียนลง CMS ใหม่ และ**รันกี่รอบก็ได้** รอบแรกเอาไว้ดูว่าอะไรพัง แก้ mapping แล้วรันใหม่ พอถึงวันเปิดเว็บก็รันอีกรอบสุดท้าย บทความล่าสุดก็ตามมาเอง

บทความนี้จะไล่ดูสคริปต์แบบนั้น ปลายทางคือ [Easy CMS](https://github.com/maritonx/easy-cms) ซึ่งเป็น CMS ที่ฝังอยู่ในแอป Nuxt หรือ Next.js (เล่าไว้ใน[บทความแรกของซีรีส์](FIRST_POST_URL)) แต่แนวคิดใช้ได้กับ CMS ไหนก็ได้ที่มี API ให้เขียนโค้ดเรียก สคริปต์เต็มอยู่ใน[สูตร "ย้ายจาก WordPress"](/th/docs/recipes/wordpress) ในบทความนี้จะเน้นเฉพาะส่วนที่ทำให้รันซ้ำได้อย่างปลอดภัย และเรื่องที่เว็บภาษาไทยต้องระวังเป็นพิเศษ

[TODO: เรื่องของคุณ — หนึ่งบรรทัดเกี่ยวกับงานย้ายเว็บ WordPress ที่ไฟล์ export ตกรุ่นก่อนวันเปิดเว็บ หรือลบบรรทัดนี้]

## อ่านจาก REST API ไม่ต้องแตะฐานข้อมูล

เว็บ WordPress ทุกเว็บมี REST API อยู่ที่ `/wp-json/wp/v2/` อยู่แล้ว (เว้นแต่มี plugin ปิดไว้) ไม่ต้องติดตั้ง plugin ไม่ต้องขอ SSH หรือ dump ฐานข้อมูลจาก hosting ชี้สคริปต์ไปที่เว็บ production ได้เลย เพราะมันอ่านเฉพาะสิ่งที่ผู้เข้าชมเห็นอยู่แล้ว คือบทความและหน้าที่เผยแพร่แล้ว

สคริปต์ขอทีละ 100 รายการ (`per_page=100` ซึ่งเป็นค่าสูงสุดของ API) และหยุดตามจำนวนหน้าที่ WordPress บอกใน header `x-wp-totalpages` ส่วนบทความขอพร้อม `&_embed=wp:featuredmedia` เพื่อให้ URL และ alt ของรูปหน้าปกมาใน response เดียวกัน

## ทุกเอกสารจำไว้ว่ามาจากไหน

นี่คือหัวใจของทั้งหมด ทุก collection ที่ import เข้ามามี field `wpId` แบบ unique และสคริปต์ใช้มันจับคู่:

```ts
// easy-cms.config.ts (บางส่วน)
{
  slug: 'posts',
  drafts: true,
  useAsTitle: 'title',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'slug', from: 'title' },
    { name: 'body', type: 'richText' },
    // …excerpt, publishedAt, cover, categories
    { name: 'wpId', type: 'number', unique: true, admin: { position: 'sidebar' } },
  ],
},
```

```ts
// scripts/import-wordpress.ts (บางส่วน)
/** Creates or updates the document with this WordPress id. */
async function save(collection: 'categories' | 'posts' | 'pages', wpId: number, data: Record<string, unknown>) {
  const { docs } = await cms.find(collection, { where: { wpId: { equals: wpId } }, limit: 1, draft: true })
  return docs[0]
    ? cms.update(collection, docs[0].id, { ...data, wpId } as never)
    : cms.create(collection, { ...data, wpId } as never)
}
```

ทำไมใช้ id ของ WordPress ไม่ใช้ slug? เพราะ slug เปลี่ยนได้ ถ้าทีมเนื้อหาแก้ชื่อบทความบนเว็บเก่าระหว่างสองรอบ การ upsert ด้วย slug จะได้บทความซ้ำสองชิ้น ส่วน id ไม่เคยเปลี่ยน และ `unique` เป็นตาข่ายรองรับ ถ้าวันไหนโค้ดมี bug แล้วพยายามสร้างชิ้นเดิมซ้ำ ฐานข้อมูลจะไม่ยอม

`cms` ในที่นี้คือ Local API: `createEasyCMS(config)` จาก `@easy-cms/core` เรียกจากสคริปต์ Node ธรรมดาด้วย `npx tsx --env-file=.env scripts/import-wordpress.ts https://old-site.com` ไม่ผ่าน HTTP ไม่ต้องมี API key สคริปต์ทำงานในฐานะโค้ดของโปรเจกต์เอง มีสิทธิ์เต็ม

เรื่องเล็กแต่เว็บไทยเจอแน่: วันที่ สคริปต์ใช้ `date_gmt` (บวก `Z` ต่อท้าย) ไม่ใช้ `date` เพราะ `date` เป็นเวลาตาม timezone ที่ตั้งไว้ใน WordPress ซึ่งเว็บไทยมักเป็นเวลาไทย ถ้าเอา `date` มาถือเป็น UTC ตรงๆ เวลาโพสต์จะช้าไป 7 ชั่วโมง บทความที่โพสต์ตอนสี่ทุ่มจะกลายเป็นของตีห้าวันถัดไป

## รูปภาพ: โหลดครั้งเดียว แม้จะรันกี่รอบ

collection `media` ได้ field `wpUrl` แบบ unique เพิ่ม Easy CMS ตั้งใจไม่เก็บ URL ต้นทางของไฟล์ที่ดาวน์โหลดมาเอง เพื่อไม่ให้ทุกโปรเจกต์ต้อง migrate ตาราง media เพิ่ม สคริปต์จึงส่งไปเป็นข้อมูลของ field เอง:

```ts
// scripts/import-wordpress.ts (บางส่วน)
const media = new Map<string, { id: number | string; url: string } | null>()
async function upload(url: string, alt = '') {
  if (!media.has(url)) {
    const { docs } = await cms.find('media', { where: { wpUrl: { equals: url } }, limit: 1 })
    try {
      media.set(url, (docs[0] ?? (await cms.uploadFromURL(url, { alt, wpUrl: url }))) as never)
    } catch (error) {
      console.warn(`  image kept as a link: ${url} (${(error as Error).message})`)
      media.set(url, null)
    }
  }
  return media.get(url) ?? null
}
```

`Map` กันไม่ให้รูปเดิมถูกโหลดซ้ำในรอบเดียวกัน ส่วนการหาด้วย `wpUrl` กันการโหลดซ้ำข้ามรอบ ถ้าโหลดรูปไหนไม่ได้ สคริปต์ไม่หยุด รูปนั้นใช้ลิงก์เดิมไปก่อน และ warning บอกว่าเป็นรูปไหน

`cms.uploadFromURL()` คือการให้ server ไปดึง URL ซึ่งเป็นช่อง SSRF คลาสสิก มันจึงปฏิเสธ `localhost`, IP ภายใน และ link-local อย่าง IP metadata ของ cloud ตรวจซ้ำหลัง resolve DNS และทุกครั้งที่โดน redirect (ไม่เกิน 3 ครั้ง) และเลิกเมื่อเกิน 15 วินาทีหรือเกิน `maxFileSize` ถ้าเรียกจากสคริปต์ของเราเองไม่ต้องตั้งค่าอะไร ข้อควรรู้คือถ้าทดสอบกับ WordPress ที่รันในเครื่อง (เช่น LocalWP หรือ Docker) รูปจะอยู่บนที่อยู่ภายใน ต้องตั้ง `upload: { fromURL: { allowedHosts: ['localhost'], allowPrivate: true } }` ตอนทดสอบ แล้วเอาออกเมื่อเสร็จ เพราะมันเปิดช่อง **จากลิงก์** ใน admin ให้เข้าถึง network ภายในด้วย

## HTML เข้า rich text ออก

WordPress ส่ง HTML ที่ render แล้วมาให้ ส่วน Easy CMS เก็บ rich text เป็น Tiptap JSON ใช้ `@tiptap/html` แปลงใน Node ได้โดยไม่ต้องมี browser:

```ts
// scripts/import-wordpress.ts (บางส่วน)
const extensions = [StarterKit, Image]

async function richText(html: string) {
  const doc = generateJSON(html, extensions) as Node
  const visit = async (node: Node) => {
    if (node.type === 'image' && typeof node.attrs?.src === 'string') {
      const file = await upload(node.attrs.src, String(node.attrs.alt ?? ''))
      if (file) node.attrs.src = file.url
    }
    for (const child of node.content ?? []) await visit(child)
  }
  await visit(doc)
  return doc
}
```

รายการ extension เป็นตัวตัดสินว่าอะไรรอด markup ที่ไม่มี extension รองรับจะไม่ถูกเก็บ `<div>` ของ page builder ถูกแกะออกเหลือแต่ข้อความ `<iframe>` หายไปทั้งก้อน และไม่มีอะไรเตือน นี่คือสิ่งที่ต้องตรวจหลังรันรอบแรก (ดูตารางด้านล่าง)

title ก็ต้องระวัง WordPress แปลงขีดและเครื่องหมายคำพูดเป็น entity ทำให้ `title.rendered` ออกมาเป็น `Hello &#8211; world` สคริปต์จึงส่ง title และ excerpt ผ่าน parser ตัวเดียวกันแล้วเก็บเฉพาะข้อความ ได้ `Hello – world`

## Redirect จาก URL เดิม

URL เดิมทุกอันควรตอบ 301 ไปที่ URL ใหม่ ไม่อย่างนั้นลิงก์จากที่อื่นจะเสียและอันดับใน Google จะหาย สคริปต์เพิ่ม redirect หนึ่งอันต่อบทความหรือหน้า ด้วย `@easy-cms/plugin-redirects` เช่น `/2024/05/hello-world/` → `/blog/hello-world`

redirect ใช้หลักเดียวกับเอกสาร คือหาของที่รอบก่อนสร้างไว้ก่อน แล้วค่อยสร้างถ้ายังไม่มี แต่จะหาเจอก็ต่อเมื่อเอา path รูปเดียวกับที่เก็บไว้ไปหา plugin แปลง `from` ทุกอันเป็นรูปมาตรฐานก่อนบันทึก สคริปต์จึงส่ง path เดิมผ่าน `normalizePath()` ตัวเดียวกับที่ plugin export ออกมาก่อน:

```ts
// scripts/import-wordpress.ts (บางส่วน)
import { normalizePath } from '@easy-cms/plugin-redirects'

/** A 301 from the old address, when it differs from the new one. */
async function redirect(oldLink: string, to: string) {
  // The path as the plugin stores it: no trailing slash, and Thai text, `%e0%b8%aa…` and
  // `%E0%B8%AA…` all as `%E0%B8%AA…`, so the next run finds it.
  const from = normalizePath(new URL(oldLink).pathname)
  if (!from || from === normalizePath(to)) return
  const { totalDocs } = await cms.find('redirects', { where: { from: { equals: from } }, limit: 0 })
  if (!totalDocs) await cms.create('redirects', { from, to, type: '301' })
}
```

ถ้าข้ามขั้นนี้ การเช็กจะไม่เจอ เพราะลิงก์ของ WordPress มี `/` ท้ายซึ่ง plugin ตัดทิ้งตอนเก็บ รอบที่สองจึงพยายามสร้าง redirect เดิมซ้ำแล้วพังที่ column `from` ซึ่งเป็น unique ส่วน slug ภาษาไทยที่ WordPress สร้างจาก title ภาษาไทยถูกเก็บแบบ percent-encoded (`/%E0%B8%82…`) และตั้งแต่ 1.4.2 คำขอจะตรงกับ redirect ไม่ว่าจะเขียน escape เป็นตัวพิมพ์เล็ก `%e0%b8…` แบบลิงก์จาก WordPress หรือตัวพิมพ์ใหญ่ `%E0%B8…` แบบที่ browser ส่งมา

จากนั้นให้เว็บทำตาม redirect ใน Nuxt ใช้ server middleware:

```ts
// server/middleware/redirects.ts
import { resolveRedirect } from '@easy-cms/plugin-redirects'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  if (/^\/(_nuxt|api|admin)(\/|$)/.test(url.pathname)) return
  const redirect = await resolveRedirect(await useEasyCMS(), url)
  if (redirect) return sendRedirect(event, redirect.location, redirect.status)
})
```

ใน Next.js 16 ใช้คำสั่งเดียวกันใน `proxy.ts` ซึ่งทำงานบน Node.js redirect ทั้งหมดถูกอ่านครั้งเดียวแล้วเก็บในหน่วยความจำ และ query string ของผู้เข้าชม (เช่น `?utm_source=facebook`) ถูกส่งต่อไปด้วย

![รายการ redirect ใต้เมนูตั้งค่า เปิดหนึ่งรายการในแผงด้านข้าง](/screenshots/redirects-th-light.webp)

หน้ารวมหมวดหมู่ แท็ก และหน้ารวมตามวันที่ของเว็บเดิมไม่ได้ถูก redirect ให้ ถ้าหน้าไหนยังมีคนเข้า ให้เพิ่มเองใน **ตั้งค่า → การเปลี่ยนเส้นทาง**

## อะไรย้ายมาได้ อะไรไม่ได้

| ย้ายมาได้ | ย้ายมาไม่ได้ |
|---|---|
| title, slug, excerpt, วันที่ | แท็กและผู้เขียน (เพิ่มได้แบบเดียวกับหมวดหมู่) |
| ย่อหน้า หัวข้อ รายการ quote โค้ด ลิงก์ ตัวหนา ตัวเอียง | embed (YouTube, ทวีต) และ `<iframe>` อื่นๆ: หายไป |
| รูปในบทความ และรูปหน้าปก | layout จาก page builder (Elementor, Divi ฯลฯ): ข้อความมา คอลัมน์ไม่มา |
| หมวดหมู่ | custom field (ACF), เมนู, ความคิดเห็น |
| shortcode ในรูป HTML ที่ WordPress render แล้ว | เนื้อหาที่ยังไม่เผยแพร่ เว้นแต่จะเข้าสู่ระบบด้วย application password |

shortcode ต้องดูอีกรอบ REST API ส่งเนื้อหาที่ WordPress รัน shortcode แล้ว `[gallery]` ที่ยังใช้งานได้จึงมาเป็น HTML แต่ถ้า plugin เจ้าของ shortcode ถูกปิดไปแล้ว WordPress จะปล่อยข้อความไว้อย่างนั้น ได้ย่อหน้าที่เขียนว่า `[gallery id="1"]` ตรงๆ ก่อนเปิดเว็บ ลองรัน `richTextToPlainText()` จาก `@easy-cms/richtext` กับ body ที่ import มาแล้วหา `[` ที่หลงเหลือ

custom post type ย้ายได้แบบเดียวกันถ้าเปิดไว้ใน REST API (`show_in_rest`): เพิ่ม collection และชื่อใน REST ของมันลงใน loop

## วันเปิดเว็บ

1. รันในเครื่องด้วย `--limit 10` แล้วเปิดดูใน `/admin`: หัวข้อ รายการ รูป รูปหน้าปก หมวดหมู่
2. แก้ mapping แล้วรันใหม่ได้เรื่อยๆ เอกสารและรูปถูกอัปเดต ไม่ถูกสร้างซ้ำ redirect ที่มีอยู่แล้วก็คงไว้
3. สร้าง migration สำหรับ collection ใหม่ (`npx easy-cms migrate:create wordpress`) ฝั่ง production ให้รัน `easy-cms migrate` ก่อน แล้วรันสคริปต์ด้วยค่าของ production และ `NODE_ENV=production` เพื่อไม่ให้ schema ถูก push เข้าฐานข้อมูลนั้น ถ้า deploy บน serverless ต้องให้ไฟล์ไปที่ S3, R2 หรือ Vercel Blob ไม่ใช่โฟลเดอร์ในเครื่อง
4. backup รันรอบสุดท้าย แล้วสลับ DNS

มีสองเรื่องที่ตามมาจากการออกแบบนี้ ควรตกลงกับทีมก่อนเริ่ม ข้อแรก การรันซ้ำจะเขียนทับเอกสารที่ import มาด้วยข้อมูลจาก WordPress ทีมเนื้อหาจึงต้องเขียนบน WordPress ต่อไปจนถึงวันสลับ และยังไม่แก้บทความที่ import มาใน admin ใหม่ ข้อสอง สคริปต์มีแค่สร้างและอัปเดต บทความที่ลบใน WordPress จะยังอยู่ใน Easy CMS

![รายการบทความในหน้า admin ของ Easy CMS](/screenshots/posts-th-light.webp)

## เมื่อไรควรอยู่กับ WordPress ต่อ

ถ้าเว็บส่วนใหญ่เป็น WooCommerce, ระบบสมาชิก หรือ ACF หลายสิบกลุ่มที่ทีมเนื้อหาพึ่งพาอยู่ สคริปต์นี้ย้ายได้แค่ส่วนที่ง่าย ส่วนที่เหลือคือการสร้างใหม่ ไม่ใช่การ import ใช้ WordPress แบบ headless หรืออยู่ต่ออาจคุ้มกว่า ส่วน plugin ร้านค้าของ Easy CMS ยังเป็น experimental อย่าเพิ่งย้ายร้านค้ามาเพราะบทความนี้ สคริปต์แบบนี้เหมาะกับ blog เว็บบริษัท และเว็บเอกสาร ที่เนื้อหาเป็นบทความ หน้า หมวดหมู่ และรูป และเว็บใหม่เป็น Nuxt หรือ Next.js

แนวคิดนี้ใช้ได้แม้ไม่ใช้ Easy CMS: ให้ทุก record ที่ import มาเก็บ id ต้นทางพร้อม unique constraint, upsert ด้วย id นั้น, ให้ทุกขั้นที่มีผลข้างเคียงเช็กก่อนทำ และเทียบ URL ในรูปที่ normalize แล้วรูปเดียว แล้วการ import จะกลายเป็นคำสั่งที่รันได้ทุกวันจนถึงวันเปิดเว็บ ไม่ใช่งานครั้งเดียวที่ต้องลุ้น

---

Easy CMS เป็น open source แบบ MIT: [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสาร](/th/docs) ถ้าลองใช้แล้วติดตรงไหน บอกผมได้ใน [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137) เขียนสั้นๆ ภาษาไทยก็ได้

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
