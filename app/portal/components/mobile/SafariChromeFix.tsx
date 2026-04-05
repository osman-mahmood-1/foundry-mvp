'use client'

/**
 * app/portal/components/mobile/SafariChromeFix.tsx
 *
 * Sets a class on document.body that applies the portal's pageBg gradient
 * as the body background. This makes Safari's toolbar area sample the
 * gradient rather than plain white/black — eliminating the solid colour
 * block visible between app content and the Safari toolbar.
 *
 * Uses a body class rather than a fixed div so the gradient extends
 * naturally behind the toolbar without any z-index conflicts.
 */

import { useEffect } from 'react'
import { useThemePreference } from '../PortalThemeProvider'

export default function SafariChromeFix() {
  const { mode } = useThemePreference()

  useEffect(() => {
    const isDark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    document.body.classList.remove('portal-light', 'portal-dark')
    document.body.classList.add(isDark ? 'portal-dark' : 'portal-light')

    return () => {
      document.body.classList.remove('portal-light', 'portal-dark')
    }
  }, [mode])

  return null
}
