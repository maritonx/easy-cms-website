/**
 * Easy CMS next to other CMSs. Every competitor fact comes from the product's own site, docs or
 * GitHub, checked on CHECKED; `sources` lists them. Where a fact couldn't be confirmed, the cell
 * says to see the official site instead of guessing.
 */
import { VERSION } from '@/lib/site'

export const CHECKED = '2026-10-17'

type T = { en: string; th: string }

export const ROWS = [
  { key: 'license', label: { en: 'License', th: 'สัญญาอนุญาต' } },
  { key: 'runs', label: { en: 'Where it runs', th: 'รันที่ไหน' } },
  { key: 'model', label: { en: 'Content model', th: 'โครงสร้างเนื้อหา' } },
  { key: 'databases', label: { en: 'Databases', th: 'ฐานข้อมูล' } },
  { key: 'runtime', label: { en: 'Language and runtime', th: 'ภาษาและ runtime' } },
  { key: 'cloud', label: { en: 'Hosted cloud', th: 'Cloud ที่ให้บริการ' } },
  { key: 'apis', label: { en: 'APIs', th: 'API' } },
  { key: 'thai', label: { en: 'Admin in Thai', th: 'หน้า admin ภาษาไทย' } },
  { key: 'team', label: { en: 'Roles, SSO, audit', th: 'บทบาท, SSO, audit' } },
  { key: 'ecosystem', label: { en: 'Ecosystem', th: 'Ecosystem' } },
  { key: 'maturity', label: { en: 'Maturity', th: 'ระดับความพร้อม' } },
] as const

export type RowKey = (typeof ROWS)[number]['key']

export type Product = {
  name: string
  url: string
  cells: Record<RowKey, T>
}

export type Competitor = Product & {
  slug: string
  summary: T
  chooseUs: { en: readonly string[]; th: readonly string[] }
  chooseThem: { en: readonly string[]; th: readonly string[] }
  sources: readonly { label: string; url: string }[]
  /** A docs page for moving from this product, e.g. 'recipes/wordpress'. */
  moveGuide?: { doc: string; text: T }
}

export const EASY_CMS: Product = {
  name: 'Easy CMS',
  url: 'https://github.com/maritonx/easy-cms',
  cells: {
    license: { en: 'MIT. Every feature is free, roles and SSO included', th: 'MIT ทุกฟีเจอร์ฟรี รวมถึงบทบาทและ SSO' },
    runs: { en: 'Inside your Next.js or Nuxt app, or as a standalone server', th: 'ในแอป Next.js หรือ Nuxt ของคุณ หรือเป็น standalone server' },
    model: { en: 'TypeScript config in your repo', th: 'config TypeScript ใน repo ของคุณ' },
    databases: { en: 'SQLite (file or Turso), Postgres (or PGlite)', th: 'SQLite (ไฟล์หรือ Turso), Postgres (หรือ PGlite)' },
    runtime: { en: 'Node.js 22.12+, TypeScript', th: 'Node.js 22.12+, TypeScript' },
    cloud: { en: 'None. Self-host anywhere; one-click deploy to your own Vercel or Netlify', th: 'ไม่มี host เองได้ทุกที่ และ deploy ด้วยคลิกเดียวไปที่ Vercel หรือ Netlify ของคุณเอง' },
    apis: { en: 'Typed Local API, REST; GraphQL and MCP as experimental plugins', th: 'Local API ที่มี type, REST และ GraphQL กับ MCP เป็น plugin ทดลอง' },
    thai: { en: 'Complete: every admin string, and every docs page', th: 'ครบ: ทุกข้อความใน admin และ docs ทุกหน้า' },
    team: { en: 'Roles, field permissions, SSO (Google, Microsoft, GitHub, OIDC), audit log: all MIT', th: 'บทบาท, สิทธิ์ระดับ field, SSO (Google, Microsoft, GitHub, OIDC), audit log: MIT ทั้งหมด' },
    ecosystem: { en: 'Small: official plugins (SEO, forms, redirects, nested pages, multi-tenant, shop, GraphQL, MCP), a new community', th: 'เล็ก: plugin ทางการ (SEO, ฟอร์ม, redirect, หน้าย่อย, multi-tenant, ร้านค้า, GraphQL, MCP) ชุมชนยังใหม่' },
    maturity: { en: `Version ${VERSION}; 1.0 in October 2026, first released September 2026`, th: `เวอร์ชัน ${VERSION} ออก 1.0 เมื่อตุลาคม 2026 และออกครั้งแรกกันยายน 2026` },
  },
}

