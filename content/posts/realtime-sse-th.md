---
title: "Realtime ใน CMS ที่ฝังในแอป: Server-Sent Events, ตาราง event และ leave ที่เกือบทำ id หลุด"
slug: realtime-sse-th
language: th
category: Engineering
publishedAt: 2027-02-22
coverText: "SSE"
excerpt: "Easy CMS 1.47 ส่งการเปลี่ยนแปลงของ collection ให้แอปผ่าน Server-Sent Events โดยเขียนแถว event ใน transaction เดียวกับการบันทึก, poll เพื่อกระจายข้าม instance, ต่อจากเดิมด้วย Last-Event-ID และแก้บั๊กที่เกือบบอก id ของเอกสารที่ผู้ใช้มองไม่เห็น"
---
ตั้งแต่ Easy CMS 1.47.0 ที่ออกเมื่อ 14 พฤศจิกายน 2026 แอป subscribe การเปลี่ยนแปลงของ collection ได้ และได้แต่ละการเปลี่ยนแปลงทันทีที่บันทึก รายการบทความบนเว็บอัปเดตเองเมื่อ editor กด publish โดยไม่ต้องโหลดหน้าใหม่ และไม่ต้องเขียน poll REST เอง

realtime คือชิ้นสุดท้ายที่ยังขาดของระดับ 2 ใน [roadmap](/th/blog/more-than-a-cms-th) และมีเรื่องต้องตัดสินใจมากกว่าที่ผมคิดไว้ สำหรับสิ่งที่ฟังดูแค่ "ส่งข้อความเมื่อแถวเปลี่ยน" บทความนี้เล่าทีละเรื่อง: ทำไมเลือก Server-Sent Events, ทำไมเพิ่มตารางใหม่แทนที่จะใช้ outbox ที่มีอยู่แล้ว, instance หลายตัวแบ่ง event กันอย่างไรโดยไม่มี Redis และ event `leave` ที่เกือบบอก id ของเอกสารที่ผู้ subscribe ไม่เคยมีสิทธิ์เห็น

## หน้าตาตอนใช้

เปิดทีละ collection:

```ts
{
  slug: 'posts',
  realtime: true,
  fields: [/* … */],
}
```

แล้วในเบราว์เซอร์:

```ts
import { createClient } from '@easy-cms/core/client'

const cms = createClient<typeof config>({ url: '/api/cms' })

const stream = cms.subscribe(
  [
    { collection: 'posts', where: { category: { equals: 'news' } } },
    { collection: 'comments', id: 42 },
  ],
  {
    onEvent: (change) => {
      if (change.collection === 'posts' && 'doc' in change) console.log(change.doc.title)
    },
    onReset: () => reloadEverything(),
  },
)
```

แอปส่วนใหญ่ไม่ต้องเรียก `subscribe()` เอง `useLive()` ใน `@easy-cms/next/live` และใน `@easy-cms/nuxt` โหลดรายการ เรียงตาม `sort` ตัดตาม `limit` และใช้ event ให้เอง ส่วนโค้ดฝั่งเซิร์ฟเวอร์ได้ event ชุดเดียวกันจาก `cms.subscribe()` ของ Local API ในรูป async iterator

ทุก event มีเอกสาร**ตามที่ผู้ subscribe คนนั้นอ่านได้ผ่าน REST** สิทธิ์ของ collection, สิทธิ์ระดับแถว, สิทธิ์อ่านระดับ field, สิทธิ์ของ API key และฉบับร่าง ใช้กับแต่ละคนแยกกัน นี่คือกฎข้อแรกที่ผมเขียนไว้ และเรื่องที่เหลือส่วนใหญ่ก็ตามมาจากข้อนี้

## ทำไมเริ่มที่ Server-Sent Events

stream คือ HTTP request ตัวเดียว: `GET /api/cms/realtime?s=posts&s=comments/42` ตอบเป็น `text/event-stream` ผมเลือก SSE ก่อน WebSocket ด้วยเหตุผลง่ายๆ:

