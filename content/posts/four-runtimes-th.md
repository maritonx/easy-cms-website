---
title: "CMS server ตัวเดียวบน Node, Bun, Deno และ Cloudflare Workers ที่ smoke test ทุก pull request"
slug: four-runtimes-th
language: th
category: Engineering
publishedAt: 2027-03-08
coverText: "bun · deno · workers"
excerpt: "Easy CMS เปลี่ยนจากรันได้แค่ Node มาเป็น Bun, Deno และ Cloudflare Workers ภายในวันเดียว ต้องแก้อะไรบ้าง (crypto, file system, stream, ฐานข้อมูล) อะไรที่ยังต้องใช้ Node.js และ CI matrix ที่ต้องผ่านก่อนจะเรียกว่ารองรับ"
---
จนถึงวันที่ 13 พฤศจิกายน 2026 Easy CMS รันได้บน Node.js อย่างเดียว วันนั้นออกสองเวอร์ชัน 1.44.0 ย้าย import ที่ผูกกับ Node ทั้งหมดใน core ไปไว้ในโฟลเดอร์เดียว และ 1.45.0 เพิ่ม `easy-cms build --target workers` ตั้งแต่นั้น standalone server ซึ่งก็คือหน้า admin กับ REST API รันบน Bun, Deno และ Cloudflare Workers ได้ด้วย

บทความนี้เล่าว่าต้องเปลี่ยนอะไรบ้าง อะไรที่ยังต้องใช้ Node.js และ CI matrix ที่อยู่เบื้องหลังคำว่า "รองรับ" กติกาที่ผมตั้งไว้สั้นๆ คือ runtime หนึ่งจะนับว่ารองรับก็ต่อเมื่อ smoke test บน runtime นั้นผ่านใน CI ทุก pull request ที่แก้โค้ด ไม่ใช่แค่เปิดขึ้นบนเครื่องผม

## ทำไมตอนแรกผมตอบว่าไม่

สิบเอ็ดวันก่อนหน้านั้น วันที่ 2 พฤศจิกายน ผมเพิ่งเขียนไว้ว่า Easy CMS จะไม่รองรับ edge runtime เหตุผลชัดเจน: รหัสผ่าน hash ด้วย scrypt, ย่อรูปด้วย sharp, driver ฐานข้อมูลที่เปิด TCP socket, ส่งอีเมลผ่าน SMTP และไฟล์อัปโหลดที่เขียนลง disk ทั้งหมดนี้ไม่มีใน Cloudflare Worker แบบที่มีใน Node

สิ่งที่ทำให้ผมเปลี่ยนใจคือ [roadmap](/th/blog/more-than-a-cms-th) ถ้า Easy CMS จะเป็น backend ที่เขียนครั้งเดียวด้วย TypeScript คำว่า "ครั้งเดียว" ก็ต้องรวมถึงที่ที่มันรันด้วย ตั้งแต่ VPS ที่มี SQLite บน disk, Bun, Deno ไปจนถึง Worker ที่ใช้ Turso กับ R2 ผมจึงเขียน [ADR-0067](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0067-multi-runtime.md) แล้วไล่ดูว่า core ผูกกับ Node จริงๆ แค่ไหน

คำตอบน้อยกว่าที่กลัวไว้ core import โมดูล `node:*` อยู่ 21 ไฟล์ ส่วนใหญ่เป็น HMAC, hash และค่าสุ่ม ซึ่งทุก runtime มีอยู่แล้ว ส่วนที่ต้องมีเครื่องจริงๆ มีไม่กี่อย่าง: disk storage, การโหลดไฟล์ config, admin modules, ไฟล์ชั่วคราวของ backup และการดาวน์โหลดไฟล์จาก URL

## โฟลเดอร์เดียวสำหรับ Node

core รับ request แบบ `(Request) => Promise<Response>` ตามมาตรฐาน Web มาตั้งแต่เวอร์ชันแรกๆ งานจริงจึงอยู่รอบๆ handler ปลายทางคือ core ที่ใช้แต่ Web API (`fetch`, `Request`/`Response`, `crypto.subtle`, stream) และทางไปคือกติกาข้อเดียว: import `node:*` ได้เฉพาะใน `packages/core/src/runtime/`

