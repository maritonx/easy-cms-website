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
      menu: { label: 'Developers', hint: 'One config, the whole backend, typed' },
      meta: {
        title: 'Easy CMS for developers',
        description:
          'A TypeScript backend you install into Next.js, Nuxt or its own server: data, sign-in, roles, jobs, files and an API from one config, on your own database.',
      },
      eyebrow: 'For developers',
      title: 'A backend you install, not five services you rent.',
      lede: 'Easy CMS is an npm package. Your data, access rules, hooks and jobs are TypeScript in your repo; your pages read them through a typed API, and the admin ships with the app you already deploy.',
      problem: {
        title: 'What a stitched-together backend costs you',
        items: [
          'A CMS, an auth service, a queue and file storage: four dashboards, four bills, four sets of keys.',
          'A schema built in a web UI that drifts from the code that reads it.',
          'Untyped JSON over HTTP, even when the page renders on the same server.',
          'Your data in someone else’s database, behind someone else’s pricing.',
        ],
      },
      pointsTitle: 'How Easy CMS helps',
      points: [
        { title: 'One config, the whole backend', body: 'Collections, fields, access rules, hooks and jobs live in easy-cms.config.ts, reviewed in pull requests like any other code.', doc: 'configuration' },
        { title: 'Sign-in and roles built in', body: 'Passwords, Google, Microsoft, GitHub or any OpenID Connect provider, with roles down to single fields.', doc: 'auth' },
        { title: 'A typed Local API', body: 'Server code calls cms.find() with types from your config. No HTTP round trip, no hand-written types.', doc: 'local-api' },
        { title: 'Jobs and webhooks', body: 'A queue in your own database with retries and schedules, and actions that run your code from the admin.', doc: 'jobs' },
        { title: 'Your database, real tables', body: 'SQLite, Turso or Postgres. Schema changes become migration files in git, applied on deploy.', doc: 'databases' },
        { title: 'Runs where you deploy', body: 'Inside Next.js or Nuxt, or as its own server on Node.js, Bun, Deno or Cloudflare Workers.', doc: 'deploy' },
      ],
      notFit: [
        'Editors must change the data model themselves, without a developer: here the model is code.',
        'You need MongoDB, MySQL or another database besides SQLite and Postgres.',
        'You need a large marketplace of ready-made integrations today.',
      ],
    },
    th: {
      menu: { label: 'นักพัฒนา', hint: 'config เดียว ได้ backend ครบ มี type' },
      meta: {
        title: 'Easy CMS สำหรับนักพัฒนา',
        description:
          'backend TypeScript ที่ติดตั้งใน Next.js, Nuxt หรือเป็น server ของตัวเอง: ข้อมูล การล็อกอิน บทบาท งานเบื้องหลัง ไฟล์ และ API จาก config เดียว บนฐานข้อมูลของคุณ',
      },
      eyebrow: 'สำหรับนักพัฒนา',
      title: 'backend ที่ติดตั้งได้ ไม่ต้องเช่าห้าบริการ',
      lede: 'Easy CMS เป็นแพ็กเกจ npm ข้อมูล กฎสิทธิ์ hook และงานเบื้องหลังเป็น TypeScript ใน repo ของคุณ หน้าเว็บอ่านผ่าน API ที่มี type และหน้า admin ไปพร้อมกับแอปที่คุณ deploy อยู่แล้ว',
      problem: {
        title: 'สิ่งที่ backend แบบต่อกันเองต้องแลก',
        items: [
          'CMS บริการล็อกอิน คิวงาน และที่เก็บไฟล์: สี่ dashboard สี่บิล สี่ชุด key',
          'schema ที่สร้างในหน้าเว็บ ซึ่งค่อยๆ ไม่ตรงกับโค้ดที่อ่านมัน',
          'JSON ที่ไม่มี type ผ่าน HTTP แม้หน้าเว็บจะ render บน server เดียวกัน',
          'ข้อมูลของคุณอยู่ในฐานข้อมูลของคนอื่น ภายใต้ราคาของคนอื่น',
        ],
      },
      pointsTitle: 'Easy CMS ช่วยอย่างไร',
      points: [
        { title: 'config เดียว ได้ backend ครบ', body: 'collection, field, กฎสิทธิ์, hook และงานเบื้องหลังอยู่ใน easy-cms.config.ts และ review ใน pull request เหมือนโค้ดอื่น', doc: 'configuration' },
        { title: 'ล็อกอินและบทบาทในตัว', body: 'รหัสผ่าน Google, Microsoft, GitHub หรือ OpenID Connect เจ้าไหนก็ได้ พร้อมบทบาทลงถึงระดับ field', doc: 'auth' },
        { title: 'Local API ที่มี type', body: 'โค้ดฝั่ง server เรียก cms.find() พร้อม type จาก config ไม่ต้องผ่าน HTTP ไม่ต้องเขียน type เอง', doc: 'local-api' },
        { title: 'งานเบื้องหลังและ webhook', body: 'คิวงานในฐานข้อมูลของคุณ ลองใหม่และตั้งเวลาได้ และ action ที่รันโค้ดของคุณจากหน้า admin', doc: 'jobs' },
        { title: 'ฐานข้อมูลของคุณ ตารางจริง', body: 'SQLite, Turso หรือ Postgres การเปลี่ยน schema กลายเป็นไฟล์ migration ใน git และรันตอน deploy', doc: 'databases' },
        { title: 'รันได้ทุกที่ที่คุณ deploy', body: 'ใน Next.js หรือ Nuxt หรือเป็น server ของตัวเองบน Node.js, Bun, Deno หรือ Cloudflare Workers', doc: 'deploy' },
      ],
      notFit: [
        'editor ต้องแก้โครงสร้างข้อมูลเองโดยไม่มีนักพัฒนา: ที่นี่โครงสร้างเป็นโค้ด',
        'ต้องใช้ MongoDB, MySQL หรือฐานข้อมูลอื่นนอกจาก SQLite และ Postgres',
        'ต้องการ marketplace ของ integration สำเร็จรูปจำนวนมากตอนนี้',
      ],
    },
  },
  {
    slug: 'teams',
    show: { screenshot: 'preview', path: '/admin/collections/posts' },
    en: {
      menu: { label: 'Startups & product teams', hint: 'An app with its backend and admin from day one' },
      meta: {
        title: 'Easy CMS for startups and product teams',
        description:
          'Ship the app, its backend and its admin together: sign-in, roles, content, jobs and an admin your operations team uses, without stitching services together. MIT licensed.',
      },
      eyebrow: 'For startups & product teams',
      title: 'Ship the app, its backend and its admin from day one.',
      lede: 'The first weeks of a product go into plumbing: sign-in, an admin for the team, a place for content, background jobs. Easy CMS gives you all of it from one config, so the weeks go into the product.',
      problem: {
        title: 'What slows a product team down',
        items: [
          'Weeks spent on sign-in, roles and an internal admin before the first feature ships.',
          'Every content change waits for a developer and a deploy.',
          'A growing list of services, each with its own bill, to run a small product.',
          'Paying for an enterprise plan just to add single sign-on for a customer.',
        ],
      },
      pointsTitle: 'How Easy CMS helps',
      points: [
        { title: 'An admin from the config', body: 'Your operations team gets lists, forms, filters and saved views generated from the data model, with nothing to design.', doc: 'admin' },
        { title: 'Roles and single sign-on', body: 'Give each person exactly what they need, down to fields, and sign in with Google, Microsoft or any OpenID Connect provider.', doc: 'roles' },
        { title: 'Content without a deploy', body: 'Drafts, live preview and scheduled publishing, so the team changes the site or app without waiting for a release.', doc: 'live-preview' },
        { title: 'AI that writes, people check', body: 'Alt text, SEO titles and translations written by Claude, GPT or Gemini, put into the form for someone to review.', doc: 'ai' },
        { title: 'Integrations the team connects', body: 'Email, LINE, Telegram and AI providers, connected in the admin with their keys encrypted in your database.', doc: 'integrations' },
        { title: 'Forms and members', body: 'Sign-up and contact forms built in the admin, and site members who sign in to your app.', doc: 'forms' },
      ],
      notFit: [
        'You want a hosted service to sign up for: Easy CMS is installed into your app by a developer.',
        'Your team wants to add new data types or fields without a developer: the model is code.',
        'You need a large marketplace of ready-made integrations today.',
      ],
    },
    th: {
      menu: { label: 'Startup และทีม product', hint: 'แอปพร้อม backend และ admin ตั้งแต่วันแรก' },
      meta: {
        title: 'Easy CMS สำหรับ startup และทีม product',
        description:
          'ส่งแอป backend และหน้า admin ไปพร้อมกัน: ล็อกอิน บทบาท เนื้อหา งานเบื้องหลัง และหน้า admin ที่ทีมปฏิบัติการใช้ ไม่ต้องต่อบริการเอง เป็น MIT',
      },
      eyebrow: 'สำหรับ startup และทีม product',
      title: 'ส่งแอป backend และหน้า admin ได้ตั้งแต่วันแรก',
      lede: 'สัปดาห์แรกๆ ของ product มักหมดไปกับงานพื้นฐาน: ล็อกอิน หน้า admin ให้ทีม ที่เก็บเนื้อหา งานเบื้องหลัง Easy CMS ให้ทั้งหมดจาก config เดียว เวลาจึงไปอยู่ที่ตัว product',
      problem: {
        title: 'สิ่งที่ทำให้ทีม product ช้า',
        items: [
          'หลายสัปดาห์หมดไปกับล็อกอิน บทบาท และหน้า admin ภายใน ก่อนฟีเจอร์แรกจะออก',
          'ทุกการแก้เนื้อหาต้องรอนักพัฒนาและการ deploy',
          'รายชื่อบริการที่ยาวขึ้นเรื่อยๆ แต่ละตัวมีบิลของตัวเอง สำหรับ product เล็กๆ',
          'ต้องจ่ายแพ็กเกจ enterprise แค่เพื่อเพิ่ม single sign-on ให้ลูกค้า',
        ],
      },
      pointsTitle: 'Easy CMS ช่วยอย่างไร',
      points: [
        { title: 'หน้า admin จาก config', body: 'ทีมปฏิบัติการได้รายการ ฟอร์ม ตัวกรอง และมุมมองที่บันทึกไว้ ที่สร้างจากโครงสร้างข้อมูล ไม่ต้องออกแบบเอง', doc: 'admin' },
        { title: 'บทบาทและ single sign-on', body: 'ให้แต่ละคนเห็นเฉพาะที่ต้องใช้ ลงถึงระดับ field และล็อกอินด้วย Google, Microsoft หรือ OpenID Connect เจ้าไหนก็ได้', doc: 'roles' },
        { title: 'แก้เนื้อหาโดยไม่ต้อง deploy', body: 'ฉบับร่าง live preview และตั้งเวลาเผยแพร่ ทีมจึงแก้เว็บหรือแอปได้โดยไม่ต้องรอ release', doc: 'live-preview' },
        { title: 'AI เขียน คนตรวจ', body: 'alt text, SEO title และคำแปลที่ Claude, GPT หรือ Gemini เขียน ใส่ลงฟอร์มให้คนตรวจก่อน', doc: 'ai' },
        { title: 'ทีมเชื่อมบริการได้เอง', body: 'อีเมล LINE, Telegram และผู้ให้บริการ AI เชื่อมในหน้า admin เก็บ key แบบเข้ารหัสในฐานข้อมูลของคุณ', doc: 'integrations' },
        { title: 'ฟอร์มและสมาชิก', body: 'ฟอร์มสมัครและติดต่อที่สร้างในหน้า admin และสมาชิกที่ล็อกอินเข้าแอปของคุณ', doc: 'forms' },
      ],
      notFit: [
        'ต้องการบริการ hosted ที่สมัครใช้ได้ทันที: Easy CMS ต้องให้นักพัฒนาติดตั้งในแอป',
        'ทีมต้องการเพิ่มชนิดข้อมูลหรือ field ใหม่โดยไม่มีนักพัฒนา: โครงสร้างเป็นโค้ด',
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
        'You need a large marketplace of ready-made integrations.',
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
        'ต้องการ marketplace ของ integration สำเร็จรูปจำนวนมาก',
      ],
    },
  },
]