- **มันคือ GET ธรรมดา** ผ่าน handler เดียวกัน auth เดียวกัน และ proxy เดียวกับการอ่านอื่นๆ ใช้กับ HTTP/2 ได้ ไม่ต้องรองรับการ upgrade connection ใน Next.js, Nuxt และเซิร์ฟเวอร์ standalone (Nuxt ยังต้องดูแลเพิ่ม: `sendWebResponse` ของ h3 อ่าน stream ต่อแม้ client ปิดไปแล้ว handler ของ Nuxt จึงเขียน event stream เองและ cancel เมื่อ connection ปิด)
- **client อ่านด้วย `fetch` ได้** เรื่องนี้สำคัญกว่าที่ฟัง `EventSource` ส่ง header `Authorization` ไม่ได้ client ฝั่งเซิร์ฟเวอร์ที่ใช้ API key จึงใช้มันไม่ได้ การอ่าน stream ด้วย `fetch` แล้วแปลงบรรทัด SSE เองใช้ได้ทั้งในเบราว์เซอร์ด้วย session cookie และบนเซิร์ฟเวอร์ด้วย header
- **ข้อมูลไหลทางเดียวอยู่แล้ว** หลังเชื่อมต่อ ผู้ subscribe ไม่ส่งอะไรกลับ สิ่งที่ตามถูกกำหนดตอนเปิด stream

ข้อสุดท้ายก็คือราคาที่ต้องจ่าย เพิ่ม subscription ให้ stream ที่เปิดอยู่ไม่ได้ อยากเปลี่ยนก็ต้องเปิดใหม่ ผมเลือกทำให้การเปิดใหม่ถูก แทนที่จะเลี่ยงมัน: `s` แต่ละตัวคือ path ของ REST พร้อม query (`posts?where[category][equals]=news&depth=0`) ได้สูงสุด 20 ตัวต่อ connection และ client เริ่ม stream ใหม่ต่อจากจุดที่ stream เดิมไปถึงได้ จึงไม่พลาดอะไรระหว่างนั้น

WebSocket ยังไม่ได้ตัดทิ้ง ทุก message มีสามส่วนคือ `id`, `event` และ `data` และมีฟังก์ชันเดียวที่แปลงเป็นข้อความ SSE ถ้าทำ WebSocket ภายหลังก็ส่งสามส่วนเดิมเป็น JSON

## แถว event ใน transaction เดียวกับการบันทึก

ทางที่ง่ายที่สุดคือ event emitter ใน process: บันทึกเสร็จก็เรียกทุก stream ที่เปิดอยู่ แต่มันพังสองแบบที่ผมสนใจ การบันทึกบน instance A ไม่ไปถึง stream ที่อยู่บน instance B และ client ที่หลุดไปสิบวินาทีไม่มีทางได้สิ่งที่พลาดไปกลับมา

ดังนั้นทุกการบันทึกของ collection ที่มี `realtime: true` จะเขียนแถวลงตารางใหม่ `realtime-events`: collection, id ของเอกสาร, ชนิดของการเปลี่ยน (`create`, `update`, `delete`, `publish`, `unpublish`), เปลี่ยนแค่ฉบับร่างหรือไม่ และเอกสาร publish อยู่หรือไม่ id แบบ serial ของแถวกลายเป็น `id:` ของ SSE และเป็น cursor สำหรับต่อจากเดิม

แถวนี้เขียน**ใน transaction เดียวกับการบันทึก** ไม่มี event ของการบันทึกที่ rollback ไป และไม่มีการบันทึกที่ไม่มี event adapter ของ SQLite และ Postgres มีช่องทางอยู่แล้ว เพราะ outbox จาก [ADR-0053](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0053-outbox-for-after-hooks.md) ส่งแถวเพิ่มเข้าไปใน `create`, `update` และ `delete` ให้เขียนคู่กับเอกสาร adapter ที่เขียนใน transaction ไม่ได้จะเขียน event ทันทีหลังบันทึก และบอกไว้ตอนเริ่มระบบ ถ้า process ตายตรงช่องนั้น event หายหนึ่งตัว

