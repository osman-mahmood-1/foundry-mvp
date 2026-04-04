'use server'

/**
 * app/admin/actions.ts
 *
 * Server actions for the admin portal.
 * All actions verify the caller is a platform_editor before executing.
 * The admin client (service_role) is used for privileged mutations.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient }      from '@/lib/supabase-server'
import { getUserRole }       from '@/lib/roles'

// ─── revokeAccountantAccess ───────────────────────────────────────────────────

export interface RevokeAccessResult {
  success: boolean
  error?:  string
}

/**
 * Revoke an accountant's access to the platform.
 *
 * Actions taken (all-or-nothing approach — JWT claim is only cleared after
 * the DB record is successfully deactivated):
 *   1. Verify caller is a platform_editor
 *   2. Fetch the accountant row to get their auth user_id
 *   3. Set is_active = false, deactivated_at = now() on accountants row
 *   4. Clear the JWT role claim so the middleware reroutes them on next request
 *
 * The accountant row and all assignment records are retained for audit.
 * Client assignments are not removed — they must be reassigned separately.
 *
 * Security:
 *   - Caller identity verified via getUser() — never from request body.
 *   - Caller must have platform_editor role.
 *   - JWT claim is wiped via Admin SDK only — the revoked user cannot
 *     manipulate their own claims.
 */
export async function revokeAccountantAccess(accountantId: string): Promise<RevokeAccessResult> {
  if (!accountantId || typeof accountantId !== 'string') {
    return { success: false, error: 'Invalid accountant ID.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'You must be signed in.' }
  }

  const role = getUserRole(user)
  if (role !== 'platform_editor') {
    return { success: false, error: 'Not authorised.' }
  }

  const admin = createAdminClient()

  // Fetch the accountant to get their auth user_id
  const { data: accountant, error: fetchError } = await admin
    .from('accountants')
    .select('id, user_id, is_active, full_name')
    .eq('id', accountantId)
    .single()

  if (fetchError || !accountant) {
    return { success: false, error: 'Accountant not found.' }
  }

  if (!accountant.is_active) {
    return { success: false, error: 'This accountant is already deactivated.' }
  }

  // 1. Deactivate the accountant row
  const { error: updateError } = await admin
    .from('accountants')
    .update({
      is_active:       false,
      deactivated_at:  new Date().toISOString(),
    })
    .eq('id', accountantId)

  if (updateError) {
    console.error('REVOKE_001', updateError)
    return { success: false, error: 'Failed to deactivate accountant record.' }
  }

  // 2. Clear JWT role claim — merge to preserve provider metadata
  const { error: jwtError } = await admin.auth.admin.updateUserById(
    accountant.user_id as string,
    {
      app_metadata: {
        role:           null,
        accountant_id:  null,
      },
    }
  )

  if (jwtError) {
    // DB is already deactivated — log but don't fail the action.
    // The accountant row being inactive is the source of truth.
    // Their JWT will expire naturally (Supabase default: 1 hour).
    console.error('REVOKE_002_JWT', jwtError)
  }

  console.info(`REVOKE: accountant ${accountantId} (${accountant.full_name}) deactivated by ${user.email}`)
  return { success: true }
}
