---
title: "ต่อ CMS เข้า Hono, Astro หรือ SvelteKit ด้วย Web Request handler ตัวเดียว"
slug: one-request-handler-th
language: th
category: Guide
publishedAt: 2027-01-25
coverText: "(Request) => Response"
excerpt: "CMS ที่เป็น (Request) => Promise<Response> ต่อเข้า framework ไหนก็ได้ที่ให้ Request มา พร้อมโค้ด Hono, Astro, SvelteKit และเรื่อง singleton ตอน HMR"
---
สมมติว่าเว็บเราทำด้วย Astro หรือ SvelteKit หรือเป็น server เล็กๆ ที่เขียนด้วย Hono แล้วอยากให้คนดูแลเนื้อหามีหลังบ้านไว้แก้ content และอยากเก็บเนื้อหาไว้ใน database ของเราเอง CMS ส่วนใหญ่จะให้เลือกแค่สองทาง คือย้ายมาใช้ framework ของเขา หรือรัน server ของเขาแยกไว้ข้างๆ server ของเรา

จริงๆ มีทางที่สาม และมันมาจากมาตรฐานที่น่าเบื่อที่สุดอย่าง `Request` กับ `Response` ของ Fetch API ถ้า CMS เป็นแค่ function ที่รับ `Request` แล้วคืน `Promise<Response>` การเอามันไปต่อกับเว็บก็เหลือแค่เรื่อง routing และทุก framework ในบทความนี้ให้ `Request` มาอยู่แล้ว

บทความนี้จะเอา Easy CMS ไป mount ใน Hono ก่อน ตามด้วย Astro แล้วก็ SvelteKit และอ่าน content จากแต่ละตัวผ่าน Local API ส่วนภาพรวมของ architecture ผมเล่าไว้แล้วใน[บทความแรกของซีรีส์นี้](FIRST_POST_URL) บทนี้จะเน้นที่โค้ดล้วนๆ

**ขอเตือนไว้ก่อนจะ copy อะไรไป** Easy CMS มี package สำหรับ Nuxt และ Next.js และมี standalone server สามตัวนี้ผ่านการทดสอบแบบ end to end ส่วน Astro, SvelteKit และ Hono ยังไม่ได้ทดสอบ ซึ่งในเอกสารก็เขียนไว้ตรงๆ ให้มองบทความนี้เป็นสูตร (recipe) ตัวอย่างข้างล่างผมรันกับ Easy CMS 1.4.1 คู่กับ Hono 4.13, Astro 7.4 และ SvelteKit 3.1 บน Node 24 และนั่นคือการทดสอบทั้งหมดที่มันเคยผ่านมา

## สามชิ้นหลัก

package ของ Nuxt และ Next.js บางมาก ตั้งแต่ ADR-0045 เป็นต้นมา package ของ Next.js ประกอบขึ้นจากสามชิ้นนี้ ส่วน package ของ Nuxt ใช้สองชิ้นแรก และเราหยิบมาใช้ตรงๆ เองได้:

| | มาจาก | ทำอะไร |
|---|---|---|
| `sharedEasyCMS(config)` | `@easy-cms/core` | instance เดียวต่อ process และคงอยู่ข้าม hot reload |
| `createApiHandler(config, options?)` | `@easy-cms/core` | REST API บน instance นั้น ในรูป `(Request) => Promise<Response>` |
| `adminHandlerFor(resolvedConfig, overrides?)` | `@easy-cms/admin` | แอป admin ที่ build ไว้แล้ว ในรูป `(Request) => Promise<Response>` |

![route ของ Hono, Astro และ SvelteKit ส่ง Web Request ต่อให้ handler ของ API และ admin ซึ่งใช้ instance ของ Easy CMS ร่วมกันหนึ่งตัวต่อ process](/images/blog/one-request-handler/diagram-1.th.png)

มี helper ตัวที่สี่คือ `cms.auth.userFromHeaders(headers)` ซึ่งคืน user ที่ล็อกอินอยู่ จาก session cookie หรือ Bearer token เอาไว้ใช้แสดง draft ให้คนแก้เนื้อหาเห็น

รวมทั้งหมดไว้ในโมดูลเดียวที่ route ต่างๆ import ไปใช้:

