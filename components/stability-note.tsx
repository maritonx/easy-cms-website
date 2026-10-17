import Link from 'next/link'
import { ArrowIcon } from './icons'

/** What 1.0 promises, from docs/versioning. On the home page and the Why pages. */
const COPY = {
  en: {
    title: 'Stable since 1.0',
    items: [
      'Breaking changes come only in a major release, each with an upgrade guide.',
      'A renamed API keeps working until the next major, with a warning.',
      'Every change is tested against databases made by older releases, on SQLite and Postgres.',
      'Security fixes reach the previous major for six months after the next one is out.',
    ],
    link: 'What the promise covers',
    href: '/docs/versioning',
  },
  th: {
    title: 'เสถียรตั้งแต่ 1.0',
    items: [
      'breaking change มาเฉพาะใน major release และมีคู่มืออัปเกรดทุกครั้ง',
      'API ที่เปลี่ยนชื่อยังใช้ได้จนถึง major ถัดไป พร้อมคำเตือน',
      'ทุกการเปลี่ยนแปลงทดสอบกับฐานข้อมูลที่สร้างจาก release เก่า ทั้ง SQLite และ Postgres',
      'major ก่อนหน้ายังได้ security fix ต่ออีกหกเดือนหลัง major ถัดไปออก',
    ],
    link: 'สัญญานี้ครอบคลุมอะไรบ้าง',
    href: '/th/docs/versioning',
  },
} as const

export function StabilityNote({ locale }: { locale: 'en' | 'th' }) {
  const t = COPY[locale]
  return (
    <div className="stability">
      <div>
        <span className="stability-badge">1.0</span>
        <h3>{t.title}</h3>
      </div>
      <ul>
        {t.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Link className="why-more" href={t.href}>
        {t.link} <ArrowIcon />
      </Link>
    </div>
  )
}
