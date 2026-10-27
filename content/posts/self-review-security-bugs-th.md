---
title: "บั๊กความปลอดภัย 5 ข้อที่ผมเจอตอนตรวจโค้ดตัวเอง และแอปของคุณก็อาจมี"
slug: self-review-security-bugs-th
language: th
category: Engineering
publishedAt: 2026-12-14
coverText: "X-Forwarded-For"
excerpt: "X-Forwarded-For, Content-Length, IPv6, presigned upload และลิงก์ในอีเมล บั๊ก 5 ข้อจากการตรวจ CMS ของผมเอง พร้อมวิธีแก้และ test ของแต่ละข้อ"
---
rate limit ของ login, limit ขนาด request, SSRF guard, การเช็คชนิดไฟล์ และลิงก์ที่ใช้ได้ครั้งเดียว เว็บแอปส่วนใหญ่มีของพวกนี้เกือบครบ ทั้งห้าอย่างมีอยู่ในโค้ดได้ ผ่าน test ได้ และยังไม่ได้ทำหน้าที่ของมันจริงๆ ก็ได้

ผมเจอเวอร์ชันที่พังของทั้งห้าข้อในโปรเจกต์ของตัวเอง คือ Easy CMS ตอนตรวจกับ OWASP ASVS 5.0 Level 1 เมื่อ 2026-10-09 ขอพูดให้ชัดว่าการตรวจครั้งนั้นคืออะไร ผมไล่อ่าน monorepo (เวอร์ชัน 0.47.2) ทีละหมวด อ่านโค้ดซ้ำในจุดที่ดูร้ายแรง และเขียน test ที่ล้มกับโค้ดเดิมให้ทุก fix มันเป็นการตรวจด้วยตัวเอง ไม่ใช่ pentest และไม่ใช่ audit จากคนภายนอก ผลคือแก้ไป 17 ข้อ ออกใน 0.47.3, 0.47.4 และ 0.48.0 โดยมีข้อหนึ่งที่ต้องแก้ส่วนที่สองเพิ่มใน 1.4.2 ส่วนอีก 20 ข้อที่ความรุนแรงต่ำยกไปไว้ milestone ถัดไป

ข้อที่หนักที่สุดคือบั๊กเรื่องสิทธิ์ใน multi-tenant ซึ่งเล่าไว้ใน[บทความแรกของซีรีส์นี้](FIRST_POST_URL)แล้ว ห้าข้อในบทความนี้ไม่หวือหวาเท่า แต่ไม่มีข้อไหนเฉพาะกับ CMS เลย ทุกข้อเป็น pattern ที่ผมคิดว่าน่าจะเจอได้ในโค้ด Node, Next.js หรือ Nuxt ทั่วไป

| | บั๊ก | แก้ในเวอร์ชัน |
|---|---|---|
| 1 | เอา IP ของ client จากตัวแรกใน `X-Forwarded-For` | 0.48.0 |
| 2 | เช็คขนาด body จาก `Content-Length` อย่างเดียว | 0.47.4 |
| 3 | SSRF guard ที่ไม่รู้จัก IPv4 ที่อยู่ใน IPv6 | 0.47.4 |
| 4 | Upload ตรงเข้า bucket ใช้ `Content-Type` ตามที่ browser ส่งมา | 0.48.0 และแก้ครบใน 1.4.2 |
| 5 | ลิงก์ในอีเมลที่ใช้ login ได้มากกว่าหนึ่งครั้ง | 0.47.4 |

## 1. IP ของ client คือตัวสุดท้ายใน X-Forwarded-For ไม่ใช่ตัวแรก

Easy CMS นับ login ที่ล้มเหลวแยกตามอีเมลและ IP ของ client เมื่ออยู่หลัง proxy IP นี้มาจาก `X-Forwarded-For` และโค้ดส่วนใหญ่ที่หาเจอก็อ่านแบบนี้

```ts
// อย่าทำแบบนี้
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
```

proxy จะต่อที่อยู่ที่มันเห็นไว้ท้าย header ทุกอย่างที่อยู่ก่อนหน้านั้นมาจาก client ตัวแรกจึงเป็นค่าอะไรก็ได้ที่ client เลือกส่งมา key ของ rate limit ผมคือ `${email}|${ip}` ถ้าแต่ละ request ส่งที่อยู่ปลอมไม่ซ้ำกัน ก็ได้ counter ใหม่ทุกครั้ง แปลว่าเดารหัสผ่านได้ไม่จำกัด