- `runtime/crypto.ts`, `runtime/bytes.ts` และ `runtime/context.ts` ใช้ได้แค่ `node:crypto`, `node:buffer` และ `node:async_hooks` ซึ่ง Node, Bun, Deno และ Workers (เปิด `nodejs_compat`) มีครบ
- `runtime/node/` เก็บส่วนที่ต้องมี disk หรือ socket: disk storage, ไฟล์และ module และการดาวน์โหลดจาก URL
- ที่อื่นใน core, Biome ไม่ยอมให้ import `node:*` และไม่ยอมให้ใช้ `Buffer` โดยข้อความ error ชี้ไปที่ `runtime/bytes.ts`

lint เห็นแค่ source จึงมีเทสอีกตัวที่ไล่ package ที่ build แล้วตั้งแต่ `dist/index.js` และจดทุกโมดูลของ Node ที่ไปถึง รายการต้องตรงกับสามโมดูลที่ทุก runtime มี บวกกับกลุ่มที่ใช้ได้เฉพาะบนเซิร์ฟเวอร์ (`fs`, `path`, `http`, `net` และอีกไม่กี่ตัว) ถ้ามีโมดูลใหม่โผล่มา เทสจะล้ม พร้อมคอมเมนต์บอกให้ย้ายไปไว้หลัง `runtime/` แล้วตัดสินใจว่าอยู่กลุ่มไหน

ผมชอบการแบ่งแบบนี้เพราะการตัดสินใจไปอยู่ที่เดียว `runtime/crypto.ts` ยังห่อ `node:crypto` สำหรับ hash, HMAC, HKDF และ AES-GCM อยู่ แต่ย้ายไป Web Crypto ได้ทีละฟังก์ชันโดยไม่แตะส่วนอื่น และวันที่ `AsyncContext` ของ TC39 มาถึง ก็แทน `AsyncLocalStorage` ใน `runtime/context.ts` ที่เดียว

## Crypto: scrypt ที่เล็กลง

การ hash รหัสผ่านเป็นจุดชนจุดแรก Easy CMS ใช้ scrypt ที่ N=2^17, r=8, p=1 ซึ่งใช้หน่วยความจำ 128 MB แต่ Worker มีหน่วยความจำทั้งหมด 128 MB

1.44.0 เปลี่ยนเป็น N=2^15, r=8, p=3 ซึ่งใช้ 32 MB ตามเกณฑ์ของ OWASP ทั้งสองแบบแข็งแรงเท่ากัน เพราะ parallelism ที่เพิ่มขึ้นชดเชยหน่วยความจำที่ลดลง สิ่งที่ผมยอมแลกมาด้วย:

- **hash เดิมยังใช้ได้** hash แต่ละตัวเก็บพารามิเตอร์ไว้ในตัว (`scrypt$N$r$p$salt$hash`) รหัสผ่านเดิมจึงตรวจได้ และ hash จะถูกแทนด้วยพารามิเตอร์ใหม่ตอน login สำเร็จครั้งถัดไป
- **hash ที่ขอเยอะเกินถูกปฏิเสธ** ถ้า N คูณ r มากกว่าค่าเดิม ระบบไม่คำนวณเลย hash ที่ถูกแก้จึงทำให้เซิร์ฟเวอร์จองหน่วยความจำเป็น GB ไม่ได้
- **reset link บางอันใช้ไม่ได้หนึ่งครั้ง** link รีเซ็ตรหัสผ่านผูกกับ hash ปัจจุบัน link ที่ส่งไปก่อนคนนั้น login ครั้งแรกหลังอัปเกรดจะใช้ไม่ได้เมื่อ hash เปลี่ยน เรื่องนี้เขียนไว้ใน ADR ว่าเป็นต้นทุนที่รู้อยู่แล้ว

บน Workers ยังมีต้นทุนที่พารามิเตอร์แก้ไม่ได้ การตรวจรหัสผ่านใช้ CPU ราว 100 ms แต่ plan ฟรีของ Workers ให้ 10 ms ต่อ request บน plan ฟรีการ login จึงล้มด้วย error 1102 คู่มือ deploy เลยบอกตั้งแต่ต้นว่าต้องใช้ Workers Paid

## File system: สิ่งที่ Worker ไม่มี

Worker ไม่มี disk และไม่มี process ที่รันค้างไว้ มีสามเรื่องที่พังเพราะเหตุนี้ และตอนนี้แต่ละเรื่องเป็นหนึ่งบรรทัดใน changelog ของ 1.44.0

