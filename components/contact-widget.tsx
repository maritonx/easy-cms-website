'use client'

import { getForm, type PublicForm, submitForm } from '@easy-cms/plugin-form-builder/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { DISCUSSIONS_URL, GITHUB_URL, localeOf } from '@/lib/site'

/** The contact form's slug and field names, seeded by scripts/seed.mts. */
const FORM = 'contact'
const KINDS = ['usage', 'project', 'bug', 'feature', 'other'] as const
type Kind = (typeof KINDS)[number]

const COPY = {
  en: {
    button: 'Contact',
    title: 'Ask us anything',
    lede: 'We reply by email.',
    docs: 'Search the docs',
    discuss: 'Ask in GitHub Discussions',
    kind: 'Type',
    kinds: {
      usage: 'A question about using Easy CMS',
      project: 'A project or business enquiry',
      bug: 'A problem or bug',
      feature: 'A feature request',
      other: 'Something else',
    } as Record<Kind, string>,
    github: 'Bugs and feature requests get answered faster as a GitHub issue, where others can help too.',
    openIssue: 'Open an issue',
    message: 'Question',
    email: 'Email',
    name: 'Name (optional)',
    send: 'Send',
    sending: 'Sending…',
    privacy: 'We keep your email only to reply, and delete messages after a year.',
    privacyLink: 'Privacy',
    done: 'Thanks, we got your message. We will reply by email.',
    again: 'Send another',
    failed: 'Could not send it. Check your connection and try again.',
    missing: 'The form isn’t available right now. Please ask in GitHub Discussions.',
    close: 'Close',
    required: 'required',
  },
  th: {
    button: 'ติดต่อเรา',
    title: 'สอบถามได้ทุกเรื่อง',
    lede: 'เราตอบกลับทางอีเมล',
    docs: 'ค้นหาใน docs',
    discuss: 'ถามใน GitHub Discussions',
    kind: 'ประเภท',
    kinds: {
      usage: 'สอบถามการใช้งาน',
      project: 'ปรึกษาโปรเจกต์หรือธุรกิจ',
      bug: 'แจ้งปัญหา',
      feature: 'ขอฟีเจอร์',
      other: 'อื่นๆ',
    } as Record<Kind, string>,
    github: 'บั๊กและคำขอฟีเจอร์จะได้คำตอบเร็วกว่าถ้าเปิดเป็น GitHub issue ซึ่งคนอื่นช่วยได้ด้วย',
    openIssue: 'เปิด issue',
    message: 'คำถาม',
    email: 'อีเมล',
    name: 'ชื่อ (ไม่บังคับ)',
    send: 'ส่ง',
    sending: 'กำลังส่ง…',
    privacy: 'เราเก็บอีเมลไว้เพื่อตอบกลับเท่านั้น และลบข้อความหลังหนึ่งปี',
    privacyLink: 'ความเป็นส่วนตัว',
    done: 'ได้รับข้อความแล้ว เราจะตอบกลับทางอีเมล',
    again: 'ส่งอีกข้อความ',
    failed: 'ส่งไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง',
    missing: 'ฟอร์มยังใช้ไม่ได้ตอนนี้ ถามใน GitHub Discussions ได้เลย',
    close: 'ปิด',
    required: 'จำเป็น',
  },
} as const

type Turnstile = { render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string; reset: (id: string) => void }

let turnstileScript: Promise<void> | null = null
function loadTurnstile() {
  turnstileScript ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Turnstile'))
    document.head.append(s)
  })
  return turnstileScript
}

const track = (event: string) => (window as { umami?: { track: (e: string) => void } }).umami?.track(event)

/**
 * The contact button in the bottom-right corner and its form: type, question, email and name,
 * sent to the "contact" form of the form builder plugin, which checks for bots (and Turnstile,
 * when its keys are set), stores it and tells the admins. Not on /admin.
 */