```ts
// cms.ts
import { adminHandlerFor } from '@easy-cms/admin'
import { createApiHandler, resolveConfig, sharedEasyCMS } from '@easy-cms/core'
import config from './easy-cms.config'

/** Local API ที่มี type ตาม config */
export const getCMS = () => sharedEasyCMS(config)

/** IP ของ client ในแต่ละ request ซึ่ง route จะใส่ไว้ก่อนเรียก `api` */
export const clientIps = new WeakMap<Request, string | undefined>()

/** `/api/cms/*` ทุก method */
export const api = createApiHandler(config, {
  getClientIp: (request) => clientIps.get(request),
})

/** `/admin/*` เฉพาะ GET และ HEAD */
export const admin = async (request: Request) =>
  adminHandlerFor(await resolveConfig(config), { siteURL: '/' })(request)
```

`clientIps` ตรงนี้ต้องอธิบายนิดหนึ่ง Web `Request` ไม่ได้พก IP ของ client มาด้วย framework รู้ค่านี้ แต่เก็บไว้ใน context object ของตัวเอง Easy CMS ใช้ IP ในการจำกัดจำนวนครั้งที่ login (rate limit) โดย key ของ limit คือ email บวกกับ IP ถ้าไม่มี IP การจำกัดจะเหลือแค่ต่อ email ทุก client ที่ลอง email เดียวกันจะใช้ bucket เดียวกันหมด ใครก็ได้จึงล็อก editor ออกจากระบบได้แค่จงใจ login ผิดซ้ำๆ ใน production ถ้า Easy CMS มองไม่เห็น IP มันจะ log warning ไว้ adapter ของ Nuxt แก้ปัญหานี้ด้วยเทคนิค `WeakMap` แบบเดียวกัน และ route ข้างล่างก็ทำแบบนั้น ถ้าอยู่หลัง proxy ที่เชื่อถือได้ จะส่ง `trustProxy: true` แทนก็ได้ แล้ว Easy CMS จะอ่านจาก `X-Forwarded-For` ส่วนบน Vercel และ Netlify มันหา IP เจอเองโดยไม่ต้องใช้ทั้งสองวิธี

config ใช้ตัวเดียวกับในบทความแรก คือมี collection `posts` ที่เปิด `drafts: true`, ใช้ SQLite และ `secret: process.env.EASY_CMS_SECRET!`

ติดตั้ง core, database adapter และ admin:

```sh
npm install @easy-cms/core @easy-cms/db-sqlite @easy-cms/admin
```

## Hono: กรณีที่ง่ายที่สุด

context ของ Hono มี `Request` ตัวดิบอยู่ที่ `c.req.raw` และ route ของ Hono คืน `Response` ได้เลย แค่นั้นก็พอแล้ว:

```ts
// server.ts
import { serve } from '@hono/node-server'
import { getConnInfo } from '@hono/node-server/conninfo'
import { Hono } from 'hono'
import { html } from 'hono/html'
import { admin, api, clientIps, getCMS } from './cms'

const app = new Hono()

app.all('/api/cms/*', (c) => {
  clientIps.set(c.req.raw, getConnInfo(c).remote.address)
  return api(c.req.raw)
})
app.get('/admin/*', (c) => admin(c.req.raw))

app.get('/', async (c) => {
  const cms = await getCMS()
  // editor ที่ล็อกอินอยู่ (session cookie หรือ Bearer token) จะเห็น draft ด้วย
  const user = await cms.auth.userFromHeaders(c.req.raw.headers)
  const { docs } = await cms.find('posts', { sort: '-createdAt', limit: 10, draft: user !== null })
  return c.html(html`<ul>${docs.map((post) => html`<li>${post.title}</li>`)}</ul>`)
})