ทำไมไม่อ่านจาก outbox ไปเลย ผมดูมันก่อนเป็นอย่างแรก outbox เป็นคิวงาน: เขียนแถวเฉพาะเมื่อมีอะไรต้องรัน (hook, webhook, purge cache) และลบทิ้งเมื่องานสำเร็จ collection ที่ไม่มี hook ไม่เขียนอะไรลงไปเลย และ client ที่กลับมาเชื่อมต่อหลังจากนั้นหนึ่งนาทีก็จะเจอแถวที่ถูกลบไปแล้ว บันทึกสำหรับ replay ต้องการตรงกันข้าม: ทุกการเปลี่ยนแปลงมีแถว และเก็บไว้สักพัก จึงเป็นตารางแยก เก็บไว้ `retentionHours` (ค่าเริ่มต้น 24) แล้วลบโดยงานที่รันทุกนาทีอยู่แล้ว

มีรายละเอียดหนึ่งที่ผมเจอเพราะนั่งคิดเรื่อง sequence ของ Postgres: Postgres แจก id ก่อน transaction จะ commit transaction ที่ช้าอาจ commit id 41 หลังจาก transaction ที่เร็วกว่า commit 42 ไปแล้ว ตัวอ่านที่ข้ามไปถึง 42 แล้วจะไม่เห็น 41 อีกเลย ตัวอ่านจึงหยุดที่ช่องว่างของ id แล้วรอ สูงสุด 10 วินาที เพราะ transaction ที่ rollback ทิ้งช่องว่างที่ไม่มีวันเต็ม event ออกไปตามลำดับและไม่ข้ามตัวไหน ราคาคือช่องว่างที่ไม่ปิดจะหน่วง event ถัดไปได้ถึง 10 วินาที

## หลาย instance โดยไม่มี Redis

instance ของ Easy CMS ประสานกันผ่านฐานข้อมูลอย่างเดียวมาตั้งแต่ก่อนหน้านี้ คิวงานก็ทำแบบนี้ ([ผมเขียนเล่าไว้ที่นี่](/th/blog/postgres-job-queue-th)) และผมไม่อยากให้ realtime เป็นเหตุผลที่ใครต้องรัน Redis เพิ่ม

![การบันทึกไปถึงผู้ subscribe อย่างไร: การบันทึกกับแถว event commit พร้อมกัน ทุก instance อ่านแถวใหม่ทุก pollMs และผู้ subscribe แต่ละคนได้เอกสารตามที่ตัวเองอ่านได้ หรือได้ leave เฉพาะเมื่อเคยเห็นเอกสารนั้นมาก่อน](/images/blog/realtime-sse/diagram-1.th.png)

แต่ละเซิร์ฟเวอร์อ่านแถวใหม่จาก `realtime-events` ทุก `pollMs` (ค่าเริ่มต้น 1,000 ms) ครั้งเดียวสำหรับทุก stream ที่เปิดอยู่บนมัน แล้วแจกให้แต่ละ stream หลังการบันทึกบน instance เดียวกันจะอ่านทันทีโดยไม่รอรอบถัดไป การบันทึกบน instance A ไปถึงผู้ subscribe บน instance B ภายในประมาณ `pollMs` และมี test สำหรับเรื่องนี้ตรงๆ: instance สองตัวบนฐานข้อมูลเดียวกัน เปิด stream บนตัวหนึ่ง สร้างบทความผ่าน REST บนอีกตัว

แถว event ไม่เก็บเอกสารที่จะส่ง สำหรับผู้ subscribe แต่ละคน เซิร์ฟเวอร์โหลดเอกสารใหม่ด้วย `where` ของ subscription บวก id ในฐานะผู้ใช้คนนั้น พร้อมฉบับร่าง depth และ locale ของเขา นี่คือสิ่งที่ทำให้ "ตามที่อ่านได้ผ่าน REST" เป็นจริง และก็เป็นส่วนที่แพง: อ่านหนึ่งครั้งต่อผู้ subscribe ต่อ event ผู้เยี่ยมชมที่ subscribe แบบเดียวกันใช้การอ่านร่วมกันต่อ event ซึ่งครอบคลุมกรณีที่พบบ่อยคือหน้าสาธารณะที่คนเปิดไว้เยอะ แต่ผู้ใช้ที่ล็อกอินจำนวนมากบน collection ที่แก้บ่อยก็มีค่าอ่านจริง

