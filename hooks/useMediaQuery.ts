'use client'

import { useState, useEffect } from 'react'

/**
 * SSR-safe media query hook.
 * Returns false on the server (avoids hydration mismatch).
 * Subscribes to changes once mounted.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
