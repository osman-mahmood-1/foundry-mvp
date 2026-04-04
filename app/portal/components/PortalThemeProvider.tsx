'use client'

/**
 * app/portal/components/PortalThemeProvider.tsx
 *
 * Client-side theme wrapper for the Portal.
 * Manages light / dark / system preference via localStorage.
 * Provides useThemePreference() for the SettingsTab to read/set the mode.
 */

import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react'

// useLayoutEffect fires synchronously before the browser paints — eliminates
// the light→dark flash on first load. Falls back to useEffect on SSR where
// window is unavailable (Next.js server components).
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
}

export default function PortalThemeProvider({
  children,
  storageKey  = 'foundry-theme',
  defaultMode = 'light',
}: PortalThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode)
  const [resolved, setResolved] = useState<ColourMode>(resolveTheme(defaultMode))

  // useLayoutEffect fires before the browser paints, so the React context
  // is updated to the correct theme before the first visual frame — no flash.
  useIsomorphicLayoutEffect(() => {
    const stored = localStorage.getItem(storageKey) as ThemeMode | null
    const initial = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : defaultMode
    setModeState(initial)
    const r = resolveTheme(initial)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
    updateThemeColorMeta(r)
  }, [])

  // Track system preference changes when mode = 'system'
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = resolveTheme('system')
      setResolved(r)
      document.documentElement.setAttribute('data-theme', r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [mode])

  function updateThemeColorMeta(resolved: ColourMode) {
    const color = resolved === 'dark' ? '#000000' : '#ffffff'
    // Hot-swap all theme-color meta tags (both media-scoped and unscoped)
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
      el.setAttribute('content', color)
    })
  }

  function setMode(m: ThemeMode) {
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