**Cloudflare Workers** ไม่เข้ากับแบบแชร์ request หนึ่งเขียนลง stream ของอีก request ไม่ได้ บน Workers แต่ละ stream จึง poll ตารางเอง: หนึ่ง query ต่อ stream ทุก `pollMs` ใช้งานได้ มี smoke test ที่เปิด stream บน Workers แล้วรอบทความที่สร้างผ่าน REST และคู่มือแนะนำให้ตั้ง `pollMs` สูงขึ้นบน Workers หรือมีจำนวน stream น้อยๆ

**ฟังก์ชัน serverless** (Vercel, Netlify) ตัด stream เมื่อถึงเวลาสูงสุดของฟังก์ชัน client เชื่อมต่อใหม่ด้วย `Last-Event-ID` และไม่พลาดอะไร แต่ stream ที่เปิดนานก็กินเวลาของฟังก์ชัน ถ้าผู้ subscribe เยอะ เซิร์ฟเวอร์ที่รันตลอดเหมาะกว่า

## ต่อจากเดิม, reset และ heartbeat

client ที่เชื่อมต่อใหม่ส่ง `Last-Event-ID` มา เซิร์ฟเวอร์ replay สิ่งที่ผู้ subscribe คนนั้นเห็นได้หลัง id นั้นก่อน แล้วค่อยส่ง `ready` `EventSource` ทำแบบนี้เอง client ใน `@easy-cms/core/client` ก็ทำ พร้อม backoff 1 ถึง 30 วินาทีบวก jitter เพื่อไม่ให้ client ที่หลุดพร้อมกันตอนรีสตาร์ตกลับมาในวินาทีเดียวกันหมด และเลิกลองใหม่เมื่อ API ปฏิเสธ subscription (400, 401, 403 หรือ 404)

บางครั้งต่อจากเดิมไม่ได้ เซิร์ฟเวอร์จะบอกด้วย `reset` แทนที่จะเดา:

- แถวหลัง id นั้นอาจถูกลบไปแล้ว (client หายไปนานกว่า `retentionHours`)
- id มากกว่าแถวล่าสุด แปลว่าฐานข้อมูลเปลี่ยนไปแล้ว
- ค่าไม่ใช่ตัวเลข
- หรือ client ตามหลังเกิน 1,000 event ซึ่งโหลดรายการใหม่ถูกกว่า replay

เมื่อได้ `reset` client โหลดสิ่งที่แสดงอยู่ใหม่ `live()` และ `useLive()` ทำให้เอง

ทุก `heartbeatMs` (25 วินาที) จะมีบรรทัด comment ออกไปหนึ่งบรรทัด เพื่อไม่ให้ proxy ปิด stream ที่เงียบ heartbeat ยังเลื่อน `id:` ของ stream ไปที่ event ล่าสุดที่เซิร์ฟเวอร์ประมวลแล้ว รวมตัวที่ผู้ subscribe คนนี้ไม่มีสิทธิ์เห็นด้วย ถ้าไม่ทำ ผู้ subscribe ที่ตาม `where` เงียบๆ บน collection ที่คึกคักจะเชื่อมต่อใหม่จาก id ที่ย้อนไปไกล แล้ว replay event เป็นร้อยตัวเพียงเพื่อทิ้งทั้งหมด

response ยังตั้ง `cache-control: no-cache, no-transform` และ `x-accel-buffering: no` ที่ต้องมี `no-transform` เพราะการบีบอัด (รวมของ Next.js) จะกั้น event ไว้จนบัฟเฟอร์เต็ม ซึ่งสำหรับ stream แปลว่า "อีกนาน"

## auth และขีดจำกัด

auth เหมือน REST: session cookie ในเบราว์เซอร์ หรือ API key / token ใน header `Authorization` บนเซิร์ฟเวอร์ **ไม่รับ token จาก URL เด็ดขาด** URL ไปอยู่ใน log ของ proxy, ประวัติเบราว์เซอร์ และ header `Referer` URL ของ stream ที่เปิดอยู่นานพร้อม token ก็คือ token ที่ไปอยู่ในทุกที่เหล่านั้น integration test ส่ง token ที่ใช้ได้จริงเป็น `?token=` แล้วคาดว่าจะได้ `401` เพราะ request นั้นถูกนับเป็นผู้เยี่ยมชมธรรมดา

