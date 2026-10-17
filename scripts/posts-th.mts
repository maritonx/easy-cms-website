/**
 * Posts in Thai for /th/blog, added as drafts until the author has read them. Facts about other
 * CMSs come from lib/why/compare.ts (checked 2026-10-17); keep the two in step.
 */
export const thaiPosts = [
  {
    title: 'เลือก headless CMS ให้ทีมไทย: 6 คำถามที่ควรถามก่อน',
    slug: 'choosing-a-headless-cms-for-thai-teams',
    language: 'th',
    category: 'Guide', publishedAt: '2026-10-17', coverText: 'cms.choose()', status: 'draft',
    meta: {
      title: 'เลือก headless CMS ให้ทีมไทย: 6 คำถามที่ควรถามก่อน',
      description: 'ภาษาของหน้า admin, เนื้อหาเก็บที่ไหน, ค่าใช้จ่ายโตตามอะไร, ต้องมี server กี่ตัว: คำถามที่ช่วยทีมไทยเลือก CMS ให้เหมาะ ไม่ว่าจะเลือกเจ้าไหน',
    },
    excerpt: 'CMS ที่เลือกวันนี้จะอยู่กับทีมไปอีกหลายปี หกคำถามนี้ช่วยให้เลือกได้ตรงกับทีมจริง ไม่ใช่แค่ตามกระแส ไม่ว่าสุดท้ายจะเลือก Easy CMS หรือไม่',
    body: `CMS ที่เลือกวันนี้จะอยู่กับทีมไปอีกหลายปี ย้ายออกทีหลังก็ทำได้ แต่เหนื่อย บทความนี้รวมคำถามที่เราอยากให้ทุกทีมถามก่อนตัดสินใจ ไม่ว่าสุดท้ายจะเลือก Easy CMS หรือเจ้าอื่น

## 1. ใครใช้หน้า admin ทุกวัน

นักพัฒนาตั้งค่า CMS ครั้งเดียว แต่ทีมคอนเทนต์และการตลาดใช้หน้า admin ทุกวัน ถ้าหน้าจอเป็นภาษาที่คนครึ่งทีมอ่านไม่สะดวก งานจะช้าและพลาดง่าย

ลองเปิดดูว่าหน้า admin แปลไทยครบแค่ไหน ไม่ใช่แค่ "มีภาษาไทย" จากที่เราตรวจเมื่อ 17 ตุลาคม 2026: Easy CMS แปลครบทุกข้อความ, Payload เกือบครบ, WordPress ราวสองในสาม, Directus บางส่วน และ Strapi ราวหนึ่งในสี่ ส่วน Sanity ใช้ plugin จากชุมชน อย่าลืมดูเอกสารด้วย: ตอนติดปัญหา คู่มือภาษาไทยช่วยได้มาก

## 2. เนื้อหาเก็บอยู่ที่ไหน

CMS บางเจ้าเก็บเนื้อหาไว้บน cloud ของผู้ให้บริการเท่านั้น เช่น Sanity ที่ host Content Lake เองและให้ host เองไม่ได้ บางเจ้าเก็บในฐานข้อมูลของคุณ เช่น Easy CMS, Payload, Strapi และ Directus

คำถามที่ควรถามคือ: องค์กรของคุณมีนโยบายเรื่องที่เก็บข้อมูลไหม backup ใครเป็นคนทำ และถ้าวันหนึ่งเลิกใช้ จะเอาข้อมูลออกมาได้ในรูปแบบไหน

## 3. ค่าใช้จ่ายโตตามอะไร

ราคาเริ่มต้นมักไม่ใช่ปัญหา ปัญหาคือราคาที่โตตามทีม ลองดูว่าค่าใช้จ่ายผูกกับอะไร:

- **จำนวนที่นั่ง:** เช่นแพ็กเกจ Growth ของ Sanity คิด $15 ต่อที่นั่งต่อเดือน
- **ฟีเจอร์ที่ต้องอัปเกรด:** live preview และประวัติเนื้อหาของ Strapi อยู่ในแพ็กเกจ Growth ($45 ต่อเดือน แบบ host เอง) ส่วน SSO และ audit log อยู่ใน Enterprise
- **ข้อจำกัดของแพ็กเกจฟรี:** Directus Core ที่ฟรีจำกัด 3 ที่นั่งและ 25 collection

Easy CMS เป็น MIT ทุกฟีเจอร์ รวมถึงบทบาท, SSO และ audit log ค่าใช้จ่ายจึงเหลือแค่ server กับฐานข้อมูลที่คุณเลือกเอง ราคาของเจ้าอื่นเปลี่ยนได้ ดูตัวเลขล่าสุดและแหล่งข้อมูลได้ที่ [หน้าเปรียบเทียบ](/th/why/compare)

## 4. ต้องมี server กี่ตัว

headless CMS ส่วนใหญ่เป็น service แยกจากเว็บ: อีก server ที่ต้อง deploy อัปเดต และดูแลความปลอดภัย และหน้าเว็บต้องยิง API ข้ามไปหามันทุกครั้ง

CMS แบบฝังในแอป (Easy CMS และ Payload) ติดตั้งเป็นแพ็กเกจในแอป Next.js ของคุณ Easy CMS ติดตั้งใน Nuxt ได้ด้วย หรือรันแยกเป็น standalone server สำหรับ frontend อื่น ถ้าทีมเล็กและมีเว็บเดียว การมีระบบเดียวให้ดูแลช่วยได้มาก

## 5. ใครเป็นคนแก้โครงสร้างเนื้อหา

บางทีมอยากให้คนที่ไม่เขียนโค้ดเพิ่มประเภทเนื้อหาหรือ field เองได้ Directus และ Strapi ทำผ่านหน้าเว็บได้ ส่วน WordPress มี plugin ช่วย

Easy CMS และ Payload กำหนดโครงสร้างด้วยโค้ด TypeScript ข้อดีคือ review ใน pull request ได้และหน้าเว็บได้ type ที่ถูกต้อง ข้อเสียคือต้องมีนักพัฒนาทุกครั้งที่จะเพิ่ม field ถ้าทีมของคุณไม่มีนักพัฒนาเลย Easy CMS ไม่เหมาะ

## 6. ชุมชนใหญ่แค่ไหน

WordPress, Strapi และ Payload มีชุมชนใหญ่ ตัวอย่างเยอะ และหาคนที่เคยใช้มาได้ง่าย Easy CMS ยังใหม่: ออก 1.0 เมื่อตุลาคม 2026 และชุมชนยังเล็ก สิ่งที่เราให้แทนคือ [สัญญาเรื่องความเสถียร](/th/docs/versioning): breaking change มาเฉพาะใน major release พร้อมคู่มืออัปเกรด และเอกสารภาษาไทยครบทุกหน้า

## สรุป

ไม่มี CMS ที่ดีที่สุดสำหรับทุกทีม ถ้าทีมของคุณมีนักพัฒนา ใช้ Next.js หรือ Nuxt และมี editor ที่ทำงานเป็นภาษาไทย Easy CMS น่าจะเข้ากันได้ดี ดูว่าเหมาะกับทีมแบบไหนได้ที่ [Easy CMS สำหรับทีมคอนเทนต์และการตลาด](/th/why/teams) และ [Easy CMS สำหรับเอเจนซี](/th/why/agencies)`,
  },
  {
    title: 'Easy CMS กับ WordPress: เลือกอะไรดีสำหรับเว็บของทีม',
    slug: 'easy-cms-vs-wordpress',
    language: 'th',
    category: 'Guide', publishedAt: '2026-10-17', coverText: 'wp vs ecms', status: 'draft',
    meta: {
      title: 'Easy CMS กับ WordPress: เลือกอะไรดีสำหรับเว็บของทีม',
      description: 'WordPress เหมาะเมื่อไร Easy CMS เหมาะเมื่อไร เปรียบเทียบอย่างตรงไปตรงมาเรื่อง stack, โครงสร้างเนื้อหา, plugin, การดูแล และการทำงานเป็นทีม',
    },
    excerpt: 'WordPress อยู่เบื้องหลังเว็บจำนวนมาก และยังเป็นตัวเลือกที่ดีในหลายกรณี บทความนี้บอกตรงๆ ว่าเมื่อไรควรใช้ WordPress และเมื่อไร Easy CMS เหมาะกว่า',
    body: `WordPress อยู่เบื้องหลังเว็บจำนวนมาก มี theme และ plugin แทบทุกอย่าง และ host ได้ถูกมาก ในหลายกรณีมันยังเป็นตัวเลือกที่ถูกต้อง บทความนี้บอกตรงๆ ว่าเมื่อไรควรใช้ WordPress และเมื่อไร Easy CMS เหมาะกว่า

## สองแนวคิดที่ต่างกัน

WordPress เป็นแอป PHP ที่รวมทุกอย่าง: หน้า admin, ฐานข้อมูล MySQL และหน้าเว็บจาก theme ถ้าจะใช้แบบ headless กับ frontend อย่าง Next.js ก็ทำได้ผ่าน REST API ในตัวหรือ plugin WPGraphQL แต่จะกลายเป็นสองระบบ: แอป PHP หนึ่งตัวและแอป JavaScript อีกตัว

Easy CMS เป็นแพ็กเกจ npm ที่ติดตั้งในแอป Next.js หรือ Nuxt ของคุณ หน้า admin, API และหน้าเว็บอยู่ใน deployment เดียวกัน ใช้ฐานข้อมูล SQLite หรือ Postgres ของคุณ

## เลือก WordPress เมื่อ

- คนที่ไม่เขียนโค้ดเป็นคนสร้างและดูแลเว็บเองด้วย theme
- มี plugin สำหรับงานที่ต้องการอยู่แล้ว เช่นระบบจองหรือร้านค้าแบบสำเร็จรูป
- ต้องการ hosting ราคาถูกที่ใครก็ตั้งค่าได้: WordPress.com มีแพ็กเกจฟรี และแบบเสียเงินเริ่ม $4 ต่อเดือน (รายปี)
- ทีมคุ้นกับ WordPress อยู่แล้ว และเว็บไม่ได้ต้องการอะไรที่ theme ทำไม่ได้

## เลือก Easy CMS เมื่อ

- เว็บของคุณเป็นแอป Next.js หรือ Nuxt อยู่แล้ว และไม่อยากมี PHP stack อีกตัวข้างๆ
- อยากให้โครงสร้างเนื้อหาเป็นโค้ด TypeScript ที่ review ใน git ได้ และหน้าเว็บอ่านข้อมูลแบบมี type
- อยากลดจำนวน plugin ที่ต้องคอยอัปเดตและตรวจความปลอดภัย: drafts, ตั้งเวลา, live preview, SEO, ฟอร์ม, บทบาท, SSO และ audit log มาจาก Easy CMS และ plugin ทางการของมันเอง
- ทีมต้องการหน้า admin และเอกสารภาษาไทยครบ

## ข้อที่ควรรู้ก่อนย้าย

Easy CMS ต้องมีนักพัฒนาตั้งค่าโครงสร้างเนื้อหาให้ เพิ่ม field ใหม่ก็ต้องแก้โค้ด ถ้าทีมคอนเทนต์ต้องสร้างประเภทเนื้อหาใหม่เองบ่อยๆ WordPress ยืดหยุ่นกว่า

ตอนนี้ยังไม่มีเครื่องมือย้ายจาก WordPress อัตโนมัติ ถ้าจะย้าย ต้องเขียนสคริปต์ดึงโพสต์ หน้า และรูปจาก WordPress REST API แล้วสร้างเอกสารใน Easy CMS ด้วย Local API ซึ่งทำได้ไม่ยากสำหรับเว็บส่วนใหญ่ แต่ควรเผื่อเวลาไว้สำหรับ shortcode และเนื้อหาจาก page builder ที่ไม่ได้เป็น HTML ธรรมดา

Easy CMS ยังใหม่ (1.0 ออกเมื่อตุลาคม 2026) ชุมชนเล็กกว่า WordPress มาก ถ้าต้องการคำตอบจากชุมชนขนาดใหญ่ทันที ข้อนี้ต้องชั่งน้ำหนักให้ดี

## สรุป

ถ้าเว็บทำจาก theme โดยคนที่ไม่เขียนโค้ด WordPress ยังคุ้มที่สุด ถ้าเว็บเป็นแอป Next.js หรือ Nuxt ที่ทีมนักพัฒนาดูแล Easy CMS ช่วยตัดระบบที่สองทิ้งไปได้ ดูตารางเปรียบเทียบเต็มพร้อมแหล่งข้อมูลได้ที่ [Easy CMS กับ WordPress](/th/why/compare/wordpress)`,
  },
  {
    title: 'ให้ทีมเข้าหน้า admin ด้วยบัญชี Google',
    slug: 'google-sign-in-for-your-team',
    language: 'th',
    category: 'Guide', publishedAt: '2026-10-17', coverText: 'auth.google()', status: 'draft',
    meta: {
      title: 'ตั้งค่า Google sign-in ให้ทีมเข้าหน้า admin ของ Easy CMS',
      description: 'ทีละขั้นตอน: สร้าง OAuth client ใน Google Cloud, ใส่ callback URL, ตั้ง config ของ Easy CMS และเลือกว่าใครเข้าได้บ้าง ฟรีภายใต้ MIT',
    },
    excerpt: 'ไม่ต้องแจกรหัสผ่านให้ทุกคนในทีมอีกต่อไป ตั้งค่าให้ทีมเข้าหน้า admin ของ Easy CMS ด้วยบัญชี Google ในไม่กี่ขั้นตอน และเลือกได้ว่าใครเข้าได้บ้าง',
    body: `ทุกคนในทีมมีบัญชี Google อยู่แล้ว ทำไมต้องจำรหัสผ่านอีกชุดสำหรับหน้า admin single sign-on ใน Easy CMS ฟรีภายใต้ MIT ไม่ต้องซื้อแพ็กเกจ enterprise เว็บที่คุณกำลังอ่านอยู่นี้ก็ใช้วิธีนี้

## 1. ติดตั้งและใส่ใน config

\`\`\`sh
npm install @easy-cms/auth-oauth
\`\`\`

\`\`\`ts
import { google } from '@easy-cms/auth-oauth'

export default defineConfig({
  serverURL: 'https://cms.example.com',
  auth: {
    providers: [google()], // อ่าน GOOGLE_CLIENT_ID และ GOOGLE_CLIENT_SECRET
  },
  // …
})
\`\`\`

\`serverURL\` ต้องมีบน production เพราะใช้สร้าง callback URL การเปิด single sign-on จะเพิ่มตาราง \`user-identities\` จึงต้องสร้าง migration ด้วย \`npx easy-cms migrate:create sso\` แล้ว commit ไฟล์ที่ได้

## 2. สร้าง OAuth client ใน Google Cloud

- ไปที่ Google Cloud console → APIs & Services → Credentials แล้วสร้าง **OAuth client ID** แบบ **Web application**
- ถ้าถูกถามให้ตั้ง consent screen: ทีมที่ใช้ Google Workspace เลือก **Internal** ถ้าไม่ใช่ให้เลือก **External** และระหว่างที่ยังอยู่ในสถานะ Testing ให้เพิ่มบัญชีของทุกคนที่จะเข้าใน **Test users**
- ใน **Authorized redirect URIs** ใส่ \`https://cms.example.com/api/cms/auth/google/callback\` และ \`http://localhost:3000/api/cms/auth/google/callback\` สำหรับตอนพัฒนา

หน้า ตั้งค่า → Single sign-on ในหน้า admin แสดง callback URL ที่ถูกต้องพร้อมปุ่มคัดลอก ใช้ตรงนั้นจะได้ไม่พิมพ์ผิด

## 3. ตั้งค่า environment

ใส่ \`GOOGLE_CLIENT_ID\` และ \`GOOGLE_CLIENT_SECRET\` ที่ได้จาก Google ในที่ที่คุณ deploy เช่น Environment Variables ของ Vercel อย่า commit ลง git และอย่าส่งต่อในแชต หลัง deploy หน้า login จะมีปุ่ม **เข้าสู่ระบบด้วย Google**

## 4. เลือกว่าใครเข้าได้

ค่าเริ่มต้นปลอดภัยที่สุด: เฉพาะคนที่มีบัญชีใน Easy CMS อยู่แล้ว เข้าสู่ระบบด้วยรหัสผ่านครั้งแรกแล้วกด **เชื่อม Google** ที่หน้าบัญชีของตัวเอง อีเมลที่ไม่รู้จักจะเข้าไม่ได้

ถ้าทีมใช้ Google Workspace มีทางลัดสองแบบ:

- \`google({ linkByEmail: true })\` จับคู่บัญชีด้วยอีเมลที่ Google ยืนยันแล้ว ไม่ต้องกดเชื่อมเอง
- \`providerSignUp: { domains: ['example.com'], role: 'editor' }\` ให้คนในโดเมนของคุณได้บัญชีตอนเข้าครั้งแรก (บทบาทนี้ตั้งเป็น admin ไม่ได้)

ใช้ \`google({ hd: 'example.com' })\` ร่วมด้วย เพื่อให้หน้าเลือกบัญชีของ Google แสดงเฉพาะบัญชีในโดเมนของคุณ

## 5. ปิดรหัสผ่าน (ถ้าต้องการ)

\`\`\`ts
auth: { providers: [google()], password: false },
\`\`\`

ทุกคนจะต้องเข้าด้วย Google ยกเว้น admin ที่ยังใช้รหัสผ่านได้ ไว้เป็นทางเข้าสำรองตอน Google มีปัญหา

## ต่อจากนี้

รวม single sign-on กับ [บทบาทและสิทธิ์ระดับ field](/th/docs/roles) และ [audit log](/th/docs/audit-log) แล้ว ทีมจะรู้ว่าใครแก้อะไรเมื่อไร รายละเอียดทั้งหมด รวมถึง Microsoft, GitHub และ OpenID Connect อยู่ที่ [คู่มือ Single sign-on](/th/docs/sso)`,
  },
]