**ตัวโหลด config ทำให้ Worker หยุดตั้งแต่เริ่ม** Easy CMS อ่าน `easy-cms.config.ts` ด้วย jiti และเดิม jiti ถูก import ตอนโหลด core โค้ด CommonJS ของมัน require `os` แค่นั้นก็พอให้ Worker หยุดก่อนตอบ request แรก ตอนนี้ jiti ถูกโหลดเฉพาะตอนอ่านไฟล์ config จริงๆ และ Worker ไม่เคยอ่านไฟล์ config เพราะตอน build มันถูก bundle เข้าไปแล้ว

**migration ต้องมีไฟล์** ใน production เดิม Easy CMS เทียบฐานข้อมูลกับไฟล์ migration บน disk ก่อนเริ่มทำงาน Worker อ่านไฟล์เหล่านั้นไม่ได้ ตอนนี้ถ้า migration ล่าสุดของฐานข้อมูลตรงกับ config ก็เริ่มได้โดยไม่ต้องมีไฟล์ ส่วน config ที่เปลี่ยนไปหลัง migration นั้นยังถูกปฏิเสธ ตอบ 500 พร้อมบอกเหตุผล จึง deploy Worker ล้ำหน้า migration โดยไม่ตั้งใจไม่ได้

**ไฟล์อัปโหลดต้องมีที่ไป** Worker ใช้ disk storage ไม่ได้ `createWorker(config)` จึง throw ตอนเริ่มถ้าไม่ได้ตั้ง `upload.storage` พร้อมตัวอย่าง `s3Storage()` กับ bucket ของ R2 และตอน build ก็ตรวจเรื่องเดียวกันก่อนเขียนไฟล์ใดๆ

มีอีกสองเรื่องเล็กที่มากับ build ใน 1.45.0 หน้า admin เป็นแอป Vue ที่เซิร์ฟเวอร์ Node อ่านจากโฟลเดอร์ บน Workers ตัว handler ของ admin ได้ option `readFile` และอ่านแอปผ่าน binding `ASSETS` ของ Worker ส่วน IP ของผู้ใช้สำหรับ rate limit และ audit log มาจาก `CF-Connecting-IP`

## Stream และฐานข้อมูล

stream ง่ายที่สุด เพราะ handler ใช้ Web stream อยู่แล้ว บน Node `easy-cms serve` แปลง request ของ Node เป็น `Request` ด้วย `Readable.toWeb` แล้วส่ง `Response` กลับด้วย `Readable.fromWeb` บน Workers ไม่มีอะไรต้องแปลง เพราะ `fetch` ส่ง `Request` ให้ handler ตรงๆ ส่วน backup บีบอัดด้วย `CompressionStream` ของ Web

realtime ที่มาใน 1.47.0 ต้องปรับหนึ่งจุดสำหรับ Workers บนเซิร์ฟเวอร์ Node process เดียวเขียนการบันทึกลงทุก stream ที่เปิดอยู่ได้ แต่บน Workers request หนึ่งเขียนลง stream ของอีก request ไม่ได้ แต่ละ stream จึง poll ตาราง events เอง และ smoke test ครอบเคสนี้ด้วย

ฐานข้อมูลง่ายกว่าที่คาดด้วยเหตุผลเดียว: SQLite ใน Easy CMS ใช้ libSQL และ adapter `sqlite()` ตัวเดิมรับ URL แบบ `libsql://` กับ auth token ได้ บน Workers ฐานข้อมูลจึงเป็น Turso ที่คุยผ่าน HTTP ส่วน Postgres ต้องใช้ TCP socket ตอนนี้จึงยังไม่อยู่ในชุด Workers ใน ADR วางไว้ว่าจะไปทาง Hyperdrive

## ตัว Worker

build เขียนทุกอย่างที่ Wrangler ต้องใช้:

```bash
npm install -D wrangler
npx easy-cms build --target workers
npx wrangler deploy
```

`.easy-cms/workers/` ได้ entry ของ Worker และแอป admin ตัว entry มีสามบรรทัด: import `createWorker` จาก `easy-cms/workers` กับ config ของคุณ แล้ว export `createWorker(config)` ฟังก์ชัน `fetch` ของ Worker ส่งต่อให้ handler ตัวเดียวกับ `easy-cms serve` และ `scheduled` รันคิวงาน

build ครั้งแรกยังเขียน `wrangler.jsonc` ให้ด้วย หลังจากนั้นไฟล์เป็นของคุณ ในนั้นมี `nodejs_compat`, binding `ASSETS`, Cron Trigger ทุกนาทีสำหรับโพสต์ที่ตั้งเวลา การส่ง webhook ซ้ำ และอีเมลในคิว และ alias สำหรับแพ็กเกจที่รันบน Workers ไม่ได้ (`sharp`, `@opentelemetry/api` และ `drizzle-kit/api`) alias ชี้ไปที่ไฟล์ที่ throw ตอน import ซึ่ง Easy CMS รับมืออยู่แล้วเวลาแพ็กเกจเสริมไม่ได้ติดตั้ง core จึงทำงานต่อได้โดยไม่มีมัน

