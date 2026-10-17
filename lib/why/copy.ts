/**
 * The words of the "Why Easy CMS" pages, in English and Thai. Every claim links to the docs page
 * that backs it; "When it isn't a fit" follows the docs' own "When it doesn't" list.
 */
import { COMPETITORS } from './compare'

export type Locale = 'en' | 'th'

type Point = { title: string; body: string; doc: string }

export type PersonaCopy = {
  menu: { label: string; hint: string }
  meta: { title: string; description: string }
  eyebrow: string
  title: string
  lede: string
  problem: { title: string; items: readonly string[] }
  pointsTitle: string
  points: readonly Point[]
  notFit: readonly string[]
}

export type Persona = {
  slug: 'developers' | 'teams' | 'agencies'
  /** One admin screenshot (public/screenshots/<key>-<locale>-<theme>.webp), or the code sample. */
  show: { screenshot: string; path: string } | { code: true }
} & Record<Locale, PersonaCopy>

export const PERSONAS: readonly Persona[] = [
  {
    slug: 'developers',
    show: { code: true },
    en: {
      menu: { label: 'Developers', hint: 'One app, a typed API, content in git' },
      meta: {
        title: 'Easy CMS for developers',
        description:
          'A headless CMS that installs into your Next.js or Nuxt app: content defined in TypeScript, a typed Local API, your own database, one deployment.',
      },
      eyebrow: 'For developers',
      title: 'A CMS you install, not one you run beside your app.',
      lede: 'Easy CMS is an npm package. Your content model is TypeScript in your repo, your pages read it with a typed API, and the admin ships with the app you already deploy.',
      problem: {
        title: 'What a separate CMS costs you',
        items: [
          'A second service to deploy, secure, monitor and keep in step with your app.',
          'A schema built in a web UI that drifts from the code that reads it.',
          'Untyped JSON over HTTP, even when the page renders on the same server.',
          'Content locked in someone else’s database, behind someone else’s pricing.',
        ],
      },
      pointsTitle: 'How Easy CMS helps',
      points: [
        { title: 'One deployment', body: 'Route handlers in Next.js or a module in Nuxt mount the admin and the API inside your app. Other frontends use the standalone server.', doc: 'what-is-easy-cms' },
        { title: 'Content model in TypeScript', body: 'Collections, fields, access rules and hooks live in easy-cms.config.ts, reviewed in pull requests like any other code.', doc: 'configuration' },
        { title: 'A typed Local API', body: 'Server code calls cms.find() with types generated from your config. No HTTP round trip, no hand-written types.', doc: 'local-api' },
        { title: 'Your database, real tables', body: 'SQLite (a file or Turso) or Postgres. Documents are rows and columns you can still query with SQL.', doc: 'databases' },
        { title: 'Migrations you commit', body: 'Schema changes become migration files in git, applied on deploy. Production refuses a config that doesn’t match.', doc: 'deployment' },
        { title: 'REST, GraphQL and MCP', body: 'REST at /api/cms for any client; GraphQL and an MCP server for AI assistants come as experimental plugins.', doc: 'rest-api' },
      ],
      notFit: [
        'Editors must change the content model themselves, without a developer: here the model is code.',
        'You need edge runtimes: Easy CMS needs Node.js 22.12 or newer.',
        'You need a large marketplace of ready-made integrations today.',
      ],
    },
    th: {
      menu: { label: 'นักพัฒนา', hint: 'แอปเดียว API มี type เนื้อหาอยู่ใน git' },
      meta: {
        title: 'Easy CMS สำหรับนักพัฒนา',
        description:
          'headless CMS ที่ติดตั้งในแอป Next.js หรือ Nuxt ของคุณ: กำหนดเนื้อหาด้วย TypeScript มี Local API ที่มี type ใช้ฐานข้อมูลของคุณเอง และ deploy ครั้งเดียว',
      },
      eyebrow: 'สำหรับนักพัฒนา',
      title: 'CMS ที่ติดตั้งในแอป ไม่ใช่อีกระบบที่ต้องรันแยก',
      lede: 'Easy CMS เป็นแพ็กเกจ npm โครงสร้างเนื้อหาเป็น TypeScript ใน repo ของคุณ หน้าเว็บอ่านด้วย API ที่มี type และหน้า admin มากับแอปที่คุณ deploy อยู่แล้ว',
      problem: {
        title: 'สิ่งที่ CMS แยกต้องแลก',
        items: [
          'service ตัวที่สองที่ต้อง deploy ดูแลความปลอดภัย monitor และคอยให้ตรงกับแอป',
          'schema ที่สร้างในหน้าเว็บ ค่อยๆ ไม่ตรงกับโค้ดที่อ่านมัน',
          'JSON ไม่มี type ผ่าน HTTP แม้หน้าเว็บจะ render บน server เดียวกัน',
          'เนื้อหาอยู่ในฐานข้อมูลของคนอื่น และขึ้นกับราคาของคนอื่น',
        ],
      },
      pointsTitle: 'Easy CMS ช่วยอย่างไร',
      points: [
        { title: 'deploy ครั้งเดียว', body: 'route handler ใน Next.js หรือ module ใน Nuxt ติดตั้งหน้า admin และ API ไว้ในแอปของคุณ frontend อื่นใช้ standalone server', doc: 'what-is-easy-cms' },
        { title: 'โครงสร้างเนื้อหาเป็น TypeScript', body: 'collection, field, กฎการเข้าถึง และ hook อยู่ใน easy-cms.config.ts และ review ใน pull request เหมือนโค้ดอื่น', doc: 'configuration' },
        { title: 'Local API ที่มี type', body: 'โค้ดฝั่ง server เรียก cms.find() พร้อม type ที่สร้างจาก config ไม่ต้องยิง HTTP ไม่ต้องเขียน type เอง', doc: 'local-api' },
        { title: 'ฐานข้อมูลของคุณ ตารางจริง', body: 'SQLite (ไฟล์หรือ Turso) หรือ Postgres เอกสารเป็นแถวและคอลัมน์ที่ยัง query ด้วย SQL ได้', doc: 'databases' },
        { title: 'migration ที่ commit ได้', body: 'การเปลี่ยน schema กลายเป็นไฟล์ migration ใน git และรันตอน deploy production จะไม่ยอมรับ config ที่ไม่ตรง', doc: 'deployment' },
        { title: 'REST, GraphQL และ MCP', body: 'REST ที่ /api/cms สำหรับ client ใดก็ได้ ส่วน GraphQL และ MCP server สำหรับ AI assistant มาเป็น plugin ทดลอง', doc: 'rest-api' },
      ],
      notFit: [
        'editor ต้องแก้โครงสร้างเนื้อหาเองโดยไม่มีนักพัฒนา: ที่นี่โครงสร้างเป็นโค้ด',
        'ต้องรันบน edge runtime: Easy CMS ต้องใช้ Node.js 22.12 ขึ้นไป',
        'ต้องการ marketplace ของ integration สำเร็จรูปจำนวนมากตอนนี้',
      ],
    },
  },
  {
    slug: 'teams',
    show: { screenshot: 'preview', path: '/admin/collections/posts' },
    en: {
      menu: { label: 'Content & marketing teams', hint: 'Drafts, live preview, SEO, forms' },
      meta: {
        title: 'Easy CMS for content and marketing teams',
        description:
          'Drafts, scheduled publishing, live preview, SEO fields with a search preview, forms and translations, in an admin your team can use in Thai or English.',
      },
      eyebrow: 'For content & marketing teams',
      title: 'Publish on your schedule, and see it before anyone else does.',
      lede: 'Your developers set up the content once. After that, your team writes, previews, translates and schedules on its own, in an admin that speaks Thai or English.',
      problem: {
        title: 'What slows a content team down',
        items: [
          'Every change waits for a developer, a deploy or a time zone.',
          'Publishing blind: no way to see the page before it goes live.',
          'SEO titles and share images filled in somewhere else, or not at all.',
          'An admin in a language half the team doesn’t read comfortably.',
        ],
      },
      pointsTitle: 'How Easy CMS helps',
      points: [
        { title: 'Drafts, history and scheduling', body: 'Keep working on a draft while the live version stays up, restore any earlier version, and publish or unpublish at a set time.', doc: 'drafts' },
        { title: 'Live preview', body: 'See the real page next to the form, updated as you type, before anything is saved.', doc: 'live-preview' },
        { title: 'SEO with a search preview', body: 'Title and description with length meters, a preview of the search result and share images, plus a sitemap and structured data.', doc: 'seo' },
        { title: 'Forms without a developer', body: 'Build contact and sign-up forms in the admin, collect submissions and get an email for each one.', doc: 'forms' },
        { title: 'Content in several languages', body: 'Switch the language you’re editing; lists show which translations are still missing.', doc: 'localization' },
        { title: 'An admin in Thai or English', body: 'Every screen of the admin is translated. Each person picks their own language.', doc: 'admin' },
      ],
      notFit: [
        'Your team wants to add new content types or fields without a developer: the content model is code.',
        'You want a hosted service to sign up for: Easy CMS is installed into a site by a developer.',
        'You need a large marketplace of ready-made integrations today.',
      ],
    },
    th: {
      menu: { label: 'ทีมคอนเทนต์และการตลาด', hint: 'draft, live preview, SEO, ฟอร์ม' },
      meta: {
        title: 'Easy CMS สำหรับทีมคอนเทนต์และการตลาด',
        description:
          'draft, ตั้งเวลาเผยแพร่, live preview, ช่อง SEO พร้อมตัวอย่างผลค้นหา, ฟอร์ม และการแปล ในหน้า admin ที่ทีมใช้ได้ทั้งภาษาไทยและอังกฤษ',
      },
      eyebrow: 'สำหรับทีมคอนเทนต์และการตลาด',
      title: 'เผยแพร่ตามเวลาของคุณ และเห็นก่อนใคร',
      lede: 'นักพัฒนาตั้งค่าโครงสร้างเนื้อหาครั้งเดียว หลังจากนั้นทีมของคุณเขียน ดูตัวอย่าง แปล และตั้งเวลาได้เอง ในหน้า admin ภาษาไทยหรืออังกฤษ',
      problem: {
        title: 'สิ่งที่ทำให้ทีมคอนเทนต์ช้า',
        items: [
          'ทุกการแก้ไขต้องรอนักพัฒนา รอ deploy หรือรอเวลาทำงานของอีกฝั่ง',
          'เผยแพร่โดยไม่เห็นหน้าจริงก่อนขึ้นเว็บ',
          'title สำหรับ SEO และรูปตอนแชร์ต้องไปกรอกที่อื่น หรือไม่ได้กรอกเลย',
          'หน้า admin เป็นภาษาที่คนครึ่งทีมอ่านไม่สะดวก',
        ],
      },
      pointsTitle: 'Easy CMS ช่วยอย่างไร',
      points: [
        { title: 'draft, ประวัติ และการตั้งเวลา', body: 'แก้ draft ต่อได้ขณะที่เวอร์ชันจริงยังออนไลน์ ย้อนกลับไปเวอร์ชันก่อนหน้าได้ และตั้งเวลาเผยแพร่หรือยกเลิกได้', doc: 'drafts' },
        { title: 'live preview', body: 'เห็นหน้าจริงข้างฟอร์ม อัปเดตขณะพิมพ์ ก่อนบันทึกอะไรเลย', doc: 'live-preview' },
        { title: 'SEO พร้อมตัวอย่างผลค้นหา', body: 'title และ description พร้อมตัววัดความยาว ตัวอย่างผลการค้นหา และรูปตอนแชร์ รวมถึง sitemap และ structured data', doc: 'seo' },
        { title: 'ฟอร์มโดยไม่ต้องพึ่งนักพัฒนา', body: 'สร้างฟอร์มติดต่อและสมัครสมาชิกในหน้า admin เก็บข้อมูลที่ส่งมา และรับอีเมลทุกครั้ง', doc: 'forms' },
        { title: 'เนื้อหาหลายภาษา', body: 'สลับภาษาที่กำลังแก้ และในรายการจะเห็นว่าภาษาไหนยังแปลไม่ครบ', doc: 'localization' },
        { title: 'หน้า admin ภาษาไทยหรืออังกฤษ', body: 'ทุกหน้าจอของ admin แปลครบ แต่ละคนเลือกภาษาของตัวเองได้', doc: 'admin' },
      ],
      notFit: [
        'ทีมต้องการเพิ่มประเภทเนื้อหาหรือ field ใหม่เองโดยไม่มีนักพัฒนา: โครงสร้างเนื้อหาเป็นโค้ด',
        'ต้องการบริการ hosted ที่สมัครใช้ได้เลย: Easy CMS ติดตั้งในเว็บโดยนักพัฒนา',
        'ต้องการ marketplace ของ integration สำเร็จรูปจำนวนมากตอนนี้',
      ],
    },
  },
  {
    slug: 'agencies',
    show: { screenshot: 'roles', path: '/admin/roles' },
    en: {
      menu: { label: 'Agencies', hint: 'Many client sites, no per-seat fees' },
      meta: {
        title: 'Easy CMS for agencies',
        description:
          'Build client sites on an MIT-licensed CMS: roles, SSO and an audit log for free, several clients in one CMS, backups, and an admin your clients can use in Thai.',
      },
      eyebrow: 'For agencies',
      title: 'One stack for every client site, with nothing to license.',
      lede: 'Easy CMS is MIT, all of it. Hand each client an admin with the roles, sign-in and audit trail they ask for, in Thai if they want it, without a per-seat bill.',
      problem: {
        title: 'What adds up across client sites',
        items: [
          'A CMS subscription or seat count for every client, growing with their team.',
          'Enterprise plans just to get single sign-on or an audit log.',
          'One more server per client to patch and back up.',
          'Clients who need their admin, and its help pages, in Thai.',
        ],
      },
      pointsTitle: 'How Easy CMS helps',
      points: [
        { title: 'Roles and field permissions', body: 'Set up roles in the admin: who sees which collections, which fields, and only their own documents.', doc: 'roles' },
        { title: 'Single sign-on', body: 'Google, Microsoft, GitHub or any OpenID Connect provider, with rules for who gets in. MIT, not an enterprise add-on.', doc: 'sso' },
        { title: 'An audit log', body: 'Who changed what and when, with values, kept tamper-evident.', doc: 'audit-log' },
        { title: 'Several clients in one CMS', body: 'The multi-tenant plugin gives each brand or client its own content, members and settings, with a switcher in the admin.', doc: 'multi-tenant' },
        { title: 'Backups and upgrades', body: 'Back up the database from the admin, restore it, and upgrade with a guide for every release.', doc: 'backups' },
        { title: 'A starter in one click', body: 'Deploy a site with its admin to Vercel or Netlify for a client demo, then move it to their server.', doc: 'one-click-deploy' },
      ],
      notFit: [
        'Easy CMS is new: 1.0 came out in October 2026, and the shop, GraphQL and MCP plugins are still experimental.',
        'Clients must change the content model themselves, without your developers.',
        'You need a large marketplace of ready-made integrations, or edge runtimes.',
      ],
    },
    th: {
      menu: { label: 'เอเจนซี', hint: 'หลายเว็บลูกค้า ไม่มีค่าที่นั่ง' },
      meta: {
        title: 'Easy CMS สำหรับเอเจนซี',
        description:
          'สร้างเว็บลูกค้าบน CMS ที่เป็น MIT: บทบาท, SSO และ audit log ฟรี หลายลูกค้าใน CMS เดียว มี backup และหน้า admin ภาษาไทยให้ลูกค้าใช้',
      },
      eyebrow: 'สำหรับเอเจนซี',
      title: 'stack เดียวสำหรับทุกเว็บลูกค้า โดยไม่ต้องซื้อ license',
      lede: 'Easy CMS เป็น MIT ทั้งหมด ให้ลูกค้าแต่ละรายได้หน้า admin พร้อมบทบาท การเข้าสู่ระบบ และ audit log ที่ต้องการ เป็นภาษาไทยถ้าต้องการ โดยไม่มีค่าใช้จ่ายต่อที่นั่ง',
      problem: {
        title: 'สิ่งที่สะสมขึ้นเมื่อมีหลายเว็บลูกค้า',
        items: [
          'ค่า CMS รายเดือนหรือค่าที่นั่งของลูกค้าทุกราย ที่เพิ่มตามขนาดทีม',
          'ต้องซื้อแพ็กเกจ enterprise แค่เพื่อ single sign-on หรือ audit log',
          'server อีกตัวต่อลูกค้าหนึ่งรายที่ต้อง patch และ backup',
          'ลูกค้าที่ต้องการหน้า admin และเอกสารช่วยเหลือเป็นภาษาไทย',
        ],
      },
      pointsTitle: 'Easy CMS ช่วยอย่างไร',
      points: [
        { title: 'บทบาทและสิทธิ์ระดับ field', body: 'ตั้งบทบาทในหน้า admin: ใครเห็น collection ไหน field ไหน และเห็นเฉพาะเอกสารของตัวเอง', doc: 'roles' },
        { title: 'single sign-on', body: 'Google, Microsoft, GitHub หรือ OpenID Connect ใดก็ได้ พร้อมกฎว่าใครเข้าได้ เป็น MIT ไม่ใช่ส่วนเสริม enterprise', doc: 'sso' },
        { title: 'audit log', body: 'ใครแก้อะไรเมื่อไร พร้อมค่าที่เปลี่ยน และตรวจได้ว่าถูกแก้ไขหรือไม่', doc: 'audit-log' },
        { title: 'หลายลูกค้าใน CMS เดียว', body: 'plugin multi-tenant ให้แต่ละแบรนด์หรือลูกค้ามีเนื้อหา สมาชิก และการตั้งค่าของตัวเอง พร้อมตัวสลับในหน้า admin', doc: 'multi-tenant' },
        { title: 'backup และการอัปเกรด', body: 'backup ฐานข้อมูลจากหน้า admin กู้คืนได้ และอัปเกรดตามคู่มือของทุก release', doc: 'backups' },
        { title: 'starter ในคลิกเดียว', body: 'deploy เว็บพร้อมหน้า admin ไปที่ Vercel หรือ Netlify เพื่อ demo ให้ลูกค้า แล้วค่อยย้ายไป server ของลูกค้า', doc: 'one-click-deploy' },
      ],
      notFit: [
        'Easy CMS ยังใหม่: 1.0 ออกเมื่อตุลาคม 2026 และ plugin ร้านค้า, GraphQL และ MCP ยังเป็นรุ่นทดลอง',
        'ลูกค้าต้องแก้โครงสร้างเนื้อหาเองโดยไม่มีนักพัฒนาของคุณ',
        'ต้องการ marketplace ของ integration สำเร็จรูปจำนวนมาก หรือ edge runtime',
      ],
    },
  },
]