![client ส่ง X-Forwarded-For ที่แต่งเอง proxy ต่อ address จริงไว้ท้าย ตัวแรกคืออะไรก็ได้ที่ client เลือก ตัวสุดท้ายคือสิ่งที่ proxy เห็นจริง](/images/blog/self-review-security-bugs/diagram-1.th.png)

วิธีแก้คือใช้ตัวที่ proxy ของเราเติมเข้าไป

```ts
// packages/core/src/framework.ts
export function forwardedClientIp(value: string | null | undefined): string | undefined {
  const last = value
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1)
  return last || undefined
}
```

แบบนี้ถูกต้องเมื่อมี proxy ที่เราคุมเองอยู่ตัวเดียวพอดี ถ้ามีสองชั้น เช่น CDN อยู่หน้า load balancer ให้นับจากขวาตามจำนวนชั้น บน Vercel และ Netlify ตอนนี้ Easy CMS อ่าน header ของแพลตฟอร์มเอง (`x-real-ip`, `x-nf-client-connection-ip`) ถ้าไม่มี proxy ก็ใช้ที่อยู่ของ connection และ `trustProxy` ปิดไว้เป็นค่าเริ่มต้น ถ้าหา IP ไม่ได้เลย มันจะเขียน warning ลง log บน production เพราะ limit ที่นับตามอีเมลอย่างเดียวเปิดให้ใครก็ได้ล็อกบัญชีของคนอื่น

วิธี test คือให้ตัวสุดท้ายคงที่ แล้วเปลี่ยนตัวแรกไปเรื่อยๆ

```ts
// ดัดแปลงจาก packages/integration/test/framework.test.ts (maxLoginAttempts: 2)
let n = 0
const login = (ip: string, password = 'wrong-password') =>
  api(new Request('http://cms.test/api/cms/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `6.6.6.${n++}, ${ip}` },
    body: JSON.stringify({ email: 'a@x.co', password }),
  }))

await login('1.1.1.1')
await login('1.1.1.1')
expect((await login('1.1.1.1', 'password123')).status).toBe(429)
expect((await login('2.2.2.2', 'password123')).status).toBe(200)
```

## 2. Limit ขนาด body ที่ดูแค่ Content-Length

```ts
// อย่าทำแบบนี้
if (Number(request.headers.get('content-length') ?? 0) > MAX) return new Response(null, { status: 413 })
const body = await request.json()
```

body ที่ส่งแบบ chunked transfer encoding ไม่มี `Content-Length` เงื่อนไข `0 > MAX` จึงเป็น false แล้ว `request.json()` ก็ buffer ทั้งก้อนไว้ใน memory ใน Fetch API ไม่มีอะไรจำกัดให้เรา REST handler ของผมอ่าน body แบบนี้ทั้งก้อนก่อนวัดขนาด request ใหญ่ๆ ไม่กี่ตัวก็ทำให้ memory ของ server หมดได้

วิธีแก้ยังเก็บการเช็ค header ไว้เป็นทางลัด แล้วนับ byte ไปพร้อมกับที่ข้อมูลเข้ามา

```ts
// packages/core/src/rest/handler.ts (ตัดให้สั้น)
async function readBody(request: Request, max: number): Promise<Uint8Array> {
  const tooLarge = () => new HttpError('Request body too large', 413)
  if (Number(request.headers.get('content-length') ?? 0) > max) throw tooLarge()
  if (!request.body) return new Uint8Array()
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      // Stop reading, without cancelling: undici, still filling a body made from FormData,
      // throws an unhandled error into a cancelled stream. Unread, the sender is held back.
      reader.releaseLock()
      throw tooLarge()
    }
    chunks.push(value)
  }
  // ...รวม chunk ทั้งหมดเป็น Uint8Array เดียว
}
```

comment ในโค้ดคือบทเรียนข้อที่สอง วิธีหยุดที่ใครก็นึกออกก่อนคือ `reader.cancel()` และ fix รุ่นแรกก็ทำแบบนั้น แต่ undici ซึ่งเป็น HTTP client เบื้องหลัง `fetch` ของ Node จะโยน error ที่ไม่มีใครจับเข้าไปใน stream ที่ถูก cancel ถ้า body ของ `Request` สร้างจาก `FormData` และยังเติมข้อมูลไม่เสร็จ การ release lock แล้วปล่อยส่วนที่เหลือไว้โดยไม่อ่าน หยุดการอ่านได้โดยไม่เกิด error นั้น และ backpressure จะรั้งฝั่งผู้ส่งไว้เอง

test ส่ง chunk ละ 64 KB โดยไม่บอกความยาว แล้วนับว่าถูกดึงไปกี่ chunk

