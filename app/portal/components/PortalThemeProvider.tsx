'use client'

/**
 * app/portal/components/PortalThemeProvider.tsx
 *
 * Client-side theme wrapper for the Portal.
 * Manages light / dark / system preference via localStorage.
 * Provides useThemePreference() for the SettingsTab to read/set the mode.
 *
 * forceMode: when set, bypasses localStorage entirely and locks the theme.
 *
 * SSR safety:
 *   useState initialisers run on the server with window=undefined, returning
 *   defaultMode. On client hydration, React reuses server state — so we MUST
 *   re-read localStorage in a useLayoutEffect (not just the initialiser) to
 *   apply the correct stored theme before the first paint.
 */

import { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react'
import { ThemeProvider } from '@/styles/ThemeContext'
import type { ColourMode } from '@/styles/tokens/colours'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

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
  /** When set, ignores localStorage and locks to this mode. */
  forceMode?:   ColourMode
}

export default function PortalThemeProvider({
  children,
  storageKey  = 'foundry-theme',
  defaultMode = 'light',
  forceMode,
}: PortalThemeProviderProps) {

  const [mode, setModeState] = useState<ThemeMode>(forceMode ?? defaultMode)
  const [resolved, setResolved] = useState<ColourMode>(forceMode ?? resolveTheme(defaultMode))

  // This effect runs after hydration on the client.
  // It re-reads localStorage to get the correct stored preference —
  // overriding the SSR-initialised state which had no access to localStorage.
  // useLayoutEffect ensures it runs before the browser paints, preventing flash.
  useIsomorphicLayoutEffect(() => {
    if (forceMode) {
      document.documentElement.setAttribute('data-theme', forceMode)
      updateThemeColorMeta(forceMode)
      return
    }
    const stored = localStorage.getItem(storageKey) as ThemeMode | null
    const effective = (stored === 'light' || stored === 'dark' || stored === 'system')
      ? stored
      : defaultMode
    const r = resolveTheme(effective)
    setModeState(effective)
    setResolved(r)
    document.documentElement.setAttribute('data-theme', r)
    updateThemeColorMeta(r)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally empty — runs once after hydration only

  // Track system preference changes
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

  function updateThemeColorMeta(r: ColourMode) {
    const color = r === 'dark' ? '#000000' : '#ffffff'
    document.querySelectorAll('meta[name="theme-color"]').forEach(el => {
      el.setAttribute('content', color)
    })
  }

  function setMode(m: ThemeMode) {
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
