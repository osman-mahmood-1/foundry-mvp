'use client'

/**
 * app/portal/components/mobile/MobileNavigationLayer.tsx
 *
 * Reusable full-screen navigation shell for any portal (Client, Admin, Accountant).
 * Handles:
 * - Frosted glass backdrop (30px blur)
 * - Apple-style quartic easing on open/close
 * - 0.1s exit delay — keeps the container solid while text blurs out first ("curtain" effect)
 * - Theme-aware solid background for Safari bar sampling
 */

import { useState, useEffect }    from 'react'
import { useThemePreference }     from '../PortalThemeProvider'
import { mobileMotion, mobileBlur } from '@/styles/tokens/mobile-physics'

interface Props {
  isOpen:   boolean
  children: React.ReactNode
}

export default function MobileNavigationLayer({ isOpen, children }: Props) {
  const { mode }           = useThemePreference()
  // Initialise from the data-theme attribute the blocking script set — avoids
  // a wrong-colour flash on first open regardless of React context timing.
  const [isDark, setIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') === 'dark'
      : true
  )

  useEffect(() => {
    const dark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
  }, [mode])

  return (
    <div
      style={{
        position:             'fixed',
        inset:                 0,
        zIndex:                200,
        display:              'flex',
        flexDirection:        'column',
        overflow:             'hidden',
        paddingTop:           'env(safe-area-inset-top, 0px)',
        background:           isDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter:       mobileBlur.container,
        WebkitBackdropFilter: mobileBlur.container,
        transform:            isOpen ? 'translateY(0)' : 'translateY(-100%)',
        opacity:              isOpen ? 1 : 0,
        pointerEvents:        isOpen ? 'auto' : 'none',
        willChange:           'transform',
        transition:           isOpen
          ? `transform ${mobileMotion.duration.entrance} ${mobileMotion.expand}, opacity 0.5s ease-out`
          : `transform ${mobileMotion.duration.exit} ${mobileMotion.collapse} 0.06s, opacity 0.25s ease-in 0.06s`,
      }}
    >
      {children}
    </div>
  )
}