serve({ fetch: app.fetch, port: 3000 })
```

รันด้วย `npx tsx watch --env-file=.env server.ts` แล้วเปิด `/admin` ตัว admin จะ redirect `/admin` ไปที่ `/admin/` (เป็น 308) แล้วให้สร้าง admin คนแรก tag `html` จะ escape title ให้ ซึ่งสำคัญเพราะ title เป็นสิ่งที่ editor พิมพ์เข้ามา

มีจุดหนึ่งที่ตอนแรกอาจดูเหมือนผิด คือ `GET /api/cms/posts` ตอบ 401 ให้คนทั่วไป ทั้งที่หน้าแรกแสดงโพสต์ที่ publish แล้วได้ปกติ อันนี้ตั้งใจให้เป็นแบบนี้ ถ้าไม่ได้ใส่ rule `access` ไว้ เฉพาะ user ที่ล็อกอินแล้วเท่านั้นที่ใช้ collection ผ่าน REST ได้ ส่วน Local API เชื่อใจคนที่เรียกมันและข้าม access rule ไป เว้นแต่เราจะสั่งให้เช็ก ถ้าอยากให้ browser อ่านโพสต์ผ่าน REST ได้ด้วย ให้เพิ่ม `access: { read: anyone }` (import `anyone` มาจาก `@easy-cms/core`)

ถ้าต้องการแค่ server ที่มีแต่ CMS ไม่ได้มีหน้าเว็บ มีทางที่สั้นกว่านี้ คือ `createStandaloneHandler(cms)` จาก package `easy-cms` ซึ่งให้ standalone server ทั้งตัวมาเป็น handler เดียว รวม `/healthz` ไว้แล้ว

## Astro: route แบบ catch-all

endpoint ของ Astro export `ALL` ได้ ซึ่งรับทุก HTTP method ส่วน rest parameter (`[...path]`) จะ match ทั้ง base path และทุกอย่างที่อยู่ใต้มัน ต้องมี server adapter ด้วย เพราะ route พวกนี้รันทุก request:

```ts
// src/pages/api/cms/[...path].ts
import type { APIRoute } from 'astro'
import { api, clientIps } from '../../../lib/cms'

export const ALL: APIRoute = ({ request, clientAddress }) => {
  clientIps.set(request, clientAddress)
  return api(request)
}
```

```ts
// src/pages/admin/[...path].ts
import type { APIRoute } from 'astro'
import { admin } from '../../lib/cms'

export const ALL: APIRoute = ({ request }) => admin(request)
```

admin handler ตอบ 405 กับทุก method ที่ไม่ใช่ GET และ HEAD ดังนั้นใช้ `ALL` ตรงนี้ก็ไม่มีปัญหา ส่วนการอ่าน content ทำใน frontmatter ของหน้า:

```astro
---
// src/pages/index.astro
import { getCMS } from '../lib/cms'

const cms = await getCMS()
const user = await cms.auth.userFromHeaders(Astro.request.headers)
const { docs } = await cms.find('posts', { sort: '-createdAt', limit: 10, draft: user !== null })
---
<ul>
  {docs.map((post) => <li>{post.title}</li>)}
</ul>
```

`cms.ts` ย้ายไปอยู่ที่ `src/lib/cms.ts` และเปลี่ยน path ที่ import config เป็น `'../../easy-cms.config'` ใน `astro.config.mjs` ของตัวอย่างตั้ง `output: 'server'` และใช้ `@astrojs/node`

ถ้ารัน `astro dev` ตรงๆ config จะพังด้วย error `secret: is required` เพราะ Astro โหลด `.env` เข้า `import.meta.env` ไม่ได้โหลดเข้า `process.env` ขณะที่ config อ่านจาก `process.env` แก้ได้ด้วยการเปิด dev server ผ่าน flag ของ Node เอง: `node --env-file=.env node_modules/astro/bin/astro.mjs dev` ส่วนใน production ให้ตั้งตัวแปรไว้ใน environment ของ server

## SvelteKit: `fallback` กับ trailing slash

`+server.ts` ของ SvelteKit export `fallback` ได้ ซึ่งจะรับทุก method ที่เราไม่ได้ export ไว้ตามชื่อ รวมถึง GET ด้วย:

```ts
// src/routes/api/cms/[...path]/+server.ts
import { api, clientIps } from '#lib/server/cms'
import type { RequestHandler } from './$types'

