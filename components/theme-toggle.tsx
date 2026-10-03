'use client'

import { MoonIcon, SunIcon } from './icons'

/** Runs before paint (in <head>) so a saved theme never flashes the other one. */
export const themeScript = `try{var t=localStorage.getItem('ecms-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const current =
      root.getAttribute('data-theme') ??
      (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    const next = current === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem('ecms-theme', next)
    } catch {}
  }
  return (
    <button className="icon-btn" type="button" onClick={toggle} aria-label="Switch light or dark theme">
      <SunIcon className="only-dark" />
      <MoonIcon className="only-light" />
    </button>
  )
}
