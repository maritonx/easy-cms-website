---
title: "สร้าง CMS แบบ Payload ที่อยู่ในแอป Nuxt ของคุณเอง"
slug: payload-style-cms-nuxt-th
language: th
category: Engineering
publishedAt: 2026-10-26
coverText: "inside your app"
excerpt: "Easy CMS คือ headless CMS แบบ code-first ที่ฝังอยู่ในแอป Nuxt และ Next.js กำหนดเนื้อหาด้วย TypeScript มี admin ที่ /admin ไม่ต้องมี server แยก"
---
Nuxt มี CMS แบบ Git-based ที่ดีมากอยู่แล้ว แต่สิ่งที่ยังไม่มีคือ CMS ที่โตเต็มที่ ที่อยู่ในแอปของเราเองและเก็บเนื้อหาไว้ใน database แบบที่ Payload ทำให้ Next.js ได้ Payload รัน *อยู่ข้างใน* แอป Next.js แต่ถ้าเป็น Nuxt มันยังต้องรัน *อยู่ข้าง ๆ* แอปเรา

ผมทำเว็บให้ลูกค้า บางงานใช้ Nuxt บางงานใช้ Next.js และผมอยากได้ชิ้นที่ขาดไปนี้มาตลอด เลยลงมือทำเอง ชื่อว่า **Easy CMS** เป็น headless CMS แบบ open source (MIT) ที่ติดตั้งเข้าไปในแอป Nuxt หรือ Next.js ผ่าน npm ได้เลย ใครใช้ Next.js ก็ใช้ได้เหมือนกัน ทั้งสอง framework ได้ฟีเจอร์เท่ากัน

## ปัญหา

ลูกค้าของผมทำเว็บด้วย Vue หรือ React และต้องการหลังบ้านที่ทีมคอนเทนต์ใช้งานได้จริง ทั้งภาษาไทยและภาษาอังกฤษ ในมุมของ developer หลังบ้านนี้ควรเป็นแค่ npm package อีกตัวหนึ่ง มี version ไปพร้อมกับแอป ถูก review ใน pull request และ deploy ไปด้วยกัน

ถ้าเป็นคนใช้ Nuxt ตอนนี้ (ตุลาคม 2026) ตัวเลือกที่มีคือ

