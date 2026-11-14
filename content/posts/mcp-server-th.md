---
title: "MCP server ของ CMS: ให้ AI agent ทำงานภายใต้สิทธิ์เดียวกับคน"
slug: mcp-server-th
language: th
category: Guide
publishedAt: 2027-04-19
coverText: "MCP"
excerpt: "Easy CMS มี MCP server (ยังเป็น preview) ที่ให้ Claude, Cursor หรือ VS Code ใช้ tool ได้เฉพาะ collection และการกระทำที่ API key อนุญาต บันทึกเป็นฉบับร่างเสมอ ทุกการแก้ไขอยู่ใน audit log ที่ลงลายเซ็น และยังต้องมีคนกดเผยแพร่"
---
คำถามที่น่าสนใจเรื่อง AI กับ CMS ไม่ใช่ "agent เขียนบทความได้ไหม" เพราะได้อยู่แล้ว คำถามจริงคือจะเกิดอะไรขึ้นในวันที่มันเขียนผิด เผยแพร่ออกไป หรือลบสิ่งที่ไม่ควรแตะ

Easy CMS มี MCP server มาตั้งแต่ 28 กันยายน 2026 ในชื่อ `@easy-cms/plugin-mcp` บทความนี้เล่าว่าผมออกแบบมันรอบคำถามนั้นอย่างไร: agent เชื่อมต่อด้วย API key ที่เป็นของคนคนหนึ่ง และ agent ไม่มีวันได้สิทธิ์มากกว่าที่บทบาทของคนนั้นอนุญาต รวมถึงสิ่งที่ agent ทำไม่ได้ การแก้ไขของมันถูกบันทึกไว้ที่ไหน และอะไรที่ยังไม่ได้สร้าง

ขอบอกก่อนเรื่องหนึ่งซึ่งสำคัญ: **plugin MCP ยังเป็น experimental** ใช้เลขเวอร์ชันเดียวกับ Easy CMS ส่วนอื่น (1.48.0 ณ วันที่เขียน 14 พฤศจิกายน 2026) แต่ option, endpoint และ tool ยังอาจเปลี่ยนใน minor release ได้ ไม่อยู่ใต้สัญญาความเสถียรที่ส่วนอื่นของ 1.x มี เดี๋ยวจะเล่าว่าต้องผ่านอะไรบ้างถึงจะเปลี่ยนสถานะนี้

## ติดตั้ง

MCP (Model Context Protocol) คือโปรโตคอลที่ผู้ช่วยอย่าง Claude Code, Claude Desktop, Cursor และ VS Code ใช้เรียก tool บน server การทำให้ CMS เป็น MCP server ใช้แค่ plugin หนึ่งตัวกับ flag หนึ่งตัวใน config:

```ts
import { mcpPlugin } from '@easy-cms/plugin-mcp'

export default defineConfig({
  // …
  apiKeys: true,
  plugins: [mcpPlugin()],
})
```

server อยู่ที่ `<routes.api>/mcp` ปกติคือ `https://example.com/api/cms/mcp` จากนั้นผู้ดูแลสร้าง API key ให้ผู้ช่วยที่ **ตั้งค่า → API keys** แล้วเชื่อมต่อ เช่นจาก Claude Code:

```bash
claude mcp add --transport http easy-cms https://example.com/api/cms/mcp \
  --header "Authorization: Bearer ecms_…"
```

[คู่มือ MCP](/th/docs/mcp) มีวิธีตั้งค่าของ Cursor, VS Code และ Claude Desktop ด้วย

มีการตัดสินใจสองข้อตั้งแต่แรกที่กำหนดส่วนที่เหลือ ข้อแรก server ใช้ Streamable HTTP ของ SDK ทางการ**แบบไม่มี session**: ทุก request สร้าง server ใหม่ ตอบเป็น JSON ธรรมดาแล้วปิด ไม่มี state ข้าม request จึงรันบน serverless ได้เหมือนรันบน Node.js process ที่อยู่ยาว ข้อสอง รับ**เฉพาะ API key** request ที่ไม่มี key ได้ `401` พร้อมบอกวิธีส่ง key ส่วน session cookie ของหน้า admin ใช้ไม่ได้ ตั้งใจให้เป็นแบบนี้ เพราะ login ของคนไม่ควรเป็นสิ่งที่ agent ใช้ทำงาน

## key คือคนคนหนึ่งที่ถูกย่อสิทธิ์ลง

API key ของ Easy CMS ถูกออกแบบใน decision record เดียวกับ MCP server ([ADR-0019](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0019-api-keys-and-mcp.md)) เพราะแก้ปัญหาเดียวกัน: มีบางอย่างที่ไม่ใช่คนต้องทำงานในระบบ และไม่ควรใช้รหัสผ่านของคน

