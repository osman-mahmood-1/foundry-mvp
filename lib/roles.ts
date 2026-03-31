/**
 * lib/roles.ts
 *
 * Server-side role checking helpers.
 *
 * Role claims live in app_metadata on the Supabase User object.
 * app_metadata can only be written via the Admin SDK (service_role key).
 * Clients cannot forge these claims — they are set server-side only.
 *
 * JWT claim structure:
 *   platform_editor:  app_metadata: { role: 'platform_editor' }
 *   accountant:       app_metadata: { role: 'accountant', accountant_id: '<uuid>' }
 *   client:           app_metadata: {} (absence of role = client — secure default)
 *
 * SECURITY: Never trust role information from request bodies or URL params.
 * Always derive role from the verified JWT via this module.
 */

import type { User } from '@supabase/supabase-js'

export type UserRole = 'client' | 'accountant' | 'platform_editor'

/**
 * Extract the user's role from app_metadata.
 * Returns 'client' as the secure default when no role claim is present.
 * Returns null only when there is no authenticated user at all.
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null
  const role = user.app_metadata?.role as string | undefined
  if (role === 'platform_editor') return 'platform_editor'
  if (role === 'accountant') return 'accountant'
  return 'client'
}

/** Extract accountant_id from app_metadata. Only present for accountant role. */
export function getAccountantId(user: User | null): string | null {
  if (!user) return null
  return (user.app_metadata?.accountant_id as string) ?? null
}

export function isPlatformEditor(user: User | null): boolean {
  return getUserRole(user) === 'platform_editor'
}

export function isAccountant(user: User | null): boolean {
  return getUserRole(user) === 'accountant'
}

export function isClient(user: User | null): boolean {
  return getUserRole(user) === 'client'
}

/**
 * Returns the correct authenticated home route for a given role.
 * Used for post-login redirects and wrong-portal redirects.
 */
export function homeForRole(role: UserRole | null): string {
  switch (role) {
    case 'platform_editor': return '/admin'
    case 'accountant':      return '/accountant'
    default:                return '/portal'
  }
}
