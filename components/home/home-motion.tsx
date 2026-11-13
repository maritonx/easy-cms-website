'use client'

import { useEffect } from 'react'

/** Groups that rise into view one after another; each item waits a little longer than the last. */
const GROUPS = ['.features > .feature', '.levels > li', '.faq details', '.pick', '.vs tbody tr', '.perf-stat', '.steps li']

/**
 * The home page's motion, all of it optional: the page is complete without it, and nothing runs
 * under reduced motion. Elements already on screen when the page opens never wait for a reveal.
 */
export function HomeMotion() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cleanups: (() => void)[] = []

    // The hero's code card types in, then a caret stays on its last line.
    const hero = document.querySelector<HTMLElement>('[data-type-lines]')
    if (hero) {
      const lines = Array.from(hero.querySelectorAll<HTMLElement>('.line'))
      hero.classList.add('typing-ready')
      const timers = lines.map((l, i) =>
        window.setTimeout(() => {
          l.classList.add('on')
          if (i === lines.length - 1) l.classList.add('caret')
        }, 500 + (i + 1) * 160),
      )
      cleanups.push(() => timers.forEach((t) => window.clearTimeout(t)))
    }

    // A soft light follows the pointer across the hero and the feature cards.
    const follow = (el: HTMLElement, x: string, y: string) => {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        el.style.setProperty(x, `${e.clientX - r.left}px`)
        el.style.setProperty(y, `${e.clientY - r.top}px`)
      }
      el.addEventListener('pointermove', move)
      cleanups.push(() => el.removeEventListener('pointermove', move))
    }
    const heroSection = document.querySelector<HTMLElement>('.hero')
    if (heroSection) follow(heroSection, '--hx', '--hy')
    document.querySelectorAll<HTMLElement>('.feature').forEach((f) => follow(f, '--x', '--y'))

    // Reveal what starts below the fold.
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    for (const sel of GROUPS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
        if (el.getBoundingClientRect().top < window.innerHeight) return
        el.classList.add('rv')
        el.style.setProperty('--d', `${(i % 6) * 60}ms`)
        io.observe(el)
      })
    }
    cleanups.push(() => io.disconnect())

    // The measured numbers count up once.
    const counts = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue
          counts.unobserve(en.target)
          const node = en.target.firstChild
          const end = Number(node?.textContent?.replace(/,/g, ''))
          if (!node || !end) continue
          const t0 = performance.now()
          const tick = (t: number) => {
            const k = Math.min(1, (t - t0) / 900)
            node.textContent = Math.round(end * (1 - (1 - k) ** 3)).toLocaleString('en-US')
            if (k < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.6 },
    )
    document.querySelectorAll('.perf-stat dd').forEach((dd) => counts.observe(dd))
    cleanups.push(() => counts.disconnect())

    return () => cleanups.forEach((c) => c())
  }, [])
  return null
}
