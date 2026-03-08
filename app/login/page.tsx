'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#051C2C', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Check your email</h1>
          <p style={{ color: '#8A9BB0' }}>We sent a magic link to <strong>{email}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#051C2C', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>Sign in</h1>
        <p style={{ color: '#8A9BB0', marginBottom: '32px' }}>Enter your email and we will send you a magic link</p>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0D2035', border: '1px solid #1B3A52', borderRadius: '8px', color: 'white', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <button
          onClick={handleLogin}
          disabled={loading || !email}
          style={{ width: '100%', padding: '12px', backgroundColor: '#0D5EAF', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: loading || !email ? 'not-allowed' : 'pointer', opacity: loading || !email ? 0.6 : 1 }}
        >
          {loading ? 'Sending...' : 'Send magic link'}
        </button>
      </div>
    </div>
  )
}