## Bun และ Deno

พอ core มีโฟลเดอร์ `runtime/` แล้ว Bun กับ Deno ก็ไม่ต้องมีโค้ดของตัวเองเลย pull request ที่เพิ่มสองตัวนี้แก้แค่ CI workflow กับสคริปต์ smoke แต่ CLI ขึ้นต้นด้วย `#!/usr/bin/env node` เวลารันจึงต้องระบุ runtime:

```sh
bunx --bun easy-cms migrate
bunx --bun easy-cms serve

deno run -A npm:easy-cms migrate
deno run -A npm:easy-cms serve
```

ทั้งคู่มี `http` และ `fs` ของ Node มากพอสำหรับ `easy-cms serve`, migration และ disk storage ถ้าไม่ใส่ `--bun` ตัว `bunx` จะทำตาม shebang แล้วเปิด Node เงียบๆ เทสจะผ่านด้วย runtime ผิดตัว smoke test จึงรันคำสั่งเดียวกับที่คู่มือเขียนไว้ทุกตัวอักษร เอกสารที่บอกอย่างหนึ่งขณะที่ CI รันอีกอย่าง คือทางที่คำว่า "รองรับ" ค่อยๆ ไม่จริงโดยไม่มีใครรู้

## อะไรที่ยังต้องใช้ Node.js

นี่คือรายการที่ผมอยากอ่านก่อนเลือก runtime:

- **Easy CMS ที่อยู่ใน Next.js หรือ Nuxt** ต้องใช้ Node.js 22.12 ขึ้นไป Bun, Deno และ Workers รัน standalone server ไม่ใช่ตัวที่ต่อกับ framework ส่วนเว็บที่อยู่บน edge ยังอ่านเนื้อหาผ่าน REST ได้ด้วย `@easy-cms/core/client` ซึ่งไม่ import อะไรเลย
- **การย่อรูป** ใช้ sharp บน Workers `upload.imageSizes` จึงไม่สร้างรูปขนาดอื่น แต่รูปยังได้ค่ากว้างและสูง
- **SMTP** ต้องใช้ Node บน Workers ให้ใช้ Resend, Postmark หรือ Brevo จาก `@easy-cms/plugin-email` ซึ่งส่งผ่าน HTTP
- **disk storage** และ **SQLite บน disk** ต้องมี disk บน Workers จึงเป็น Turso กับ R2 (หรือ S3 storage เจ้าไหนก็ได้)
- **backup** ยังเขียนไฟล์ชั่วคราวก่อนบีบอัด และ **การดาวน์โหลดจาก URL** ใช้ `http` กับ `dns` ของ Node ตรวจที่อยู่ปลายทาง ทั้งสองอยู่ใน `runtime/node/` ADR วางแผนเวอร์ชันสำหรับ Workers ไว้แล้ว แต่จนกว่า smoke test จะครอบ ผมจะไม่บอกว่ามันใช้บน Workers ได้
- **edge runtime อื่น** เช่น Vercel Edge Functions ยังไม่รองรับ

ใน ADR ยังมีงานถัดไป: Nuxt บน Cloudflare ผ่าน Nitro, Next.js ผ่าน OpenNext, D1 และ adapter สำหรับย่อรูป

## CI พิสูจน์อย่างไร

ADR-0067 นิยาม "รองรับ" ว่าคือ smoke test: เปิด server, รอ `/healthz`, สร้าง admin, login, สร้าง อ่าน แก้ ลบ, อัปโหลด และอ่านผ่าน REST CI workflow รันมันเป็น matrix pull request ที่แก้โค้ดมีห้า job:

- Node กับ pnpm บน Linux และ Node กับ npm บน Windows
- Bun ติดตั้งด้วย bun และรันด้วย `bunx --bun`
- Deno ติดตั้งด้วย npm และรันด้วย `deno run -A npm:easy-cms`
- Cloudflare Workers ติดตั้งด้วย npm และรันใน `wrangler dev`

บน `main` ส่วนของ Node ขยายเป็นทุก package manager: npm, pnpm, Yarn stable, Yarn 1.22.22 และ bun บน Linux กับ npm และ pnpm บน Windows ส่วน pull request ที่แก้แค่เอกสารรันแค่ lint

