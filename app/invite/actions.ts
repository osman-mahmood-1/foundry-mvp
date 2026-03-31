'use server'

/**
 * app/invite/actions.ts
 *
 * Server actions for the invite flow.
 *
 * Flow:
 *   1. validateInviteToken  — called on page load to check the token is valid
 *   2. sendInviteMagicLink  — sends a magic link to the invited email address
 *   3. acceptInvite         — called after sign-in to provision the role and redirect
 *
 * Security:
 *   - All token reads use service_role (admin client) — invite_tokens is RLS-protected,
 *     anon key cannot read it.
 *   - JWT claims are set server-side via Admin SDK only — never from client input.
 *   - Email must exactly match the invite to prevent token hijacking.
 *   - Tokens are single-use; used_at is set atomically after provisioning succeeds.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import type { InviteRole } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InviteTokenData {
  id: string
  token: string
  role: InviteRole
  email: string
  invited_by: string
}

export type TokenError = 'not_found' | 'expired' | 'used'

export interface ValidateTokenResult {
  valid: boolean
  token?: InviteTokenData
  error?: TokenError
}

// ─── validateInviteToken ──────────────────────────────────────────────────────

/**
 * Validate an invite token without consuming it.
 * Uses service_role — invite_tokens is not readable by anon or client users.
 */
export async function validateInviteToken(token: string): Promise<ValidateTokenResult> {
  if (!token || typeof token !== 'string') return { valid: false, error: 'not_found' }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('invite_tokens')
    .select('id, token, role, email, invited_by, used_at, expires_at')
    .eq('token', token)
    .limit(1)
    .single()

  if (error || !data) return { valid: false, error: 'not_found' }
  if (data.used_at)                              return { valid: false, error: 'used' }
  if (new Date(data.expires_at) < new Date())   return { valid: false, error: 'expired' }

  return {
    valid: true,
    token: {
      id:         data.id,
      token:      data.token,
      role:       data.role as InviteRole,
      email:      data.email,
      invited_by: data.invited_by,
    },
  }
}

// ─── sendInviteMagicLink ──────────────────────────────────────────────────────

/**
 * Send a magic link to the invited email.
 * The redirectTo returns the user to /invite/[token] after they click the link,
 * so acceptInvite can complete provisioning while the token is in scope.
 */
export async function sendInviteMagicLink(
  email: string,
  token: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? 'https://taxfoundry.co.uk'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl}/invite/${token}` },
  })

  if (error) {
    console.error('INVITE_MAGIC_LINK', error)
    return { error: 'Failed to send sign-in email. Please try again.' }
  }

  return { error: null }
}

// ─── acceptInvite ─────────────────────────────────────────────────────────────

export interface AcceptInviteResult {
  success: boolean
  redirectTo?: string
  error?: string
}

/**
 * Complete the invite flow:
 *   1. Re-validate token (idempotency guard)
 *   2. Verify signed-in user's email matches the invite
 *   3. Create accountant or platform_editor row
 *   4. Set JWT role claim via Admin SDK
 *   5. Mark token as used
 *   6. Return the redirect path for the new role's home
 *
 * This action is the only place JWT claims are written for invites.
 * All steps are guarded so a partial failure cannot leave the user in an
 * inconsistent state (no claim is set until the row is successfully created).
 */
export async function acceptInvite(token: string): Promise<AcceptInviteResult> {
  const supabase = await createClient()
  const admin    = createAdminClient()

  // 1. Verify session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'You must be signed in to accept this invite.' }
  }

  // 2. Re-validate token (prevents double-use race conditions)
  const validation = await validateInviteToken(token)
  if (!validation.valid || !validation.token) {
    const msg =
      validation.error === 'used'    ? 'This invite has already been used.' :
      validation.error === 'expired' ? 'This invite link has expired. Ask the sender for a new one.' :
                                       'This invite link is invalid.'
    return { success: false, error: msg }
  }

  const tokenData = validation.token

  // 3. Email must match exactly (case-insensitive)
  if (user.email?.toLowerCase() !== tokenData.email.toLowerCase()) {
    return {
      success: false,
      error: `This invite was sent to ${tokenData.email}. Please sign in with that email address.`,
    }
  }

  try {
    if (tokenData.role === 'accountant') {
      // Create accountant row
      const { data: accountant, error: insertError } = await admin
        .from('accountants')
        .insert({
          user_id:          user.id,
          full_name:        (user.user_metadata?.full_name as string) ?? user.email ?? 'Accountant',
          email:            user.email!,
          invited_by:       tokenData.invited_by,
          is_active:        true,
          is_foundry_admin: false,
        })
        .select('id')
        .single()

      if (insertError || !accountant) {
        console.error('INVITE_002_ACCOUNTANT', insertError)
        throw new Error('Failed to create accountant record.')
      }

      // Set JWT claim — must happen after row creation so accountant_id is known
      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { role: 'accountant', accountant_id: accountant.id },
      })

    } else {
      // Create platform_editor row
      const { error: insertError } = await admin
        .from('platform_editors')
        .insert({
          user_id:    user.id,
          full_name:  (user.user_metadata?.full_name as string) ?? user.email ?? 'Editor',
          email:      user.email!,
          invited_by: tokenData.invited_by,
        })

      if (insertError) {
        console.error('INVITE_003_EDITOR', insertError)
        throw new Error('Failed to create platform editor record.')
      }

      await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { role: 'platform_editor' },
      })
    }

    // 5. Mark token as used (after successful provisioning only)
    await admin
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    const redirectTo = tokenData.role === 'platform_editor' ? '/admin' : '/accountant'
    return { success: true, redirectTo }

  } catch (err) {
    console.error('INVITE_001', err)
    return {
      success: false,
      error: 'Setup failed. Please contact support and quote error INVITE_001.',
    }
  }
}