export const fallback: RequestHandler = ({ request, getClientAddress }) => {
  clientIps.set(request, getClientAddress())
  return api(request)
}
```

```ts
// src/routes/admin/[...path]/+server.ts
import { admin } from '#lib/server/cms'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ request }) => admin(request)
```

ถ้า mount แบบนี้ `/admin` จะวน loop เพราะ admin redirect `/admin` ไปที่ `/admin/` แล้ว SvelteKit ก็ redirect `/admin/` กลับมาที่ `/admin` Next.js ก็ทำแบบเดียวกัน และ package ของ Next.js ปิด redirect ของ admin ไว้ เราก็ทำแบบเดียวกันใน `src/lib/server/cms.ts`:

```ts
// src/lib/server/cms.ts (ส่วนที่ export admin)
export const admin = async (request: Request) =>
  adminHandlerFor(await resolveConfig(config), {
    siteURL: '/',
    // SvelteKit ตัด trailing slash ออก ถ้า redirect กลับไปจะวน loop
    trailingSlashRedirect: false,
  })(request)
```

admin ยังใช้งานที่ `/admin` ได้ปกติ เพราะ HTML ของมันตั้ง `<base href="/admin/">` ไว้ ส่วน content ไปอ่านใน server `load`:

```ts
// src/routes/+page.server.ts
import { getCMS } from '#lib/server/cms'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ request }) => {
  const cms = await getCMS()
  const user = await cms.auth.userFromHeaders(request.headers)
  const { docs } = await cms.find('posts', { sort: '-createdAt', limit: 10, draft: user !== null })
  return { posts: docs.map(({ id, title, slug }) => ({ id, title, slug })) }
}
```

SvelteKit 3 มีรายละเอียดอยู่สองเรื่อง เรื่องแรก config อยู่ใน `vite.config.ts` ในรูป `sveltekit({ adapter: adapter() })` เรื่องที่สอง `$lib` ถูกเอาออกแล้ว ให้ใช้ `#lib` แทน ซึ่งเป็น subpath import ของ Node ที่ประกาศไว้ใน `package.json` (`"imports": { "#lib/*": "./src/lib/*" }`) ถ้ายังอยู่บน SvelteKit 2 ให้ใช้ `$lib` กับ `svelte.config.js` ตามเดิม เปิด dev server ด้วย `node --env-file=.env node_modules/vite/bin/vite.js dev` ด้วยเหตุผลเดียวกับ Astro

## เรื่องของ HMR

Astro และ SvelteKit รันอยู่บน Vite เวลาเรา save ไฟล์ Vite จะ evaluate โมดูลที่เปลี่ยนใหม่ รวมถึงทุกโมดูลที่ import มัน ภายใน Node process เดิม ถ้า `cms.ts` เก็บ instance ไว้ในตัวแปรระดับโมดูล ทุกครั้งที่ save จะได้ instance ใหม่พร้อม database connection ใหม่ และตัวเก่าจะไม่มีวันถูกปิด

instance จึงไม่ได้อยู่ในโมดูล แต่อยู่บน `globalThis`:

```ts
// packages/core/src/framework.ts (ตัดบางส่วนและเอา type ออก)
const KEY = Symbol.for('easy-cms.shared')
const store = globalThis as unknown as { [KEY]?: Shared }

export function sharedEasyCMS(config, options) {
  const cached = store[KEY]
  const signature = configSignature(config)
  if (cached?.signature === signature) return cached.promise
  if (cached) void cached.promise.then((cms) => cms.destroy()).catch(() => {})
  const promise = createEasyCMS(config, options)
  store[KEY] = { signature, promise }
  promise.catch(() => {
    if (store[KEY]?.promise === promise) delete store[KEY]
  })
  return promise
}
```

ส่วนที่น่าสนใจคือการเปรียบเทียบ หลัง reload แล้ว config จะเป็น object ใหม่เสมอ ถึงข้างในจะไม่มีอะไรเปลี่ยนเลยก็ตาม Next.js ยิ่งทำให้หนักขึ้น เพราะมัน bundle config เข้าไปในแต่ละ server layer ทำให้ process เดียวถือ config ไว้หลายก๊อปพร้อมกันได้ ถ้าเทียบกันด้วย identity ก็จะสร้าง instance ใหม่อยู่ตลอด `configSignature` คือ JSON string ของ config ที่เรียง key แล้ว และแทนทุก function ด้วย `"fn"` ถ้าโครงสร้างเหมือนกัน ก็ได้ instance เดิม

ก่อนมี ADR-0045 package ของ Next.js เทียบ config ด้วยวิธีนี้ ส่วน package ของ Nuxt เทียบด้วย identity ตอนนี้ทั้งคู่ใช้ `sharedEasyCMS` และแอป Astro หรือ SvelteKit ของเราก็ใช้ตัวเดียวกัน