- **Nuxt Content + Nuxt Studio** ฟรี MIT และ self-host ได้ เหมาะมากถ้าเนื้อหาเป็น Markdown แต่มันเป็นแบบ Git-based คือการแก้ไขแต่ละครั้งกลายเป็น commit ไม่ได้ให้ record ใน database ไม่มีระบบ role และไม่รองรับข้อมูลที่ผู้ใช้สร้างขึ้นเอง
- **Payload** ดีมาก และเรา[เรียก Local API ของมันจาก Nuxt ได้](https://payloadcms.com/docs/local-api/outside-nextjs) แต่ admin ของมันเป็น React และต้องมี Next.js เป็น host (หรือ TanStack Start ใน v4 beta) แปลว่าเราจะมีสองแอป deploy สองรอบ และขยาย admin ด้วย Vue ไม่ได้
- **Directus หรือ Strapi** ทั้งคู่ดี แต่ก็คือ server อีกตัวที่ต้อง deploy ต้องอัปเดต และต้องคอยให้ sync กัน
- **Sanity หรือ Contentful** ใช้งานได้ดีทั้งคู่ แต่เนื้อหาของเราไปอยู่บน cloud ของเขา

สิ่งที่ผมอยากได้คือสิ่งที่ Payload ให้คนใช้ Next.js คือกำหนดเนื้อหาในโค้ด มี admin มาให้ในตัว และ deploy แค่แอปเดียว ผมอยากได้แบบนี้สำหรับ Nuxt ด้วย

## สิ่งที่ผมทำ

Easy CMS รันอยู่ใน server ของแอปเรา เราอธิบายเนื้อหาไว้ใน `easy-cms.config.ts` แล้วจะได้ admin ที่ `/admin`, Local API ที่มี type สำหรับใช้ในหน้าเว็บ และ REST API ที่ `/api/cms`

หน้า admin มีภาษาไทยในตัว ภาษาของหน้าจอ admin (ไทยหรืออังกฤษ) แยกจากภาษาของเนื้อหา และผู้ใช้แต่ละคนสลับเองได้ ทีมคอนเทนต์ที่ถนัดไทยกับ developer ที่ถนัดอังกฤษเลยใช้ระบบเดียวกันได้

![หน้า dashboard ของ Easy CMS](/screenshots/dashboard-th-light.webp)

## ลองได้ในสองนาที

ในแอป Nuxt 4 หรือ Next.js 15+ ที่มีอยู่แล้ว (Node.js 22.12 ขึ้นไป ถ้าใช้ Nuxt ต้อง 22.19)

```bash
npm create easy-cms@latest
npm run dev   # open http://localhost:3000/admin
```

คำสั่งนี้จะตรวจว่าแอปเป็น Nuxt หรือ Next.js แล้วติดตั้ง package ให้ สร้าง `easy-cms.config.ts` พร้อม collection ตัวอย่างชื่อ `posts` ใส่ secret แบบสุ่มไว้ใน `.env` และต่อเข้ากับ framework ให้ (Nuxt ได้เป็น module, Next.js ได้เป็น route handler) พอเปิด `/admin` ครั้งแรก มันจะให้สร้าง admin คนแรก

config เป็น TypeScript ธรรมดา

```ts
// easy-cms.config.ts
import { defineConfig } from '@easy-cms/core'
import { sqlite } from '@easy-cms/db-sqlite'

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET!,
  db: sqlite({ url: 'file:./cms.db' }),
  collections: [
    {
      slug: 'posts',
      drafts: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'slug', from: 'title' },
        { name: 'body', type: 'richText' },
      ],
    },
  ],
})
```

ฝั่ง Nuxt การอ่านเนื้อหาก็คือ server route ตัวหนึ่ง

```ts
// server/api/posts.get.ts
export default defineEventHandler(async () => {
  const cms = await useEasyCMS()
  return cms.find('posts', { sort: '-createdAt', limit: 10 })
})
```

โดย default `find` จะคืนเฉพาะเอกสารที่ publish แล้ว `post.title` มี type เป็น `string` เพราะใน config บอกว่าเป็น text field ที่ required ตอน dev schema ของ database จะตาม config ไปเอง แค่ save ไฟล์ admin ก็แสดง field ใหม่แล้ว

![หน้าแก้ไขโพสต์ใน admin](/screenshots/edit-th-light.webp)

ฝั่ง Next.js ให้เรียก `getEasyCMS(config)` ใน Server Component ส่วนถ้าไม่ใช้ framework เลย `npm create easy-cms@latest my-cms` จะได้ server แบบ standalone ที่ port 4000 ให้ frontend ตัวไหนก็เรียกได้

admin มีสิ่งที่ทีมคอนเทนต์มักขอครบ ทั้ง draft และตั้งเวลา publish, ประวัติ version ที่กู้คืนได้, live preview, คลัง media ที่แบ่งโฟลเดอร์ได้, role ที่ตั้งจากหน้า admin, single sign-on, audit log, backup และ command palette ที่เปิดด้วย ⌘K

![command palette](/screenshots/command-palette-th-light.webp)

## ข้างในทำงานยังไง

```
┌────────────────── your Nuxt / Next.js app ──────────────────┐
│  pages ──► Local API (typed)      browsers ──► /api/cms      │
│  editors ──► /admin                                          │
│                  @easy-cms/nuxt | @easy-cms/next             │
│                        @easy-cms/core                        │
│          SQLite / Postgres (ecms_ tables) · uploads          │
└──────────────────────────────────────────────────────────────┘
```

- **core ไม่ผูกกับ framework** `@easy-cms/core` เป็น TypeScript ธรรมดาที่สร้างบน `Request` และ `Response` ตามมาตรฐาน Web ทั้ง config, validation, access control, hook, draft และ API ทั้งสองแบบอยู่ในนี้หมด
- **adapter แต่ละตัวบางมาก** Nuxt module กับ route handler ของ Next.js ส่วนใหญ่แค่ mount handler ตัวเดียว ทั้งสอง framework เลยได้ฟีเจอร์เท่ากัน
- **Local API ไม่ผ่าน HTTP** หน้าเว็บเรียก `cms.find()` ได้ตรง ๆ และเรา deploy แค่แอปเดียว
- **ข้อมูลอยู่ใน database ของเราเอง** Easy CMS ใช้ SQLite (เป็นไฟล์ หรือใช้ Turso) หรือ Postgres ผ่าน Drizzle เขียนลงตารางและคอลัมน์จริงที่ขึ้นต้นด้วย `ecms_` เราจึงยัง query ด้วย SQL ได้ตามปกติ
- **admin มาแบบ build เสร็จแล้ว** เป็นแอป Vue ที่อ่าน config จาก API แล้ววาดฟอร์มให้เอง เราไม่ต้อง build เอง

แนวทางนี้มีต้นทุน คือทุกฟีเจอร์ต้องทำงานได้ทั้งในสอง framework และใน server แบบ standalone ผมจึงพยายามให้ adapter บางที่สุด และมี end-to-end test ครอบทั้งสามแบบ

## เหมาะกับงานแบบไหน

เทียบกันแบบนี้ (ณ ตุลาคม 2026) แต่ละตัวมีจุดที่เก่งของมัน

| | รันอยู่ในแอป Nuxt | เก็บเนื้อหาไว้ที่ | Admin UI | Access control | License |
|---|---|---|---|---|---|
| Nuxt Content + Studio | ✅ | Git (ไฟล์) | Vue | มี login ไม่มี role | MIT |
| Payload | ผ่าน Local API หรือแยกเป็นอีกแอป | Database | React | เขียนในโค้ด | MIT |
| Directus | server แยก | Database | Vue | role ในหน้า admin | Source-available |
| Strapi | server แยก | Database | React | role ในหน้า admin | MIT (Community Edition) |
| **Easy CMS** | ✅ (Next.js ด้วย) | Database | Vue | role ในหน้า admin + กฎในโค้ด | MIT |

ถ้าเนื้อหาเป็น Markdown ที่เก็บใน Git ใช้ Nuxt Studio ถ้าใช้ Next.js และอยากได้ ecosystem ที่ใหญ่ที่สุด Payload คือตัวเลือกที่ปลอดภัย ส่วน Easy CMS เหมาะกับเนื้อหาที่อยู่ใน database มี role มี admin และอยู่ในแอป Nuxt หรือ Next.js ของเรา ตอนนี้ก็มีโปรเจกต์ใหม่ ๆ ตัวอื่นที่ลองทำเรื่องนี้อยู่เหมือนกัน เช่น [nuxt-cms](https://github.com/xleddyl/nuxt-cms)

## ทำด้วย AI แต่มีหลักฐานให้ตรวจ

Easy CMS 1.0 ออกวันที่ 17 ตุลาคม หลัง commit แรก 22 วัน ซึ่งเร็ว และควรสงสัยไว้ก่อน ผมขอเล่าตามจริงแบบนี้

ผมทำคนเดียวในเวลาว่าง ประมาณครึ่งหนึ่งของ commit กว่า 500 ครั้ง เขียนร่วมกับ Claude Code และมี trailer อยู่ใน git history ให้ใครก็ตรวจได้ สิ่งที่ทำให้มันปลอดภัยคือกระบวนการรอบ ๆ โค้ด

- **architecture decision record 56 ฉบับ** ทุกการตัดสินใจที่สำคัญมีเหตุผลเขียนไว้ เป็นภาษาไทยซึ่งเป็นภาษาแม่ของผม
- **test มากกว่า 900 ตัว** มีทั้ง unit และ integration test, end-to-end test ด้วย Playwright, smoke test ของ `create-easy-cms` กับ npm, pnpm, Yarn และ Bun และ upgrade test ที่ migrate database ซึ่งสร้างจาก release เก่า ๆ ในทุกรอบของ CI
- **self-review ตาม OWASP ASVS Level 1** เป็นการรีวิวโดยตัวผมเอง ไม่ใช่ audit จากภายนอก

การรีวิวรอบนั้นเจอ bug ที่หนักที่สุดเท่าที่เคยมี ใน plugin multi-tenant มี helper ตัวหนึ่งตัดสินสองเรื่องในทีเดียว คือ user คนนี้ *อ่าน* ข้อมูลทุก tenant ได้ไหม และมีสิทธิ์ *เข้าถึง* ทุก tenant ไหม โค้ดดูสมเหตุสมผล แต่พอแต่ละ site มีสมาชิกได้ ลูกค้าที่สมัครสมาชิกในร้านค้าก็ผ่านเงื่อนไขนั้นไปได้ แล้วไปแก้ไข user คนอื่นได้ รวมถึงรหัสผ่านของ admin ด้วย การรีวิวจัดให้เป็นระดับ critical ตัวแก้แยก helper ออกเป็นสองตัว เพิ่ม test ที่ fail กับโค้ดเดิม และออกใน 0.47.3 ภายในวันเดียวกัน

เรื่องที่เล็กกว่านั้น ก่อน 1.0 มีการเปลี่ยนชื่อ option ใน config ที่แตะไป 139 ไฟล์ แต่หลุดไปสาม field ใน starter template และ CI จับได้ตอน template build ไม่ผ่าน

AI ทำให้การเขียนโค้ดที่ดูถูกต้องมีต้นทุนต่ำมาก test, การตัดสินใจที่เขียนไว้ และการรีวิว คือวิธีหาโค้ดที่แค่ดูเหมือนถูก

## กรณีที่ไม่เหมาะ

- **ทีมคอนเทนต์เปลี่ยนโครงสร้างเนื้อหาเองไม่ได้** เพราะมันอยู่ในโค้ด ต้องให้ developer เป็นคนแก้
- **ไม่รองรับ edge runtime** ต้องใช้ Node.js 22.12 ขึ้นไป (ถ้าใช้ Nuxt ต้อง 22.19) และยังไม่รองรับ MySQL
- **ยังไม่มี marketplace ใหญ่** integration สำเร็จรูปยังมีไม่มาก
- **plugin บางตัวยังเป็น experimental** plugin ร้านค้า, GraphQL และ MCP อาจยังเปลี่ยนใน minor release ส่วนที่เหลือทั้งหมดอยู่ภายใต้[สัญญาความเสถียรของ 1.0](/th/docs/versioning) คือจะมี breaking change เฉพาะใน major release และมีคู่มือ upgrade ให้

## ลองใช้ แล้วบอกผมว่าติดตรงไหน

รัน `npm create easy-cms@latest` ในแอป Nuxt หรือ Next.js หรือกดปุ่ม Deploy ใน README เพื่อได้บล็อกพร้อม admin บน Vercel หรือ Netlify เลย เอกสารมีภาษาไทยครบทุกหน้า ถ้าอ่านภาษาไทยสะดวกกว่าก็เริ่มจากตรงนั้นได้ ลองแล้วติดอะไร บอกผมใน [feedback issue ของ 1.0](https://github.com/maritonx/easy-cms/issues/137) เขียนสั้น ๆ ห้วน ๆ ก็ได้

---

Easy CMS เป็น open source (MIT): [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสารภาษาไทย](/th/docs) ถ้าลองแล้วติดตรงไหน บอกผมได้ที่ [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137)

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
