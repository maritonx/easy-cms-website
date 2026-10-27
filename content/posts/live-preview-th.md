---
title: "ทำ live preview แบบไม่ต้องบันทึกใน Nuxt และ Next.js พร้อมกลไกเบื้องหลัง"
slug: live-preview-th
language: th
category: Guide
publishedAt: 2026-12-07
coverText: "postMessage"
excerpt: "ให้ editor เห็นหน้าเว็บจริงข้างฟอร์ม อัปเดตตามที่พิมพ์ก่อนบันทึก วิธีตั้งค่าใน Nuxt และ Next.js และกลไก postMessage ที่อยู่ข้างหลัง"
---
editor แก้หัวข้อข่าวแล้วอยากรู้ว่าบนหน้าเว็บจริงมันตัดบรรทัดตรงไหน กับเว็บภาษาไทยเรื่องนี้ยิ่งต้องดู เพราะภาษาไทยไม่มีช่องว่างระหว่างคำ จุดที่ขึ้นบรรทัดใหม่ขึ้นกับการตัดคำของ browser และ font ที่ใช้ หัวข้อที่ดูดีในช่องกรอกอาจขาดกลางวลีบนหน้าจริงก็ได้ ซึ่งต้องเห็นเองถึงจะรู้

ในระบบส่วนใหญ่ วิธีดูคือบันทึก draft เปิด URL preview ในอีกแท็บ แล้วกด reload ทำแบบนี้ยี่สิบรอบ ประวัติเวอร์ชันก็มีเวอร์ชันที่ไม่มีใครอยากได้เพิ่มมาอีกยี่สิบอัน

