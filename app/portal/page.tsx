/**
 * app/portal/page.tsx
 *
 * Server component entry point for the authenticated portal.
 *
 * Responsibilities:
 *   1. Verify the user session server-side — redirect to /login if not authenticated
 *   2. Load the client record from Supabase using the server client
 *   3. Redirect to /onboarding if onboarding is incomplete
 *   4. Hand off to PortalShell (client component) with the typed client record
 *
 * This file does nothing else. No UI. No data transformation.
 * All layout and tab rendering lives in PortalShell.
 *
 * force-dynamic: this page is always server-rendered on demand.
 * It must never be statically generated — it serves authenticated,
 * personalised data.
 */

import { redirect }           from 'next/navigation'
import { createClient }       from '@/lib/supabase-server'
import PortalThemeProvider    from './components/PortalThemeProvider'
import PortalShell            from './components/PortalShell'
import type { Client }        from '@/types'

export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  const supabase = await createClient()

  // ── Auth check ────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Client record ─────────────────────────────────────────────
  // .limit(1) instead of .single() — prevents a crash if duplicate records
  // exist (e.g. a double-submit on mobile during onboarding). Always picks
  // the most recently created record.
  const { data: clientRows } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  const clientData = clientRows?.[0] ?? null

  // ── Onboarding guard ──────────────────────────────────────────
  if (!clientData?.onboarding_complete) redirect('/onboarding')

  return (
    <PortalThemeProvider>
      <PortalShell client={clientData as Client} />
    </PortalThemeProvider>
  )
}