/**
 * app/admin/invites/page.tsx
 *
 * Admin — Invite management page.
 * Shows all invite tokens: pending, used, and expired.
 * Allows sending new invites for accountants and platform editors.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import AdminInvitesTable     from '../components/AdminInvitesTable'

export const dynamic = 'force-dynamic'

export default async function AdminInvitesPage() {
  const admin = createAdminClient()

  const { data: invites } = await admin
    .from('invite_tokens')
    .select('id, token, role, email, used_at, expires_at, created_at')
    .order('created_at', { ascending: false })

  const enriched = (invites ?? []).map(inv => ({
    id:         inv.id         as string,
    role:       inv.role       as string,
    email:      inv.email      as string,
    used_at:    inv.used_at    as string | null,
    expires_at: inv.expires_at as string,
    created_at: inv.created_at as string,
  }))

  return <AdminInvitesTable invites={enriched} />
}