export const persona = (slug: string) => PERSONAS.find((p) => p.slug === slug) ?? null

/** Labels shared by the menu and the pages. */
export const WHY_UI = {
  en: {
    menu: 'Why Easy CMS',
    lead: 'More than a CMS →',
    leadHint: 'The backend your app needs, in one TypeScript file',
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
    lead: 'มากกว่า CMS →',
    leadHint: 'backend ที่แอปต้องมี ในไฟล์ TypeScript เดียว',
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
      title: 'Why Easy CMS: more than a CMS',
      description:
        'Easy CMS is the backend your app needs in one TypeScript file: content, sign-in and roles, jobs, files, an API and an admin your clients use. MIT licensed, on your own database, from Next.js and Nuxt to Cloudflare Workers.',
    },
    eyebrow: 'Why Easy CMS',
    title: 'More than a CMS.',
    accent: 'The backend your app needs, in one TypeScript file.',
    lede: 'Most projects start with a CMS, then add a sign-in service, a job queue, file storage, an admin for the client and an API layer. Easy CMS is all of it, defined in one config and running on your own database.',
    start: 'Get started',
    compare: 'See how it compares',
    stack: {
      title: 'What a backend usually takes.',
      text: 'Six pieces, often six vendors: each with its own dashboard, keys, bill and way of failing. With Easy CMS they are parts of one package, configured in one file.',
      usual: 'Stitched together',
      usualNote: 'separate services and SDKs',
      ours: 'Easy CMS',
      oursNote: 'one package, one database',
      parts: [
        ['Headless CMS', 'content, drafts, versions', 'collections'],
        ['Auth service', 'sign-in, SSO, roles', 'auth · access'],
        ['Job queue', 'background work, schedules', 'jobs'],
        ['File storage', 'uploads, image sizes', 'upload'],
        ['Admin panel', 'for the people you build for', 'admin'],
        ['API layer', 'REST, GraphQL, types', 'Local API · REST'],
      ],
      bill: '+1 bill',
      totalUsual: '6 services to wire up',
      totalOurs: '1 config file',
    },
    pillarsTitle: 'Six reasons developers switch.',
    pillars: [
      { icon: 'layout', title: 'One file, the whole backend', body: 'Data, access rules, hooks, jobs and the admin come from easy-cms.config.ts, with types for every query.', proof: 'easy-cms.config.ts', doc: 'configuration' },
      { icon: 'api', title: 'Runs where you deploy', body: 'Inside Next.js or Nuxt, or as its own server on Node.js, Bun, Deno or Cloudflare Workers.', proof: 'Tested on every pull request', doc: 'deploy' },
      { icon: 'shield', title: 'Free all the way', body: 'Single sign-on, field permissions, the audit log and backups are MIT. There is no paid edition.', proof: '0 features behind a paywall', doc: 'sso' },
      { icon: 'preview', title: 'An admin your clients use', body: 'Generated from the config, with live preview, AI that writes alt text and translations, and integrations they connect.', proof: 'English and Thai, light and dark', doc: 'admin' },
      { icon: 'spark', title: 'Ready for AI assistants', body: 'A typed config and docs as llms.txt, so Claude Code or Cursor write code that compiles. Agents use MCP under the same roles.', proof: 'llms.txt · MCP (preview)', doc: 'mcp' },
      { icon: 'language', title: 'Thai throughout', body: 'Every admin string and every docs page in Thai as well as English, for Thai teams and the people they build for.', proof: 'Admin and docs, 100%', doc: 'localization' },
    ],
    compareTitle: 'Head to head.',
    compareLede: 'Four questions developers ask, answered from each product’s own site. Every comparison page also says when another product is the better choice.',
    forTitle: 'Who it’s for',
  },
  th: {
    meta: {
      title: 'ทำไมต้อง Easy CMS: มากกว่า CMS',
      description:
        'Easy CMS คือ backend ที่แอปต้องมี ในไฟล์ TypeScript เดียว: เนื้อหา การล็อกอินและบทบาท งานเบื้องหลัง ไฟล์ API และหน้า admin ที่ลูกค้าใช้ได้เอง เป็น MIT บนฐานข้อมูลของคุณ ตั้งแต่ Next.js และ Nuxt ถึง Cloudflare Workers',
    },
    eyebrow: 'ทำไมต้อง Easy CMS',
    title: 'มากกว่า CMS',
    accent: 'backend ที่แอปต้องมี ในไฟล์ TypeScript เดียว',
    lede: 'โปรเจกต์ส่วนใหญ่เริ่มจาก CMS แล้วต้องเพิ่มบริการล็อกอิน คิวงาน ที่เก็บไฟล์ หน้า admin ให้ลูกค้า และชั้น API Easy CMS รวมทั้งหมดไว้ กำหนดใน config เดียว และรันบนฐานข้อมูลของคุณเอง',
    start: 'เริ่มใช้งาน',
    compare: 'ดูการเปรียบเทียบ',
    stack: {
      title: 'backend ปกติต้องมีอะไรบ้าง',
      text: 'หกชิ้น บ่อยครั้งก็หกเจ้า แต่ละเจ้ามี dashboard, key, บิล และวิธีล่มของตัวเอง ใน Easy CMS ทั้งหมดเป็นส่วนหนึ่งของ package เดียว ตั้งค่าในไฟล์เดียว',
      usual: 'ต่อกันเอง',
      usualNote: 'บริการและ SDK แยกกัน',
      ours: 'Easy CMS',
      oursNote: 'package เดียว ฐานข้อมูลเดียว',
      parts: [
        ['Headless CMS', 'เนื้อหา ฉบับร่าง เวอร์ชัน', 'collections'],
        ['บริการล็อกอิน', 'ล็อกอิน SSO บทบาท', 'auth · access'],
        ['คิวงาน', 'งานเบื้องหลัง ตั้งเวลา', 'jobs'],
        ['ที่เก็บไฟล์', 'อัปโหลด ขนาดรูป', 'upload'],
        ['หน้า admin', 'สำหรับคนที่คุณทำระบบให้', 'admin'],
        ['ชั้น API', 'REST, GraphQL, type', 'Local API · REST'],
      ],
      bill: '+1 บิล',
      totalUsual: '6 บริการที่ต้องต่อกัน',
      totalOurs: 'config ไฟล์เดียว',
    },
    pillarsTitle: 'หกเหตุผลที่นักพัฒนาย้ายมา',
    pillars: [
      { icon: 'layout', title: 'ไฟล์เดียว ได้ backend ครบ', body: 'ข้อมูล กฎสิทธิ์ hook งานเบื้องหลัง และหน้า admin มาจาก easy-cms.config.ts พร้อม type ทุก query', proof: 'easy-cms.config.ts', doc: 'configuration' },
      { icon: 'api', title: 'รันได้ทุกที่ที่คุณ deploy', body: 'ใน Next.js หรือ Nuxt หรือเป็น server ของตัวเองบน Node.js, Bun, Deno หรือ Cloudflare Workers', proof: 'ทดสอบทุก pull request', doc: 'deploy' },
      { icon: 'shield', title: 'ฟรีทั้งหมด', body: 'single sign-on สิทธิ์ระดับ field, audit log และ backup เป็น MIT ไม่มีรุ่นเสียเงิน', proof: 'ฟีเจอร์ที่ต้องจ่ายเงิน: 0', doc: 'sso' },
      { icon: 'preview', title: 'หน้า admin ที่ลูกค้าใช้ได้เอง', body: 'สร้างจาก config มี live preview, AI ช่วยเขียน alt text และแปลภาษา และเชื่อมบริการต่างๆ ได้เอง', proof: 'ไทยและอังกฤษ สว่างและมืด', doc: 'admin' },
      { icon: 'spark', title: 'พร้อมสำหรับผู้ช่วย AI', body: 'config ที่มี type และ docs เป็น llms.txt ทำให้ Claude Code หรือ Cursor เขียนโค้ดที่ compile ผ่าน ส่วน agent ใช้ MCP ภายใต้บทบาทเดียวกับคน', proof: 'llms.txt · MCP (preview)', doc: 'mcp' },
      { icon: 'language', title: 'ภาษาไทยครบ', body: 'ทุกข้อความใน admin และ docs ทุกหน้ามีภาษาไทยคู่กับอังกฤษ สำหรับทีมคนไทยและลูกค้าของคุณ', proof: 'admin และ docs ครบ 100%', doc: 'localization' },
    ],
    compareTitle: 'เทียบกันตัวต่อตัว',
    compareLede: 'สี่คำถามที่นักพัฒนาถาม ตอบจากเว็บของแต่ละผลิตภัณฑ์เอง ทุกหน้าเปรียบเทียบบอกด้วยว่าเมื่อไรควรเลือกเจ้าอื่น',
    forTitle: 'เหมาะกับใคร',
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
    allTitle: 'Every question, side by side.',
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
    allTitle: 'ทุกคำถาม เทียบกันทีละข้อ',
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
