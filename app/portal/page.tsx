'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../lib/supabase'
import PortalShell from './components/PortalShell'

export default function PortalPage() {
  const [client, setClient] = useState<any>(null)
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

      setClient(clientData)
      setLoading(false)
    }

    loadClient()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#F0F4FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '2px solid rgba(5,28,44,0.1)',
            borderTop: '2px solid #051C2C',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  return <PortalShell client={client} />
}
