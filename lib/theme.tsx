'use client'

/**
 * lib/theme.tsx
 *
 * Theme context — light/dark mode for the entire portal.
 *
 * Usage:
 *   <ThemeProvider><PortalShell /></ThemeProvider>
 *
 *   const { mode, colours, isDark, toggleMode } = useTheme()
 *
 * Defaults to system preference. Persists choice in localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { light, dark } from '@/styles/tokens/colours'
import type { ColourMode } from '@/styles/tokens/colours'

interface ThemeContextValue {
  mode:       ColourMode
  colours:    typeof light
  isDark:     boolean
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode:       'light',
  colours:    light,
  isDark:     false,
  toggleMode: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColourMode>('light')

  useEffect(() => {
    const stored = localStorage.getItem('foundry-theme') as ColourMode | null
    if (stored === 'light' || stored === 'dark') {
      setMode(stored)
      return
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setMode(prefersDark ? 'dark' : 'light')
  }, [])

  function toggleMode() {
    setMode(prev => {
      const next: ColourMode = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('foundry-theme', next)
      return next
    })
  }

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    colours: mode === 'dark' ? dark : light,
    isDark:  mode === 'dark',
    toggleMode,
  }), [mode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
