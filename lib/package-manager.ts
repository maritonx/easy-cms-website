'use client'

import { useSyncExternalStore } from 'react'

export const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn', 'bun'] as const
export type PackageManager = (typeof PACKAGE_MANAGERS)[number]

const KEY = 'ecms-pm'
const EVENT = 'ecms-pm-change'

function read(): PackageManager {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && (PACKAGE_MANAGERS as readonly string[]).includes(saved)) return saved as PackageManager
  } catch {}
  return 'npm'
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** Remembers the reader's package manager across the home page and every docs page. */
export function setPackageManager(pm: PackageManager) {
  try {
    localStorage.setItem(KEY, pm)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

export function usePackageManager() {
  return useSyncExternalStore(subscribe, read, () => 'npm' as const)
}

/** Copies text, or selects it in `fallback` when the clipboard is unavailable. */
export async function copyText(text: string, fallback?: Element | null) {
  try {
    await navigator.clipboard.writeText(text)
    return 'Copied'
  } catch {
    if (fallback) {
      const range = document.createRange()
      range.selectNodeContents(fallback)
      const selection = getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
    return 'Selected'
  }
}