export function ContactWidget() {
  const pathname = usePathname()
  const locale = localeOf(pathname)
  const t = COPY[locale]
  const id = useId()
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const [form, setForm] = useState<PublicForm | null | undefined>(undefined)
  const [kind, setKind] = useState<Kind>('usage')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const panel = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const turnstileBox = useRef<HTMLDivElement>(null)
  const turnstile = useRef<{ id?: string; token: string }>({ token: '' })

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 240)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const load = useCallback(async () => {
    try {
      setForm(await getForm(FORM, { api: '/api/cms', locale: null }))
    } catch {
      setForm(null)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    panel.current?.querySelector<HTMLElement>('select, textarea, input')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Cloudflare Turnstile, when the form asks for it.
  useEffect(() => {
    const key = form?.turnstile
    if (!open || !key || !turnstileBox.current || turnstile.current.id) return
    loadTurnstile()
      .then(() => {
        const api = (window as { turnstile?: Turnstile }).turnstile
        if (!api || !turnstileBox.current) return
        turnstile.current.id = api.render(turnstileBox.current, {
          sitekey: key,
          callback: (token) => {
            turnstile.current.token = token
          },
        })
      })
      .catch(() => setFormError(t.failed))
  }, [open, form, t.failed])

  if (pathname.startsWith('/admin')) return null

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form) return
    const data = new FormData(e.currentTarget)
    setState('sending')
    setErrors({})
    setFormError('')
    let result: Awaited<ReturnType<typeof submitForm>>
    try {
      result = await submitForm(
        FORM,
        {
          data: {
            kind,
            message: String(data.get('message') ?? ''),
            email: String(data.get('email') ?? ''),
            name: String(data.get('name') ?? ''),
          },
          token: form.token,
          page: location.pathname,
          locale: null,
          ...(form.turnstile ? { turnstile: turnstile.current.token } : {}),
          [form.honeypot]: String(data.get(form.honeypot) ?? ''),
        },
        { api: '/api/cms' },
      )
    } catch {
      result = { ok: false, status: 0, errors: [{ message: t.failed }] }
    }
    if (result.ok) {
      setState('done')
      track('contact-sent')
      return
    }
    setState('idle')
    const byField: Record<string, string> = {}
    for (const err of result.errors) if (err.field) byField[err.field] = err.message
    setErrors(byField)
    setFormError(result.errors.filter((err) => !err.field).map((err) => err.message).join(' ') || (Object.keys(byField).length ? '' : t.failed))
    const api = (window as { turnstile?: Turnstile }).turnstile
    if (turnstile.current.id && api) api.reset(turnstile.current.id)
    // An old token (the form sat open for long): load a fresh one.
    if (result.status === 400 && Object.keys(byField).length === 0) void load()
  }

  function toggle() {
    if (!open) {
      track('contact-open')
      if (form === undefined) void load()
    }
    setOpen((o) => !o)
  }

  function again() {
    setForm(undefined)
    setState('idle')
    turnstile.current = { token: '' }
    void load()
  }

  const docs = locale === 'th' ? '/th/docs' : '/docs'
  const err = (name: string) =>
    errors[name] ? (
      <p className="cw-error" id={`${id}-${name}-error`}>
        {errors[name]}
      </p>
    ) : null

  return (
    <div className={`cw${open ? ' is-open' : ''}`}>
      {open && (
        <div className="cw-panel" ref={panel} role="dialog" aria-modal="false" aria-labelledby={`${id}-title`} id={`${id}-panel`}>
          <div className="cw-head">
            <div>
              <h2 id={`${id}-title`}>{t.title}</h2>
              <p>{t.lede}</p>
            </div>
            <button type="button" className="cw-close" aria-label={t.close} onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
          <div className="cw-links">
            <Link href={docs} onClick={() => setOpen(false)}>{t.docs} →</Link>
            <a href={DISCUSSIONS_URL}>{t.discuss} →</a>
          </div>
          {state === 'done' ? (
            <div className="cw-done" role="status">
              <span className="cw-done-mark" aria-hidden="true">✓</span>
              <p>{t.done}</p>
              <button type="button" className="btn" onClick={again}>{t.again}</button>
            </div>
          ) : form === null ? (
            <p className="cw-status" role="alert">{t.missing}</p>
          ) : (
            <form className="cw-form" onSubmit={onSubmit} noValidate={false} aria-busy={form === undefined || state === 'sending'}>
              <label htmlFor={`${id}-kind`}>{t.kind}</label>
              <select id={`${id}-kind`} value={kind} onChange={(e) => setKind(e.target.value as Kind)} required>
                {KINDS.map((k) => (
                  <option key={k} value={k}>{t.kinds[k]}</option>
                ))}
              </select>
              {err('kind')}
              {(kind === 'bug' || kind === 'feature') && (
                <p className="cw-hint">
                  {t.github} <a href={`${GITHUB_URL}/issues/new/choose`}>{t.openIssue} →</a>
                </p>
              )}
              <label htmlFor={`${id}-message`}>{t.message}</label>
              <textarea id={`${id}-message`} name="message" rows={4} required maxLength={4000} aria-invalid={!!errors.message} aria-describedby={errors.message ? `${id}-message-error` : undefined} />
              {err('message')}
              <div className="cw-row">
                <div>
                  <label htmlFor={`${id}-email`}>{t.email}</label>
                  <input id={`${id}-email`} name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-error` : undefined} />
                  {err('email')}
                </div>
                <div>
                  <label htmlFor={`${id}-name`}>{t.name}</label>
                  <input id={`${id}-name`} name="name" type="text" autoComplete="name" />
                </div>
              </div>
              {form?.honeypot && (
                <div className="cw-hp" aria-hidden="true">
                  <input name={form.honeypot} type="text" tabIndex={-1} autoComplete="off" />
                </div>
              )}
              {form?.turnstile && <div className="cw-turnstile" ref={turnstileBox} />}
              {formError && <p className="cw-status error" role="alert">{formError}</p>}
              <button type="submit" className="btn primary cw-send" disabled={!form || state === 'sending'}>
                {state === 'sending' ? t.sending : t.send}
              </button>
              <p className="cw-privacy">
                {t.privacy} <Link href={locale === 'th' ? '/th/privacy' : '/privacy'}>{t.privacyLink}</Link>
              </p>
            </form>
          )}
        </div>
      )}
      <button
        ref={button}
        type="button"
        className={`cw-button${compact && !open ? ' compact' : ''}`}
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        aria-label={open ? t.close : t.button}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />}
        </svg>
        <span className="cw-label">{t.button}</span>
      </button>
    </div>
  )
}