นี่คือสิ่งที่เกิดขึ้นในตัวอย่าง SvelteKit โดยผมใส่ log ไว้ใน `cms.ts` ให้พิมพ์ instance ออกมา:

| สิ่งที่แก้ | instance |
|---|---|
| save `cms.ts` หรือเพิ่ม comment ใน config | โมดูลถูก evaluate ใหม่ แต่ได้ instance เดิม |
| เพิ่ม field `summary` ใน `posts` | ตัวเก่าถูกปิด ได้ตัวใหม่ และ push schema (1 statement) |
| พิมพ์ field type ผิด | ขึ้นหน้า error และไม่มีอะไรถูก cache ไว้ |
| แก้ที่พิมพ์ผิด | request ถัดไปเริ่ม instance ใหม่ |

`createApiHandler` ก็ตามไปด้วย มันเก็บ REST handler ไว้หนึ่งตัวต่อหนึ่ง instance ใน `WeakMap` ดังนั้น API จะสลับไปใช้ instance ใหม่ตั้งแต่ request ถัดไป

วิธีนี้มี trade-off สองข้อ ข้อแรก ถ้าแก้แค่โค้ดข้างใน hook ต้อง restart เอง เพราะ function ถูกนับเป็น `"fn"` เท่านั้น ข้อสอง มี instance เดียวต่อ process ถ้าแอปเดียวต้องใช้สอง config ให้เรียก `createEasyCMS` เอง

## สาม framework ต่างกันตรงไหน

| | Hono | Astro | SvelteKit |
|---|---|---|---|
| API route | `app.all('/api/cms/*')` | `src/pages/api/cms/[...path].ts`, `ALL` | `src/routes/api/cms/[...path]/+server.ts`, `fallback` |
| Client IP | `getConnInfo(c)` | `clientAddress` | `getClientAddress()` |
| trailing slash ของ `/admin` | ค่าเริ่มต้น | ค่าเริ่มต้น | `trailingSlashRedirect: false` |
| เอา `.env` เข้า `process.env` | `--env-file` | `--env-file` | `--env-file` |

## ก่อนขึ้น production

- **Node.js 22.12 ขึ้นไป** Easy CMS รันใน edge runtime ไม่ได้ Cloudflare Workers และ Vercel Edge จึงใช้ไม่ได้
- **อย่า bundle package admin** ไฟล์ของ admin ถูกอ่านจาก `@easy-cms/admin` บน disk ตอนผม build ทดสอบ ทั้ง `@astrojs/node` และ `@sveltejs/adapter-node` ปล่อย `@easy-cms/*` ไว้เป็น import และ admin โหลดขึ้นมาได้ ถ้า build ของคุณ bundle มันเข้าไป ให้ mark เป็น external หรือส่ง `appDir` ให้ `adminHandlerFor`
- **Migration** ตอน development schema จะเปลี่ยนตาม config เอง แต่เมื่อ `NODE_ENV=production` จะไม่มีอะไรเปลี่ยนเองเลย ให้สร้าง migration ด้วย `npx easy-cms migrate:create` แล้วรัน `npx easy-cms migrate` ในที่ที่ deploy และ server จะไม่ยอม start ถ้ายังมี migration ค้างอยู่

ถ้าใช้ Nuxt หรือ Next.js อยู่ ให้ใช้ package ไปเลย เพราะเป็นทางที่ผ่านการทดสอบแล้ว ถ้า frontend เป็น static site หรือเป็นแอปแยกต่างหาก standalone server อาจเหมาะกว่าการ mount อะไรเข้าไป [TODO: เรื่องของคุณ — เคยใช้วิธีนี้ในโปรเจกต์ Astro หรือ SvelteKit จริงหรือยัง, 1 บรรทัด]

ถ้าใครลองวิธีนี้กับ framework ที่ไม่มีในบทความ อยากรู้ว่าเป็นยังไงบ้าง รวมถึงพังตรงไหนด้วย

---

Easy CMS เป็น open source (MIT): [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสารภาษาไทย](/th/docs) ถ้าลองแล้วติดตรงไหน บอกผมได้ที่ [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137)

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
