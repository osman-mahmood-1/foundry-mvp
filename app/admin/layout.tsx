/**
 * app/admin/layout.tsx
 *
 * Server-component layout for the platform editor portal.
 * Wraps every /admin/* route in ThemeProvider (dark) + AdminShell.
 *
 * Responsibilities:
 *   1. Verify the user session — redirect to /login if missing
 *   2. Verify the user has platform_editor role via JWT app_metadata
 *   3. Load the PlatformEditor record via admin client
 *   4. Wrap children in <ThemeProvider theme="dark"> + <AdminShell>
 *
 * Security: the proxy middleware has already enforced the route guard.
 * This layout is a second layer of verification before any data loads.
 *
 * force-dynamic: always server-rendered — serves authenticated, personalised data.
 */

import { redirect }           from 'next/navigation'
import { createClient }       from '@/lib/supabase-server'
import { createAdminClient }  from '@/lib/supabase-admin'
import { getUserRole }        from '@/lib/roles'
import PortalThemeProvider    from '@/app/portal/components/PortalThemeProvider'
import AdminShell             from './components/AdminShell'
import type { PlatformEditor } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ── Auth check ──────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Role check ──────────────────────────────────────────────────────────
  const role = getUserRole(user)
  if (role !== 'platform_editor') redirect('/login')

  // ── PlatformEditor record ───────────────────────────────────────────────
  const admin = createAdminClient()
  const { data: editorRows } = await admin
    .from('platform_editors')
    .select('*')
    .eq('user_id', user.id)
    .is('deactivated_at', null)
    .limit(1)

  const editor = (editorRows?.[0] ?? null) as PlatformEditor | null
  if (!editor) redirect('/login')

  return (
    <PortalThemeProvider storageKey="foundry-theme" defaultMode="system" forceMode="light">
      <AdminShell editor={editor}>
        {children}
      </AdminShell>
    </PortalThemeProvider>
  )
}