```ts
// ดัดแปลงจาก packages/integration/test/rest.test.ts
let sent = 0
const body = new ReadableStream<Uint8Array>({
  pull(controller) {
    if (sent >= 1600) return controller.close() // สูงสุด 100 MB
    sent++
    controller.enqueue(new Uint8Array(64 * 1024).fill(32))
  },
})
const response = await handle(new Request('http://cms.test/api/cms/auth/forgot-password', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half',
} as RequestInit))
expect(response.status).toBe(413)
expect(sent).toBeLessThan(40) // limit คือ 1 MB
```

## 3. SSRF guard ที่ลืม IPv4 ที่อยู่ใน IPv6

Easy CMS ดาวน์โหลดไฟล์มาเป็น upload จากลิงก์ได้ ฟีเจอร์นี้ปิดไว้เป็นค่าเริ่มต้น ถ้าเปิด มันจะ resolve host ปฏิเสธที่อยู่ private และเช็คซ้ำหลังทุก redirect ใน blocklist มีช่วง IPv4 ที่ทุกคนใส่กัน (`10.0.0.0/8`, `169.254.0.0/16` และอื่นๆ) รวมกับ `::1`, `fc00::/7` และ `fe80::/10`

สิ่งที่หลุดไปคือที่อยู่ IPv6 ที่พกที่อยู่ IPv4 ไว้ใน 32 bit สุดท้าย แบบแรกคือ NAT64 prefix `64:ff9b::/96` บน network ที่มี NAT64 `64:ff9b::a9fe:a9fe` ไปถึง `169.254.169.254` ซึ่งเป็นที่อยู่ metadata ของ cloud ได้ แบบที่สองคือรูปแบบเก่าที่เรียกว่า IPv4-compatible คือ `::/96` `net.BlockList` ของ Node นับที่อยู่ `::ffff:` (IPv4-mapped) เป็น IPv4 ให้อยู่แล้ว แต่ไม่นับสองแบบนี้ จะ match จากรูปแบบที่มีจุดก็ไม่ช่วย เพราะ URL parser เขียนให้ใหม่ `new URL('http://[::ffff:127.0.0.1]/').hostname` ได้ `[::ffff:7f00:1]`

วิธีแก้คือดึง IPv4 ที่ฝังอยู่ออกมาแล้วเช็คแบบ IPv4

```ts
// packages/core/src/remote-file.ts (บางส่วน)
const EMBEDS_IPV4 = new BlockList()
EMBEDS_IPV4.addSubnet('64:ff9b::', 96, 'ipv6')
EMBEDS_IPV4.addSubnet('::', 96, 'ipv6')

// ใน isPrivateAddress() เมื่อเป็นที่อยู่ IPv6:
const embedded = embeddedIPv4(address) // 4 byte สุดท้ายในรูป a.b.c.d
if (embedded) return PRIVATE.check(embedded, 'ipv4')
return PRIVATE.check(address, 'ipv6')
```

test ให้ครบทั้งสองทาง จะได้แน่ใจว่า fix ไม่ได้แค่บล็อก IPv6 ทุกตัว

```ts
// ดัดแปลงจาก packages/core/test/remote-file.test.ts
for (const ip of ['::ffff:192.168.0.1', '64:ff9b::a9fe:a9fe', '64:ff9b::127.0.0.1', '::127.0.0.1'])
  expect(isPrivateAddress(ip), ip).toBe(true)
for (const ip of ['8.8.8.8', '2606:4700:4700::1111', '64:ff9b::808:808'])
  expect(isPrivateAddress(ip), ip).toBe(false)
```

ผมให้ข้อนี้ความรุนแรงระดับต่ำ เพราะฟีเจอร์ปิดเป็นค่าเริ่มต้น ที่ยกมาไว้ในนี้เพราะช่องนี้ไม่ได้เฉพาะโค้ดของผม guard ไหนที่สร้างจากช่วง IPv4 บวก IPv6 อีกไม่กี่ช่วงก็มีช่องเดียวกัน

## 4. Presigned upload ที่ใช้ Content-Type ตามที่ browser ส่งมา

ไฟล์ใหญ่ส่งจาก browser ตรงไป S3 ผ่าน presigned PUT URL server เช็คชื่อและชนิดไฟล์ก่อน แล้วจึงเซ็น URL แต่ S3 เก็บไฟล์ และเสิร์ฟไฟล์ในภายหลัง ด้วย `Content-Type` ของ PUT ที่ browser ส่ง ถ้า header นี้ไม่อยู่ใน signature คนอัปโหลดก็เลือกเองได้ ส่งมาเป็น `text/html` ไฟล์นั้นก็กลายเป็นหน้าเว็บบน domain ของ bucket หรือ CDN ของเรา

