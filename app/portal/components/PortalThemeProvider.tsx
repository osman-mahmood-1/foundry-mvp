'use client'

/**
 * app/portal/components/PortalThemeProvider.tsx
 *
 * Client-side theme wrapper for the Portal.
 * Manages light / dark / system preference via localStorage.
 * Provides useThemePreference() for the SettingsTab to read/set the mode.
 */

import { createContext, useContext, useState, useEffect } from 'react'
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
  // Lazy initialisers: read localStorage + DOM synchronously on first render so
  // initial state matches what the blocking script already painted — no useEffect
  // needed for first-frame correctness, eliminating the light→dark flash.
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultMode
    const stored = localStorage.getItem(storageKey) as ThemeMode | null
    return (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : defaultMode
  })
  const [resolved, setResolved] = useState<ColourMode>(() => {
    if (typeof window === 'undefined') return resolveTheme(defaultMode)
    // Trust the data-theme the blocking script already set on the html element
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'dark' || attr === 'light') return attr
    return resolveTheme(defaultMode)
  })

  // Sync DOM attribute and meta on mount (covers edge cases where script missed)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
    updateThemeColorMeta(resolved)
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
