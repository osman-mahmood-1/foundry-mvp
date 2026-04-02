/**
 * app/accountant/page.tsx
 *
 * Server component — accountant's home screen.
 * Fetches all clients assigned to the accountant and renders an
 * urgency-sorted client list.
 *
 * Urgency sort order (per implementation plan §7.1):
 *   1. Clients with unread messages (they're waiting)
 *   2. Clients with SA deadline within 30 days
 *   3. Clients with pending expense reviews
 *   4. Clients with unreviewed documents
 *   5. All others — alphabetical
 *
 * Data strategy: admin client for multi-table joins (server-only, identity
 * already verified in layout.tsx). accountant_id is sourced from the
 * verified JWT claim — never from query params or request body.
 *
 * force-dynamic: always server-rendered on demand.
 */

import { redirect }                                          from 'next/navigation'
import { createClient }                                      from '@/lib/supabase-server'
import { createAdminClient }                                 from '@/lib/supabase-admin'
import { getAccountantId }                                   from '@/lib/roles'
import AccountantClientList, { EmptyState }                  from './components/AccountantClientList'
import type { ClientWithUrgency }                            from './components/AccountantClientList'
import type { Client }                                       from '@/types'

export const dynamic = 'force-dynamic'

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function urgencyTier(item: ClientWithUrgency): 0 | 1 | 2 | 3 | 4 {
  if (item.unreadMessages > 0) return 0
  if (item.saDaysRemaining !== null && item.saDaysRemaining <= 30) return 1
  if (item.pendingReviews > 0) return 2
  if (item.unreviewedDocs > 0) return 3
  return 4
}

function sortByUrgency(items: ClientWithUrgency[]): ClientWithUrgency[] {
  return [...items].sort((a, b) => {
    const tierDiff = a.urgencyTier - b.urgencyTier
    if (tierDiff !== 0) return tierDiff
    // Within same tier: sort by SA deadline proximity (closest first), then alphabetically
    if (a.saDaysRemaining !== null && b.saDaysRemaining !== null) {
      const daysDiff = a.saDaysRemaining - b.saDaysRemaining
      if (daysDiff !== 0) return daysDiff
    }
    return (a.client.full_name ?? '').localeCompare(b.client.full_name ?? '')
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccountantPage() {
  // ── Identity ──────────────────────────────────────────────────────────────
  const supabase     = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const accountantId = getAccountantId(user)
  if (!accountantId) redirect('/login')

  // ── Data fetch ────────────────────────────────────────────────────────────
  const admin = createAdminClient()

  // 1. Get assigned client IDs
  const { data: assignments } = await admin
    .from('accountant_clients')
    .select('client_id')
    .eq('accountant_id', accountantId)

  const clientIds = (assignments ?? []).map(a => a.client_id as string)

  if (clientIds.length === 0) {
    return <EmptyState />
  }

  // 2. Get client records
  const { data: clientRows } = await admin
    .from('clients')
    .select('*')
    .in('id', clientIds)
    .is('deleted_at', null)

  const clients = (clientRows ?? []) as Client[]

  // 3. Get urgency counts in parallel
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [
    { data: unreadMsgRows },
    { data: deadlineRows },
    { data: pendingReviewRows },
    { data: unreviewedDocRows },
  ] = await Promise.all([
    // Unread messages sent by the client
    admin
      .from('messages')
      .select('client_id')
      .in('client_id', clientIds)
      .eq('read', false)
      .eq('sender_role', 'client'),

    // SA deadlines within 30 days
    admin
      .from('deadlines')
      .select('client_id, deadline_date')
      .in('client_id', clientIds)
      .in('status', ['upcoming'])
      .lte('deadline_date', in30Days)
      .gte('deadline_date', now.toISOString().split('T')[0]),

    // Expenses without a review record
    admin
      .from('expenses')
      .select('client_id')
      .in('client_id', clientIds)
      .is('allowable', null),

    // Documents not yet reviewed
    admin
      .from('documents')
      .select('client_id')
      .in('client_id', clientIds)
      .eq('reviewed', false),
  ])

  // 4. Build urgency maps
  const unreadMap:    Record<string, number> = {}
  const reviewMap:    Record<string, number> = {}
  const docMap:       Record<string, number> = {}
  const deadlineMap:  Record<string, number> = {}

  for (const row of unreadMsgRows    ?? []) { unreadMap[(row as { client_id: string }).client_id]  = (unreadMap[(row as { client_id: string }).client_id]  ?? 0) + 1 }
  for (const row of pendingReviewRows ?? []) { reviewMap[(row as { client_id: string }).client_id]  = (reviewMap[(row as { client_id: string }).client_id]  ?? 0) + 1 }
  for (const row of unreviewedDocRows ?? []) { docMap[(row as { client_id: string }).client_id]     = (docMap[(row as { client_id: string }).client_id]     ?? 0) + 1 }
  for (const row of deadlineRows      ?? []) {
    const r   = row as { client_id: string; deadline_date: string }
    const days = Math.ceil(
      (new Date(r.deadline_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    const existing = deadlineMap[r.client_id]
    if (existing === undefined || days < existing) deadlineMap[r.client_id] = days
  }

  // 5. Compose urgency items
  const items: ClientWithUrgency[] = clients.map(client => {
    const item: ClientWithUrgency = {
      client,
      unreadMessages:  unreadMap[client.id]   ?? 0,
      pendingReviews:  reviewMap[client.id]   ?? 0,
      unreviewedDocs:  docMap[client.id]      ?? 0,
      saDaysRemaining: deadlineMap[client.id] ?? null,
      urgencyTier:     0,
    }
    item.urgencyTier = urgencyTier(item)
    return item
  })

  const sorted = sortByUrgency(items)

  return <AccountantClientList sorted={sorted} totalClients={clients.length} />
}
