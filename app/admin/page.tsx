/**
 * app/admin/page.tsx
 *
 * Admin landing page — all clients across all accountants.
 *
 * Server component that fetches via admin client:
 *   - All active clients (with accountant assignment info)
 *   - Summary counts for the dashboard header
 *
 * Renders a clean data table with columns:
 *   Client | Plan | Accountant | SA Deadline | Status
 *
 * This is the "ops console" — dense, scannable, dark theme.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import AdminClientsTable     from './components/AdminClientsTable'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const admin = createAdminClient()

  // ── Parallel data fetches ──────────────────────────────────────────────
  const [clientsResult, accountantsResult, assignmentsResult] = await Promise.all([
    admin
      .from('clients')
      .select('id, full_name, email, plan, utr, ni_number, created_at')
      .is('deleted_at', null)
      .order('full_name', { ascending: true }),

    admin
      .from('accountants')
      .select('id, full_name, email')
      .is('deactivated_at', null),

    admin
      .from('accountant_clients')
      .select('client_id, accountant_id'),
  ])

  const clients     = clientsResult.data     ?? []
  const accountants = accountantsResult.data  ?? []
  const assignments = assignmentsResult.data  ?? []

  // Build lookup: client_id → accountant name
  const accountantMap: Record<string, string> = {}
  for (const a of accountants) {
    accountantMap[a.id] = a.full_name ?? a.email
  }

  const assignmentMap: Record<string, string> = {}
  for (const asgn of assignments) {
    const name = accountantMap[asgn.accountant_id]
    if (name) assignmentMap[asgn.client_id] = name
  }

  // Enrich clients
  const enrichedClients = clients.map(c => ({
    id:           c.id         as string,
    full_name:    c.full_name  as string | null,
    email:        c.email      as string,
    plan:         (c.plan ?? 'foundation') as string,
    accountant:   assignmentMap[c.id as string] ?? null,
    hasUtr:       !!c.utr,
    hasNi:        !!c.ni_number,
    created_at:   c.created_at as string,
  }))

  return (
    <AdminClientsTable
      clients={enrichedClients}
      totalAccountants={accountants.length}
    />
  )
}