ผมอยากให้ editor เห็นหน้าเว็บจริงอยู่ข้างฟอร์ม อัปเดตตามที่พิมพ์ โดยไม่บันทึกอะไรเลย บทความนี้จะแสดงวิธีตั้งค่าในหน้า Nuxt และหน้า Next.js ด้วย [Easy CMS](https://github.com/maritonx/easy-cms) ซึ่งเป็น CMS แบบฝังในแอปที่ผมเล่าไว้ใน[บทความแรกของซีรีส์นี้](FIRST_POST_URL) ส่วนครึ่งหลังอธิบายว่ามันทำงานยังไง: iframe, `postMessage`, handshake และ token ที่ลงลายเซ็นไว้ ส่วนนี้เอาไปใช้กับ CMS หรือ framework ไหนก็ได้

![หน้า admin ของ Easy CMS มีฟอร์มแก้ไขอยู่ด้านซ้าย และหน้าเว็บจริงอยู่ด้านขวา](/screenshots/preview-th-light.webp)

## ขั้นที่ 1: บอก CMS ว่าเอกสารแสดงอยู่ที่หน้าไหน

เพิ่มฟังก์ชัน `preview` ให้ collection ฟังก์ชันนี้คืนหน้าที่แสดงเอกสารนั้น จะเป็น path บนเว็บ, URL แบบเต็ม หรือ `null` ถ้ายังไม่มีหน้าก็ได้

```ts
// easy-cms.config.ts (inside defineConfig)
{
  slug: 'posts',
  drafts: true,
  // live preview ในหน้า admin: หน้าที่แสดงโพสต์นี้
  preview: ({ doc }) => (doc.slug ? `/posts/${doc.slug}` : null),
  fields: [/* … */],
}
```

ฟังก์ชันนี้รันบน server เพราะฟังก์ชันส่งไปให้ browser ไม่ได้ หน้า admin จึงรู้แค่ว่า collection นี้มี preview แล้วค่อยถาม server ว่า URL คืออะไร จากนั้น admin จะมีปุ่ม **Preview** ซึ่งเปิดหน้าเว็บใน frame ข้างฟอร์ม global ก็ใช้ option เดียวกันได้

## ขั้นที่ 2: หน้า Nuxt

หน้าเว็บต้องอ่าน draft ได้ ไม่อย่างนั้น preview ของโพสต์ที่ยังไม่เคย publish จะขึ้น 404 ใน example ของ Nuxt ตัว server route ส่ง user ที่ login อยู่ไปให้ Local API และดึง draft มาเฉพาะเมื่อมี user เท่านั้น:

```ts
// server/api/posts/[slug].get.ts
export default defineEventHandler(async (event) => {
  const cms = await useEasyCMS()
  const user = await useEasyCMSUser(event)
  const { docs } = await cms.find('posts', {
    where: { slug: { equals: getRouterParam(event, 'slug') } },
    limit: 1,
    overrideAccess: false,
    user,
    draft: user !== null,
  })
  const post = docs[0]
  if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  return post
})
```

ฝั่งหน้าเว็บส่ง ref ของข้อมูลให้ `useLivePreview` ซึ่ง Nuxt module auto-import ให้แล้ว:

```vue
<script setup lang="ts">
import { renderRichText } from '@easy-cms/richtext'

const route = useRoute()
const { data: post } = await useFetch(`/api/posts/${route.params.slug}`, {
  headers: useRequestHeaders(['cookie']),
})
useLivePreview(post)
const html = computed(() => renderRichText(post.value?.body))
</script>

<template>
  <article v-if="post">
    <p v-if="post.status === 'draft'"><strong>Draft preview</strong></p>
    <h1>{{ post.title }}</h1>
    <div class="body" v-html="html" />
  </article>
</template>
```

มีสองจุดที่สำคัญ:

- `useRequestHeaders(['cookie'])` ส่งต่อ session cookie ของ editor ตอน server render ถ้าไม่ใส่ `useFetch` ฝั่ง server จะรันในฐานะผู้เข้าชมที่ไม่ได้ login และมองไม่เห็น draft
- rich text ถูก render ใน `computed` จึง render ใหม่ทุกครั้งที่ `post` เปลี่ยน `renderRichText` ทำงานใน browser ได้ด้วย และมัน escape ข้อความกับตัด URL ที่ไม่ปลอดภัยออก ใช้ `v-html` ตรงนี้จึงรับได้

นอก frame ของหน้า admin `useLivePreview` ไม่ทำอะไรเลย หน้าเดียวกันนี้จึงใช้กับผู้เข้าชมจริงได้ตามปกติ

## ขั้นที่ 3: หน้า Next.js

ใน Next.js เราโหลดโพสต์ใน Server Component แล้ว render ใน Client Component ฝั่งโหลดข้อมูลหน้าตาเหมือน route ของ Nuxt:

```tsx
// app/posts/[slug]/page.tsx
import { getEasyCMS, getEasyCMSUser } from '@easy-cms/next'
import { notFound } from 'next/navigation'
import config from '@/easy-cms.config'
import { PostView } from './post-view'

export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cms = await getEasyCMS(config)
  const user = await getEasyCMSUser(config)
  const { docs } = await cms.find('posts', {
    where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1,
    overrideAccess: false,
    user,
    draft: user !== null,
  })
  if (!docs[0]) notFound()
  return <PostView post={docs[0]} />
}
```

ฝั่ง render รับเอกสารจาก server มาเป็นค่าเริ่มต้น:

```tsx
// app/posts/[slug]/post-view.tsx
'use client'

import { useLivePreview } from '@easy-cms/next/live-preview'
import { type RichTextInput, renderRichText } from '@easy-cms/richtext'

interface Post {
  title: string
  status?: string
  body?: RichTextInput | null
}

export function PostView({ post: initial }: { post: Post }) {
  const post = useLivePreview(initial)
  return (
    <article>
      {post.status === 'draft' ? <p><strong>Draft preview</strong></p> : null}
      <h1>{post.title}</h1>
      <div className="body" dangerouslySetInnerHTML={{ __html: renderRichText(post.body) }} />
    </article>
  )
}
```

`@easy-cms/next/live-preview` ถูก build เป็นไฟล์แยกที่มี `'use client'` อยู่บรรทัดแรก แยกจาก entry `@easy-cms/next` ที่ใช้ฝั่ง server ทำให้ Next.js มองมันเป็น module ของ Client Component ถ้า Server Component ส่ง `initial` ตัวใหม่มา (เช่นหลัง router refresh) hook จะเปลี่ยนไปใช้ตัวใหม่

## Frontend อื่นๆ

helper ของแต่ละ framework ห่อฟังก์ชันเดียวจาก `@easy-cms/core/live-preview` ซึ่งไม่มี import ของ Node.js เลย:

```ts
import { subscribeLivePreview } from '@easy-cms/core/live-preview'

const stop = subscribeLivePreview((doc) => render(doc), {
  origin: 'https://cms.example.com', // origin ของหน้า admin; ค่าเริ่มต้นคือ origin ของหน้าเว็บเอง
})
```

ถ้าใช้ adapter ของ Nuxt หรือ Next.js หน้า admin กับเว็บอยู่ origin เดียวกัน ค่าเริ่มต้นจึงถูกอยู่แล้ว แต่ถ้าแยก CMS เป็น server ต่างหากที่อยู่คนละ origin ต้องตั้ง `origin` เอง

## กลไกเบื้องหลัง

นี่คือสิ่งที่เกิดขึ้นเมื่อ editor เปิด preview แล้วเริ่มพิมพ์:

```
admin (form)                 server                       iframe (your page)
     │ POST /posts/3/preview      │                                │
     │ {form values} ───────────► │ merge with current draft,      │
     │                            │ read path: populate,           │
     │ ◄──── { doc, url+token } ──│ afterRead, field access        │
     │ set iframe src (once) ─────────────────────────────────────►│ loads, subscribes
     │ ◄──────────────────────────────────── { type: 'easy-cms:preview-ready' }
     │ postMessage({ type: 'easy-cms:preview', doc }, pageOrigin) ─►│ render(doc)
     │ … each change, 300 ms later: POST again, postMessage again …│
```

### หน้าเว็บโหลดแค่ครั้งเดียว

admin ตั้ง `src` ของ iframe แค่ครั้งแรก หลังจากนั้นทุกการแก้ไขส่งมาเป็น message การพิมพ์จึงไม่ทำให้หน้า reload ตำแหน่ง scroll และ state ฝั่ง client ก็ยังอยู่ กรณีเดียวที่ admin โหลดหน้าใหม่เองคือตอนสลับภาษาของเนื้อหา เพราะแต่ละภาษามี URL ของตัวเองได้ ตัวอย่างที่เห็นภาพง่ายคือเว็บสองภาษาไทย/อังกฤษ ที่หน้าภาษาไทยกับหน้าภาษาอังกฤษอาจอยู่คนละ URL พอ editor สลับไปแก้ฉบับอังกฤษ frame ก็ต้องโหลดหน้าของภาษานั้น

### Debounce และ response ที่ตกยุค

admin เฝ้าดูฟอร์มแบบ deep และรอ **300 ms** หลังการแก้ไขครั้งสุดท้ายก่อนถาม server แต่ถ้าเน็ตช้า request ก็ยังซ้อนกันได้ แต่ละ request จึงมีหมายเลข และ response จะถูกทิ้งถ้ามี request ที่ใหม่กว่าเริ่มไปแล้ว ถ้าไม่ทำแบบนี้ response เก่าที่ช้าอาจมาถึงทีหลังสุด แล้วแสดงข้อความที่ editor ลบไปแล้ว

### Ready handshake

admin ได้เอกสารแรกมาก่อนที่หน้าใน iframe จะโหลดเสร็จ message ที่ส่งไปหา frame ที่ยังโหลดอยู่และยังไม่มี listener ก็หายไปเฉยๆ หน้าเว็บจึงต้องประกาศตัว: `subscribeLivePreview` ติดตั้ง listener ก่อน แล้วค่อยส่ง `{ type: 'easy-cms:preview-ready' }` ไปหา parent เมื่อ admin ได้รับข้อความนี้จาก frame ของตัวเอง ก็จะส่งเอกสารล่าสุดไปอีกรอบ

ข้อความ ready ส่งไปที่ origin ไหนก็ได้ (`'*'`) เพราะไม่มีข้อมูลอะไรในนั้น ส่วนเอกสารที่ส่งกลับไปใช้ `targetOrigin` ที่ระบุชัด คือ origin ของ URL preview จึงไม่มีทางไปถึงหน้าที่ navigate ไปที่อื่นแล้ว ฝั่งหน้าเว็บก็ตรวจ `event.origin` เทียบกับ origin ของ admin ก่อน render อะไร

### ผ่านเส้นทาง output เดียวกับการอ่านปกติ

ฟอร์มไม่ได้ส่งค่าดิบไปให้หน้าเว็บตรงๆ server สร้างเอกสารก่อน:

1. โหลดเอกสารที่บันทึกไว้และ draft ที่ค้างอยู่ แล้ว merge ค่าในฟอร์มทับลงไป ฟอร์มที่กรอกไม่ครบก็ preview ได้ถูก
2. แปลงค่าแบบเดียวกับตอนบันทึก แต่ข้าม `required` และเก็บค่าที่ไม่ผ่าน validation ไว้ เนื้อหาที่พิมพ์ค้างครึ่งๆ ก็ยัง preview ได้
3. ส่งผลลัพธ์ผ่านฟังก์ชัน `output()` ตัวเดียวกับที่ทุกการอ่านใช้: populate relationship และไฟล์อัปโหลด (admin ขอ `depth=2`), รัน hook `afterRead` และตัด field ที่ editor ไม่มีสิทธิ์อ่านออก

ไม่มีอะไรถูกบันทึก หน้าเว็บได้เอกสารรูปร่างเดียวกับที่โหลดมาจาก server ฟังก์ชัน render ตัวเดียวจึงใช้ได้ทั้งสองกรณี และคนที่ preview ได้มีแค่ user ที่มีสิทธิ์ update เอกสารนั้น (หรือสิทธิ์ create สำหรับเอกสารใหม่)

### Preview token สำหรับเว็บที่อยู่คนละ origin

หน้าที่อยู่ origin เดียวกันอ่าน draft ได้ด้วย session cookie ของ editor อย่างในขั้นที่ 2 และ 3 แต่ frontend ที่อยู่คนละ origin ไม่มี session admin จึงเติม `easy-cms-preview=<token>` ต่อท้าย URL preview และหน้าเว็บส่งต่อเป็น `?preview=` ตอน fetch `GET /api/cms/posts/:id`

token มีรูปแบบ `<payload>.<signature>` ตัว payload เป็น JSON ที่เข้ารหัส base64url มี collection, id, เวลาหมดอายุ และถ้าเป็น token ที่ออกจาก admin ก็มี user ที่เปิด preview ด้วย ส่วน signature คือ HMAC-SHA256 ของ `preview:` ต่อด้วย payload โดยใช้ `secret` ของ CMS เป็น key คำนำหน้านี้ทำให้มันไม่ปนกับลายเซ็นของ session และ password ที่ใช้ secret ตัวเดียวกัน server จะปฏิเสธ token ที่ถูกแก้ หมดอายุ หรือระบุเอกสารคนละตัว token จาก admin อ่านข้อมูลด้วยสิทธิ์ของ user คนนั้น และใช้ไม่ได้ทันทีถ้า user ถูกปิดใช้งาน อายุเริ่มต้นคือหนึ่งชั่วโมง

ผมจำกัด token ไว้ที่เอกสารเดียวโดยตั้งใจ token ที่เปิด draft ได้ทั้งหมดจะทำง่ายกว่า แต่ถ้าลิงก์ preview หลุดออกไป ทุกอย่างที่ยังไม่ publish ก็หลุดตามไปด้วย แบบที่ทำอยู่ ลิงก์หลุดหนึ่งลิงก์เปิดได้แค่เอกสารเดียว นานไม่เกินหนึ่งชั่วโมง ฝั่ง server ใช้ `cms.createPreviewToken({ collection, id }, { user })` สร้าง token ได้ เช่นทำปุ่ม "แชร์ลิงก์ preview" ถ้าไม่ใส่ `user` token จะอ่านด้วยสิทธิ์เต็ม

### CSP: frame-src ของ admin และ header ของเว็บคุณเอง

admin ส่ง Content Security Policy มาด้วย และหน้าใดจะถูกแสดงใน frame ได้ก็ต่อเมื่อ `frame-src` อนุญาต admin ตั้ง `frame-src 'self' http: https:` เพื่อให้ admin แบบ standalone แสดงเว็บที่อยู่คนละ origin ได้ ส่วนตัว admin เองยังคง `frame-ancestors 'none'` และ `X-Frame-Options: DENY` ไว้ จึงไม่มีใครเอา admin ไปใส่ frame ได้

อีกครึ่งเป็นหน้าที่ของคุณ ถ้าเว็บส่ง `X-Frame-Options: DENY` หรือ `frame-ancestors 'none'` browser จะไม่ยอมแสดงเว็บใน frame ใดๆ รวมถึง preview ด้วย แล้วช่อง preview ก็จะว่างเปล่า ให้อนุญาต `'self'` ถ้า admin อยู่ origin เดียวกัน หรืออนุญาต origin ของ admin ถ้าเป็นแบบ standalone

## ข้อแลกเปลี่ยน

- **หน้าเว็บต้อง render จากข้อมูล** ถ้าคุณ render rich text เป็น HTML บน server แล้วส่งแค่ HTML ไปให้ client, live preview จะอัปเดตส่วนนั้นไม่ได้ ต้อง render ฝั่ง client ด้วย
- **render แบบเผื่อไว้ก่อน** หน้าใน example ตรวจว่า relationship เป็น object ที่มี `url` ก่อนแสดง หน้าจะได้ไม่พังถ้ามี id มาแทนเอกสารที่ populate แล้ว
- **มอง URL preview เป็นลิงก์แชร์** ใครถือลิงก์ไว้ก็อ่าน draft นั้นได้จนกว่าจะหมดอายุ
- **นี่คือ preview ไม่ใช่ page editor** editor พิมพ์ในฟอร์มแล้วดูหน้าเว็บ จะคลิกหัวข้อบนหน้าเว็บเพื่อแก้ตรงนั้นไม่ได้

[TODO: เรื่องของคุณ — หนึ่งบรรทัดว่า editor พูดหรือทำอะไรตอนใช้ live preview ครั้งแรก ถ้ามีเหตุการณ์นั้นจริง]

pattern เบื้องหลังทั้งหมด (โหลด frame ครั้งเดียว, debounce, ready handshake, ระบุ `targetOrigin` ชัดเจน และสร้าง preview ผ่านเส้นทางการอ่านปกติ) ใช้ได้โดยไม่ต้องมี Easy CMS ถ้าคุณทำเอง สองส่วนที่ผมจะเก็บไว้แน่ๆ คือ handshake กับการเช็ก response ที่ตกยุค

example ฉบับเต็มอยู่ที่ [`examples/nuxt-blog`](https://github.com/maritonx/easy-cms/tree/main/examples/nuxt-blog) และ [`examples/next-blog`](https://github.com/maritonx/easy-cms/tree/main/examples/next-blog) ส่วนคู่มืออยู่ที่ [ตัวอย่างสด (live preview)](/th/docs/live-preview)

---

Easy CMS เป็น open source (MIT): [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสารภาษาไทย](/th/docs) ถ้าลองแล้วติดตรงไหน บอกผมได้ที่ [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137)

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
