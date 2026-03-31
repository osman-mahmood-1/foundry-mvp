/**
 * app/accountant/hooks/useAccountantNotes.ts
 *
 * Hook for reading and saving private accountant working notes.
 *
 * Notes are stored in the `accountant_notes` table.
 * RLS allows the accountant to read and write their own notes only.
 * Clients never see these notes.
 *
 * One note per (client_id, accountant_id) pair.
 * If no note exists it is created on first save.
 *
 * Rules:
 * - No JSX. No style objects. Pure data logic.
 * - All Supabase access lives here.
 * - Returns typed data only.
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient }  from '@/lib/supabase'
import { APP_ERRORS }    from '@/lib/errors'
import type { AccountantNote } from '@/types'
import type { AppError }       from '@/lib/errors'

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseAccountantNotesResult {
  note:     AccountantNote | null
  body:     string
  setBody:  (body: string) => void
  loading:  boolean
  saving:   boolean
  saved:    boolean    // flashes true for 1.5s after a successful save
  error:    AppError | null
  saveNote: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccountantNotes(
  clientId:     string,
  accountantId: string | null,
): UseAccountantNotesResult {
  const [note,    setNote]   = useState<AccountantNote | null>(null)
  const [body,    setBody]   = useState('')
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving] = useState(false)
  const [saved,   setSaved]  = useState(false)
  const [error,   setError]  = useState<AppError | null>(null)

  const supabase = createClient()

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accountantId) {
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('accountant_notes')
      .select('*')
      .eq('client_id', clientId)
      .eq('accountant_id', accountantId)
      .limit(1)
      .then(({ data, error: err }) => {
        setLoading(false)
        if (err) {
          setError(APP_ERRORS.NOTE_001)
          return
        }
        const existing = (data?.[0] ?? null) as AccountantNote | null
        setNote(existing)
        setBody(existing?.body ?? '')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, accountantId])

  // ── Save ───────────────────────────────────────────────────────────────────
  const saveNote = useCallback(async () => {
    if (!accountantId) return
    setSaving(true)
    setError(null)

    let result: { data: unknown; error: unknown }

    if (note) {
      result = await supabase
        .from('accountant_notes')
        .update({ body, updated_at: new Date().toISOString() })
        .eq('id', note.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('accountant_notes')
        .insert({ client_id: clientId, accountant_id: accountantId, body })
        .select()
        .single()
    }

    setSaving(false)

    const { data, error: err } = result as { data: AccountantNote | null; error: { message: string } | null }

    if (err) {
      setError(APP_ERRORS.NOTE_002)
    } else {
      setNote(data)
      // Flash saved indicator
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    }
  }, [clientId, accountantId, note, body, supabase])

  return { note, body, setBody, loading, saving, saved, error, saveNote }
}
