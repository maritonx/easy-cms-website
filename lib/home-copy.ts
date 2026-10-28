/**
 * The home page's words in English and Thai. Text in `backticks` is shown as code
 * (components/home/home-page.tsx). Code samples stay in English, apart from their comments.
 */
export type Locale = 'en' | 'th'

type Item = readonly [string, string]

export type HomeCopy = {
  meta: { title: string; description: string }
  docs: string
  hero: { title: string; accent: string; lede: string; start: string; star: string; meta: readonly string[] }
  stackLabel: string
  why: {
    eyebrow: string
    title: string
    text: string
    hosted: { tag: string; title: string; app: string; link: string; service: string; serviceNote: string; db: string; dbNote: string; points: readonly string[] }
    ours: { title: string; app: string; link: string; db: string; dbNote: string; points: readonly string[] }
  }
  code: {
    eyebrow: string
    title: string
    text: string
    steps: readonly [Item, Item, Item]
    comments: { routes: string; page: string; hero: string }
  }
  features: { eyebrow: string; title: string; items: readonly (readonly [string, string, string])[] }
  performance: {
    eyebrow: string
    title: string
    text: string
    /** Value, unit and what was measured: p95 times from the docs' 1M table. */
    stats: readonly (readonly [string, string, string])[]
    setup: string
    limits: string
    link: string
    /** The docs page with the full table, with its heading's anchor in this language. */
    page: string
  }
  plugins: { eyebrow: string; title: string; text: string; browse: string; items: readonly string[] }
  admin: {
    eyebrow: string
    title: string
    text: string
    tabs: readonly string[]
    alts: readonly string[]
    note: string
  }
  blog: { eyebrow: string; title: string; all: string; note: string | null; empty: string }
  final: { title: string; text: string; guide: string; source: string }
  copy: string
  copied: string
}

