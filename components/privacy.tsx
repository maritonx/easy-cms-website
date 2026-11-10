import Link from 'next/link'
import { GITHUB_URL } from '@/lib/site'

const UPDATED = { en: '10 November 2026', th: '10 พฤศจิกายน 2569' }

/** The privacy policy of easycms.dev: what the site and its admin keep, and why. */
export function Privacy({ locale }: { locale: 'en' | 'th' }) {
  const issues = `${GITHUB_URL}/issues`
  if (locale === 'th')
    return (
      <article className="article wrap">
        <header className="article-head">
          <h1>นโยบายความเป็นส่วนตัว</h1>
          <p className="excerpt">easycms.dev เก็บอะไร ใช้ทำอะไร และเก็บไว้ที่ไหน ปรับปรุงล่าสุด {UPDATED.th}</p>
        </header>
        <div className="prose">
          <p>
            easycms.dev เป็นเว็บของโปรเจกต์โอเพนซอร์ส Easy CMS ดูแลโดย Kanawut K. เป็นการส่วนตัว
            หน้านี้อธิบายข้อมูลที่เว็บและหน้า admin ของเว็บเก็บ
          </p>
          <h2>ผู้เยี่ยมชม</h2>
          <ul>
            <li>ไม่มีบัญชีผู้ใช้ ฟอร์ม หรือการสมัครรับข่าวสารสำหรับผู้เยี่ยมชม</li>
            <li>
              นับจำนวนผู้เข้าชมด้วย Umami Cloud ซึ่งไม่ใช้คุกกี้และไม่เก็บข้อมูลที่ระบุตัวบุคคล เช่น หน้าที่เปิด
              เว็บที่ส่งต่อมา ประเทศ และประเภทอุปกรณ์
            </li>
            <li>เว็บโฮสต์บน Vercel ซึ่งเก็บ log คำขอ (รวม IP address) ไว้ระยะสั้นเพื่อดูแลระบบ</li>
          </ul>
          <h2>ผู้ดูแลเว็บ (หน้า admin)</h2>
          <ul>
            <li>
              เฉพาะผู้ดูแลที่ได้รับเชิญเท่านั้นที่เข้า <code>/admin</code> ได้ โดยเข้าสู่ระบบด้วย Google
              เว็บเก็บอีเมล ชื่อ และรหัสบัญชี Google เพื่อระบุตัวผู้ดูแล และใช้คุกกี้ session ที่จำเป็นต่อการเข้าสู่ระบบ
            </li>
            <li>อีเมลของหน้า admin เช่น คำเชิญ ส่งผ่าน Resend บันทึกอีเมลเก็บผู้รับและหัวข้อไว้ 30 วัน ไม่เก็บเนื้อหา</li>
            <li>เมื่อผู้ดูแลใช้ฟีเจอร์ AI ข้อความที่เลือกจะถูกส่งให้ผู้ให้บริการ AI ที่ตั้งไว้</li>
          </ul>
          <h2>ข้อมูลจาก Google</h2>
          <ul>
            <li>
              Google Sign-In: ใช้อีเมล ชื่อ และรหัสบัญชี เพื่อให้ผู้ดูแลเข้าสู่ระบบเท่านั้น
            </li>
            <li>
              Google Drive (สิทธิ์ <code>drive.file</code>): ใช้เก็บไฟล์ backup ของฐานข้อมูลเว็บ
              ในโฟลเดอร์ที่แอปสร้างขึ้นเองใน Drive ของผู้ดูแลที่เชื่อมต่อ แอปเห็นและแก้ได้เฉพาะไฟล์ที่แอปสร้าง
              มองไม่เห็นไฟล์อื่นใน Drive
            </li>
            <li>
              ข้อมูลจาก Google ไม่ถูกขาย ไม่ใช้ทำโฆษณา ไม่ใช้ฝึก AI และไม่ส่งต่อให้ใคร การใช้ข้อมูลจาก Google API
              เป็นไปตาม Google API Services User Data Policy รวมถึงข้อกำหนด Limited Use
            </li>
            <li>
              ยกเลิกสิทธิ์ได้ทุกเมื่อที่{' '}
              <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> หรือ
              ยกเลิกการเชื่อมต่อในหน้า admin
            </li>
          </ul>
          <h2>ที่เก็บข้อมูล</h2>
          <p>
            ฐานข้อมูลอยู่ที่ Turso ไฟล์ที่อัปโหลดอยู่ที่ Vercel Blob และ backup อยู่ใน Google Drive ที่เชื่อมต่อไว้
            ความลับ เช่น API key ที่กรอกในหน้า admin ถูกเข้ารหัสก่อนเก็บ
          </p>
          <h2>ติดต่อ</h2>
          <p>
            สอบถามหรือขอลบข้อมูลได้ที่ <a href={issues}>GitHub Issues</a> ของโปรเจกต์ ดูฉบับภาษาอังกฤษได้ที่{' '}
            <Link href="/privacy">/privacy</Link>
          </p>
        </div>
      </article>
    )
  return (
    <article className="article wrap">
      <header className="article-head">
        <h1>Privacy policy</h1>
        <p className="excerpt">What easycms.dev keeps, why, and where. Last updated {UPDATED.en}.</p>
      </header>
      <div className="prose">
        <p>
          easycms.dev is the website of Easy CMS, an open-source project run personally by Kanawut K. This
          page says what the site and its admin keep.
        </p>
        <h2>Visitors</h2>
        <ul>
          <li>There are no visitor accounts, forms or newsletters.</li>
          <li>
            Visits are counted with Umami Cloud, which uses no cookies and keeps nothing that identifies
            you: the pages opened, the referring site, the country and the kind of device.
          </li>
          <li>The site is hosted on Vercel, which keeps request logs (IP addresses included) for a short time to run the service.</li>
        </ul>
        <h2>Maintainers (the admin)</h2>
        <ul>
          <li>
            Only invited maintainers can open <code>/admin</code>, signing in with Google. The site keeps
            their email address, name and Google account ID to know who they are, and a session cookie
            needed to stay signed in.
          </li>
          <li>
            The admin’s emails, such as invitations, are sent through Resend. The email log keeps the recipient
            and subject for 30 days, never the content.
          </li>
          <li>When a maintainer uses an AI feature, the text they chose is sent to the AI provider set up.</li>
        </ul>
        <h2>Data from Google</h2>
        <ul>
          <li>Google Sign-In: the email address, name and account ID, only to sign maintainers in.</li>
          <li>
            Google Drive (the <code>drive.file</code> scope): to store backups of the site’s database in a
            folder the app creates in the connected maintainer’s Drive. The app can see and change only
            the files it created, nothing else in the Drive.
          </li>
          <li>
            Data from Google is not sold, used for advertising, used to train AI, or shared with anyone.
            Easy CMS’s use of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </li>
          <li>
            Access can be removed at any time at{' '}
            <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>, or by
            disconnecting in the admin.
          </li>
        </ul>
        <h2>Where it is kept</h2>
        <p>
          The database is on Turso, uploaded files on Vercel Blob, and backups in the connected Google
          Drive. Secrets entered in the admin, such as API keys, are encrypted before they are stored.
        </p>
        <h2>Contact</h2>
        <p>
          Questions or requests to delete data: <a href={issues}>GitHub Issues</a>. Thai:{' '}
          <Link href="/th/privacy">/th/privacy</Link>.
        </p>
      </div>
    </article>
  )
}
