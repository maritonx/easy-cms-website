/**
 * The home page's words in English and Thai. Text in `backticks` is shown as code
 * (components/home/home-page.tsx). Code samples stay in English, apart from their comments.
 */
export type Locale = 'en' | 'th'

type Item = readonly [string, string]

/** A compare cell: how well the product answers the row. */
export type Mark = 'yes' | 'part' | 'no' | 'unknown'
export type CompareRow = { title: string; sub: string; cells: readonly (readonly [Mark, string])[] }

/** The compare table's columns; facts from lib/why/compare.ts, checked on its CHECKED date. */
export const COMPARED = ['Easy CMS', 'Payload', 'Strapi', 'Directus', 'WordPress'] as const

export type HomeCopy = {
  meta: { title: string; description: string }
  docs: string
  hero: { title: string; accent: string; lede: string; start: string; star: string; meta: readonly string[] }
  stack: {
    label: string
    /** Under the logos: what each number is. */
    downloads: string
    releases: string
    tests: string
    paywall: string
    source: string
  }
  code: {
    eyebrow: string
    title: string
    text: string
    steps: readonly [Item, Item, Item]
    comments: { routes: string; page: string; hero: string }
  }
  admin: {
    eyebrow: string
    title: string
    accent: string
    text: string
    /** Screen, title, one line, the callout on the screen. */
    items: readonly (readonly [string, string, string, string])[]
    language: string
    larger: string
    close: string
  }
  runtimes: {
    eyebrow: string
    title: string
    text: string
    /** Key, title, what it uses (also the code card's caption), the guide's docs page. */
    options: readonly (readonly [string, string, string, string])[]
    comments: Record<string, string>
    guide: string
    tested: string
    testedMore: string
  }
  backend: {
    eyebrow: string
    title: string
    text: string
    /** Group, its line, and its items: icon, title, text, docs page. */
    groups: readonly (readonly [string, string, readonly (readonly [string, string, string, string])[]])[]
  }
  compare: {
    eyebrow: string
    title: string
    accent: string
    text: string
    caption: string
    pick: string
    marks: Record<Mark, string>
    rows: readonly CompareRow[]
    tally: string
    tallyMore: string
    note: string
    link: string
  }
  ai: {
    eyebrow: string
    title: string
    text: string
    worksWith: string
    open: string
    you: string
    prompt: string
    added: string
    replay: string
  }
  levels: {
    eyebrow: string
    title: string
    /** From the roadmap's data: how many levels are complete, of how many. */
    text: (complete: number, total: number) => string
    level: string
    complete: string
    next: string
    progress: string
    link: string
  }
  proven: {
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
  faq: { eyebrow: string; title: string; text: string; ask: string; items: readonly Item[] }
  final: { title: string; text: string; guide: string; source: string }
  copy: string
  copied: string
}

export const HOME_COPY: Record<Locale, HomeCopy> = {
  en: {
    meta: {
      title: 'Easy CMS: one TypeScript file, a whole backend',
      description:
        'Define data, access and logic in one TypeScript config. Easy CMS gives you a database, a typed API and REST, sign-in, files, jobs and an admin your clients can use. MIT licensed.',
    },
    docs: '/docs',
    hero: {
      title: 'One TypeScript file.',
      accent: 'A whole backend.',
      lede: 'Define data, access and logic in `easy-cms.config.ts`. You get a database, a typed API and REST, sign-in, files, jobs and an admin at `/admin`.',
      start: 'Get started',
      star: 'Star on GitHub',
      meta: ['MIT licensed', 'Next.js · Nuxt · Standalone', 'Admin in English & ไทย'],
    },
    stack: {
      label: 'Runs with',
      downloads: 'npm downloads last week',
      releases: 'releases since 1.0 on 17 Oct',
      tests: 'tests on every pull request',
      paywall: 'features behind a paywall',
      source: 'easycms.dev runs on Easy CMS. Read its source',
    },
    code: {
      eyebrow: 'Code-first',
      title: 'Three files and your app has a backend.',
      text: 'Describe collections and fields in TypeScript. The admin forms, validation, access rules and the typed API are built from that one file.',
      steps: [
        ['Define your content', 'Collections, fields, drafts and locales in `easy-cms.config.ts`.'],
        ['Mount the admin and API', 'Two route handlers serve `/admin` and `/api/cms`.'],
        ['Read it in a Server Component', '`getEasyCMS()` returns documents typed from your config.'],
      ],
      comments: {
        routes: 'your Next config',
        page: 'post.title: string, typed from your config',
        hero: 'bookings: admin, REST, typed API and jobs from here',
      },
    },
    admin: {
      eyebrow: 'The admin',
      title: 'Generated from your config.',
      accent: 'Ready for your clients.',
      text: 'Your clients edit and preview content, give people roles and see who changed what, with AI that writes alt text and translations, and integrations they connect themselves. In English or Thai.',
      items: [
        ['ai', 'AI writes, people check', 'Alt text, SEO titles and translations go into the form with Undo beside them.', '✦ Written by AI · Undo'],
        ['integrations', 'Integrations your clients connect', 'Claude, GPT, Gemini, LINE, Facebook, Telegram and Resend, keys encrypted in your database.', '✓ Anthropic connected'],
        ['preview', 'Live preview', 'The real page sits beside the form and changes as people type.', '● Updating as you type'],
        ['roles', 'Roles down to fields', 'Tick what each role may read, create, change and delete.', '✓ Field rules saved'],
        ['audit', 'Audit log', 'Who changed what and when, signed so tampering shows.', '✓ Chain verified'],
        ['backups', 'Backups', 'Scheduled to S3 or Google Drive, restored in a click.', '✓ Backup finished'],
      ],
      language: 'Admin language',
      larger: 'See this screen larger',
      close: 'Close',
    },
    runtimes: {
      eyebrow: 'Multi-runtime',
      title: 'Pick where it runs.',
      text: 'The same config runs on a single VPS, on Vercel, at the edge on Cloudflare Workers or across many containers. Choose by the job.',
      options: [
        ['vps', 'A company site on one VPS', 'SQLite and the disk · Node.js or Bun', 'deploy/vps'],
        ['vercel', 'A Next.js app on Vercel', 'Neon or Turso · Vercel Blob', 'deploy/vercel'],
        ['workers', 'An API at the edge', 'Turso and Cloudflare R2 · Workers', 'deploy/cloudflare-workers'],
        ['docker', 'A system for a whole organisation', 'Postgres and S3 · many containers', 'deploy/docker'],
        ['deno', 'A small server on Deno', 'SQLite · Deno 2', 'standalone#bun-and-deno'],
      ],
      comments: {
        vps: 'one process; jobs run every minute by themselves',
        vercel: 'a Vercel cron calls /api/cms/jobs/run',
        workers: 'Cron Triggers run the jobs every minute',
        docker: 'sessions, limits and jobs are shared through Postgres',
        deno: 'the same CLI, run by Deno',
      },
      guide: 'Read the guide',
      tested: 'Tested on every pull request',
      testedMore: 'plus PgBouncer and upgrades from 0.10',
    },
    backend: {
      eyebrow: 'One backend',
      title: 'Everything an app needs, from one config file.',
      text: 'A CMS stores content. Most apps also need sign-in, permissions, files, background work and an API. Easy CMS ships them in one MIT package, on your own database.',
      groups: [
        ['People', 'Who signs in and what they may do', [
          ['key', 'Sign-in for staff and members', 'Passwords, Google, Microsoft, GitHub or any OpenID Connect provider, set in code or the admin.', 'auth'],
          ['shield', 'Roles down to fields', 'Tick what each role may read, create, change and delete, field by field, with an audit log.', 'roles'],
          ['layout', 'An admin your clients use', 'Generated from the config, in English and Thai, light and dark. Nothing to design.', 'admin'],
        ]],
        ['Data', 'Where it lives and how you read it', [
          ['db', 'Your database, real tables', 'SQLite, Turso or Postgres. Schema changes become migrations you commit and review.', 'databases'],
          ['media', 'Files and media', 'On disk, S3, Cloudflare R2 or Vercel Blob. Image sizes, folders and signed links for private files.', 'uploads'],
          ['api', 'REST, GraphQL and a typed API', 'REST for any client, `cms.find()` typed from your config in server code.', 'rest-api'],
        ]],
        ['Logic', 'What runs when something happens', [
          ['clock', 'Jobs, webhooks and email', 'A queue in your own database with retries and schedules. Nothing else to host.', 'jobs'],
          ['bolt', 'Actions that run your code', 'Buttons on a document, a row or many rows that run server code you write.', 'actions'],
          ['spark', 'AI and agents', 'Claude, GPT or Gemini for alt text and translation; an MCP server for agents (preview).', 'ai'],
        ]],
      ],
    },
    compare: {
      eyebrow: 'Compare',
      title: 'Others make you choose.',
      accent: 'Easy CMS doesn’t.',
      text: 'Team features without an enterprise plan, a schema you review in pull requests, and no second server to run. Four things developers ask for, checked against each product’s own site.',
      caption: 'Easy CMS next to Payload, Strapi, Directus and WordPress',
      pick: 'Our pick',
      marks: { yes: 'Yes', part: 'Partly', no: 'No', unknown: 'Not confirmed' },
      rows: [
        { title: 'SSO, roles and an audit log, free', sub: 'What teams pay for first.', cells: [
          ['yes', 'MIT, every feature'], ['no', 'SSO is an Enterprise plan'], ['no', 'SSO and audit logs are Enterprise'],
          ['no', 'No SSO in the free Core'], ['unknown', 'Not confirmed'],
        ] },
        { title: 'No second server to run', sub: 'One deploy, one thing to secure.', cells: [
          ['yes', 'Inside Next.js or Nuxt, or standalone'], ['part', 'Inside Next.js only'], ['no', 'A separate Node server'],
          ['no', 'A separate Node server'], ['no', 'A separate PHP app'],
        ] },
        { title: 'The schema is typed code', sub: 'Reviewed in pull requests, typed in your app.', cells: [
          ['yes', 'TypeScript config in your repo'], ['yes', 'TypeScript config in your repo'], ['part', 'Built in the admin, saved as files'],
          ['part', 'Built in the studio, YAML snapshots'], ['no', 'PHP post types or plugins'],
        ] },
        { title: 'Admin and docs in Thai', sub: 'For Thai editors and the people who pay you.', cells: [
          ['yes', 'Every admin string and docs page'], ['part', 'Admin near-complete'], ['part', 'About a quarter of the admin'],
          ['part', 'Partial, by the community'], ['part', 'About two-thirds of the admin'],
        ] },
      ],
      tally: 'Easy CMS: 4 of 4.',
      tallyMore: 'No other product here gets more than one.',
      note: 'Checked against each product’s own site on 17 Oct 2026. The full comparison also says when another product is the better choice.',
      link: 'See the full comparison',
    },
    ai: {
      eyebrow: 'AI-ready',
      title: 'Your AI assistant can write it.',
      text: 'The config is typed TypeScript and the docs ship as `llms.txt`, so Claude Code, Cursor or Copilot write collections, access rules and hooks that compile. Agents reach the data through MCP, under the same roles as people.',
      worksWith: 'Works with',
      open: 'Open llms.txt',
      you: 'You',
      prompt: 'Add a bookings collection: customer, service, start time and status. Front desk can create and change bookings; only admins delete them.',
      added: '+ 14 lines',
      replay: 'Replay',
    },
    levels: {
      eyebrow: 'Roadmap',
      title: 'Six levels from CMS to AI-native backend.',
      text: (complete, total) =>
        `${complete === 1 ? 'One level is' : `${complete} levels are`} complete and ${total - complete} have parts shipped. Each one says what works today and what is still to build.`,
      level: 'Level',
      complete: 'Complete',
      next: 'Building next',
      progress: 'In progress',
      link: 'See the roadmap',
    },
    proven: {
      eyebrow: 'Proven in production',
      title: 'Fast at a million documents. Stable since 1.0.',
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
    faq: {
      eyebrow: 'Questions',
      title: 'Before you pick a backend.',
      text: 'What developers ask before they bet a project on Easy CMS. Anything else,',
      ask: 'ask in GitHub Discussions',
      items: [
        ['Is it ready for production?', '1.0 shipped on 17 October 2026 and releases follow semantic versioning: a breaking change waits for a major version and comes with an upgrade guide. A load test runs every night against a million posts.'],
        ['Which databases and runtimes does it support?', 'SQLite, Turso and Postgres. It runs inside Next.js or Nuxt, or as its own server on Node.js, Bun, Deno or Cloudflare Workers.'],
        ['Is it really free? What is the catch?', 'Every feature is MIT licensed, including single sign-on, field permissions, the audit log and backups. There is no paid edition. You run it on your own infrastructure.'],
        ['Do I need Next.js or Nuxt?', 'No. `easy-cms serve` runs it as its own server, with REST and an optional GraphQL API for a Vite, React, Vue or static frontend.'],
        ['Can I move from Payload or Strapi?', 'There is no import tool yet. Collections are TypeScript, so they map across field by field, and a script can load the data with `cms.create()`.'],
        ['Who maintains it, and what if it stops?', 'Easy CMS is an independent open-source project built in the open on GitHub. Your data is in ordinary tables in your own database and the code is MIT, so you can fork it or read the data without Easy CMS.'],
      ],
    },
    final: {
      title: 'Build the backend once. Ship any app on it.',
      text: 'Scaffold a project with Easy CMS in about a minute. It is MIT licensed and runs on your own infrastructure.',
      guide: 'Get started',
      source: 'Star on GitHub',
    },
    copy: 'Copy',
    copied: 'Copied',
  },
  th: {
    meta: {
      title: 'Easy CMS: ไฟล์ TypeScript เดียว ได้ backend ครบ',
      description:
        'กำหนดข้อมูล สิทธิ์ และ logic ใน config TypeScript ไฟล์เดียว Easy CMS ให้ฐานข้อมูล API ที่มี type และ REST การล็อกอิน ไฟล์ งานเบื้องหลัง และหน้า admin ที่ลูกค้าใช้ได้เอง เป็น MIT',
    },
    docs: '/th/docs',
    hero: {
      title: 'ไฟล์ TypeScript เดียว',
      accent: 'ได้ backend ครบ',
      lede: 'กำหนดข้อมูล สิทธิ์ และ logic ใน `easy-cms.config.ts` แล้วได้ฐานข้อมูล API ที่มี type และ REST การล็อกอิน ไฟล์ งานเบื้องหลัง และหน้า admin ที่ `/admin`',
      start: 'เริ่มใช้งาน',
      star: 'ให้ดาวบน GitHub',
      meta: ['MIT license', 'Next.js · Nuxt · Standalone', 'Admin ภาษาไทยและอังกฤษ'],
    },
    stack: {
      label: 'ใช้ได้กับ',
      downloads: 'ดาวน์โหลดจาก npm สัปดาห์ที่แล้ว',
      releases: 'release ตั้งแต่ 1.0 เมื่อ 17 ต.ค.',
      tests: 'test ที่รันทุก pull request',
      paywall: 'ฟีเจอร์ที่ต้องจ่ายเงิน',
      source: 'easycms.dev สร้างด้วย Easy CMS ดูซอร์สโค้ดได้',
    },
    code: {
      eyebrow: 'เขียนด้วยโค้ด',
      title: 'สามไฟล์ แอปของคุณก็มี backend',
      text: 'กำหนด collection และ field ด้วย TypeScript แล้วฟอร์มใน admin การตรวจข้อมูล กฎสิทธิ์ และ API ที่มี type จะสร้างจากไฟล์นั้นไฟล์เดียว',
      steps: [
        ['กำหนดเนื้อหา', 'collection, field, ฉบับร่าง และภาษา ใน `easy-cms.config.ts`'],
        ['ติดตั้ง admin และ API', 'route handler สองตัวให้บริการ `/admin` และ `/api/cms`'],
        ['อ่านใน Server Component', '`getEasyCMS()` คืนเอกสารที่มี type ตาม config ของคุณ'],
      ],
      comments: {
        routes: 'config ของ Next',
        page: 'post.title: string มี type จาก config',
        hero: 'bookings: ได้ admin, REST, API ที่มี type และงานเบื้องหลังจากตรงนี้',
      },
    },
    admin: {
      eyebrow: 'หน้า admin',
      title: 'สร้างจาก config ของคุณ',
      accent: 'พร้อมให้ลูกค้าใช้',
      text: 'ลูกค้าแก้และดูตัวอย่างเนื้อหาได้เอง กำหนดบทบาทให้คนในทีม ดูได้ว่าใครแก้อะไร มี AI ช่วยเขียน alt text และแปลภาษา และเชื่อมบริการต่างๆ ได้เอง ทั้งภาษาไทยและอังกฤษ',
      items: [
        ['ai', 'AI เขียน คนตรวจ', 'alt text, SEO title และคำแปลใส่ลงฟอร์มให้ พร้อมปุ่ม Undo ข้างๆ', '✦ เขียนโดย AI · ย้อนกลับได้'],
        ['integrations', 'ลูกค้าเชื่อมบริการได้เอง', 'Claude, GPT, Gemini, LINE, Facebook, Telegram และ Resend เก็บ key แบบเข้ารหัสในฐานข้อมูลของคุณ', '✓ เชื่อม Anthropic แล้ว'],
        ['preview', 'Live preview', 'หน้าเว็บจริงอยู่ข้างฟอร์ม และเปลี่ยนตามที่พิมพ์', '● อัปเดตตามที่พิมพ์'],
        ['roles', 'บทบาทลงถึง field', 'ติ๊กว่าแต่ละบทบาทอ่าน สร้าง แก้ และลบอะไรได้', '✓ บันทึกสิทธิ์แล้ว'],
        ['audit', 'Audit log', 'ใครแก้อะไรเมื่อไร ลงลายเซ็นไว้ ถ้ามีคนแก้ประวัติจะรู้ทันที', '✓ ตรวจสอบแล้ว'],
        ['backups', 'Backup', 'ตั้งเวลาไป S3 หรือ Google Drive กู้คืนได้ในคลิกเดียว', '✓ Backup เสร็จแล้ว'],
      ],
      language: 'ภาษาของหน้า admin',
      larger: 'ดูหน้าจอนี้แบบใหญ่',
      close: 'ปิด',
    },
    runtimes: {
      eyebrow: 'หลาย runtime',
      title: 'เลือกได้ว่าจะรันที่ไหน',
      text: 'config เดียวกันรันได้ทั้งบน VPS เครื่องเดียว บน Vercel ที่ edge บน Cloudflare Workers หรือกระจายหลาย container เลือกตามงาน',
      options: [
        ['vps', 'เว็บบริษัทบน VPS เครื่องเดียว', 'SQLite และดิสก์ · Node.js หรือ Bun', 'deploy/vps'],
        ['vercel', 'แอป Next.js บน Vercel', 'Neon หรือ Turso · Vercel Blob', 'deploy/vercel'],
        ['workers', 'API ที่ edge', 'Turso และ Cloudflare R2 · Workers', 'deploy/cloudflare-workers'],
        ['docker', 'ระบบสำหรับทั้งองค์กร', 'Postgres และ S3 · หลาย container', 'deploy/docker'],
        ['deno', 'server เล็กๆ บน Deno', 'SQLite · Deno 2', 'standalone#bun-and-deno'],
      ],
      comments: {
        vps: 'process เดียว งานเบื้องหลังรันเองทุกนาที',
        vercel: 'Vercel cron เรียก /api/cms/jobs/run',
        workers: 'Cron Triggers รันงานทุกนาที',
        docker: 'session, limit และงานใช้ร่วมกันผ่าน Postgres',
        deno: 'CLI ตัวเดิม รันด้วย Deno',
      },
      guide: 'อ่านคู่มือ',
      tested: 'ทดสอบทุก pull request',
      testedMore: 'รวมถึง PgBouncer และการอัปเกรดจาก 0.10',
    },
    backend: {
      eyebrow: 'backend เดียว',
      title: 'ทุกอย่างที่แอปต้องมี จาก config ไฟล์เดียว',
      text: 'CMS เก็บเนื้อหา แต่แอปส่วนใหญ่ยังต้องมีการล็อกอิน สิทธิ์ ไฟล์ งานเบื้องหลัง และ API Easy CMS มีให้ครบใน package เดียวที่เป็น MIT บนฐานข้อมูลของคุณเอง',
      groups: [
        ['ผู้ใช้', 'ใครล็อกอินได้ และทำอะไรได้บ้าง', [
          ['key', 'ล็อกอินสำหรับทีมงานและสมาชิก', 'รหัสผ่าน Google, Microsoft, GitHub หรือ OpenID Connect เจ้าไหนก็ได้ ตั้งในโค้ดหรือใน admin', 'auth'],
          ['shield', 'บทบาทลงถึง field', 'ติ๊กว่าแต่ละบทบาทอ่าน สร้าง แก้ และลบอะไรได้ ทีละ field พร้อม audit log', 'roles'],
          ['layout', 'หน้า admin ที่ลูกค้าใช้ได้', 'สร้างจาก config ทั้งภาษาไทยและอังกฤษ โหมดสว่างและมืด ไม่ต้องออกแบบเอง', 'admin'],
        ]],
        ['ข้อมูล', 'เก็บที่ไหน และอ่านอย่างไร', [
          ['db', 'ฐานข้อมูลของคุณ ตารางจริง', 'SQLite, Turso หรือ Postgres การเปลี่ยน schema กลายเป็น migration ที่ commit และ review ได้', 'databases'],
          ['media', 'ไฟล์และสื่อ', 'บนดิสก์ S3, Cloudflare R2 หรือ Vercel Blob มีขนาดรูป โฟลเดอร์ และลิงก์แบบเซ็นสำหรับไฟล์ส่วนตัว', 'uploads'],
          ['api', 'REST, GraphQL และ API ที่มี type', 'REST สำหรับ client ใดก็ได้ และ `cms.find()` ที่มี type จาก config ในโค้ดฝั่ง server', 'rest-api'],
        ]],
        ['Logic', 'อะไรทำงานเมื่อมีเหตุการณ์', [
          ['clock', 'งานเบื้องหลัง webhook และอีเมล', 'คิวงานในฐานข้อมูลของคุณ ลองใหม่และตั้งเวลาได้ ไม่ต้อง host อะไรเพิ่ม', 'jobs'],
          ['bolt', 'Action ที่รันโค้ดของคุณ', 'ปุ่มบนเอกสาร แถวเดียว หรือหลายแถว ที่รันโค้ดฝั่ง server ที่คุณเขียน', 'actions'],
          ['spark', 'AI และ agent', 'Claude, GPT หรือ Gemini เขียน alt text และแปลภาษา พร้อม MCP server สำหรับ agent (preview)', 'ai'],
        ]],
      ],
    },
    compare: {
      eyebrow: 'เปรียบเทียบ',
      title: 'เจ้าอื่นให้คุณเลือกอย่างใดอย่างหนึ่ง',
      accent: 'Easy CMS ให้ครบ',
      text: 'ฟีเจอร์สำหรับทีมโดยไม่ต้องซื้อแพ็กเกจ enterprise schema ที่ review ใน pull request ได้ และไม่ต้องดูแล server ตัวที่สอง สี่เรื่องที่นักพัฒนาถาม ตรวจจากเว็บของแต่ละผลิตภัณฑ์เอง',
      caption: 'Easy CMS เทียบกับ Payload, Strapi, Directus และ WordPress',
      pick: 'ตัวเลือกของเรา',
      marks: { yes: 'ได้', part: 'ได้บางส่วน', no: 'ไม่ได้', unknown: 'ยังยืนยันไม่ได้' },
      rows: [
        { title: 'SSO บทบาท และ audit log ฟรี', sub: 'สิ่งแรกที่ทีมต้องจ่ายเงิน', cells: [
          ['yes', 'MIT ทุกฟีเจอร์'], ['no', 'SSO อยู่ในแพ็กเกจ Enterprise'], ['no', 'SSO และ audit log อยู่ใน Enterprise'],
          ['no', 'Core ที่ฟรีไม่มี SSO'], ['unknown', 'ยังยืนยันไม่ได้'],
        ] },
        { title: 'ไม่ต้องรัน server ตัวที่สอง', sub: 'deploy ครั้งเดียว ดูแลความปลอดภัยที่เดียว', cells: [
          ['yes', 'ใน Next.js หรือ Nuxt หรือแยกเป็น standalone'], ['part', 'ใน Next.js เท่านั้น'], ['no', 'server Node แยก'],
          ['no', 'server Node แยก'], ['no', 'แอป PHP แยก'],
        ] },
        { title: 'schema เป็นโค้ดที่มี type', sub: 'review ใน pull request และมี type ในแอป', cells: [
          ['yes', 'config TypeScript ใน repo ของคุณ'], ['yes', 'config TypeScript ใน repo ของคุณ'], ['part', 'สร้างใน admin บันทึกเป็นไฟล์'],
          ['part', 'สร้างใน studio มี YAML snapshot'], ['no', 'post type ด้วย PHP หรือ plugin'],
        ] },
        { title: 'หน้า admin และ docs ภาษาไทย', sub: 'สำหรับ editor และลูกค้าคนไทย', cells: [
          ['yes', 'ทุกข้อความใน admin และ docs ทุกหน้า'], ['part', 'admin เกือบครบ'], ['part', 'ราวหนึ่งในสี่ของ admin'],
          ['part', 'บางส่วน ชุมชนแปล'], ['part', 'ราวสองในสามของ admin'],
        ] },
      ],
      tally: 'Easy CMS: 4 จาก 4',
      tallyMore: 'ไม่มีผลิตภัณฑ์อื่นในตารางนี้ได้เกินหนึ่งข้อ',
      note: 'ตรวจจากเว็บของแต่ละผลิตภัณฑ์เมื่อ 17 ต.ค. 2026 หน้าเปรียบเทียบเต็มบอกด้วยว่าเมื่อไรควรเลือกเจ้าอื่น',
      link: 'ดูการเปรียบเทียบทั้งหมด',
    },
    ai: {
      eyebrow: 'พร้อมสำหรับ AI',
      title: 'ผู้ช่วย AI ของคุณเขียนให้ได้',
      text: 'config เป็น TypeScript ที่มี type และ docs มีเป็น `llms.txt` Claude Code, Cursor หรือ Copilot จึงเขียน collection กฎสิทธิ์ และ hook ที่ compile ผ่าน ส่วน agent เข้าถึงข้อมูลผ่าน MCP ภายใต้บทบาทเดียวกับคน',
      worksWith: 'ใช้ได้กับ',
      open: 'เปิด llms.txt',
      you: 'คุณ',
      prompt: 'เพิ่ม collection bookings มีลูกค้า บริการ เวลาเริ่ม และสถานะ ให้หน้าเคาน์เตอร์สร้างและแก้การจองได้ แต่ลบได้เฉพาะ admin',
      added: '+ 14 บรรทัด',
      replay: 'เล่นอีกครั้ง',
    },
    levels: {
      eyebrow: 'Roadmap',
      title: 'หกระดับ จาก CMS สู่ backend ที่ทำงานกับ AI',
      text: (complete, total) =>
        `เสร็จแล้ว ${complete} ระดับ อีก ${total - complete} ระดับมีบางส่วนที่ใช้ได้แล้ว แต่ละระดับบอกว่าอะไรใช้ได้วันนี้ และอะไรยังต้องสร้าง`,
      level: 'ระดับ',
      complete: 'เสร็จแล้ว',
      next: 'กำลังสร้าง',
      progress: 'กำลังทำ',
      link: 'ดู roadmap',
    },
    proven: {
      eyebrow: 'พิสูจน์แล้วบน production',
      title: 'เร็วแม้มีเอกสารล้านรายการ เสถียรตั้งแต่ 1.0',
      text: 'ทุกคืนมี load test รัน Easy CMS กับโพสต์ 1,000,000 รายการ เวลาที่แสดงเป็น p95 คือ 95% ของ request เสร็จเร็วกว่านี้',
      stats: [
        ['1,000,000', '', 'โพสต์ใน collection เดียว'],
        ['27', 'ms', 'โพสต์หนึ่งรายการจาก id หรือ slug'],
        ['37', 'ms', 'หน้าถัดไปด้วย cursor ลึกแค่ไหนก็ได้'],
        ['79', 'ms', 'ค้นข้อความไทยด้วย trigram index'],
      ],
      setup: 'Easy CMS 1.15 · ค่ามัธยฐานจาก 3 รอบ · Postgres 17 · GitHub runner 4 core · 20 request พร้อมกัน · 28 ต.ค. 2026',
      limits: 'ยังไม่ได้เร็วทุกอย่าง: การเลือกหน้าด้วยเลขหน้าลึกๆ ใช้เวลาหลายวินาที (ใช้ `cursor` แทน) และ query ข้างใน block ก็เช่นกัน ผลทั้งหมดมีรายการไว้',
      link: 'ผลทั้งหมดและวิธีวัด',
      page: 'databases#at-1000000-posts',
    },
    faq: {
      eyebrow: 'คำถาม',
      title: 'ก่อนเลือก backend',
      text: 'สิ่งที่นักพัฒนาถามก่อนตัดสินใจใช้ Easy CMS กับโปรเจกต์ ถ้ามีคำถามอื่น',
      ask: 'ถามใน GitHub Discussions',
      items: [
        ['พร้อมใช้บน production ไหม', '1.0 ออกเมื่อ 17 ตุลาคม 2026 และ release ทำตาม semantic versioning: breaking change รอจนถึง major version และมีคู่มืออัปเกรดทุกครั้ง มี load test กับโพสต์ล้านรายการทุกคืน'],
        ['รองรับฐานข้อมูลและ runtime อะไรบ้าง', 'SQLite, Turso และ Postgres รันใน Next.js หรือ Nuxt หรือเป็น server ของตัวเองบน Node.js, Bun, Deno หรือ Cloudflare Workers'],
        ['ฟรีจริงไหม มีข้อแม้อะไร', 'ทุกฟีเจอร์เป็น MIT รวมถึง single sign-on สิทธิ์ระดับ field, audit log และ backup ไม่มีรุ่นเสียเงิน คุณรันบน infrastructure ของคุณเอง'],
        ['ต้องใช้ Next.js หรือ Nuxt ไหม', 'ไม่ต้อง `easy-cms serve` รันเป็น server ของตัวเอง มี REST และ GraphQL (ถ้าเปิดใช้) สำหรับ frontend ที่เป็น Vite, React, Vue หรือเว็บ static'],
        ['ย้ายมาจาก Payload หรือ Strapi ได้ไหม', 'ยังไม่มีเครื่องมือ import แต่ collection เป็น TypeScript จึงแปลงทีละ field ได้ และเขียนสคริปต์โหลดข้อมูลด้วย `cms.create()`'],
        ['ใครดูแล ถ้าหยุดพัฒนาจะเป็นอย่างไร', 'Easy CMS เป็นโปรเจกต์ open source อิสระที่พัฒนาแบบเปิดบน GitHub ข้อมูลของคุณอยู่ในตารางธรรมดาในฐานข้อมูลของคุณเอง และโค้ดเป็น MIT จึง fork ต่อหรืออ่านข้อมูลได้โดยไม่ต้องมี Easy CMS'],
      ],
    },
    final: {
      title: 'สร้าง backend ครั้งเดียว ใช้กับทุกแอป',
      text: 'สร้างโปรเจกต์พร้อม Easy CMS ได้ในราวหนึ่งนาที เป็น MIT และรันบน infrastructure ของคุณเอง',
      guide: 'เริ่มใช้งาน',
      source: 'ให้ดาวบน GitHub',
    },
    copy: 'คัดลอก',
    copied: 'คัดลอกแล้ว',
  },
}