export const HOME_COPY: Record<Locale, HomeCopy> = {
  en: {
    meta: {
      title: 'Easy CMS: the embedded headless CMS for Next.js and Nuxt',
      description:
        'Easy CMS runs inside your Next.js or Nuxt app. Define content in TypeScript and get an admin, a typed API and REST on one deployment and your own database.',
    },
    docs: '/docs',
    hero: {
      title: 'Your Next.js app is',
      accent: 'already a CMS.',
      lede: 'Easy CMS runs inside your Next.js or Nuxt app. Define content in TypeScript, and you get an admin at `/admin`, a typed API and REST, on one deployment and your own database.',
      start: 'Get started',
      star: 'Star on GitHub',
      meta: ['MIT licensed', 'Next.js 15+ · Nuxt', 'Admin in English & ไทย'],
    },
    stackLabel: 'Runs with',
    why: {
      eyebrow: 'Embedded, not hosted',
      title: 'No second server to run, pay for or keep in sync.',
      text: 'A typical headless CMS is another service with its own database and API keys. Easy CMS is an npm package your app mounts, so content ships with the code that renders it.',
      hosted: {
        tag: 'A hosted headless CMS',
        title: 'Two apps, two databases',
        app: 'Your Next.js app',
        link: 'HTTPS · API token · rate limits',
        service: 'CMS service',
        serviceNote: 'separate deploy',
        db: 'CMS database',
        dbNote: 'not yours',
        points: ['Schema lives in a web UI, not in your repo', 'Types generated in a separate step', 'A network hop on every page render'],
      },
      ours: {
        title: 'One app, one database',
        app: 'Your Next.js app',
        link: 'in-process call · no network',
        db: 'Your database',
        dbNote: 'Postgres or SQLite · only `ecms_` tables',
        points: ['Content model in `easy-cms.config.ts`, reviewed in PRs', 'Types come straight from the config, no build step', 'Deploys wherever your app already runs'],
      },
    },
    code: {
      eyebrow: 'Code-first',
      title: 'Three files and your app has a CMS.',
      text: 'Describe collections and fields in TypeScript. The admin forms, validation, access rules and the typed API are built from that one file.',
      steps: [
        ['Define your content', 'Collections, fields, drafts and locales in `easy-cms.config.ts`.'],
        ['Mount the admin and API', 'Two route handlers serve `/admin` and `/api/cms`.'],
        ['Read it in a Server Component', '`getEasyCMS()` returns documents typed from your config.'],
      ],
      comments: {
        routes: 'your Next config',
        page: 'post.title: string, typed from your config',
        hero: 'docs: Post[], typed from your config',
      },
    },
    features: {
      eyebrow: 'Built in',
      title: 'What editors expect, what developers can review.',
      items: [
        ['history', 'Drafts and version history', 'Edit a published post without touching the live page. Compare versions and restore any of them.'],
        ['preview', 'Live preview', 'Your real page sits next to the form and updates as editors type, before anything is published.'],
        ['language', 'Localized content', 'One value per language, with translation status in every list. The admin speaks English and Thai.'],
        ['lock', 'Roles and single sign-on', 'Tick what each role may do in the admin, down to fields. Sign in with Google, Microsoft or GitHub.'],
        ['media', 'A media library with folders', 'Folders, many files at once, private files with signed links, and storage on S3, R2 or Vercel Blob.'],
        ['shield', 'Audit log and backups', 'A signed record of who changed what, and database backups you start or schedule from the admin.'],
        ['calendar', 'Scheduled publishing', 'Publish or unpublish at a set time. Due jobs run every minute on the server you already have.'],
        ['seo', 'SEO out of the box', 'Sitemaps, hreflang, JSON-LD and llms.txt from the content you already have.'],
        ['chip', 'Typed API, REST and GraphQL', 'A typed Local API in your server code, REST for any client, and GraphQL and MCP as plugins.'],
      ],
    },
    performance: {
      eyebrow: 'Measured at scale',
      title: 'Fast at a million documents.',
      text: 'Every night a load test runs Easy CMS against 1,000,000 posts. The times are p95: 95% of requests finish faster.',
      stats: [
        ['1,000,000', '', 'posts in one collection'],
        ['27', 'ms', 'a post by id or slug'],
        ['37', 'ms', 'the next page by cursor, however deep'],
        ['79', 'ms', 'Thai text search with a trigram index'],
      ],
      setup: 'Easy CMS 1.15 · median of 3 runs · Postgres 17 · GitHub runner, 4 cores · 20 requests at once · 28 Oct 2026',
      limits: 'Not everything is fast yet: a page picked by number deep in the list takes seconds (use `cursor` instead), and so do queries inside blocks. The full results list them.',
      link: 'All results and how they are measured',
      page: 'databases#at-1000000-posts',
    },
    plugins: {
      eyebrow: 'Official plugins',
      title: 'Add a feature with one line in `plugins`.',
      text: 'Each plugin adds its own collections, admin screens and API routes, and ships its migration. Write your own with the same hooks.',
      browse: 'Browse plugins',
      items: [
        'Meta fields, sitemaps, hreflang and JSON-LD.',
        'Editors build forms; submissions are validated, stored and exported as CSV.',
        '301 to 308 redirects, created automatically when a page moves.',
        'Pages inside pages, with paths and breadcrumbs per language.',
        'Several sites or clients in one CMS, each with its own members and content.',
        'Products, carts and checkout with Stripe, PromptPay or bank transfer.',
        'A GraphQL API with the same access rules as REST.',
        'An MCP server so AI assistants can work with your content.',
      ],
    },
    admin: {
      eyebrow: 'The admin',
      title: 'An admin your editors will actually like.',
      text: 'Generated from your config, in light and dark, English and Thai. Nothing to design or host.',
      tabs: ['Dashboard', 'Editing a post', 'Translations', 'Media'],
      alts: ['The Easy CMS admin dashboard', 'Editing a post in the admin', 'Translation status in the posts list', 'The media library'],
      note: 'Switch the site theme to see the admin in light or dark',
    },
    blog: {
      eyebrow: 'From the blog',
      title: 'Latest releases and guides',
      all: 'All posts',
      note: null,
      empty: 'No posts yet. Publish one at `/admin`, or run `pnpm seed`.',
    },
    final: {
      title: 'Ship content with the code that renders it.',
      text: 'Scaffold a Next.js or Nuxt project with Easy CMS in about a minute. It is MIT licensed and runs on your own infrastructure.',
      guide: 'Read the guide',
      source: 'View source',
    },
    copy: 'Copy',
    copied: 'Copied',
  },

  th: {
    meta: {
      title: 'Easy CMS: headless CMS ที่ฝังอยู่ในแอป Next.js และ Nuxt ของคุณ',
      description:
        'Easy CMS รันอยู่ในแอป Next.js หรือ Nuxt ของคุณ กำหนดเนื้อหาด้วย TypeScript แล้วได้หน้า admin, Local API ที่มี type และ REST บน deployment เดียวกับฐานข้อมูลของคุณเอง',
    },
    docs: '/th/docs',
    hero: {
      title: 'CMS ที่ทีมไทย',
      accent: 'ใช้ได้ทั้งทีม',
      lede: 'หน้า admin ภาษาไทยครบทุกหน้าจอ เอกสารภาษาไทยทุกหน้า บทบาท, SSO และ audit log ฟรีภายใต้ MIT ติดตั้งในแอป Next.js หรือ Nuxt แล้วรันบน server และฐานข้อมูลของคุณเอง ไม่มีค่าใช้จ่ายต่อที่นั่ง',
      start: 'เริ่มใช้งาน',
      star: 'กดดาวบน GitHub',
      meta: ['ฟรีทุกฟีเจอร์ (MIT)', 'admin และเอกสารภาษาไทยครบ', 'Next.js 15+ · Nuxt'],
    },
    stackLabel: 'ใช้ร่วมกับ',
    why: {
      eyebrow: 'ฝังในแอป ไม่ใช่บริการแยก',
      title: 'ไม่ต้องมี server ตัวที่สองให้ดูแล จ่ายเงิน หรือคอย sync',
      text: 'headless CMS ทั่วไปเป็นอีกบริการหนึ่งที่มีฐานข้อมูลและ API key ของตัวเอง Easy CMS เป็นแพ็กเกจ npm ที่แอปของคุณติดตั้งเข้าไป เนื้อหาจึงไปพร้อมกับโค้ดที่แสดงผลมัน',
      hosted: {
        tag: 'headless CMS แบบบริการแยก',
        title: 'สองแอป สองฐานข้อมูล',
        app: 'แอป Next.js ของคุณ',
        link: 'HTTPS · API token · จำกัดจำนวนครั้ง',
        service: 'บริการ CMS',
        serviceNote: 'deploy แยก',
        db: 'ฐานข้อมูล CMS',
        dbNote: 'ไม่ใช่ของคุณ',
        points: ['schema อยู่ในหน้าเว็บ ไม่ได้อยู่ใน repo', 'ต้องสร้าง type แยกอีกขั้น', 'ทุกหน้าต้องเรียกข้ามเครือข่าย'],
      },
      ours: {
        title: 'แอปเดียว ฐานข้อมูลเดียว',
        app: 'แอป Next.js ของคุณ',
        link: 'เรียกในโปรเซสเดียวกัน · ไม่ผ่านเครือข่าย',
        db: 'ฐานข้อมูลของคุณ',
        dbNote: 'Postgres หรือ SQLite · ใช้แค่ตาราง `ecms_`',
        points: ['โครงสร้างเนื้อหาอยู่ใน `easy-cms.config.ts` และ review ใน PR ได้', 'type มาจาก config โดยตรง ไม่ต้อง build', 'deploy ได้ทุกที่ที่แอปของคุณรันอยู่แล้ว'],
      },
    },
    code: {
      eyebrow: 'Code-first',
      title: 'สามไฟล์ แอปของคุณก็มี CMS',
      text: 'กำหนด collection และ field ด้วย TypeScript ฟอร์มใน admin การตรวจข้อมูล สิทธิ์การเข้าถึง และ API ที่มี type ถูกสร้างจากไฟล์เดียวนี้',
      steps: [
        ['กำหนดเนื้อหา', 'collection, field, ฉบับร่าง และภาษา ใน `easy-cms.config.ts`'],
        ['ติดตั้งหน้า admin และ API', 'route handler สองตัวให้บริการ `/admin` และ `/api/cms`'],
        ['อ่านใน Server Component', '`getEasyCMS()` คืนเอกสารที่มี type ตาม config ของคุณ'],
      ],
      comments: {
        routes: 'config ของ Next ของคุณ',
        page: 'post.title: string ได้ type จาก config ของคุณ',
        hero: 'docs: Post[] ได้ type จาก config ของคุณ',
      },
    },
    features: {
      eyebrow: 'มีให้ในตัว',
      title: 'สิ่งที่ editor ต้องการ และสิ่งที่นักพัฒนา review ได้',
      items: [
        ['history', 'ฉบับร่างและประวัติเวอร์ชัน', 'แก้บทความที่เผยแพร่แล้วได้โดยหน้าเว็บจริงไม่เปลี่ยน เทียบเวอร์ชันและกู้คืนเวอร์ชันใดก็ได้'],
        ['preview', 'ตัวอย่างสด', 'หน้าเว็บจริงแสดงข้างฟอร์ม และเปลี่ยนตามที่ editor พิมพ์ ก่อนจะเผยแพร่'],
        ['language', 'เนื้อหาหลายภาษา', 'แต่ละภาษามีค่าของตัวเอง และทุกรายการบอกสถานะการแปล หน้า admin ใช้ได้ทั้งไทยและอังกฤษ'],
        ['lock', 'บทบาทและ single sign-on', 'ติ๊กว่าแต่ละบทบาททำอะไรได้ใน admin ลงไปถึงระดับ field และ login ด้วย Google, Microsoft หรือ GitHub'],
        ['media', 'คลังไฟล์ที่มีโฟลเดอร์', 'โฟลเดอร์ อัปโหลดหลายไฟล์พร้อมกัน ไฟล์ส่วนตัวพร้อมลิงก์ที่มีลายเซ็น และเก็บไฟล์บน S3, R2 หรือ Vercel Blob'],
        ['shield', 'Audit log และการสำรองข้อมูล', 'บันทึกที่มีลายเซ็นว่าใครแก้อะไร และสำรองฐานข้อมูลได้เองหรือตั้งเวลาจากหน้า admin'],
        ['calendar', 'ตั้งเวลาเผยแพร่', 'เผยแพร่หรือยกเลิกตามเวลาที่ตั้ง งานที่ถึงเวลารันทุกนาทีบน server ที่คุณมีอยู่แล้ว'],
        ['seo', 'SEO พร้อมใช้', 'sitemap, hreflang, JSON-LD และ llms.txt จากเนื้อหาที่มีอยู่แล้ว'],
        ['chip', 'API ที่มี type, REST และ GraphQL', 'Local API ที่มี type ในโค้ดฝั่ง server, REST สำหรับ client ทุกแบบ และ GraphQL กับ MCP เป็น plugin'],
      ],
    },
    performance: {
      eyebrow: 'วัดผลที่ขนาดใหญ่',
      title: 'ยังเร็วที่ล้านเอกสาร',
      text: 'ทุกคืนมี load test รัน Easy CMS กับบทความ 1,000,000 รายการ เวลาด้านล่างเป็น p95: 95% ของ request เสร็จเร็วกว่านี้',
      stats: [
        ['1,000,000', '', 'บทความใน collection เดียว'],
        ['27', 'ms', 'อ่านบทความตาม id หรือ slug'],
        ['37', 'ms', 'หน้าถัดไปด้วย cursor ลึกแค่ไหนก็ได้'],
        ['79', 'ms', 'ค้นข้อความภาษาไทยด้วย trigram index'],
      ],
      setup: 'Easy CMS 1.15 · มัธยฐานของ 3 รอบ · Postgres 17 · GitHub runner 4 core · request พร้อมกัน 20 · 28 ต.ค. 2026',
      limits: 'ยังไม่ได้เร็วทุกอย่าง: เปิดหน้าตามเลขหน้าลึกๆ ใช้เวลาหลายวินาที (ใช้ `cursor` แทน) และ query ภายในบล็อกก็เช่นกัน ผลทั้งหมดบอกไว้ครบ',
      link: 'ดูผลทั้งหมดและวิธีวัด',
      page: 'databases#at-1-000-000-posts',
    },
    plugins: {
      eyebrow: 'Plugin ทางการ',
      title: 'เพิ่มฟีเจอร์ด้วยบรรทัดเดียวใน `plugins`',
      text: 'แต่ละ plugin เพิ่ม collection หน้า admin และ API route ของตัวเอง พร้อม migration และเขียน plugin เองได้ด้วย hook ชุดเดียวกัน',
      browse: 'ดู plugin ทั้งหมด',
      items: [
        'field สำหรับ meta, sitemap, hreflang และ JSON-LD',
        'editor สร้างฟอร์มเอง ข้อมูลที่ส่งมาถูกตรวจ เก็บ และ export เป็น CSV ได้',
        'redirect แบบ 301 ถึง 308 สร้างให้อัตโนมัติเมื่อหน้าเปลี่ยนที่อยู่',
        'หน้าย่อยในหน้า พร้อม path และ breadcrumb แยกตามภาษา',
        'หลายเว็บหรือหลายลูกค้าใน CMS เดียว แต่ละแห่งมีสมาชิกและเนื้อหาของตัวเอง',
        'สินค้า ตะกร้า และชำระเงินด้วย Stripe, PromptPay หรือโอนเงิน',
        'GraphQL API ที่ใช้สิทธิ์การเข้าถึงเดียวกับ REST',
        'MCP server ให้ผู้ช่วย AI ทำงานกับเนื้อหาของคุณ',
      ],
    },
    admin: {
      eyebrow: 'หน้า admin',
      title: 'หน้า admin ที่ editor ของคุณจะชอบใช้',
      text: 'สร้างจาก config ของคุณ มีทั้งธีมสว่างและมืด ภาษาไทยและอังกฤษ ไม่ต้องออกแบบหรือ host เอง',
      tabs: ['แดชบอร์ด', 'แก้บทความ', 'การแปล', 'คลังไฟล์'],
      alts: ['แดชบอร์ดของ Easy CMS', 'การแก้บทความในหน้า admin', 'สถานะการแปลในรายการบทความ', 'คลังไฟล์'],
      note: 'สลับธีมของเว็บเพื่อดูหน้า admin แบบสว่างหรือมืด',
    },
    blog: {
      eyebrow: 'จากบล็อก',
      title: 'บทความและคู่มือล่าสุด',
      all: 'บทความทั้งหมด',
      note: null,
      empty: 'ยังไม่มีบทความ เผยแพร่ได้ที่ `/admin` หรือรัน `pnpm seed`',
    },
    final: {
      title: 'ส่งเนื้อหาไปพร้อมกับโค้ดที่แสดงผลมัน',
      text: 'สร้างโปรเจกต์ Next.js หรือ Nuxt พร้อม Easy CMS ได้ในราวหนึ่งนาที ใช้สัญญาอนุญาต MIT และรันบนโครงสร้างของคุณเอง',
      guide: 'อ่านคู่มือ',
      source: 'ดูซอร์สโค้ด',
    },
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
  },
}