SVG มีปัญหาเดียวกันจากอีกทาง มันอยู่ใน `image/*` ค่าเริ่มต้น และ SVG ใส่ script ได้ ไฟล์ที่ Easy CMS เสิร์ฟเองจะได้ `Content-Security-Policy: sandbox` และ `nosniff` แต่ public bucket ไม่ส่งให้ทั้งสองอย่าง

fix แรกใน 0.48.0 มีสองส่วน ส่วนแรก `image/*` ไม่รวม SVG แล้ว ต้องระบุ `image/svg+xml` ตรงๆ ส่วนที่สอง เมื่อ direct upload ถูก complete server จะอ่านส่วนต้นของไฟล์แล้วเช็คสองอย่าง

```ts
// packages/core/src/local-api.ts, completeUpload()
const mimeType = sniffMimeType(start.body.subarray(0, SNIFF_BYTES), t.name)
if (mimeType !== t.type)
  await refuse(`contains ${mimeType ?? 'an unknown type'}, not ${t.type}`)
// The browser chose the type the storage serves it with: it must be the one checked.
const served = start.contentType?.split(';')[0]?.trim().toLowerCase()
if (served && served !== t.type) await refuse(`is stored as ${served}, not ${t.type}`)
```

`refuse` ลบไฟล์ทิ้ง test อัปโหลด PDF จริงด้วย `text/html; charset=utf-8` แล้วคาดว่า `completeUpload` จะปฏิเสธ และไม่เหลืออะไรใน storage

fix นั้นยังมีช่อง ซึ่งผมเพิ่งเจอตอนเขียนบทความนี้ การเช็คทำตอน complete upload ไฟล์ที่ส่งขึ้นไปแล้วแต่ไม่มีใคร complete จะข้ามการเช็คไป และค้างอยู่ใน bucket ด้วยชนิดที่ส่งมา Easy CMS ไม่ลบ upload ที่ถูกทิ้งไว้ (ตาราง pending uploads ต้องใช้ migration ในทุกโปรเจกต์) บน public bucket ไฟล์นั้นจึงถูกเสิร์ฟเป็นชนิดอะไรก็ได้ที่คนอัปโหลดเลือก การเช็คไฟล์ตอน upload เสร็จไม่พอ ถ้าไฟล์เป็น public ตั้งแต่ก่อนหน้านั้นแล้ว