กฎสั้นๆ คือ **key เป็นของผู้ใช้คนหนึ่ง และไม่มีวันทำได้มากกว่าผู้ใช้คนนั้น** นอกจากนั้น key ยังระบุเองว่าทำอะไรได้ ราย collection และ global: read, create, update, delete, publish ต้องผ่านทั้งสองชั้น:

- key ไม่ได้ติ๊กการกระทำนั้น: `403 This API key may not create "posts"`
- key ติ๊กไว้ แต่[กฎสิทธิ์](/th/docs/access-control)ของเจ้าของไม่อนุญาต: `403 Forbidden`

key ของ editor ที่ติ๊ก "delete" ไว้ก็ยังลบสิ่งที่ editor ลบไม่ได้ไม่ได้อยู่ดี และอะไรที่ไม่ได้ติ๊กคือไม่อนุญาต รวมถึง collection ที่เพิ่มทีหลังด้วย

key สำหรับผู้ช่วยเขียนบทความสร้างได้จากหน้า admin หรือจาก seed script:

```ts
const { key } = await cms.createApiKey({
  name: 'Claude',
  user: editor.id,
  permissions: {
    collections: { posts: ['read', 'create', 'update'], media: ['read', 'create'] },
  },
  expiresAt: '2027-03-01T00:00:00Z',
})
```

key ถูกคืนมาครั้งเดียว Easy CMS เก็บแค่ hash แบบ SHA-256 การลบ key หรือปิดใช้งานเจ้าของจะตัดผู้ช่วยออกทันที

กฎสิทธิ์ที่คุณเขียนเองก็แยก key ออกจากคนได้ เพราะ request ที่มาด้วย key จะมี `user.apiKey`:

```ts
access: {
  // People may delete posts; keys may not, whatever they list.
  delete: ({ user }) => !!user && !user.apiKey,
}
```

## tool มาจาก key

ส่วนนี้คือส่วนที่ผมชอบที่สุดในการออกแบบ server ไม่ได้มี tool ชุดตายตัวแล้วคอยปฏิเสธการเรียกส่วนใหญ่ แต่สร้างรายการ tool **จาก key ในทุก request**: หนึ่ง tool ต่อหนึ่ง collection และการกระทำที่ key อนุญาต

ถ้าใช้ key ข้างบนกับ collection `posts` ที่เปิด drafts ผู้ช่วยจะเห็น tool เจ็ดตัวพอดี:

- `find_posts`, `get_posts`, `create_posts`, `update_posts`
- `find_media`, `get_media`, `upload_media`

ไม่มี `publish_posts` และ `delete_posts` ในรายการ model จึงไม่เห็นและไม่มีอะไรให้ลอง ชุดเต็มสำหรับ key ที่อนุญาตทุกอย่างคือ:

| Tool | ต้องมีสิทธิ์ |
|---|---|
| `find_<collection>`, `get_<collection>` | read |
| `create_<collection>`, `update_<collection>` | create, update |
| `delete_<collection>` | delete |
| `publish_<collection>`, `unpublish_<collection>` | publish (collection ที่มี drafts) |
| `schedule_<collection>` | publish (collection ที่มี `schedule`) |
| `upload_media` | create ของ Media |
| `get_global_<slug>`, `update_global_<slug>`, `publish_global_<slug>` | read, update, publish |

input schema ของแต่ละ tool สร้างจาก field ของ collection: `select` กลายเป็น `enum`, `number` เก็บ `min` และ `max` ไว้, field upload ขอ id ของ media และบอกให้ใช้ `upload_media` model ที่ได้ schema แม่นๆ จะเรียกผิดน้อยลง และถ้าผิด error ที่กลับไปก็เป็นข้อความที่มันแก้ต่อได้ เช่น `Invalid data: title: is required` ไม่ใช่ stack trace

รายการ tool เป็นแค่ด่านแรก ทุกการเรียกผ่าน Local API ด้วย `overrideAccess: false` และผู้ใช้ของ key ซึ่งเป็นทางเดียวกับ REST API สิทธิ์ราย field ก็มีผล: field ที่เจ้าของอ่านไม่ได้จะหายไปจากผลของ `get_` และมีเทสตรวจเรื่องนี้

## ฉบับร่างยังเป็นฉบับร่าง

กฎที่สำคัญที่สุดในเรื่องนี้: **ใน collection ที่มี drafts การ create และ update ของ agent บันทึกเป็นฉบับร่างเสมอ** ถ้า model ส่ง `status: 'published'` มาใน data plugin จะตัดออกแล้วบันทึกเป็น `status: 'draft'` มีแค่ `publish_<collection>` ที่ทำให้เอกสารขึ้นเว็บ และต้องมีสิทธิ์ publish บน key

