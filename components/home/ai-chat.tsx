'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Lines of the answer shown before anything types, so the card is never empty. */
const SHOWN = 3

/**
 * A request to an AI assistant that types itself once the card is in view, then the config it
 * wrote appears line by line. Replay runs it again; under reduced motion everything shows at once.
 */
export function AiChat({
  prompt,
  html,
  labels,
}: {
  prompt: string
  html: string
  labels: { you: string; added: string; replay: string }
}) {
  const card = useRef<HTMLDivElement>(null)
  const code = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const [typed, setTyped] = useState(prompt)
  const [typing, setTyping] = useState(false)

  const lines = () => Array.from(code.current?.querySelectorAll<HTMLElement>('.line') ?? [])

  const play = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
    const all = lines()
    all.forEach((l, i) => l.classList.toggle('on', i < SHOWN))
    setTyping(true)
    for (let i = 0; i <= prompt.length; i++) {
      timers.current.push(window.setTimeout(() => setTyped(prompt.slice(0, i)), i * 18))
    }
    const done = prompt.length * 18
    timers.current.push(window.setTimeout(() => setTyping(false), done))
    all.slice(SHOWN).forEach((l, i) => {
      timers.current.push(window.setTimeout(() => l.classList.add('on'), done + (i + 1) * 90))
    })
  }, [prompt])

  useEffect(() => {
    const el = card.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Hidden until it plays: the first lines show, the rest wait.
    lines().forEach((l, i) => l.classList.toggle('on', i < SHOWN))
    el.classList.add('typing-ready')
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          seen.disconnect()
          play()
        }
      },
      { threshold: 0.45 },
    )
    seen.observe(el)
    return () => {
      seen.disconnect()
      for (const t of timers.current) window.clearTimeout(t)
    }
  }, [play])

  return (
    <div className="ai-chat" ref={card}>
      <div className="ai-ask">
        <span className="who">{labels.you}</span>
        <p className={typing ? 'caret' : undefined}>
          <span className="sr-only">{prompt}</span>
          <span aria-hidden="true">{typed}</span>
        </p>
      </div>
      <div className="float-code ai-code">
        <div className="fname">
          <span>easy-cms.config.ts</span>
          <span className="fname-r">
            {labels.added}
            <button type="button" className="replay" onClick={play}>{labels.replay}</button>
          </span>
        </div>
        <div className="typing" ref={code} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