สิทธิ์ตรวจตอนเปิด stream ด้วยการรัน count แบบ `max: 0` ของแต่ละ subscription ในฐานะผู้ใช้คนนั้น `where` บน field ที่ผู้ใช้อ่านไม่ได้ได้ `403` ก่อนจะมี event ใดๆ เหมือนกับการ list ระหว่างที่ stream เปิดอยู่ session หรือ API key ถูกตรวจซ้ำราวนาทีละครั้ง ถ้าหมดอายุหรือถูกยกเลิก stream จะปิด แล้ว client เชื่อมต่อใหม่ในฐานะผู้ใช้ปัจจุบัน

ขีดจำกัดสองตัวกันไม่ให้ client เดียวยึดเซิร์ฟเวอร์: `maxPerUser` (10) stream ต่อผู้ใช้ ต่อ API key หรือต่อ IP ของผู้เยี่ยมชม เกินได้ `429` พร้อม `Retry-After: 30` และ `maxConnections` (1,000) ต่อเซิร์ฟเวอร์ เกินได้ `503` พร้อม `Retry-After: 10` ทั้งสองนับต่อ process (ต่อ isolate บน Workers) ไม่นับข้าม instance

## leave ที่เกือบทำ id หลุด

นอกจากการเปลี่ยนแปลงห้าแบบ ผู้ subscribe ยังได้ event อีกตัวคือ `leave` แปลว่า "เอกสารที่คุณอาจมีอยู่ไม่แสดงสำหรับคุณแล้ว": บทความถูกเลิก publish สำหรับผู้เยี่ยมชม หรือถูกแก้จนไม่ตรง `where` ของ subscription หรือสิทธิ์ระดับแถวของผู้ใช้อีกต่อไป ถ้าไม่มี `leave` รายการที่กรองไว้จะแสดงบทความที่ย้ายไปหมวดอื่นค้างไว้จนกว่าจะโหลดหน้าใหม่

เวอร์ชันแรกของผมส่ง `leave` (และ `delete`) ให้ทุกคนที่อ่าน collection ได้แต่โหลดเอกสารนั้นไม่ได้ ฟังดูไม่มีพิษภัย แต่ไม่ใช่ ลองนึกถึง collection `notes` ที่ผู้ใช้แต่ละคนอ่านได้แค่ของตัวเองด้วยสิทธิ์ระดับแถว ผู้ใช้ A แก้โน้ตของตัวเอง เซิร์ฟเวอร์โหลดโน้ตนั้นให้ผู้ใช้ B, B อ่านไม่ได้ B จึงได้ `leave` พร้อม id ของโน้ต B ไม่เคยเห็นโน้ตนั้นและไม่เคยมีสิทธิ์เห็น แต่ตอนนี้ B รู้ว่ามันมีอยู่ รู้ id และรู้ว่ามันเพิ่งเปลี่ยน กับ subscription ที่มี `where: { category: { equals: 'news' } }` ก็เหมือนกัน ทุกการแก้บทความหมวดกีฬาส่ง `leave` ไปหาคนที่ตามหมวดข่าว

การรีวิวก่อนออก 1.47.0 จับได้ และการแก้เข้าไปในเช้าวันเดียวกับที่ออก release สิ่งที่ต้องมีเพิ่มคือสิ่งที่แถว event ยังไม่มี: หน้าตาของเอกสาร**ก่อน**การเปลี่ยน

- แถว event ของ update และ delete เก็บเอกสารที่อยู่ในฐานข้อมูลก่อนการเปลี่ยนไว้เป็น JSON ในคอลัมน์ `before` โดยไม่รวม password hash และ**ไม่เคยส่งออกไป** ไม่อยู่ใน `data` ของ SSE และไม่อยู่ใน `cms.subscribe()` ใช้แค่ตรวจ
- `leave` และ `delete` ไปถึงเฉพาะผู้ subscribe ที่เห็นสถานะก่อนหน้านั้นได้: ตรงกับ subscription (collection, id, `where`) และผ่านสิทธิ์อ่านของผู้ subscribe **ตอนนี้** รวม `where` ระดับแถวและ grant ของ API key และฉบับร่างตามที่เขาอ่านได้ ผู้เยี่ยมชมที่อ่านเฉพาะฉบับ publish ต้องเห็นสถานะก่อนหน้าที่ publish อยู่
- เพราะ `before` อยู่ในแถว การตรวจแบบเดียวกันจึงใช้ได้ตอน client ที่เชื่อมต่อใหม่ replay ด้วย `Last-Event-ID`