คำแนะนำในตัวที่ server ส่งให้ผู้ช่วยทุกตัวก็บอกเรื่องเดียวกันด้วยภาษาธรรมดา รวมถึงให้ถามก่อนเผยแพร่ ถ้าไม่ได้ถูกสั่งไว้ คุณเพิ่มคำแนะนำของตัวเองได้ด้วย option `instructions` เช่นสไตล์การเขียนของเว็บ แต่ผมไม่พึ่งคำแนะนำเพื่อความปลอดภัย model เมินคำแนะนำได้ แต่เรียก tool ที่ไม่อยู่ในรายการไม่ได้

ตรงนี้ก็เป็นจุดที่ผมทำพลาด คำอธิบายของ `update_` บอกผู้ช่วยว่า "เวอร์ชันที่เผยแพร่อยู่ยังอยู่" ระหว่างแก้บทความที่เผยแพร่แล้ว ซึ่งจริงเฉพาะเมื่อ collection เปิด `versions` ถ้าไม่มี versions การบันทึกเอกสารที่เผยแพร่แล้วเป็นฉบับร่างจะทำให้มันหายจากเว็บจนกว่าจะเผยแพร่อีกครั้ง เหมือนในหน้า admin agent ที่ถูกบอกว่า "หน้าเว็บปลอดภัย" จึงอาจทำให้หน้าหายไปได้ แก้แล้วใน 0.68.1 วันที่ 16 ตุลาคม 2026: คำอธิบายเปลี่ยนตาม collection และบอกตรงๆ เมื่อการแก้จะทำให้หน้าออฟไลน์ ถ้าคุณให้ agent มีสิทธิ์ update แต่ไม่มี publish ให้เปิด `versions` ของ collection นั้นด้วย

## สิ่งที่ agent ทำไม่ได้

ไม่ว่า key จะเขียนไว้อย่างไร:

- **ไม่มี tool ของ users และ API keys** สอง collection นี้ถูกข้ามตอนสร้าง tool และ key สร้าง key ไม่ได้ agent จึงเพิ่มสิทธิ์ให้ตัวเองไม่ได้
- **ไม่มี tool แก้ schema หรือ config** โมเดลเนื้อหาเป็น TypeScript ใน repository ของคุณ agent แก้เนื้อหาได้ แต่แก้รูปร่างของเนื้อหาไม่ได้
- **ไม่ดึง URL** `upload_media` รับไฟล์เป็น base64 server ที่ดาวน์โหลดทุกที่อยู่ที่ agent ส่งมา คือ server ที่ถูกชี้ไปยัง network ภายในของคุณได้ จึงไม่ทำ
- **ได้ไม่เกิน 100 เอกสารต่อการเรียก** รายการรวมฉบับร่างด้วย เหมือนการอ่านด้วย key ทุกครั้ง
- **ไม่มีอะไรนอก collection และ global ของ key** option `collections` และ `globals` จำกัดเพิ่มได้ทั้ง server เช่น `['posts', 'categories', 'media']`

และทุกอย่างที่มันเขียนผ่านการตรวจข้อมูล hook และ versions ชุดเดียวกับการบันทึกในหน้า admin ไม่มีทางลัดแบบ "AI" เข้าฐานข้อมูลอีกทาง

## audit trail

ถ้าเปิด [audit log](/th/docs/audit-log) (`audit: true`) ทุกการแก้ไขของ agent ถูกบันทึกแบบเดียวกับของคน: เอกสารไหน field ไหน ค่าก่อนและหลัง รายการบอกชื่อเจ้าของ key บอกว่าแก้ผ่าน API key และเก็บชื่อของ key ไว้ ชื่อ "Claude" ของ key คือสิ่งที่คุณจะเห็นข้างการแก้ไขนั้น

