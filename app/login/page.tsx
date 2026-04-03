'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import type { AppError } from '@/lib/errors'

// ─── Error banner for the login page ─────────────────────────────────────────
// Inline version — login page has no access to portal UI primitives.

function LoginErrorBanner({ error }: { error: AppError }) {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(error.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background:   'rgba(255,183,0,0.08)',
      border:       '1px solid rgba(255,183,0,0.25)',
      borderLeft:   '3px solid rgba(255,183,0,0.6)',
      borderRadius: '10px',
      padding:      '12px 14px',
      marginBottom: '20px',
      display:      'flex',
      alignItems:   'flex-start',
      gap:          '12px',
      justifyContent: 'space-between',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#E8C87A', fontWeight: 500, fontSize: '13px', marginBottom: '2px' }}>
          {error.title}
        </div>
        <div style={{ color: '#8A9BB0', fontSize: '13px', lineHeight: 1.5 }}>
          {error.message}
          {error.action && (
            <span style={{ color: '#6B7F91' }}> {error.action}</span>
          )}
        </div>
      </div>
      <button
        onClick={copyCode}
        title="Copy reference code"
        style={{
          fontFamily:    'monospace',
          fontSize:      '10px',
          color:         copied ? '#4CAF50' : 'rgba(255,183,0,0.5)',
          background:    'transparent',
          border:        `1px solid ${copied ? '#4CAF50' : 'rgba(255,183,0,0.25)'}`,
          borderRadius:  '6px',
          padding:       '3px 8px',
          cursor:        'pointer',
          flexShrink:    0,
          whiteSpace:    'nowrap',
          alignSelf:     'flex-start',
        }}
      >
        {copied ? '✓ copied' : error.code}
      </button>
    </div>
  )
}

// ─── Inner page (uses useSearchParams — must be inside Suspense) ───────────────

function LoginInner() {
  const searchParams = useSearchParams()
  const errorCode    = searchParams.get('error')
  const authError    = errorCode && errorCode in APP_ERRORS
    ? APP_ERRORS[errorCode as keyof typeof APP_ERRORS]
    : null

  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)

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
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#051C2C', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>Check your email</h1>
          <p style={{ color: '#8A9BB0' }}>We sent a magic link to <strong>{email}</strong></p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#051C2C', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontFamily: 'Georgia, serif', marginBottom: '8px' }}>Sign in</h1>
        <p style={{ color: '#8A9BB0', marginBottom: '32px' }}>Enter your email and we will send you a magic link</p>

        {authError && <LoginErrorBanner error={authError} />}

        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{ width: '100%', padding: '12px 16px', backgroundColor: '#0D2035', border: '1px solid #1B3A52', borderRadius: '10px', color: 'white', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <button
          onClick={handleLogin}
          disabled={loading || !email}
          style={{ width: '100%', padding: '12px', backgroundColor: '#0D5EAF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: loading || !email ? 'not-allowed' : 'pointer', opacity: loading || !email ? 0.6 : 1 }}
        >
          {loading ? 'Sending...' : 'Send magic link'}
        </button>
      </div>
    </div>
  )
}

// ─── Page export ─────────────────────────────────────────────────────────────
// useSearchParams requires Suspense boundary in Next.js App Router.

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
