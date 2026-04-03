'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendInviteMagicLink, acceptInvite } from '../actions'
import type { InviteTokenData, TokenError } from '../actions'

// ─── Design tokens (matches portal design language) ──────────────────────────

const bg     = 'radial-gradient(ellipse at 60% 30%, rgba(255,200,80,0.06) 0%, transparent 60%), #0a0a0a'
const card   = 'rgba(255,255,255,0.035)'
const border = 'rgba(255,255,255,0.08)'
const gold   = '#C8963E'
const muted  = 'rgba(255,255,255,0.4)'
const text   = 'rgba(255,255,255,0.88)'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  token: string
  tokenData: InviteTokenData | null
  tokenError: TokenError | null
  currentUserEmail: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InviteClient({ token, tokenData, tokenError, currentUserEmail }: Props) {
  const router = useRouter()

  const [magicLinkSent, setMagicLinkSent]   = useState(false)
  const [accepting, setAccepting]           = useState(false)
  const [errorMsg, setErrorMsg]             = useState<string | null>(null)

  const roleLabel = tokenData?.role === 'platform_editor' ? 'Platform Editor' : 'Accountant'

  // ─── Token invalid ──────────────────────────────────────────────────────────
  if (tokenError || !tokenData) {
    const message =
      tokenError === 'used'    ? 'This invite link has already been used.' :
      tokenError === 'expired' ? 'This invite link has expired. Ask the sender to resend it.' :
                                 'This invite link is invalid or could not be found.'
    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.3 }}>✕</div>
          <div style={{ fontSize: '18px', color: text, marginBottom: '8px' }}>Invite unavailable</div>
          <div style={{ fontSize: '14px', color: muted, maxWidth: '320px', lineHeight: 1.6 }}>{message}</div>
        </div>
      </Shell>
    )
  }

  // ─── Signed in — right email → accept ──────────────────────────────────────
  if (currentUserEmail && currentUserEmail.toLowerCase() === tokenData.email.toLowerCase()) {
    async function handleAccept() {
      setAccepting(true)
      setErrorMsg(null)
      const result = await acceptInvite(token)
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo)
      } else {
        setErrorMsg(result.error ?? 'Something went wrong.')
        setAccepting(false)
      }
    }

    return (
      <Shell>
        <RoleBadge role={roleLabel} />
        <h1 style={styles.heading}>You're invited</h1>
        <p style={styles.sub}>
          You've been invited to join Tax Foundry as a <strong style={{ color: text }}>{roleLabel}</strong>.
          Your account will be set up immediately.
        </p>
        <InfoRow label="Email" value={tokenData.email} />
        <InfoRow label="Access" value={roleLabel} />
        {errorMsg && <ErrorBanner>{errorMsg}</ErrorBanner>}
        <button
          onClick={handleAccept}
          disabled={accepting}
          style={{ ...styles.btn, opacity: accepting ? 0.5 : 1 }}
        >
          {accepting ? 'Setting up your account…' : 'Accept invite & continue'}
        </button>
      </Shell>
    )
  }

  // ─── Signed in — wrong email ────────────────────────────────────────────────
  if (currentUserEmail) {
    return (
      <Shell>
        <RoleBadge role={roleLabel} />
        <h1 style={styles.heading}>Wrong account</h1>
        <p style={styles.sub}>
          This invite was sent to <strong style={{ color: text }}>{tokenData.email}</strong>. You're
          currently signed in as <strong style={{ color: text }}>{currentUserEmail}</strong>.
        </p>
        <p style={{ ...styles.sub, marginTop: '8px' }}>
          Sign out and sign in with the invited address to continue.
        </p>
      </Shell>
    )
  }

  // ─── Not signed in → send magic link ───────────────────────────────────────
  if (magicLinkSent) {
    return (
      <Shell>
        <div style={{ fontSize: '28px', marginBottom: '16px' }}>✉️</div>
        <h1 style={styles.heading}>Check your email</h1>
        <p style={styles.sub}>
          We sent a sign-in link to <strong style={{ color: text }}>{tokenData.email}</strong>.
          Click the link in the email to complete your setup.
        </p>
        <p style={{ ...styles.sub, marginTop: '12px', fontSize: '12px', color: muted }}>
          The link expires in 10 minutes. If you don't see it, check your spam folder.
        </p>
      </Shell>
    )
  }

  async function handleSendLink() {
    setAccepting(true)
    setErrorMsg(null)
    const result = await sendInviteMagicLink(tokenData!.email, token)
    if (result.error) {
      setErrorMsg(result.error)
      setAccepting(false)
    } else {
      setMagicLinkSent(true)
    }
  }

  return (
    <Shell>
      <RoleBadge role={roleLabel} />
      <h1 style={styles.heading}>You're invited</h1>
      <p style={styles.sub}>
        You've been invited to join Tax Foundry as a{' '}
        <strong style={{ color: text }}>{roleLabel}</strong>.
        Click below to receive a sign-in link at:
      </p>
      <InfoRow label="Email" value={tokenData.email} />
      {errorMsg && <ErrorBanner>{errorMsg}</ErrorBanner>}
      <button
        onClick={handleSendLink}
        disabled={accepting}
        style={{ ...styles.btn, opacity: accepting ? 0.5 : 1 }}
      >
        {accepting ? 'Sending…' : `Send sign-in link to ${tokenData.email}`}
      </button>
      <p style={{ ...styles.sub, marginTop: '16px', fontSize: '12px', color: muted }}>
        This invite expires 48 hours after it was sent and can only be used once.
      </p>
    </Shell>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '440px', background: card, border: `1px solid ${border}`, borderRadius: '16px', padding: '40px 36px' }}>
        <div style={{ marginBottom: '24px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em', color: gold, textTransform: 'uppercase' }}>
          Tax Foundry
        </div>
        {children}
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <div style={{ display: 'inline-block', background: 'rgba(200,150,62,0.1)', border: '1px solid rgba(200,150,62,0.25)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: gold, marginBottom: '20px', letterSpacing: '0.04em' }}>
      {role}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${border}`, borderRadius: '8px', marginBottom: '12px' }}>
      <span style={{ fontSize: '13px', color: muted }}>{label}</span>
      <span style={{ fontSize: '13px', color: text }}>{value}</span>
    </div>
  )
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(200,62,62,0.08)', border: '1px solid rgba(200,62,62,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#C86262', lineHeight: 1.5 }}>
      {children}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  heading: {
    fontSize: '22px',
    fontWeight: 600,
    color: text,
    margin: '0 0 12px',
    lineHeight: 1.3,
  } as React.CSSProperties,
  sub: {
    fontSize: '14px',
    color: muted,
    lineHeight: 1.7,
    margin: '0 0 20px',
  } as React.CSSProperties,
  btn: {
    width: '100%',
    padding: '12px 20px',
    background: gold,
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0a0a0a',
    cursor: 'pointer',
    marginTop: '8px',
    letterSpacing: '0.01em',
  } as React.CSSProperties,
}
