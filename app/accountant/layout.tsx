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
import { getAccountantId }    from '@/lib/roles'
import AccountantShell        from './components/AccountantShell'
import type { Accountant }    from '@/types'

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

  // ── Role check — extract accountant_id from verified JWT claim ────────────
  const accountantId = getAccountantId(user)
  if (!accountantId) redirect('/login')

  // ── Accountant record ─────────────────────────────────────────────────────
  // Uses admin client so the fetch succeeds regardless of current RLS state
  // on the accountants table. The JWT claim is the access gate.
  const admin = createAdminClient()
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
