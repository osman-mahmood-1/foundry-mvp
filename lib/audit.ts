'use server'
/**
 * lib/audit.ts
 *
 * Append-only audit log helper.
 *
 * Uses service_role (via createAdminClient) because the audit_log table
 * has no RLS policies for authenticated users — clients must not be able
 * to read or tamper with the audit trail directly.
 *
 * Design: fire-and-forget. Audit failures never block user operations.
 * They are logged to the console for Vercel function log visibility.
 *
 * SECURITY: Never call this from the client bundle. This is a Server Action —
 * it runs on the server only. The service_role key never reaches the browser.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import type { SenderRole } from '@/types'

export async function logAudit({
  actorId,
  actorRole = 'client',
  clientId,
  action,
  targetType,
  targetId,
}: {
  actorId:    string
  actorRole?: SenderRole
  clientId:   string
  action:     string
  targetType: string
  targetId:   string
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('audit_log').insert({
      actor_id:    actorId,
      actor_role:  actorRole,
      client_id:   clientId,
      action,
      target_type: targetType,
      target_id:   targetId,
    })
    if (error) {
      console.error('AUDIT_001', { action, targetType, targetId, error })
    }
  } catch (err) {
    console.error('AUDIT_001', { action, targetType, targetId, err })
  }
}