fix จริงคือผูกชนิดไฟล์ไว้ตั้งแต่ตอนเซ็น ออกใน 1.4.2 ([PR #197](https://github.com/maritonx/easy-cms/pull/197)) adapter ของ S3 เซ็นด้วย aws4fetch ซึ่งไม่ใส่ `content-type` ใน signature ถ้าไม่ได้ขอให้เซ็นทุก header

```ts
// packages/storage-s3/src/index.ts, uploadURL()
const headers = { 'content-type': contentType }
const signed = await client.sign(url.toString(), {
  method: 'PUT',
  headers,
  aws: { signQuery: true, allHeaders: true },
})
return { url: signed.url, method: 'PUT', headers }
```

`contentType` คือชนิดที่ server หาจากชื่อไฟล์และเช็คกับรายการที่อนุญาตแล้ว ตอนนี้ URL มี `X-Amz-SignedHeaders=content-type;host` S3 จึงปฏิเสธ PUT ที่ส่งชนิดอื่นมา หรือไม่ส่งชนิดมาเลย test ใหม่รันกับ server ที่เข้ากันได้กับ S3 ตัวจริง PUT ด้วย `text/html` และ PUT ที่ไม่มีชนิดถูกปฏิเสธทั้งคู่ ไม่มีอะไรถูกเก็บ และ complete upload ไม่ผ่าน ไฟล์ที่ถูกทิ้งไว้ยังมีได้ แต่มีได้แค่ชนิดที่ server อนุญาต

adapter ของ Vercel Blob ผูกชนิดไว้ด้วย `allowedContentTypes` อยู่แล้ว ถ้าใช้ AWS SDK v3 การใส่ `ContentType` ใน `PutObjectCommand` ก็ทำให้มันเป็น signed header แบบเดียวกัน ไม่ว่าจะเซ็นด้วยอะไร ให้ดู signed headers ใน URL จริง อย่าเชื่อแค่ option ที่ส่งเข้าไป คำแนะนำเรื่อง deploy จากการตรวจครั้งนั้นยังใช้ได้เป็นอีกชั้นหนึ่ง คือเสิร์ฟ public bucket จาก domain ที่ไม่ใช่ domain เดียวกับแอป

## 5. ลิงก์ในอีเมลที่ใช้ login ได้มากกว่าหนึ่งครั้ง

token ที่เซ็นไว้และมีวันหมดอายุ ไม่ว่าจะเป็น HMAC หรือ JWT ตอบได้ว่า "นี่คือใคร และยังใช้ได้อยู่ไหม" แต่ตอบไม่ได้ว่า "ถูกใช้ไปแล้วหรือยัง" signature ยังถูกต้องในคลิกที่สองเหมือนคลิกแรก

ลิงก์ยืนยันอีเมลของสมาชิกเว็บ login ให้ด้วยในตัว และมีอายุ 7 วันเป็นค่าเริ่มต้น ก่อนแก้ ลิงก์เดิมใช้ login ซ้ำได้เรื่อยๆ จนหมดอายุ ซึ่งรวมถึงกรณีอีเมลที่ถูก forward ต่อ คอมพิวเตอร์ที่ใช้ร่วมกัน หรือ history ของ browser

วิธีแก้คือผูก token ไว้กับ state ที่ action นั้นเปลี่ยน ลิงก์ยืนยันใช้ได้เฉพาะตอนที่บัญชียังไม่ได้ยืนยัน

```ts
// packages/core/src/auth/auth.ts, verifyEmail() (บางส่วน)
if (
  !user ||
  user.active === false ||
  // A link confirms once: it doesn't sign in again afterwards.
  user.emailVerified !== false ||
  !passwordTokenMatches(this.config.secret, token, passwordFingerprint(user.passwordHash))
) {
  // บันทึกความล้มเหลว แล้วตอบว่า "This link has expired or is not valid"
}
```

บรรทัดสุดท้ายเป็นเทคนิคเดียวกับลิงก์ reset รหัสผ่าน HMAC ครอบ fingerprint ของ password hash ปัจจุบันของผู้ใช้ไว้ด้วย พอเปลี่ยนรหัสผ่าน ลิงก์เก่าทุกอันก็ใช้ไม่ได้ทันที โดยไม่ต้องมีตารางเก็บ token ที่ใช้ไปแล้ว ส่วน test ก็แค่เรียกสองครั้ง

```ts
// packages/integration/test/members.test.ts
expect((await call('/auth/verify-email', { method: 'POST', body: { token } })).status).toBe(200)
expect((await call('/auth/verify-email', { method: 'POST', body: { token } })).status).toBe(400)
```

## ถ้าเป็นแอปของคุณ ผมจะเช็คอะไรบ้าง

- **header ที่ proxy เขียน:** เชื่อตัวไหน และแอปมีทางถูกเรียกตรงๆ โดยไม่ผ่าน proxy หรือเปล่า
- **ทุกจุดที่เรียก `request.json()` และ `request.text()`:** อะไรหยุด body ที่ไม่มีความยาว
- **blocklist ของ SSRF:** เอาตารางที่อยู่ข้างบนไปรันกับของคุณ
- **presigned URL:** header ไหนอยู่ใน signature จริงๆ และ upload ที่ไม่มีใคร complete จะเป็นอย่างไร
- **ลิงก์ใช้ครั้งเดียว:** state อะไรที่ทำให้การใช้ครั้งที่สองล้ม

การตรวจครั้งเดียวกันยังเจอว่า starter template ใช้ secret ค่าคงที่เป็น fallback บน production ตอนนี้ core ไม่รับ secret ที่ดูเป็นค่าตัวอย่างหรือเป็นรูปแบบซ้ำๆ บน production ทุก fix ในรายการของการตรวจมี test และรายการเต็มอยู่ใน [docs/security/asvs-l1.md](https://github.com/maritonx/easy-cms/blob/main/docs/security/asvs-l1.md) ซึ่งเขียนเป็นภาษาไทยอยู่แล้ว เอกสารนั้นวางแผน pentest จากภายนอกไว้หลัง 1.0 เมื่อมีผู้ใช้ production แล้ว ถ้าคุณเจออะไรก่อนหน้านั้น ช่วยรายงานผ่าน private vulnerability reporting ของ GitHub ตามที่เขียนไว้ใน `SECURITY.md` แทนการเปิด issue สาธารณะ

---

Easy CMS เป็น open source (MIT): [github.com/maritonx/easy-cms](https://github.com/maritonx/easy-cms) · [เอกสารภาษาไทย](/th/docs) ถ้าลองแล้วติดตรงไหน บอกผมได้ที่ [issue สำหรับ feedback](https://github.com/maritonx/easy-cms/issues/137)

*ผมร่างบทความนี้ด้วย Claude จากเอกสารออกแบบและ git history ของโปรเจกต์ การตัดสินใจและความผิดพลาดเป็นของผมเอง*
