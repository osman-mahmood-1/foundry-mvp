'use client'

/**
 * app/portal/components/PortalThemeProvider.tsx
 *
 * Client-side theme wrapper for the Portal.
 * Manages light / dark / system preference via localStorage.
 * Provides useThemePreference() for the SettingsTab to read/set the mode.
 *
 * forceMode: when set, bypasses localStorage entirely and locks the theme.
 * Used by desktop layouts to pin to light mode while mobile remains free.
 */

import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
import { ThemeProvider } from '@/styles/ThemeContext'
import type { ColourMode } from '@/styles/tokens/colours'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemePreferenceCtx {
  mode:    ThemeMode
  setMode: (m: ThemeMode) => void
}

const ThemePreferenceContext = createContext<ThemePreferenceCtx>({
  mode:    'light',
  setMode: () => {},
})

export function useThemePreference(): ThemePreferenceCtx {
  return useContext(ThemePreferenceContext)
}

function resolveTheme(mode: ThemeMode): ColourMode {
  if (mode === 'system') {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return mode
}

interface PortalThemeProviderProps {
  children:     React.ReactNode
  storageKey?:  string
  defaultMode?: ThemeMode
  /** When set, ignores localStorage and locks to this mode. Desktop uses 'light'. */
  forceMode?:   ColourMode
}

export default function PortalThemeProvider({
  children,
  storageKey  = 'foundry-theme',
  defaultMode = 'system',
  forceMode,
}: PortalThemeProviderProps) {

  // If forceMode is set, skip localStorage entirely
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (forceMode) return forceMode
    if (typeof window === 'undefined') return defaultMode
    const stored = localStorage.getItem(storageKey) as ThemeMode | null
    return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : defaultMode
  })

  const [resolved, setResolved] = useState<ColourMode>(() => {
    if (forceMode) return forceMode
    if (typeof window === 'undefined') return resolveTheme(defaultMode)
    const stored = localStorage.getItem(storageKey) as ThemeMode | null
    const initial = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : defaultMode
    return resolveTheme(initial)
  })

  useIsomorphicLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
    updateThemeColorMeta(resolved)
  }, [])

  // Track system preference changes — only when not forced and mode = 'system'
  useEffect(() => {
    if (forceMode || mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = resolveTheme('system')
      setResolved(r)
      document.documentElement.setAttribute('data-theme', r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode, forceMode])

  function updateThemeColorMeta(resolved: ColourMode) {
    const color = resolved === 'dark' ? '#000000' : '#ffffff'
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
      el.setAttribute('content', color)
    })
  }

  function setMode(m: ThemeMode) {
    // No-op when forced — UI controls should be hidden in this state
    if (forceMode) return
    setModeState(m)
    localStorage.setItem(storageKey, m)
    const r = resolveTheme(m)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
    updateThemeColorMeta(r)
  }

  return (
    <ThemePreferenceContext.Provider value={{ mode, setMode }}>
      <ThemeProvider theme={resolved}>
        {children}
      </ThemeProvider>
    </ThemePreferenceContext.Provider>
  )
}
