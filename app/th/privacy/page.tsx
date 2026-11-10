import type { Metadata } from 'next'
import { Privacy } from '@/components/privacy'

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว',
  description: 'easycms.dev และหน้า admin เก็บข้อมูลอะไร ใช้ทำอะไร และเก็บไว้ที่ไหน',
  alternates: { canonical: '/th/privacy', languages: { en: '/privacy' } },
}

export default function PrivacyPage() {
  return <Privacy locale="th" />
}