export const persona = (slug: string) => PERSONAS.find((p) => p.slug === slug) ?? null

/** Labels shared by the menu and the pages. */
export const WHY_UI = {
  en: {
    menu: 'Why Easy CMS',
    forTitle: 'Easy CMS is for',
    compareTitle: 'Compare',
    overview: 'Why Easy CMS: the overview',
    allCompared: 'All side by side',
    vs: (name: string) => `Easy CMS vs ${name}`,
    readDocs: 'Read the docs',
    notFitTitle: 'When it isn’t a fit',
    getStarted: 'Get started',
    seeComparisons: 'Compare with other CMSs',
    chooseUs: 'Choose Easy CMS when',
    chooseThem: (name: string) => `Choose ${name} when`,
    sources: 'Sources',
    checked: (date: string) => `Checked against each product’s own site on ${date}. Prices and versions change; follow the links for today’s.`,
    seeOfficial: 'See the official site',
    honest:
      'Easy CMS is young: its first release was in September 2026 and its community is small. Every other product here has been in production longer, with more people answering questions.',
    feature: 'Feature',
    otherComparisons: 'Other comparisons',
    moveGuide: 'Read the guide',
    forPages: 'Who it’s for',
    ctaTitle: 'Try it in your own app.',
    ctaLede: 'One command sets up a Next.js or Nuxt project with the admin, or deploy a starter to your own Vercel or Netlify.',
    copy: 'Copy',
    copied: 'Copied',
    demo: 'Try the demo',
    docs: 'Read the guide',
    questions: 'Questions? Ask in GitHub Discussions',
  },
  th: {
    menu: 'ทำไมต้อง Easy CMS',
    forTitle: 'Easy CMS เหมาะกับ',
    compareTitle: 'เปรียบเทียบ',
    overview: 'ทำไมต้อง Easy CMS: ภาพรวม',
    allCompared: 'เทียบทั้งหมดในตารางเดียว',
    vs: (name: string) => `Easy CMS กับ ${name}`,
    readDocs: 'อ่านเอกสาร',
    notFitTitle: 'เมื่อไรที่ไม่เหมาะ',
    getStarted: 'เริ่มใช้งาน',
    seeComparisons: 'เทียบกับ CMS อื่น',
    chooseUs: 'เลือก Easy CMS เมื่อ',
    chooseThem: (name: string) => `เลือก ${name} เมื่อ`,
    sources: 'แหล่งข้อมูล',
    checked: (date: string) => `ตรวจสอบจากเว็บของแต่ละผลิตภัณฑ์เมื่อ ${date} ราคาและเวอร์ชันเปลี่ยนได้ ดูข้อมูลล่าสุดได้จากลิงก์`,
    seeOfficial: 'ดูเว็บทางการ',
    honest:
      'Easy CMS ยังใหม่: ออกครั้งแรกเมื่อกันยายน 2026 และชุมชนยังเล็ก ผลิตภัณฑ์อื่นในหน้านี้ใช้งานจริงมานานกว่า และมีคนช่วยตอบคำถามมากกว่า',
    feature: 'หัวข้อ',
    otherComparisons: 'การเปรียบเทียบอื่น',
    moveGuide: 'อ่านคู่มือ',
    forPages: 'เหมาะกับใคร',
    ctaTitle: 'ลองใช้ในแอปของคุณเอง',
    ctaLede: 'คำสั่งเดียวสร้างโปรเจกต์ Next.js หรือ Nuxt พร้อมหน้า admin หรือ deploy starter ไปที่ Vercel หรือ Netlify ของคุณเอง',
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
    demo: 'ลอง demo',
    docs: 'อ่านคู่มือ',
    questions: 'มีคำถาม? ถามได้ใน GitHub Discussions',
  },
} as const

