/**
 * app/admin/accountants/page.tsx
 *
 * Admin — Accountants management page.
 * Lists all accountants with their assignment counts.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import AdminAccountantsTable from '../components/AdminAccountantsTable'

export const dynamic = 'force-dynamic'

export default async function AdminAccountantsPage() {
  const admin = createAdminClient()

  const [accountantsResult, assignmentsResult] = await Promise.all([
    admin
      .from('accountants')
      .select('id, full_name, email, firm_name, is_active, created_at, deactivated_at')
      .order('full_name', { ascending: true }),

    admin
      .from('accountant_clients')
      .select('accountant_id'),
  ])

  const accountants = accountantsResult.data ?? []
  const assignments = assignmentsResult.data ?? []

  // Count assignments per accountant
  const countMap: Record<string, number> = {}
  for (const a of assignments) {
    countMap[a.accountant_id] = (countMap[a.accountant_id] ?? 0) + 1
  }

  const enriched = accountants.map(a => ({
    id:           a.id           as string,
    full_name:    a.full_name    as string | null,
    email:        a.email        as string,
    firm_name:    a.firm_name    as string | null,
    is_active:    a.is_active    as boolean,
    clientCount:  countMap[a.id as string] ?? 0,
    created_at:   a.created_at   as string,
  }))

  return <AdminAccountantsTable accountants={enriched} />
}
