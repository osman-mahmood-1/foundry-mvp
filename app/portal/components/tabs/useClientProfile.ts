/**
 * app/portal/components/tabs/useClientProfile.ts
 *
 * Hook for reading and updating the client's own profile fields.
 *
 * Security:
 * - Uses the anon client-side Supabase client.
 * - RLS policy `clients_update` enforces `user_id = auth.uid()` so a client
 *   can only update their own row — not other clients' rows.
 * - Only safe, client-editable fields are accepted. Plan, stripe IDs,
 *   assigned_accountant_id, and generated columns are never sent.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import type { Client, ClientType, TaxYear } from '@/types'
import type { AppError } from '@/lib/errors'

// ─── Types ────────────────────────────────────────────────────────────────────

/** The subset of client fields a client may update themselves. */
export interface ProfileUpdate {
  full_name?:    string | null
  phone?:        string | null
  date_of_birth?: string | null
  utr?:          string | null
  ni_number?:    string | null
  vat_number?:   string | null
  client_type?:  ClientType
  tax_year?:     TaxYear
}

export interface UseClientProfileResult {
  saving:  boolean
  error:   AppError | null
  success: boolean
  update:  (fields: ProfileUpdate) => Promise<boolean>
  clearError: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useClientProfile(clientId: string): UseClientProfileResult {
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<AppError | null>(null)
  const [success, setSuccess] = useState(false)

  async function update(fields: ProfileUpdate): Promise<boolean> {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error: dbError } = await supabase
      .from('clients')
      .update(fields)
      .eq('id', clientId)

    setSaving(false)

    if (dbError) {
      console.error('PROFILE_001', dbError)
      setError(APP_ERRORS.PROFILE_001)
      return false
    }

    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    return true
  }

  return { saving, error, success, update, clearError: () => setError(null) }
}