/** The overview page, /why. */
export const WHY_OVERVIEW = {
  en: {
    meta: {
      title: 'Why Easy CMS',
      description:
        'Why teams choose Easy CMS: it runs inside your Next.js or Nuxt app, the content model is TypeScript, roles and SSO are free under MIT, and the admin and docs are in Thai and English.',
    },
    eyebrow: 'Why Easy CMS',
    title: 'The CMS that lives in your app.',
    lede: 'Most headless CMSs are a second system: another server, another bill, another schema to keep in sync. Easy CMS is a package you install, so content ships with the app you already run.',
    pillarsTitle: 'What makes it different',
    pillars: [
      { title: 'Inside your app', body: 'Runs in Next.js or Nuxt, or as a standalone server for any other frontend. One deployment, one database.', doc: 'what-is-easy-cms' },
      { title: 'Content model in code', body: 'Collections and fields in TypeScript, reviewed in git, with types for every query.', doc: 'configuration' },
      { title: 'Team features, free', body: 'Roles, field permissions, SSO, an audit log and live preview, all under the MIT license.', doc: 'roles' },
      { title: 'Thai throughout', body: 'A complete Thai admin, and Thai docs for every page, next to English.', doc: 'admin' },
    ],
    forTitle: 'Who it’s for',
    compareTitle: 'How it compares',
    compareLede: 'Honest side-by-sides with the CMSs people ask about most, with sources.',
  },
  th: {
    meta: {
      title: 'ทำไมต้อง Easy CMS',
      description:
        'เหตุผลที่ทีมเลือก Easy CMS: รันในแอป Next.js หรือ Nuxt ของคุณ โครงสร้างเนื้อหาเป็น TypeScript บทบาทและ SSO ฟรีภายใต้ MIT และมีหน้า admin กับเอกสารทั้งภาษาไทยและอังกฤษ',
    },
    eyebrow: 'ทำไมต้อง Easy CMS',
    title: 'CMS ที่อยู่ในแอปของคุณ',
    lede: 'headless CMS ส่วนใหญ่เป็นระบบที่สอง: อีก server อีกบิล และอีก schema ที่ต้องคอยให้ตรงกัน Easy CMS เป็นแพ็กเกจที่ติดตั้งได้ เนื้อหาจึงไปพร้อมกับแอปที่คุณรันอยู่แล้ว',
    pillarsTitle: 'ต่างจากที่อื่นอย่างไร',
    pillars: [
      { title: 'อยู่ในแอปของคุณ', body: 'รันใน Next.js หรือ Nuxt หรือเป็น standalone server สำหรับ frontend อื่น deploy ครั้งเดียว ฐานข้อมูลเดียว', doc: 'what-is-easy-cms' },
      { title: 'โครงสร้างเนื้อหาเป็นโค้ด', body: 'collection และ field ใน TypeScript review ใน git และมี type ทุก query', doc: 'configuration' },
      { title: 'ฟีเจอร์ทีม ฟรี', body: 'บทบาท, สิทธิ์ระดับ field, SSO, audit log และ live preview ทั้งหมดภายใต้ license MIT', doc: 'roles' },
      { title: 'ภาษาไทยครบ', body: 'หน้า admin ภาษาไทยครบทุกข้อความ และเอกสารภาษาไทยทุกหน้า คู่กับภาษาอังกฤษ', doc: 'admin' },
    ],
    forTitle: 'เหมาะกับใคร',
    compareTitle: 'เทียบกับที่อื่น',
    compareLede: 'เปรียบเทียบอย่างตรงไปตรงมากับ CMS ที่คนถามถึงบ่อยที่สุด พร้อมแหล่งข้อมูล',
  },
} as const

