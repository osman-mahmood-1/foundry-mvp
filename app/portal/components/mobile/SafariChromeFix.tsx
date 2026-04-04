'use client'

/**
 * app/portal/components/mobile/SafariChromeFix.tsx
 *
 * Hardware layer — portals a fixed full-screen div into document.body at
 * z-index -1 so Safari's edge-sampling compositor thread reads solid
 * pixels at the screen boundary for status bar / URL bar colouring.
 */

import { useState, useEffect, useLayoutEffect } from 'react'
import { createPortal }           from 'react-dom'
import { useThemePreference }     from '../PortalThemeProvider'

// Read the data-theme attribute the blocking script already set — this is
// synchronous and correct before React context settles.
function readDOMTheme(): boolean {
  if (typeof window === 'undefined') return false
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

export default function SafariChromeFix() {
  const { mode }              = useThemePreference()
  const [mounted, setMounted] = useState(false)
  const [isDark,  setIsDark]  = useState(readDOMTheme)

  // Mount before paint so the portal exists on the first visual frame.
  useLayoutEffect(() => { setMounted(true) }, [])

  // Keep in sync when the user toggles the theme at runtime.
  useEffect(() => {
    const dark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
  }, [mode])

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
