'use client'

/**
 * styles/ThemeContext.tsx
 *
 * React context that provides the correct colour token set to any component
 * within a themed subtree. Components call `useColours()` instead of
 * hardcoding `import { light as colours }`.
 *
 * Usage in a layout:
 *   <ThemeProvider theme="dark">
 *     <AdminShell>{children}</AdminShell>
 *   </ThemeProvider>
 *
 * Usage in a component:
 *   const colours = useColours()
 *   // colours is now the dark or light set depending on nearest provider
 *
 * The glass helper is also theme-aware — use `useGlass()` for the correct
 * glass styles within the current theme.
 */

import { createContext, useContext } from 'react'
import { light, dark } from './tokens/colours'
import type { ColourMode } from './tokens/colours'

// ─── Types ──────────────────────────────────────────────────────────────────

/** Widened colour token set — keys match both light and dark objects. */
export type ColourTokens = { [K in keyof typeof light]: string }

// ─── Context ────────────────────────────────────────────────────────────────

const ColourContext = createContext<ColourTokens>(light as ColourTokens)
const ThemeModeContext = createContext<ColourMode>('light')

// ─── Provider ───────────────────────────────────────────────────────────────

const TOKEN_SETS: Record<ColourMode, ColourTokens> = {
  light: light as ColourTokens,
  dark:  dark  as ColourTokens,
}

export function ThemeProvider({
  theme,
  children,
}: {
  theme:    ColourMode
  children: React.ReactNode
}) {
  return (
    <ThemeModeContext.Provider value={theme}>
      <ColourContext.Provider value={TOKEN_SETS[theme]}>
        {children}
      </ColourContext.Provider>
    </ThemeModeContext.Provider>
  )
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/** Returns the colour token set for the nearest ThemeProvider. */
export function useColours(): ColourTokens {
  return useContext(ColourContext)
}

/** Returns 'light' | 'dark' for the nearest ThemeProvider. */
export function useThemeMode(): ColourMode {
  return useContext(ThemeModeContext)
}