/** The comparison overview, /why/compare. */
export const COMPARE_OVERVIEW = {
  en: {
    meta: {
      title: 'Easy CMS compared with Payload, Strapi, Directus, WordPress and Sanity',
      description:
        'Easy CMS next to Payload, Strapi, Directus, WordPress and Sanity: license, where it runs, content model, databases, pricing, APIs, Thai admin, roles and SSO, with sources.',
    },
    eyebrow: 'Compare',
    title: 'Easy CMS next to the others',
    lede: 'Eleven questions that decide most CMS choices, answered from each product’s own site. Where we couldn’t confirm something, the table says so.',
  },
  th: {
    meta: {
      title: 'เปรียบเทียบ Easy CMS กับ Payload, Strapi, Directus, WordPress และ Sanity',
      description:
        'Easy CMS เทียบกับ Payload, Strapi, Directus, WordPress และ Sanity: license, รันที่ไหน, โครงสร้างเนื้อหา, ฐานข้อมูล, ราคา, API, admin ภาษาไทย, บทบาทและ SSO พร้อมแหล่งข้อมูล',
    },
    eyebrow: 'เปรียบเทียบ',
    title: 'Easy CMS เทียบกับที่อื่น',
    lede: 'สิบเอ็ดคำถามที่ตัดสินการเลือก CMS ส่วนใหญ่ ตอบจากเว็บของแต่ละผลิตภัณฑ์เอง ข้อไหนที่เรายืนยันไม่ได้ ตารางจะบอกไว้',
  },
} as const

/** A docs link in the page's language; "What is Easy CMS?" is the docs' front page. */
export function docHref(doc: string, locale: Locale) {
  const docs = locale === 'th' ? '/th/docs' : '/docs'
  return doc === 'what-is-easy-cms' ? docs : `${docs}/${doc}`
}

/** A Why page's path in the page's language: whyHref('compare/payload', 'th') is /th/why/compare/payload. */
export const whyHref = (rest: string, locale: Locale) => `${locale === 'th' ? '/th' : ''}/why${rest ? `/${rest}` : ''}`

/** Every Why page after /why: '', 'developers', 'compare', 'compare/payload'… */
export const WHY_RESTS = ['', ...PERSONAS.map((p) => p.slug), 'compare', ...COMPETITORS.map((c) => `compare/${c.slug}`)]