การตรวจนี้รันในหน่วยความจำด้วยฟังก์ชันเล็กๆ ชื่อ `matchesWhere` กับแถวที่เก็บไว้ มันรู้จัก `equals`, `not_equals`, `in`, `not_in`, `gt`, `gte`, `lt`, `lte`, `exists`, `and` และ `or`, path เข้าไปใน group และค่าหลายภาษา และ relationship ที่เทียบด้วย id คำตอบมีสามแบบ: `true`, `false` หรือ **"บอกไม่ได้"** `like` ขึ้นกับ collation และกฎของข้อความในฐานข้อมูล ส่วนค่าใน array (field แบบ `hasMany` หรือ tags) ขึ้นกับว่าฐานข้อมูลเก็บอย่างไร แทนที่จะเขียนทั้งสองอย่างใหม่แบบไม่ดี `matchesWhere` บอกว่าไม่รู้ และ "ไม่รู้" นับว่า**มองไม่เห็น**: ไม่ส่ง `leave`

นี่คือการแลกที่ตั้งใจ client ที่ตามการค้นด้วย `like` อาจแสดงเอกสารค้างไว้หลังจากที่มันไม่ตรงแล้ว จนกว่าจะโหลดใหม่ ทางเลือกอีกทางคือบอก id ที่ใครบางคนไม่ควรรู้ และบั๊กแบบนั้นเรียกคืนไม่ได้เมื่อออกไปแล้ว

integration test ตอนนี้เขียนสี่กรณีไว้ชัดด้วยผู้ใช้สองคนกับสิทธิ์ระดับแถว: มองไม่เห็นทั้งก่อนและหลัง ไม่ได้อะไรเลยแม้แต่ id; เห็นก่อนแต่ไม่เห็นหลัง คนที่เคยเห็นได้ `leave` อีกคนไม่ได้อะไร; ไม่เห็นก่อนแต่เห็นหลัง ได้ `update` พร้อมเอกสาร; ถูกลบ ได้ `delete` เฉพาะคนที่เคยเห็น

## สิ่งที่ยังขาด

- **global และ channel ที่กำหนดเอง** ตามได้เฉพาะ collection
- **WebSocket** สำหรับ client ที่ต้องการ รูปแบบ message พร้อมแล้ว แต่ยังไม่ได้ทำ transport
- **`cms.increment()` ไม่เขียน event** เหมือนที่ไม่ส่ง webhook
- **ค่าใช้จ่ายเมื่อโตขึ้น** ทุก instance อ่านตารางทุก `pollMs` ตราบที่มีคน subscribe, ทุก event อ่านเอกสารหนึ่งครั้งต่อผู้ subscribe และแต่ละแถวเก็บสำเนาเอกสารก่อนการเปลี่ยนไว้ `retentionHours` ตารางจึงโตตามขนาดเอกสาร บน Workers ค่า query คูณจำนวน stream
- **ตารางต้องมี migration** ตอนเปิด realtime ครั้งแรก: `easy-cms migrate:create realtime`

หน้า admin ใช้ stream เดียวกันนี้ตั้งแต่ 1.48.0 ซึ่งมีโจทย์ของตัวเอง: แยกการบันทึกของเราเองออกจากของคนอื่น นั่นคือบทความถัดไป

## ลองใช้

ใส่ `realtime: true` ให้ collection สร้าง migration แล้ว `useLive()` จะให้รายการที่ตาม editor ของคุณ [คู่มือ realtime](/th/docs/realtime) มีตัวเลือก รูปแบบ stream และข้อควรรู้เรื่อง Workers กับ serverless ส่วน [ADR-0070](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0070-realtime.md) มีเหตุผลทั้งหมด ถ้าลองรันหลาย instance หรือบน edge runtime แล้วมีอะไรไม่เป็นอย่างที่ควร หรือต้องการ channel ที่ไม่ใช่ collection บอกผมได้ใน [GitHub discussions](https://github.com/maritonx/easy-cms/discussions)
