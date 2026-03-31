/**
 * app/accountant/layout.tsx
 *
 * Server-component layout for the accountant portal.
 * Wraps every /accountant/* route in AccountantShell (sidebar + chrome).
 *
 * Responsibilities:
 *   1. Verify the user session — redirect to /login if missing
 *   2. Extract accountant_id from app_metadata (set server-side only — cannot be forged)
 *   3. Load the Accountant record
 *   4. Pass accountant data to AccountantShell
 *
 * Note: the proxy middleware has already enforced that only users with
 * role='accountant' or 'platform_editor' can reach /accountant/*.
 * This layout is a second layer of verification before any data is loaded.
 *
 * Data fetch: uses createAdminClient() to bypass RLS for the accountants table.
 * The identity gate (JWT app_metadata check) runs first — we only fetch data
 * for the exact accountant_id that the verified JWT claims. This is safe for
 * server-side rendering. Client-side queries (hooks) will use the anon client
 * with full RLS enforcement once the accountant RLS policies are extended.
 *
 * force-dynamic: always server-rendered — serves authenticated, personalised data.
 */

import { redirect }           from 'next/navigation'
import { createClient }       from '@/lib/supabase-server'
import { createAdminClient }  from '@/lib/supabase-admin'
import { getAccountantId, getUserRole } from '@/lib/roles'
import AccountantShell        from './components/AccountantShell'
import type { Accountant, PlatformEditor } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AccountantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = getUserRole(user)
  if (role !== 'accountant' && role !== 'platform_editor') redirect('/login')

  const admin = createAdminClient()

  // ── Platform editors: pass through using their platform_editors record ────
  // Platform editors have no accountant_id but are allowed to view all client
  // records via the accountant split panel. We build a synthetic Accountant
  // shape from their platform_editors row for the shell identity.
  if (role === 'platform_editor') {
    const { data: editorRows } = await admin
      .from('platform_editors')
      .select('*')
      .eq('user_id', user.id)
      .is('deactivated_at', null)
      .limit(1)

    const editor = (editorRows?.[0] ?? null) as PlatformEditor | null
    if (!editor) redirect('/login')

    // Synthetic Accountant with platform editor identity for the shell footer
    const syntheticAccountant: Accountant = {
      id:               editor.id,
      user_id:          editor.user_id,
      full_name:        editor.full_name,
      email:            editor.email,
      qualification:    null,
      firm_name:        'Tax Foundry',
      is_foundry_admin: true,
      is_active:        true,
      invited_by:       null,
      deactivated_at:   null,
      created_at:       editor.created_at,
      updated_at:       editor.created_at,
    }

    return (
      <AccountantShell accountant={syntheticAccountant}>
        {children}
      </AccountantShell>
    )
  }

  // ── Accountant: standard flow ─────────────────────────────────────────────
  const accountantId = getAccountantId(user)
  if (!accountantId) redirect('/login')

  const { data: accountantRows } = await admin
    .from('accountants')
    .select('*')
    .eq('id', accountantId)
    .limit(1)

  const accountant = (accountantRows?.[0] ?? null) as Accountant | null
  if (!accountant) redirect('/login')

  return (
    <AccountantShell accountant={accountant}>
      {children}
    </AccountantShell>
  )
}