![smoke test ในทุก pull request: ห้า job (Node บน Linux และ Windows, Bun, Deno และ Cloudflare Workers) publish แพ็กเกจไปที่ registry ในเครื่อง สร้างโปรเจกต์ migrate เปิด server แล้วใช้งานผ่าน REST ส่วน job ของ Workers ตรวจหน้า admin จาก Workers Assets, Cron Trigger และ realtime stream เพิ่ม](/images/blog/four-runtimes/diagram-1.th.png)

แต่ละ job ทำแบบที่ผู้ใช้ใหม่ทำ แพ็กเกจจาก pull request ถูก publish ไปที่ Verdaccio ในเครื่อง จึงไม่มีอะไรจาก npmjs หลุดเข้ามา จากนั้น `npm create easy-cms` (หรือ `pnpm create`, `bun create`) สร้างโปรเจกต์ใหม่ สคริปต์ตรวจว่ามี lockfile ของ package manager นั้น และ `@easy-cms/core` ที่ติดตั้งเป็นเวอร์ชันที่เพิ่ง publish แล้วรัน `migrate:create init`, `migrate` และ `admin:create` บน runtime นั้น แล้วเปิด server

เมื่อ server ขึ้นแล้ว job จะ:

1. รอ `/healthz` ได้นานสุด 120 วินาที และล้มทันทีถ้า server ปิดตัวเอง
2. login แล้วเก็บ CSRF token
3. อัปโหลด PNG ขนาดหนึ่ง pixel แล้วดาวน์โหลดกลับมาให้ตรงทุก byte
4. สร้างโพสต์ที่ใช้รูปนั้นเป็น cover แก้ชื่อ แล้วอ่านกลับโดยไม่ login แบบที่เว็บอ่าน
5. ลบโพสต์และรูป แล้วตรวจว่าโพสต์ตอบ 404

job ของ Workers ทำมากกว่านั้น มันเพิ่ม `@easy-cms/storage-s3` กับ Wrangler เปิด sqld (เซิร์ฟเวอร์ที่ Turso ใช้) และ S3 server ใน Docker แล้ว build Worker หลังขั้นตอนข้างบน มันโหลดหน้า admin จาก binding `ASSETS` เรียก `/__scheduled` เพื่อรัน Cron Trigger และล้มถ้างานพิมพ์ error ออกมา แล้วเปิด realtime stream ที่ต้องได้รับโพสต์ที่สร้างผ่าน REST

ทั้งหมดนี้ไม่ต้องใช้บัญชี Cloudflare และนั่นก็คือขีดจำกัดตรงๆ ของการตรวจนี้: มันรัน workerd บนเครื่อง CI ไม่ได้ deploy ขึ้น Cloudflare จริง

## สิ่งที่ผมจะทำแบบเดิมอีก

การขีดเส้นที่ระดับโฟลเดอร์คุ้มกว่าการแก้จุดไหนจุดเดียว ไฟล์ส่วนใหญ่ใน 21 ไฟล์แค่ต้องเปลี่ยน import และปัญหาที่เหลือ (jiti, ไฟล์ migration, หน่วยความจำของ scrypt) แต่ละเรื่องเป็นการแก้เล็กๆ ที่แยกจากกัน

การเขียนลงใน ADR ว่า "รองรับ = smoke test ผ่าน" ก็ช่วยเหมือนกัน ADR ถึงขั้นบอกว่าคำว่า "Edge-ready" ใช้ในการตลาดได้ก็ต่อเมื่อ smoke test ของ Workers ผ่านใน CI แล้วเท่านั้น job ของ Workers ถูก merge ก่อนออก 1.45.0 และหลังจากนั้นเว็บถึงขึ้นว่า "Now runs on Cloudflare Workers, Bun and Deno"

## ลองใช้

คู่มืออยู่ที่ [Bun และ Deno](/th/docs/standalone#bun-and-deno) และ [Deploy บน Cloudflare Workers](/th/docs/deploy/cloudflare-workers) เริ่มโปรเจกต์ standalone ได้ด้วย:

```bash
npm create easy-cms@latest my-cms
```

ถ้าคุณรัน Easy CMS บน runtime เหล่านี้ แล้วมีอะไรในรายการ "ยังต้องใช้ Node" ที่สำคัญกับคุณ หรือเจอปัญหาที่ smoke test ไม่ครอบ บอกผมได้ที่ [GitHub discussions](https://github.com/maritonx/easy-cms/discussions)
