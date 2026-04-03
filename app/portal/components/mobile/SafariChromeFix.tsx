'use client'

/**
 * app/portal/components/mobile/SafariChromeFix.tsx
 *
 * Hardware layer — portals a fixed full-screen div into document.body at
 * z-index -1 so Safari's edge-sampling compositor thread reads solid
 * pixels at the screen boundary for status bar / URL bar colouring.
 *
 * Hardcoded hex strings are intentional: CSS variables and React state
 * cause a micro-delay through the CSSOM that produces a white flicker.
 * Raw hex bypasses that pipeline entirely.
 */

import { useState, useEffect }    from 'react'
import { createPortal }           from 'react-dom'
import { useThemePreference }     from '../PortalThemeProvider'

export default function SafariChromeFix() {
  const { mode }              = useThemePreference()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = mode === 'dark' ||
    (mode === 'system' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        -1,
        background:    isDark ? '#000000' : '#ffffff',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />,
    document.body
  )
}
