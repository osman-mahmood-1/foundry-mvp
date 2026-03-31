/**
 * app/admin/audit/page.tsx
 *
 * Admin — Audit log viewer.
 * Shows the most recent audit entries across all clients and actors.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import AdminAuditTable       from '../components/AdminAuditTable'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  const admin = createAdminClient()

  const { data: entries } = await admin
    .from('audit_log')
    .select('id, action, table_name, record_id, client_id, performed_by, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const enriched = (entries ?? []).map(e => ({
    id:           e.id           as string,
    action:       e.action       as string,
    table_name:   e.table_name   as string,
    record_id:    e.record_id    as string | null,
    client_id:    e.client_id    as string | null,
    performed_by: e.performed_by as string | null,
    metadata:     e.metadata     as Record<string, unknown> | null,
    created_at:   e.created_at   as string,
  }))

  return <AdminAuditTable entries={enriched} />
}
