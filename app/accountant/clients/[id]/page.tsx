/**
 * app/accountant/clients/[id]/page.tsx
 *
 * Server component — split-panel client record for the accountant portal.
 *
 * Responsibilities:
 *   1. Verify user is authenticated and has accountant (or platform_editor) role
 *   2. Verify the client is actually assigned to this accountant
 *      (platform editors bypass this check — they see all clients)
 *   3. Load the client record
 *   4. Render the split-panel view (SplitPanel client component)
 *
 * Security: assignment verification uses admin client so it cannot be
 * circumvented by RLS gaps. The JWT claim is the identity gate.
 *
 * force-dynamic: always server-rendered.
 */

import { redirect }           from 'next/navigation'
import { notFound }           from 'next/navigation'
import { createClient }       from '@/lib/supabase-server'
import { createAdminClient }  from '@/lib/supabase-admin'
import { getAccountantId, getUserRole } from '@/lib/roles'
import SplitPanel             from '../../components/SplitPanel'
import type { Client }        from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AccountantClientPage({ params }: Props) {
  const { id: clientId } = await params

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role         = getUserRole(user)
  const accountantId = getAccountantId(user)

  // Must be accountant or platform_editor
  if (role !== 'accountant' && role !== 'platform_editor') redirect('/login')

  const admin = createAdminClient()

  // ── Assignment check ───────────────────────────────────────────────────────
  // Platform editors see all clients. Accountants only see their assigned ones.
  if (role === 'accountant') {
    if (!accountantId) redirect('/login')

    const { data: assignment } = await admin
      .from('accountant_clients')
      .select('id')
      .eq('accountant_id', accountantId)
      .eq('client_id', clientId)
      .limit(1)

    if (!assignment || assignment.length === 0) {
      // Client exists but is not assigned to this accountant — 404, not 403,
      // to avoid leaking the existence of client IDs.
      notFound()
    }
  }

  // ── Client record ─────────────────────────────────────────────────────────
  const { data: clientRows } = await admin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .is('deleted_at', null)
    .limit(1)

  const client = (clientRows?.[0] ?? null) as Client | null
  if (!client) notFound()

  return (
    <SplitPanel
      client={client}
      accountantId={accountantId}
    />
  )
}
