'use client'

/**
 * app/portal/page.tsx
 *
 * Entry point for the authenticated portal.
 * Responsibilities:
 *   1. Verify the user is authenticated — redirect to /login if not
 *   2. Load the client record from Supabase
 *   3. Redirect to /onboarding if onboarding is incomplete
 *   4. Hand off to PortalShell with the client record
 *
 * This file does nothing else. No UI. No data transformation.
 * All layout and tab rendering lives in PortalShell.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import PortalShell from './components/PortalShell'
import type { Client } from '@/types'

export default function PortalPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadClient() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!clientData?.onboarding_complete) {
        window.location.href = '/onboarding'
        return
      }

      setClient(clientData as Client)
      setLoading(false)
    }

    loadClient()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#F0F4FA',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width:        '32px',
          height:       '32px',
          border:       '2px solid rgba(5,28,44,0.1)',
          borderTop:    '2px solid #051C2C',
          borderRadius: '50%',
          animation:    'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!client) return null

  return <PortalShell client={client} />
}
