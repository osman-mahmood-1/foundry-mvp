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

const STORAGE_KEY = 'foundry-theme'

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

export default function PortalThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')
  const [resolved, setResolved] = useState<ColourMode>('light')

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const initial = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'light'
    setModeState(initial)
    const r = resolveTheme(initial)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
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

  function setMode(m: ThemeMode) {
    setModeState(m)
    localStorage.setItem(STORAGE_KEY, m)
    const r = resolveTheme(m)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
  }

  return (
    <ThemePreferenceContext.Provider value={{ mode, setMode }}>
      <ThemeProvider theme={resolved}>
        {children}
      </ThemeProvider>
    </ThemePreferenceContext.Provider>
  )
}
