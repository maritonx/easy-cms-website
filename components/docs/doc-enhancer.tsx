'use client'

import { useEffect } from 'react'
import { copyText, type PackageManager, setPackageManager, usePackageManager } from '@/lib/package-manager'

/**
 * Turns server-rendered `.code-group` blocks into tabs (package-manager groups follow the
 * reader's choice everywhere) and adds a copy button to every code block.
 */
export function DocEnhancer({ html }: { html: string }) {
  const pm = usePackageManager()

  useEffect(() => {
    const root = document.querySelector('.doc .prose')
    if (!root) return
    const cleanups: (() => void)[] = []

    root.querySelectorAll<HTMLElement>('.code-group:not(.ready)').forEach((group) => {
      const figures = [...group.querySelectorAll<HTMLElement>(':scope > figure')]
      if (figures.length === 0) return
      const tabs = document.createElement('div')
      tabs.className = 'cg-tabs'
      tabs.setAttribute('role', 'tablist')
      const labels = figures.map((f) => f.querySelector('figcaption')?.textContent?.trim() || 'code')
      const buttons = labels.map((label, i) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.setAttribute('role', 'tab')
        b.textContent = label
        b.dataset.label = label
        b.addEventListener('click', () => {
          if (group.hasAttribute('data-pm')) setPackageManager(label as PackageManager)
          else select(i)
        })
        tabs.appendChild(b)
        return b
      })
      function select(i: number) {
        figures.forEach((f, j) => (f.hidden = j !== i))
        buttons.forEach((b, j) => b.setAttribute('aria-selected', String(j === i)))
      }
      group.prepend(tabs)
      group.classList.add('ready')
      select(0)
    })

    root.querySelectorAll<HTMLElement>('figure[data-rehype-pretty-code-figure]').forEach((figure) => {
      if (figure.querySelector(':scope > .copy-btn')) return
      const pre = figure.querySelector('pre')
      if (!pre) return
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'copy-btn'
      button.textContent = 'Copy'
      const onClick = async () => {
        button.textContent = await copyText(pre.innerText, pre)
        setTimeout(() => (button.textContent = 'Copy'), 1600)
      }
      button.addEventListener('click', onClick)
      figure.appendChild(button)
      cleanups.push(() => button.removeEventListener('click', onClick))
    })
    return () => cleanups.forEach((fn) => fn())
  }, [html])

  // Package-manager groups show the reader's package manager.
  useEffect(() => {
    document.querySelectorAll<HTMLElement>('.doc .code-group[data-pm].ready').forEach((group) => {
      const figures = [...group.querySelectorAll<HTMLElement>(':scope > figure')]
      const buttons = [...group.querySelectorAll<HTMLButtonElement>('.cg-tabs button')]
      const index = Math.max(0, buttons.findIndex((b) => b.dataset.label === pm))
      figures.forEach((f, j) => (f.hidden = j !== index))
      buttons.forEach((b, j) => b.setAttribute('aria-selected', String(j === index)))
    })
  }, [pm, html])

  return null
}
