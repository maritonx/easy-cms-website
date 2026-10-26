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

[คู่มือย้ายจาก WordPress](/th/docs/recipes/wordpress) มีสคริปต์ที่ดึงบทความ หน้า หมวดหมู่ และรูปภาพผ่าน WordPress REST API มาสร้างใน Easy CMS พร้อม redirect 301 จากที่อยู่เดิม (รวมถึง URL ภาษาไทย) และรันซ้ำได้จนถึงวันเปิดตัว สิ่งที่ย้ายมาไม่ได้คือ embed อย่าง YouTube, layout จาก page builder และ custom field อย่าง ACF ควรเผื่อเวลาจัดส่วนเหล่านี้เอง

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
  {
    title: 'Easy CMS 1.4: เห็นงานเบื้องหลัง และรันครั้งเดียวแม้มีหลาย server',
    slug: 'easy-cms-1-4-th',
    language: 'th',
    category: 'Release', publishedAt: '2026-10-18', coverText: 'jobs ✓', status: 'draft',
    meta: {
      title: 'Easy CMS 1.4: หน้างานเบื้องหลัง ตั้งเวลาของวัน และงานที่รันครั้งเดียว',
      description: 'มีอะไรใหม่ตั้งแต่ Easy CMS 1.0 ถึง 1.4: หน้า admin ที่บอกว่ากำลังโหลด งานเบื้องหลังที่ไม่รันซ้ำแม้มีหลาย server และหน้าดู รัน หยุด และเปลี่ยนเวลางาน',
    },
    excerpt: 'สี่เวอร์ชันหลังจาก 1.0: หน้า admin ที่บอกว่ากำลังโหลด งานเบื้องหลังที่รันครั้งเดียวไม่ว่าจะมีกี่ server และหน้า ตั้งค่า → งานเบื้องหลัง',
    body: `Easy CMS 1.0 ออกเมื่อวันที่ 17 ตุลาคม หลังจากนั้นมีอีกสี่เวอร์ชัน ทุกเวอร์ชันไม่มี breaking change บทความนี้สรุปว่ามีอะไรเพิ่ม และต้องทำอะไรบ้างตอนอัปเกรด

## งานเบื้องหลังรันครั้งเดียว (1.3)

Easy CMS มีงานที่ทำอยู่เบื้องหลัง เช่น การเผยแพร่ตามกำหนดเวลา การส่ง webhook และอีเมลซ้ำ การสำรองข้อมูลตามเวลา และ \`jobs\` ที่ config หรือ plugin เพิ่มเข้ามา อย่างการเช็คการชำระเงินของร้านค้า ก่อน 1.3 ถ้ามีสอง server ใช้ฐานข้อมูลเดียวกัน ทั้งคู่อาจหยิบงานชิ้นเดียวกันไปทำ หรือแม้แต่ scheduler กับ cron ใน server เดียว ผลคือโพสต์ถูกเผยแพร่ซ้ำ webhook ถูกส่งซ้ำ หรือได้ backup สองไฟล์

ตอนนี้งานทุกชิ้นถูกจองในฐานข้อมูลก่อนเริ่มทำ จึงรันครั้งเดียว ถ้า server หยุดกลางทาง งานจะกลับเข้าคิวเอง และกดปุ่มส่งซ้ำของ delivery ที่ล้มเหลวสองครั้ง ก็ส่งออกไปครั้งเดียว

แอปที่มี \`jobs\` รวมถึงร้านค้า ต้องสร้าง migration หนึ่งครั้งตอนอัปเกรดเป็น 1.3 โดยรัน \`easy-cms migrate:create\` แล้วตามด้วย \`easy-cms migrate\`

## หน้า ตั้งค่า → งานเบื้องหลัง (1.4)

หน้าใหม่นี้แสดงงานเบื้องหลังทั้งหมด แต่ละงานบอกรอบการรัน รันล่าสุดเมื่อไร ผลลัพธ์ (พร้อมข้อความ error ถ้าไม่สำเร็จ) และรอบถัดไป อีก tab หนึ่งแสดงการเผยแพร่ตามกำหนดเวลาที่รอ กำลังรัน หรือไม่สำเร็จ ปุ่ม **รันงานที่ถึงเวลาเดี๋ยวนี้** สั่งรันทุกอย่างที่ถึงเวลาแล้ว

หน้านี้ยังบอกด้วยว่างานเบื้องหลังรันล่าสุดเมื่อไร ถ้าไม่มีอะไรรันเลยเกิน 10 นาทีจะขึ้นคำเตือน บน serverless มักแปลว่ายังไม่ได้ตั้ง cron

แอดมินหยุดงานชั่วคราวได้ เช่น ตอนที่บริการภายนอกที่งานเรียกใช้ล่มอยู่ แล้วค่อยกดทำต่อทีหลัง งานที่หยุดไว้จะขึ้นบน Dashboard กันลืม และงานที่ตั้ง \`adminSchedule: true\` แอดมินเปลี่ยนเวลารันจากหน้านี้ได้

## ตั้งเวลารันตามเวลาของวัน

ตอนนี้ตั้งให้ job รันตามเวลาในเขตเวลาของคุณได้:

\`\`\`ts
export default defineConfig({
  timeZone: 'Asia/Bangkok',
  jobs: [
    { name: 'sitemap:refresh', at: '02:00', adminSchedule: true, run: refreshSitemap },
  ],
})
\`\`\`

ถ้าพลาดเวลาไป เช่น ตอนกำลัง deploy งานจะรันหนึ่งครั้งทันทีที่งานเบื้องหลังกลับมารัน และ \`timeZone\` ใช้กับ \`backups.at\` ด้วย

## หน้า admin บอกว่ากำลังโหลด (1.2)

ระหว่างโหลด Dashboard รายการ ฟอร์ม และหน้าตั้งค่า จะแสดงโครงสีเทาตามรูปร่างของเนื้อหา และมีแถบบาง ๆ วิ่งที่ขอบบนตอนเปลี่ยนหน้า หน้าที่โหลดเร็วจะไม่เห็นอะไรเลย เพราะตัวบอกสถานะขึ้นหลังผ่านไป 250 ms ถ้าเปิด reduced motion ไว้ จะไม่มีการเคลื่อนไหว และ screen reader จะอ่าน "กำลังโหลด…" ครั้งเดียว ปุ่มย้อนกลับในหน้าเอกสารก็กลับไปที่รายการได้อีกครั้ง พร้อมตัวกรองและหน้าเดิม

## เพิ่มเติม

- ร้านค้าเช็คการชำระเงินที่ยังค้างอยู่หลัง checkout ซ้ำให้ (1.1) เผื่อลูกค้าปิดหน้าไปก่อนที่การชำระเงินจะผ่าน
- create input ของ GraphQL ทำเครื่องหมาย field ที่ต้องกรอกใน group และ row ให้ถูกต้อง (1.1)
- dropdown แสดงลูกศรแบบเดียวกันทุกเบราว์เซอร์ (1.3)

## อัปเกรด

อัปเกรดทุกแพ็กเกจพร้อมกัน:

\`\`\`bash
npm install @easy-cms/core@latest easy-cms@latest
npx easy-cms migrate
\`\`\`

รายละเอียดอยู่ใน[คู่มืองานเบื้องหลัง](/th/docs/jobs) และ[หน้า changelog](/changelog) มีทุกเวอร์ชัน`,
  },
  {
    title: 'Easy CMS 1.7: พร้อมรันหลาย server',
    slug: 'easy-cms-1-7-th',
    language: 'th',
    category: 'Release', publishedAt: '2026-10-25', coverText: 'readyz ✓', status: 'draft',
    meta: {
      title: 'Easy CMS 1.7: pooler ของ Postgres, log แบบ JSON, health check และ Docker image',
      description: 'มีอะไรใหม่ตั้งแต่ Easy CMS 1.4 ถึง 1.7: ตั้งค่า pool ของ Postgres และใช้ PgBouncer ได้, log แบบ JSON พร้อม request id, health check ทุก setup, Docker image อย่างเป็นทางการ และ setup หลาย server ที่ทดสอบจริง',
    },
    excerpt: 'สาม release หลัง 1.4 ทำให้ Easy CMS พร้อมรันหลาย server: pooler ของ Postgres, log แบบ JSON พร้อม request id, health check และ Docker image อย่างเป็นทางการ',
    body: `Easy CMS 1.4 ทำให้งานเบื้องหลังรันครั้งเดียวไม่ว่าจะมีกี่ server ใช้ฐานข้อมูลร่วมกัน สาม release หลังจากนั้นเติมส่วนที่เหลือ: ทุกอย่างที่ทีมต้องใช้เพื่อรัน Easy CMS หลาย server หลัง load balancer และรู้ว่าแต่ละตัวกำลังทำอะไร ไม่มี release ไหน breaking และไม่ต้อง migrate

## setup ที่ทดสอบจริง ไม่ใช่แค่คาดว่าใช้ได้

หน้าใหม่ [สถาปัตยกรรมสำหรับ production](/th/docs/deploy/production) บอกว่ารองรับอะไรเมื่อ server เดียวไม่พอ: Postgres, storage แบบ S3 สำหรับไฟล์ upload, instance ที่เหมือนกันกี่ตัวก็ได้หลัง load balancer โดยไม่ต้องใช้ sticky session และ CDN ข้างหน้า และบอกตรง ๆ ว่าอะไรใช้ได้แค่ server เดียว (SQLite บนดิสก์ ไฟล์ upload บนดิสก์) และอะไรที่ไม่รองรับ (หลาย region, read replica)

ตอนนี้ CI ตรวจ setup นี้ทุกครั้งที่มีการเปลี่ยนแปลง: เปิดสอง instance บน Postgres และ bucket เดียวกันหลัง proxy แบบ round-robin, login ที่ตัวหนึ่งแล้วใช้ session ที่อีกตัว, upload ผ่านตัวหนึ่งแล้วดาวน์โหลดผ่านอีกตัว, นับการ login ผิดรวมทั้งสองตัว และให้ทั้งสองตัวรันการเผยแพร่ตามเวลาพร้อมกันเพื่อเช็คว่าแต่ละโพสต์ถูกเผยแพร่ครั้งเดียว

## ตั้งค่า connection ของ Postgres (1.5)

\`postgres()\` รับ \`prepare\`, \`statementTimeoutMs\`, \`idleTimeoutMs\`, \`connectTimeoutMs\` และ \`applicationName\` และ connection จะแสดงเป็น \`easy-cms\` ใน \`pg_stat_activity\`

\`\`\`ts
db: postgres({ url: process.env.DATABASE_POOLER_URL, max: 2, prepare: false })
\`\`\`

บน serverless และเมื่อมีหลาย instance ให้ต่อผ่าน pooler CI รันเทสต์ของ Postgres ทั้งหมดผ่าน PgBouncer แบบ transaction mode หน้า[ฐานข้อมูล](/th/docs/databases#connections) อธิบายขนาด pool และเมื่อไรควรปิด prepared statement

องค์กรที่อยากแยก CMS ออกจากข้อมูลธุรกิจ ให้ CMS มี schema และ role ของตัวเองได้ คู่มือใหม่[แยกฐานข้อมูลจากแอป](/th/docs/database-isolation) อธิบายสี่ระดับ ตั้งแต่ใช้ฐานข้อมูลร่วมกันไปจนถึงแยก server พร้อม SQL สำหรับย้ายเว็บที่มีอยู่แล้ว

## log แบบ JSON และ request id (1.6)

\`\`\`ts
logs: { format: 'json' }
\`\`\`

หรือตั้ง \`EASY_CMS_LOG_FORMAT=json\` บน host ทุกบรรทัดจะเป็น JSON หนึ่ง object มีเวลา ระดับ ข้อความ และ stack ของ error พร้อมส่งเข้า Datadog, Loki หรือ CloudWatch ทุก response ของ API มี header \`X-Request-Id\` ทุกบรรทัดที่ log ระหว่างตอบ request นั้นมี id เดียวกัน และถ้า load balancer ส่ง id มาจะใช้ค่านั้นต่อ เมื่อเปิด JSON แต่ละ request ยังได้หนึ่งบรรทัดที่บอก path, status และเวลาที่ใช้ ดู[Log](/th/docs/deployment#logs)

## Health check (1.7)

ตอนนี้ทุก setup ตอบ probe สองตัวใต้ path ของ API:

- \`/api/cms/healthz\` ตอบ \`ok\` เมื่อ process ยังทำงาน โดยไม่แตะฐานข้อมูล
- \`/api/cms/readyz\` ตอบ \`200\` เมื่อฐานข้อมูลตอบและไม่มี migration ค้าง ไม่อย่างนั้นตอบ \`503\`

ให้ load balancer หรือ readiness probe ของ Kubernetes เรียก \`readyz\` และให้ liveness เรียก \`healthz\` ทั้งสองตัวตอบได้แม้ CMS เริ่มไม่ขึ้น และไม่ถูกเขียนลง log ของ request ดู[Health check](/th/docs/deployment#health-checks)

## Docker image อย่างเป็นทางการ

\`ghcr.io/maritonx/easy-cms\` รัน \`easy-cms serve\` พร้อม adapter ของ SQLite และ Postgres, storage แบบ S3 และอีเมล SMTP เพิ่ม config และ migration ของคุณ:

\`\`\`dockerfile
FROM ghcr.io/maritonx/easy-cms:1
COPY easy-cms.config.ts ./
COPY easy-cms ./easy-cms
\`\`\`

image รันด้วย user ที่ไม่ใช่ root เช็ค \`/readyz\` และมีทั้ง amd64 และ arm64 ทุก release จะ build ให้เอง ดู[Docker](/th/docs/deploy/docker#the-official-image)

## อื่น ๆ

- logout บนหน้าที่ยังไม่ได้บันทึกจะถามก่อน และถ้าเลือกอยู่ต่อจะยัง login อยู่ (1.4.3)
- การอ่านด้วย \`locale: 'all'\` มี type ตรงกับข้อมูลที่ได้จริง (1.4.2)

## การอัปเกรด

อัปเกรดทุกแพ็กเกจพร้อมกัน ไม่ต้อง migrate:

\`\`\`bash
npm install @easy-cms/core@latest easy-cms@latest
\`\`\`

[หน้า changelog](/changelog) มีทุกเวอร์ชัน`,
  },
  {
    title: 'รัน Easy CMS หลาย server ด้วย Docker และ Postgres',
    slug: 'run-easy-cms-on-several-servers-th',
    language: 'th',
    category: 'Guide', publishedAt: '2026-10-25', coverText: 'app1 + app2', status: 'draft',
    meta: {
      title: 'รัน Easy CMS หลาย server: Docker Compose, Postgres, S3 และ load balancer',
      description: 'ตั้งค่าทีละขั้นด้วย Docker Compose: Easy CMS สอง instance จาก image อย่างเป็นทางการ, Postgres, storage แบบ S3 และ Caddy เป็น load balancer โดยรัน migration ครั้งเดียว',
    },
    excerpt: 'Easy CMS สอง instance หลัง load balancer บน Postgres และ bucket เดียวกันด้วย Docker Compose ปิดตัวไหนเว็บก็ยังตอบ',
    body: `server เดียวพอสำหรับเว็บส่วนใหญ่ แต่ server ตัวที่สองทำให้ deploy ได้โดยไม่มี downtime และเว็บยังทำงานเมื่อ server ตัวหนึ่งล่ม คู่มือนี้ตั้ง Easy CMS สอง instance ด้วย Docker Compose: image อย่างเป็นทางการ, Postgres, bucket สำหรับไฟล์ upload และ Caddy ข้างหน้า

คู่มือนี้ใช้ standalone server (\`easy-cms serve\`) แอป Next.js หรือ Nuxt ทำแบบเดียวกันได้ โดยรัน image ของแอปคุณหลายตัวแทน

## สิ่งที่ต้องมี

- Docker ที่มี Compose
- bucket แบบ S3 และ key: S3, Cloudflare R2 หรือ MinIO เพราะเมื่อมีสอง server ไฟล์ upload อยู่บนดิสก์ของ server ไม่ได้
- โปรเจกต์ที่มี \`easy-cms.config.ts\` และ migration ใน \`easy-cms/migrations\` (รัน \`easy-cms migrate:create init\` ครั้งเดียวในช่วงพัฒนา)

## 1. Config

ทุกค่ามาจาก environment ทั้งสอง instance จึงใช้ image เดียวกัน:

\`\`\`ts
import { defineConfig } from '@easy-cms/core'
import { postgres } from '@easy-cms/db-postgres'
import { s3Storage } from '@easy-cms/storage-s3'

export default defineConfig({
  secret: process.env.EASY_CMS_SECRET as string,
  serverURL: process.env.SERVER_URL,
  db: postgres({ url: process.env.DATABASE_URL as string, max: 5 }),
  upload: {
    storage: s3Storage({
      bucket: process.env.S3_BUCKET as string,
      region: process.env.S3_REGION ?? 'auto',
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }),
  },
  collections: [
    { slug: 'posts', drafts: true, schedule: true, fields: [{ name: 'title', type: 'text' }] },
  ],
})
\`\`\`

## 2. Image

image อย่างเป็นทางการมี Easy CMS และ adapter อยู่แล้ว image ของคุณเพิ่มแค่ config และ migration:

\`\`\`dockerfile
FROM ghcr.io/maritonx/easy-cms:1
COPY easy-cms.config.ts ./
COPY easy-cms ./easy-cms
\`\`\`

## 3. Compose

\`compose.yaml\` รัน Postgres, service \`migrate\` ที่รันครั้งเดียว, สอง instance และ load balancer:

\`\`\`yaml
x-app: &app
  build: .
  environment:
    EASY_CMS_SECRET: \${EASY_CMS_SECRET:?set EASY_CMS_SECRET in .env}
    SERVER_URL: \${SERVER_URL:-http://localhost:8080}
    DATABASE_URL: postgres://cms:\${POSTGRES_PASSWORD:?}@db:5432/cms
    S3_BUCKET: \${S3_BUCKET:?}
    S3_REGION: \${S3_REGION:-auto}
    S3_ENDPOINT: \${S3_ENDPOINT:-}
    S3_ACCESS_KEY_ID: \${S3_ACCESS_KEY_ID:?}
    S3_SECRET_ACCESS_KEY: \${S3_SECRET_ACCESS_KEY:?}
    # Migrations run once, in the migrate service.
    EASY_CMS_MIGRATE: "false"
  depends_on:
    migrate:
      condition: service_completed_successfully
  restart: unless-stopped

services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: cms
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:?}
      POSTGRES_DB: cms
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cms -d cms"]
      interval: 5s
      retries: 10
    restart: unless-stopped

  migrate:
    <<: *app
    entrypoint: ["easy-cms", "migrate"]
    depends_on:
      db:
        condition: service_healthy
    restart: "no"

  app1: *app
  app2: *app

  lb:
    image: caddy:2
    ports:
      - "8080:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
    depends_on: [app1, app2]
    restart: unless-stopped

volumes:
  pgdata:
\`\`\`

instance ทั้งสองรอ \`migrate\` เสร็จก่อน ฐานข้อมูลจึงเป็นเวอร์ชันล่าสุดก่อนตัวไหนจะรับ request และ migration รันครั้งเดียว ไม่ใช่รันในทั้งสองตัว

## 4. Load balancer

Caddy ส่ง request ให้ทั้งสอง instance สลับกัน และหยุดส่งให้ตัวที่ \`/readyz\` ไม่ตอบ \`200\`:

\`\`\`txt
:80 {
	reverse_proxy app1:4000 app2:4000 {
		lb_policy round_robin
		health_uri /readyz
		health_interval 5s
	}
}
\`\`\`

ไม่ต้องใช้ sticky session เพราะ session, การจำกัดการ login และคิวงานอยู่ใน Postgres instance ไหนก็ตอบ request ไหนก็ได้

## 5. เริ่มระบบ

ใส่ค่าลับใน \`.env\` ข้าง \`compose.yaml\`:

\`\`\`bash
printf 'EASY_CMS_SECRET=%s\\nPOSTGRES_PASSWORD=%s\\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 16)" > .env
\`\`\`

เพิ่ม \`S3_BUCKET\`, \`S3_ACCESS_KEY_ID\` และ \`S3_SECRET_ACCESS_KEY\` ถ้าใช้ R2 หรือ MinIO ให้เพิ่ม \`S3_ENDPOINT\` ด้วย แล้วรัน:

\`\`\`bash
docker compose up -d --build
docker compose exec app1 easy-cms admin:create --email you@example.com
\`\`\`

เปิด \`http://localhost:8080/admin\` แล้ว login ไฟล์ upload ไปอยู่ใน bucket ไฟล์ที่ upload ตอนที่ instance หนึ่งตอบอยู่ จึงเปิดผ่านอีกตัวได้

## 6. ลองดู

ปิด instance หนึ่งแล้วใช้ admin ต่อ:

\`\`\`bash
docker compose stop app1
\`\`\`

ภายในไม่กี่วินาที Caddy จะรู้ว่า \`app1\` ไม่ตอบ \`/readyz\` และส่งทุก request ไปที่ \`app2\` เปิดกลับด้วย \`docker compose start app1\`

## deploy เวอร์ชันใหม่

build ใหม่ migrate ครั้งเดียว แล้วเปลี่ยน instance ทีละตัว จะมีตัวหนึ่งตอบอยู่เสมอ:

\`\`\`bash
docker compose build
docker compose run --rm migrate
docker compose up -d --no-deps app1
docker compose up -d --no-deps app2
\`\`\`

## ก่อนขึ้นระบบจริง

- ใส่ HTTPS ข้างหน้า: ใส่ domain ใน Caddyfile แทน \`:80\` แล้ว Caddy จะขอ certificate ให้เอง และตั้ง \`SERVER_URL\` เป็นที่อยู่จริง
- ให้จำนวน instance × \`max\` น้อยกว่า \`max_connections\` ของ Postgres พอสมควร และใส่ PgBouncer เมื่อมีหลาย instance ดู[Connection](/th/docs/databases#connections)
- เปิด log แบบ JSON (\`EASY_CMS_LOG_FORMAT=json\`) ถ้าเก็บ log และ backup ทั้งฐานข้อมูลและ bucket

หน้า[สถาปัตยกรรมสำหรับ production](/th/docs/deploy/production) มีทุกอย่างที่รองรับ และ[คู่มือ Docker](/th/docs/deploy/docker) ครอบคลุมกรณี server เดียว`,
  },
]
