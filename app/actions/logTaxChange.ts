'use server'

/**
 * app/actions/logTaxChange.ts
 *
 * Server Action — called client-side when a client edits their tax information.
 * Writes a permanent, undeletable entry to the audit_log so accountants can
 * see exactly what changed, when, and by whom.
 *
 * Uses service_role via createAdminClient (same as logAudit).
 * The client's JWT is verified server-side before the log is written.
 */

import { createClient }      from '@/lib/supabase-server'
import { logAudit }          from '@/lib/audit'

export interface TaxSnapshot {
  utr:         string | null
  ni_number:   string | null
  vat_number:  string | null
  client_type: string
  tax_year:    string
}

export async function logTaxChange(
  clientId: string,
  before:   TaxSnapshot,
  after:    TaxSnapshot,
): Promise<void> {
  // Server-side auth check — never trust the client's claim of who they are
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const now       = new Date()
  const formatted = now.toLocaleString('en-GB', {
    timeZone:  'Europe/London',
    dateStyle: 'long',
    timeStyle: 'medium',
  })

  await logAudit({
    actorId:     user.id,
    actorRole:   'client',
    clientId,
    action:      `CLIENT_TAX_INFO_CHANGED — ${formatted} GMT`,
    targetType:  'client',
    targetId:    clientId,
    beforeState: before as unknown as Record<string, unknown>,
    afterState:  after  as unknown as Record<string, unknown>,
  })
}