export const COMPETITORS: readonly Competitor[] = [
  {
    slug: 'payload',
    name: 'Payload',
    url: 'https://payloadcms.com',
    summary: {
      en: 'Payload is the closest to Easy CMS: MIT, code-first and installed into your Next.js app. It is far more mature, with a large community. Easy CMS also runs in Nuxt or on its own, and keeps team features such as SSO in the free license.',
      th: 'Payload ใกล้ Easy CMS ที่สุด: MIT, code-first และติดตั้งในแอป Next.js ของคุณ Payload mature กว่ามากและชุมชนใหญ่กว่า ส่วน Easy CMS รันใน Nuxt หรือรันแยกได้ด้วย และฟีเจอร์ทีมอย่าง SSO อยู่ใน license ฟรี',
    },
    cells: {
      license: { en: 'MIT; an Enterprise plan (through sales) adds SSO and visual editing', th: 'MIT มีแพ็กเกจ Enterprise (ติดต่อฝ่ายขาย) เพิ่ม SSO และ visual editing' },
      runs: { en: 'Inside your Next.js app', th: 'ในแอป Next.js ของคุณ' },
      model: { en: 'TypeScript config in your repo', th: 'config TypeScript ใน repo ของคุณ' },
      databases: { en: 'MongoDB, Postgres, SQLite', th: 'MongoDB, Postgres, SQLite' },
      runtime: { en: 'Node.js, TypeScript; Next.js only', th: 'Node.js, TypeScript; Next.js เท่านั้น' },
      cloud: { en: 'Self-host anywhere; one-click templates for Vercel and Cloudflare', th: 'host เองได้ทุกที่ มี template คลิกเดียวสำหรับ Vercel และ Cloudflare' },
      apis: { en: 'See the official site', th: 'ดูเว็บทางการ' },
      thai: { en: 'Yes, near-complete', th: 'มี เกือบครบ' },
      team: { en: 'SSO is an Enterprise feature', th: 'SSO อยู่ในแพ็กเกจ Enterprise' },
      ecosystem: { en: 'Large: about 45k GitHub stars; Payload has joined Figma', th: 'ใหญ่: ดาวบน GitHub ราว 45k และ Payload อยู่กับ Figma แล้ว' },
      maturity: { en: 'Version 3 since November 2024', th: 'เวอร์ชัน 3 ตั้งแต่พฤศจิกายน 2024' },
    },
    chooseUs: {
      en: [
        'Your frontend is Nuxt, or not a Next.js app at all (the standalone server serves any frontend).',
        'You want roles, SSO and an audit log without an enterprise plan.',
        'Your editors work in Thai and need Thai docs too.',
      ],
      th: [
        'frontend ของคุณเป็น Nuxt หรือไม่ใช่แอป Next.js เลย (standalone server ให้บริการ frontend ใดก็ได้)',
        'ต้องการบทบาท, SSO และ audit log โดยไม่ต้องซื้อแพ็กเกจ enterprise',
        'editor ทำงานเป็นภาษาไทยและต้องการ docs ภาษาไทยด้วย',
      ],
    },
    chooseThem: {
      en: [
        'You want the most mature embedded CMS for Next.js, with a large community and many examples.',
        'You need MongoDB.',
        'You need visual editing or enterprise support from the vendor.',
      ],
      th: [
        'ต้องการ CMS แบบฝังในแอป Next.js ที่ mature ที่สุด ชุมชนใหญ่และมีตัวอย่างมาก',
        'ต้องใช้ MongoDB',
        'ต้องการ visual editing หรือ support ระดับ enterprise จากผู้พัฒนา',
      ],
    },
    sources: [
      { label: 'Payload: pricing and license', url: 'https://payloadcms.com/get-started' },
      { label: 'Payload: databases', url: 'https://payloadcms.com/docs/database/overview' },
      { label: 'Payload: admin languages', url: 'https://payloadcms.com/docs/configuration/i18n' },
      { label: 'Payload on GitHub', url: 'https://github.com/payloadcms/payload' },
    ],
  },
  {
    slug: 'strapi',
    name: 'Strapi',
    url: 'https://strapi.io',
    summary: {
      en: 'Strapi is the most popular open-source headless CMS: a separate Node server with its own admin. Its Community Edition is MIT, while live preview, content history, SSO and audit logs are in paid plans. Easy CMS runs inside your app and keeps those features in the free license.',
      th: 'Strapi เป็น headless CMS แบบ open source ที่นิยมที่สุด: server Node แยกพร้อม admin ของตัวเอง Community Edition เป็น MIT ส่วน live preview, ประวัติเนื้อหา, SSO และ audit log อยู่ในแพ็กเกจเสียเงิน Easy CMS รันในแอปของคุณและฟีเจอร์เหล่านั้นอยู่ใน license ฟรี',
    },
    cells: {
      license: { en: 'MIT Community Edition; paid Growth ($45/month self-hosted) and Enterprise editions', th: 'Community Edition เป็น MIT มีแพ็กเกจ Growth ($45/เดือน แบบ host เอง) และ Enterprise ที่เสียเงิน' },
      runs: { en: 'A separate Node server', th: 'server Node แยก' },
      model: { en: 'Content-type Builder in the admin (in development), saved as schema files in the project', th: 'Content-type Builder ในหน้า admin (ตอนพัฒนา) บันทึกเป็นไฟล์ schema ในโปรเจกต์' },
      databases: { en: 'PostgreSQL, MySQL, MariaDB, SQLite', th: 'PostgreSQL, MySQL, MariaDB, SQLite' },
      runtime: { en: 'Node.js', th: 'Node.js' },
      cloud: { en: 'Strapi Cloud from $35/month; no free tier listed', th: 'Strapi Cloud เริ่ม $35/เดือน ไม่มีแพ็กเกจฟรี' },
      apis: { en: 'REST, GraphQL', th: 'REST, GraphQL' },
      thai: { en: 'Partial (about a quarter of the admin)', th: 'บางส่วน (ราวหนึ่งในสี่ของ admin)' },
      team: { en: 'Live preview, content history: Growth; SSO, review workflows, audit logs: Enterprise', th: 'live preview, ประวัติเนื้อหา: Growth; SSO, review workflow, audit log: Enterprise' },
      ecosystem: { en: 'The largest here: about 73k GitHub stars', th: 'ใหญ่ที่สุดในกลุ่ม: ดาวบน GitHub ราว 73k' },
      maturity: { en: 'Version 5 since September 2024', th: 'เวอร์ชัน 5 ตั้งแต่กันยายน 2024' },
    },
    chooseUs: {
      en: [
        'You don\'t want a second server to deploy, secure and keep in step with your app.',
        'You want the content model as typed TypeScript, reviewed in pull requests.',
        'You want live preview, history, SSO and an audit log without a paid plan.',
      ],
      th: [
        'ไม่อยากมี server ตัวที่สองที่ต้อง deploy ดูแลความปลอดภัย และคอยให้ตรงกับแอป',
        'ต้องการโครงสร้างเนื้อหาเป็น TypeScript ที่มี type และ review ใน pull request',
        'ต้องการ live preview, ประวัติ, SSO และ audit log โดยไม่ต้องเสียเงิน',
      ],
    },
    chooseThem: {
      en: [
        'One backend serves many frontends and teams that are not in one codebase.',
        'You want the largest community, plugins and hiring pool.',
        'You prefer building content types in an admin screen.',
      ],
      th: [
        'backend เดียวให้บริการหลาย frontend และหลายทีมที่ไม่ได้อยู่ใน codebase เดียวกัน',
        'ต้องการชุมชน plugin และคนที่จ้างได้มากที่สุด',
        'ชอบสร้าง content type ในหน้า admin',
      ],
    },
    sources: [
      { label: 'Strapi: license', url: 'https://github.com/strapi/strapi/blob/develop/LICENSE' },
      { label: 'Strapi: self-hosted pricing', url: 'https://strapi.io/pricing-self-hosted' },
      { label: 'Strapi: cloud pricing', url: 'https://strapi.io/pricing-cloud' },
      { label: 'Strapi: databases', url: 'https://docs.strapi.io/cms/configurations/database' },
      { label: 'Strapi: Content-type Builder', url: 'https://docs.strapi.io/cms/features/content-type-builder' },
      { label: 'Strapi: admin translations', url: 'https://github.com/strapi/strapi/tree/develop/packages/core/admin/admin/src/translations' },
    ],
  },
  {
    slug: 'directus',
    name: 'Directus',
    url: 'https://directus.com',
    summary: {
      en: 'Directus puts a data studio and APIs on top of any SQL database, with the model built in its interface. Its license is source-available, not OSI open source, and the free Core is capped. Easy CMS is MIT with no caps, and its model lives in your repo.',
      th: 'Directus วาง data studio และ API ไว้บนฐานข้อมูล SQL ใดก็ได้ โดยสร้างโครงสร้างในหน้าเว็บ license เป็นแบบ source-available ไม่ใช่ open source ตาม OSI และ Core ที่ฟรีมีข้อจำกัด Easy CMS เป็น MIT ไม่จำกัด และโครงสร้างอยู่ใน repo ของคุณ',
    },
    cells: {
      license: { en: 'Source-available (Monospace Sustainable Core License); free Core capped at 3 seats, 25 collections and 5 flows; each release becomes GPL after four years', th: 'source-available (Monospace Sustainable Core License); Core ฟรีจำกัด 3 ที่นั่ง, 25 collection และ 5 flow; แต่ละ release เป็น GPL หลัง 4 ปี' },
      runs: { en: 'A separate Node server and data studio on your SQL database', th: 'server Node แยกพร้อม data studio บนฐานข้อมูล SQL ของคุณ' },
      model: { en: 'Built in the data studio as real tables; can introspect an existing database; YAML snapshots', th: 'สร้างใน data studio เป็นตารางจริง อ่านจากฐานข้อมูลที่มีอยู่ได้ และมี snapshot เป็น YAML' },
      databases: { en: 'Postgres, MySQL, MariaDB, MS SQL, SQLite, OracleDB, CockroachDB', th: 'Postgres, MySQL, MariaDB, MS SQL, SQLite, OracleDB, CockroachDB' },
      runtime: { en: 'Node.js', th: 'Node.js' },
      cloud: { en: 'Team plan $499/month (annual); cloud hosting +$99/month', th: 'แพ็กเกจ Team $499/เดือน (รายปี) และ cloud hosting +$99/เดือน' },
      apis: { en: 'REST, GraphQL', th: 'REST, GraphQL' },
      thai: { en: 'Partial (community translation)', th: 'บางส่วน (ชุมชนแปล)' },
      team: { en: 'No SSO in the free Core', th: 'Core ที่ฟรีไม่มี SSO' },
      ecosystem: { en: 'About 39k GitHub stars', th: 'ดาวบน GitHub ราว 39k' },
      maturity: { en: 'Version 12 since June 2026', th: 'เวอร์ชัน 12 ตั้งแต่มิถุนายน 2026' },
    },
    chooseUs: {
      en: [
        'You want an OSI open-source license with no seat or collection caps.',
        'Your schema should be code, reviewed and versioned with the app.',
        'Content belongs to a Next.js or Nuxt site rather than a shared data platform.',
      ],
      th: [
        'ต้องการ license open source ตาม OSI โดยไม่จำกัดที่นั่งหรือ collection',
        'ต้องการให้ schema เป็นโค้ด review และมีเวอร์ชันไปกับแอป',
        'เนื้อหาเป็นของเว็บ Next.js หรือ Nuxt มากกว่าเป็นแพลตฟอร์มข้อมูลที่ใช้ร่วมกัน',
      ],
    },
    chooseThem: {
      en: [
        'You already have a SQL database and want an admin and APIs on top of it.',
        'You need MySQL, MS SQL, Oracle or CockroachDB.',
        'Non-developers should change the data model themselves.',
      ],
      th: [
        'มีฐานข้อมูล SQL อยู่แล้ว และต้องการ admin กับ API บนฐานข้อมูลนั้น',
        'ต้องใช้ MySQL, MS SQL, Oracle หรือ CockroachDB',
        'คนที่ไม่ใช่นักพัฒนาต้องแก้โครงสร้างข้อมูลเองได้',
      ],
    },
    sources: [
      { label: 'Directus: license', url: 'https://github.com/directus/directus/blob/main/license' },
      { label: 'Directus: pricing', url: 'https://directus.com/pricing' },
      { label: 'Directus: collections', url: 'https://directus.com/docs/guides/data-model/collections' },
      { label: 'Directus: schema snapshots', url: 'https://docs.directus.io/self-hosted/cli' },
      { label: 'Directus on GitHub', url: 'https://github.com/directus/directus' },
    ],
  },
  {
    slug: 'wordpress',
    name: 'WordPress',
    url: 'https://wordpress.org',
    summary: {
      en: 'WordPress runs a large share of the web, with themes and plugins for almost anything, on PHP and MySQL. Used headless, it is a separate PHP app next to your frontend. Easy CMS keeps everything in your TypeScript app, with a typed content model.',
      th: 'WordPress อยู่เบื้องหลังเว็บจำนวนมาก มี theme และ plugin แทบทุกอย่าง บน PHP และ MySQL ถ้าใช้แบบ headless จะเป็นแอป PHP แยกข้าง frontend ของคุณ Easy CMS เก็บทุกอย่างไว้ในแอป TypeScript ของคุณ พร้อมโครงสร้างเนื้อหาที่มี type',
    },
    cells: {
      license: { en: 'GPL-2.0; free to self-host', th: 'GPL-2.0 host เองได้ฟรี' },
      runs: { en: 'A separate PHP app (themes, or headless)', th: 'แอป PHP แยก (theme หรือ headless)' },
      model: { en: 'Posts and pages; custom post types in PHP or plugins', th: 'โพสต์และหน้า และ custom post type ด้วย PHP หรือ plugin' },
      databases: { en: 'MySQL 8.0+ or MariaDB 10.11+', th: 'MySQL 8.0+ หรือ MariaDB 10.11+' },
      runtime: { en: 'PHP 8.3+', th: 'PHP 8.3+' },
      cloud: { en: 'WordPress.com: free plan; paid plans from $4/month (yearly)', th: 'WordPress.com: มีแพ็กเกจฟรี และแพ็กเกจเสียเงินเริ่ม $4/เดือน (รายปี)' },
      apis: { en: 'REST built in; GraphQL with the WPGraphQL plugin', th: 'มี REST ในตัว และ GraphQL ผ่าน plugin WPGraphQL' },
      thai: { en: 'Partial (about two-thirds translated)', th: 'บางส่วน (แปลแล้วราวสองในสาม)' },
      team: { en: 'See the official site', th: 'ดูเว็บทางการ' },
      ecosystem: { en: 'The largest plugin and theme ecosystem', th: 'ecosystem ของ plugin และ theme ใหญ่ที่สุด' },
      maturity: { en: 'Version 7.1 (August 2026), over two decades old', th: 'เวอร์ชัน 7.1 (สิงหาคม 2026) มีมากว่ายี่สิบปี' },
    },
    chooseUs: {
      en: [
        'Your site is a Next.js or Nuxt app and you don\'t want a PHP stack beside it.',
        'You want the content model typed in TypeScript and reviewed in git.',
        'You want fewer plugins to update and audit.',
      ],
      th: [
        'เว็บของคุณเป็นแอป Next.js หรือ Nuxt และไม่อยากมี PHP stack อยู่ข้างๆ',
        'ต้องการโครงสร้างเนื้อหาที่มี type ใน TypeScript และ review ใน git',
        'ต้องการ plugin ที่ต้องอัปเดตและตรวจสอบน้อยลง',
      ],
    },
    chooseThem: {
      en: [
        'People who don\'t write code build and run the site with themes.',
        'You need a plugin for something specific, and it already exists.',
        'You want cheap managed hosting that anyone can set up.',
      ],
      th: [
        'คนที่ไม่เขียนโค้ดสร้างและดูแลเว็บเองด้วย theme',
        'ต้องการ plugin สำหรับงานเฉพาะ และมีอยู่แล้ว',
        'ต้องการ hosting ราคาถูกที่ใครก็ตั้งค่าได้',
      ],
    },
    moveGuide: {
      doc: 'recipes/wordpress',
      text: {
        en: 'Moving from WordPress? A script brings your posts, pages, categories and images across, with redirects from the old addresses.',
        th: 'จะย้ายจาก WordPress? มีสคริปต์ย้ายบทความ หน้า หมวดหมู่ และรูปภาพมาให้ พร้อม redirect จากที่อยู่เดิม',
      },
    },
    sources: [
      { label: 'WordPress: releases', url: 'https://wordpress.org/download/releases/' },
      { label: 'WordPress: requirements', url: 'https://wordpress.org/about/requirements/' },
      { label: 'WordPress.com: pricing', url: 'https://wordpress.com/pricing/' },
      { label: 'WordPress: REST API', url: 'https://developer.wordpress.org/rest-api/' },
      { label: 'WordPress: Thai translation', url: 'https://translate.wordpress.org/locale/th/' },
    ],
  },
  {
    slug: 'sanity',
    name: 'Sanity',
    url: 'https://www.sanity.io',
    summary: {
      en: 'Sanity pairs an MIT-licensed Studio, configured in code, with a hosted content backend you can\'t self-host. It is strong at real-time collaboration and visual editing, billed by seats and usage. Easy CMS keeps your content in your own database.',
      th: 'Sanity มี Studio ที่เป็น MIT และตั้งค่าด้วยโค้ด คู่กับ backend เนื้อหาแบบ hosted ที่ host เองไม่ได้ เด่นเรื่องการทำงานร่วมกันแบบ real-time และ visual editing คิดเงินตามที่นั่งและการใช้งาน Easy CMS เก็บเนื้อหาไว้ในฐานข้อมูลของคุณเอง',
    },
    cells: {
      license: { en: 'Studio is MIT; the Content Lake backend is a proprietary hosted service', th: 'Studio เป็น MIT ส่วน backend Content Lake เป็นบริการ hosted แบบ proprietary' },
      runs: { en: 'Studio as a React app (it can be embedded in Next.js); content in Sanity\'s cloud', th: 'Studio เป็นแอป React (ฝังใน Next.js ได้) เนื้อหาอยู่บน cloud ของ Sanity' },
      model: { en: 'Schemas in JavaScript or TypeScript', th: 'schema ใน JavaScript หรือ TypeScript' },
      databases: { en: 'Sanity\'s hosted Content Lake only', th: 'Content Lake ที่ Sanity host เท่านั้น' },
      runtime: { en: 'Studio: React; backend: hosted', th: 'Studio: React; backend: hosted' },
      cloud: { en: 'Free plan (20 seats, 10k documents); Growth $15 per seat per month', th: 'แพ็กเกจฟรี (20 ที่นั่ง, 10k เอกสาร) และ Growth $15 ต่อที่นั่งต่อเดือน' },
      apis: { en: 'GROQ, GraphQL', th: 'GROQ, GraphQL' },
      thai: { en: 'Community plugin', th: 'plugin จากชุมชน' },
      team: { en: 'See the pricing page', th: 'ดูหน้าราคา' },
      ecosystem: { en: 'Mature hosted platform; real-time collaboration and visual editing', th: 'แพลตฟอร์ม hosted ที่ mature มีการทำงานร่วมกันแบบ real-time และ visual editing' },
      maturity: { en: 'Studio version 6 since June 2026', th: 'Studio เวอร์ชัน 6 ตั้งแต่มิถุนายน 2026' },
    },
    chooseUs: {
      en: [
        'Content should live in your own database, under your own backups.',
        'You don\'t want bills that grow with seats, documents or API requests.',
        'You want to run everything yourself, on any host.',
      ],
      th: [
        'เนื้อหาควรอยู่ในฐานข้อมูลและ backup ของคุณเอง',
        'ไม่อยากมีค่าใช้จ่ายที่เพิ่มตามจำนวนที่นั่ง เอกสาร หรือ API request',
        'ต้องการรันทุกอย่างเองบน host ใดก็ได้',
      ],
    },
    chooseThem: {
      en: [
        'Editors work together in real time on the same documents.',
        'You want no backend to operate at all.',
        'The free plan\'s limits fit your project.',
      ],
      th: [
        'editor ทำงานร่วมกันแบบ real-time บนเอกสารเดียวกัน',
        'ไม่อยากดูแล backend เลย',
        'ข้อจำกัดของแพ็กเกจฟรีพอสำหรับโปรเจกต์ของคุณ',
      ],
    },
    sources: [
      { label: 'Sanity: pricing', url: 'https://www.sanity.io/pricing' },
      { label: 'Sanity: Studio', url: 'https://www.sanity.io/docs/studio' },
      { label: 'Sanity: embedding the Studio', url: 'https://www.sanity.io/docs/studio/embedding-sanity-studio' },
      { label: 'Sanity: self-hosting the Content Lake', url: 'https://www.sanity.io/answers/is-it-possible-to-self-host-the-content-lake' },
      { label: 'Sanity: Studio languages', url: 'https://www.sanity.io/docs/studio/localizing-studio-ui' },
    ],
  },
]

export const competitor = (slug: string) => COMPETITORS.find((c) => c.slug === slug) ?? null