รายการแก้หรือลบผ่าน Easy CMS ไม่ได้ และแต่ละรายการลงลายเซ็น HMAC-SHA256 ด้วย `EASY_CMS_SECRET` ของคุณ ([ADR-0039](https://github.com/maritonx/easy-cms/blob/main/docs/adr/0039-audit-log.md)) รายการที่ถูกแก้ในฐานข้อมูลภายหลังจะตรวจลายเซ็นไม่ผ่าน และการตรวจรายวันแจ้งบนแดชบอร์ด ข้อจำกัดก็เขียนไว้ชัด: คนที่มี secret ด้วยปลอมลายเซ็นได้ และการอ่านไม่ถูกบันทึก ข้อหลังสำคัญกับ agent: audit log บอกว่า agent แก้อะไร แต่ไม่บอกว่ามันเปิดดูอะไรไปบ้าง

![ลำดับของหนึ่ง MCP call: agent เชื่อมต่อด้วย API key ได้ tool เฉพาะที่ key และเจ้าของอนุญาต บันทึกฉบับร่างผ่านการตรวจข้อมูลและ hook ชุดเดียวกับหน้า admin ทุกการแก้ไขเข้า audit log ที่ลงลายเซ็น แล้วคนเป็นผู้เผยแพร่ ส่วนการอนุมัติการแก้ไขของ agent ใน Easy CMS ยังไม่ได้สร้าง](/images/blog/mcp-server/diagram-1.th.png)

## ทดสอบอย่างไร

การเรียกฟังก์ชันของ tool ตรงๆ ไม่ได้บอกว่า client จริงคุยกับ server อย่างไร ก่อน 1.0 จึงมี issue สองข้อใน roadmap ที่บังคับให้ plugin คุยกับ client จริง:

- **#115:** เรียกทุก tool ผ่าน client ของ `@modelcontextprotocol/sdk` และทดสอบ client ที่ใช้โปรโตคอลเวอร์ชัน 2024-11-05, 2025-03-26 และ 2025-06-18 ตอนนี้รันใน CI ทุก pull request
- **#121:** ต่อ Claude Desktop และ Claude Code ตามคู่มือ แล้วอ่าน ร่าง และเผยแพร่ Claude Desktop ต้องใช้ `mcp-remote` เพื่อส่ง header และสอนผมเรื่องหนึ่งที่ใส่ไว้ในเอกสารแล้ว: ถ้าแก้ `claude_desktop_config.json` ตอน Claude เปิดอยู่ สิ่งที่แก้อาจถูกเขียนทับ แล้ว server ก็ไม่ขึ้นมาเฉยๆ ให้ปิด Claude ก่อน

## สิ่งที่ยังขาด

รายการตรงๆ ณ 1.48.0:

- **ยังเป็น preview** plugin จะพ้นสถานะ experimental ใน minor release เมื่อผ่านสามข้อ: ทดสอบกับ client จริงโดยบันทึกผลไว้ใน issue, ไม่มี breaking change สาม minor release ติดกัน และ CI ครอบคลุมทุก option ที่เอกสารระบุ ระหว่างนี้อ่าน changelog ก่อนอัปเกรด
- **ยังไม่มีขั้นอนุมัติ** วันนี้ความปลอดภัยคือ "ฉบับร่าง + key ที่ไม่มี publish": agent ร่าง แล้วคนเปิดหน้า admin อ่านฉบับร่างและกดเผยแพร่ ใช้ได้ แต่ Easy CMS ไม่รู้ว่าฉบับร่างนั้นเป็นข้อเสนอ ไม่มีคิวการแก้ไขของ agent ไม่มีปุ่มอนุมัติหรือปฏิเสธ และ audit log บันทึกไม่ได้ว่าใครตอบตกลงให้ใคร การแก้ไขของ agent ที่รอคนอนุมัติเป็นรายการของระดับ 6 ใน [roadmap](/roadmap) ยังไม่ได้สร้าง ผมเขียนไว้ว่าทำไมนี่คือยอดเขาของทั้ง roadmap ใน [Easy CMS ไม่ได้เป็นแค่ CMS](/th/blog/more-than-a-cms-th)
- **ยังไม่มี stdio และ OAuth** มีแค่ HTTP กับ Bearer header client ที่ส่ง header ไม่ได้ต้องใช้ `mcp-remote` คั่นกลาง ส่วน `easy-cms mcp` แบบ stdio และ OAuth อยู่ในรายการหลัง 1.0 โดยไม่มีวันที่
- **ยังอัปโหลดจาก URL ไม่ได้** ตั้งใจไว้แบบนั้นในตอนนี้ ตามที่เล่าข้างบน

## ลองดู

ถ้าคุณมีโปรเจกต์ Easy CMS อยู่แล้ว เริ่มจาก[คู่มือ MCP](/th/docs/mcp) ให้ key มีสิทธิ์ read, create และ update ของ collection เดียว เปิด `versions` กับ audit log แล้วให้ agent ร่างอะไรสักอย่างที่คุณไปตรวจในหน้า admin

ถ้าคุณต่อกับ client ที่ผมยังไม่ได้ลอง หรือมีความเห็นว่าการอนุมัติการแก้ไขของ agent ควรทำงานแบบไหน อยากฟังใน [GitHub discussions](https://github.com/maritonx/easy-cms/discussions) เพราะการออกแบบส่วนนั้นยังไม่ได้เริ่มเขียน
