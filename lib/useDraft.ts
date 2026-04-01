'use client'

/**
 * lib/useDraft.ts
 *
 * Generic localStorage draft persistence hook.
 *
 * Persists in-progress form state to localStorage so entries survive
 * tab switches, refreshes, and accidental navigation.
 *
 * Usage:
 *   const { state, setState, clearDraft, hasDraft } = useDraft(
 *     `foundry-draft-income-${clientId}`,
 *     { description: '', amount: '', date: today, category: 'other' }
 *   )
 *
 * - state / setState: drop-in replacement for useState
 * - clearDraft(): call on submit or explicit discard
 * - hasDraft: true if a non-initial draft exists (show "Draft restored" UI)
 *
 * Drafts are local-only (per device). No server round-trip.
 */

import { useState, useEffect, useCallback } from 'react'

interface UseDraftReturn<T> {
  state:      T
  setState:   (updater: T | ((prev: T) => T)) => void
  clearDraft: () => void
  hasDraft:   boolean
}

export function useDraft<T>(key: string, initialState: T): UseDraftReturn<T> {
  const [state, setStateRaw] = useState<T>(initialState)
  const [hasDraft, setHasDraft] = useState(false)

  // On mount: hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored) as T
        // Only restore if at least one field differs from initial state
        const hasContent = Object.entries(parsed as Record<string, unknown>).some(
          ([k, v]) => v !== (initialState as Record<string, unknown>)[k]
        )
        if (hasContent) {
          setStateRaw(parsed)
          setHasDraft(true)
        }
      }
    } catch { /* malformed JSON or SSR */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function'
        ? (updater as (prev: T) => T)(prev)
        : updater
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
    setHasDraft(false)  // once user starts editing, it's no longer a "restored" draft
  }, [key])

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key) } catch {}
    setStateRaw(initialState)
    setHasDraft(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { state, setState, clearDraft, hasDraft }
}
