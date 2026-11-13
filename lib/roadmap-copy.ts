/** The roadmap page's words in English and Thai; the levels themselves come from the CMS. */
import type { Locale } from './home-copy'

export const ROADMAP_COPY: Record<
  Locale,
  {
    meta: { title: string; description: string }
    eyebrow: string
    title: string
    accent: string
    lede: string
    facts: { reached: string; of: (complete: number, total: number) => string; version: string; updated: string }
    nav: string
    level: string
    states: { complete: string; next: string; progress: string }
    legend: { reached: string; next: string; progress: string; flag: string }
    levels: { eyebrow: string; title: string; text: string; github: string; now: string; todo: string; nothingLeft: string }
    next: { eyebrow: string; title: string; text: string; open: string }
    summit: { eyebrow: string; title: string; text: string; vows: readonly (readonly [string, string])[] }
    final: { title: string; text: string; start: string; star: string }
  }
> = {
  en: {
    meta: {
      title: 'Roadmap: from headless CMS to an AI-native backend',
      description:
        'Six levels, from managing content to a backend that people and AI agents work in under the same rules. What works in Easy CMS today, and what is still to build.',
    },
    eyebrow: 'Roadmap',
    title: 'The climb to an',
    accent: 'AI‑native backend.',
    lede: 'Six camps, from managing content to a backend that people and AI agents work in under the same rules. Each one lists what works today and what is still to build.',
    facts: {
      reached: 'Camps reached',
      of: (complete, total) => `${complete} of ${total}`,
      version: 'Current version',
      updated: 'Updated',
    },
    nav: 'The six levels',
    level: 'Level',
    states: { complete: 'Complete', next: 'Building next', progress: 'In progress' },
    legend: { reached: 'Camp reached', next: 'Climbing now', progress: 'Parts shipped', flag: 'Summit flag not planted yet' },
    levels: {
      eyebrow: 'Six levels',
      title: 'Where each level stands.',
      text: 'A level is complete when what it needs has shipped and CI tests it. The roadmap with its issues is on',
      github: 'GitHub',
      now: 'Works today',
      todo: 'Still to build',
      nothingLeft: 'Nothing left for this level',
    },
    next: {
      eyebrow: 'Next',
      title: 'What we are building next.',
      text: 'Each piece is designed in the open before it is built, and ships when CI tests it.',
      open: 'Designed in the open on GitHub',
    },
    summit: {
      eyebrow: 'The summit',
      title: 'A backend that people and AI agents share, under one set of rules.',
      text: 'At level 6 an agent drafts a change, a person approves it, and the audit log records both. Every camp on the way ships in the MIT release, so the climb pays off before the summit.',
      vows: [
        ['Every level ships MIT', 'Nothing on the way up goes behind a paid plan.'],
        ['Done means tested', 'A level is complete when what it needs has shipped and CI tests it on every pull request.'],
        ['Planned in the open', 'Each piece is designed in a GitHub issue before it is built.'],
      ],
    },
    final: {
      title: 'Build on what ships today.',
      text: 'Everything marked as working is in the current release, MIT licensed, on your own infrastructure.',
      start: 'Get started',
      star: 'Star on GitHub',
    },
  },
  th: {
    meta: {
      title: 'Roadmap: จาก headless CMS สู่ backend ที่ทำงานกับ AI',
      description:
        'หกระดับ จากการจัดการเนื้อหา สู่ backend ที่คนและ AI agent ทำงานภายใต้กฎเดียวกัน อะไรใน Easy CMS ใช้ได้วันนี้ และอะไรยังต้องสร้าง',
    },
    eyebrow: 'Roadmap',
    title: 'เส้นทางขึ้นสู่',
    accent: 'backend ที่ทำงานกับ AI',
    lede: 'หกแคมป์ จากการจัดการเนื้อหา สู่ backend ที่คนและ AI agent ทำงานภายใต้กฎเดียวกัน แต่ละแคมป์บอกว่าอะไรใช้ได้วันนี้ และอะไรยังต้องสร้าง',
    facts: {
      reached: 'ถึงแล้ว',
      of: (complete, total) => `${complete} จาก ${total}`,
      version: 'เวอร์ชันปัจจุบัน',
      updated: 'อัปเดต',
    },
    nav: 'หกระดับ',
    level: 'ระดับ',
    states: { complete: 'เสร็จแล้ว', next: 'กำลังสร้าง', progress: 'กำลังทำ' },
    legend: { reached: 'ถึงแคมป์แล้ว', next: 'กำลังปีน', progress: 'มีบางส่วนใช้ได้แล้ว', flag: 'ยังไม่ได้ปักธงบนยอด' },
    levels: {
      eyebrow: 'หกระดับ',
      title: 'แต่ละระดับไปถึงไหนแล้ว',
      text: 'ระดับหนึ่งจะเสร็จเมื่อสิ่งที่ต้องมีออกครบและมี CI ทดสอบ roadmap พร้อม issue อยู่บน',
      github: 'GitHub',
      now: 'ใช้ได้วันนี้',
      todo: 'ยังต้องสร้าง',
      nothingLeft: 'ระดับนี้ไม่มีอะไรค้างแล้ว',
    },
    next: {
      eyebrow: 'ถัดไป',
      title: 'สิ่งที่กำลังสร้างต่อ',
      text: 'ทุกชิ้นออกแบบแบบเปิดก่อนลงมือสร้าง และออกเมื่อ CI ทดสอบแล้ว',
      open: 'ออกแบบแบบเปิดบน GitHub',
    },
    summit: {
      eyebrow: 'ยอดเขา',
      title: 'backend ที่คนและ AI agent ใช้ร่วมกัน ภายใต้กฎชุดเดียว',
      text: 'ที่ระดับ 6 agent ร่างการแก้ไข คนอนุมัติ และ audit log บันทึกทั้งสองฝั่ง ทุกแคมป์ระหว่างทางอยู่ใน release ที่เป็น MIT จึงได้ประโยชน์ตั้งแต่ก่อนถึงยอด',
      vows: [
        ['ทุกระดับเป็น MIT', 'ไม่มีอะไรระหว่างทางที่ต้องจ่ายเงิน'],
        ['เสร็จแปลว่าทดสอบแล้ว', 'ระดับหนึ่งเสร็จเมื่อสิ่งที่ต้องมีออกครบและ CI ทดสอบทุก pull request'],
        ['วางแผนแบบเปิด', 'ทุกชิ้นออกแบบใน GitHub issue ก่อนลงมือสร้าง'],
      ],
    },
    final: {
      title: 'เริ่มจากสิ่งที่ใช้ได้วันนี้',
      text: 'ทุกอย่างที่บอกว่าใช้ได้อยู่ใน release ปัจจุบัน เป็น MIT และรันบน infrastructure ของคุณเอง',
      start: 'เริ่มใช้งาน',
      star: 'ให้ดาวบน GitHub',
    },
  },
}
