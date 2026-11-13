'use client'

import { useEffect } from 'react'

/**
 * The trail draws itself up the mountain once, and the camps arrive along it. Without script or
 * under reduced motion the climb is simply there.
 */
export function ClimbMotion() {
  useEffect(() => {
    const climb = document.querySelector('.rm-climb')
    if (!climb || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    climb.classList.add('anim')
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => climb.classList.add('go')))
    return () => cancelAnimationFrame(frame)
  }, [])
  return null
}
