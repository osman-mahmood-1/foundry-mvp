'use client'

/**
 * app/admin/components/AdminInvitesTable.tsx
 *
 * Data table for invite token management.
 * Pending rows: Withdraw button.
 * Pending + Expired rows: Resend button.
 * Used rows: no actions.
 */

import { useState }         from 'react'
import { useRouter }        from 'next/navigation'
import { useColours }       from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, space } from '@/styles/tokens'
import { spacing }          from '@/styles/tokens/spacing'
import SendInviteForm       from './SendInviteForm'
import { withdrawInvite, resendInvite } from '@/app/invite/actions'

interface Invite {
  id:         string
  role:       string
  email:      string
  used_at:    string | null
  expires_at: string
  created_at: string
}

interface Props {
  invites: Invite[]
}

function isPending(inv: Invite): boolean {
  return !inv.used_at && new Date(inv.expires_at) >= new Date()
}

function isExpired(inv: Invite): boolean {
  return !inv.used_at && new Date(inv.expires_at) < new Date()
}

function inviteStatus(inv: Invite): string {
  if (inv.used_at)  return 'Used'
  if (isExpired(inv)) return 'Expired'
  return 'Pending'
}

// ─── Shared button style helper ───────────────────────────────────────────────

function inlineBtn(colour: string, loading: boolean): React.CSSProperties {
  return {
    fontSize: fontSize.xs, fontFamily: fonts.sans, color: colour,
    background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    padding: 0, textDecoration: 'underline', transition: transition.snap,
    opacity: loading ? 0.5 : 1,
  }
}

// ─── Withdraw button ──────────────────────────────────────────────────────────

function WithdrawButton({ inviteId }: { inviteId: string }) {
  const colours = useColours()
  const router  = useRouter()
  const [stage, setStage] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setStage('loading')
    const result = await withdrawInvite(inviteId)
    if (result.success) { router.refresh() }
    else { setError(result.error ?? 'Failed.'); setStage('idle') }
  }

  if (stage === 'confirm') {
    return (
      <div style={{ display: 'flex', gap: space[2], alignItems: 'center' }}>
        <button onClick={handleConfirm} style={{
          fontSize: fontSize.xs, fontFamily: fonts.sans, fontWeight: fontWeight.medium,
          color: colours.white, background: colours.danger, border: 'none',
          borderRadius: radius.sm, padding: `${space[1]} ${space[2]}`, cursor: 'pointer',
        }}>Confirm</button>
        <button onClick={() => setStage('idle')} style={inlineBtn(colours.textMuted, false)}>Cancel</button>
        {error && <span style={{ fontSize: fontSize.xs, color: colours.danger }}>{error}</span>}
      </div>
    )
  }

  return (
    <button onClick={() => setStage('confirm')} disabled={stage === 'loading'}
      style={inlineBtn(colours.textMuted, stage === 'loading')}>
      {stage === 'loading' ? 'Withdrawing…' : 'Withdraw'}
    </button>
  )
}

// ─── Resend button ────────────────────────────────────────────────────────────

function ResendButton({ inviteId }: { inviteId: string }) {
  const colours = useColours()
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [sent,    setSent]     = useState(false)

  async function handleResend() {
    setLoading(true)
    setError(null)
    const result = await resendInvite(inviteId)
    if (result.success) {
      setSent(true)
      router.refresh()
    } else {
      setError(result.error ?? 'Failed.')
    }
    setLoading(false)
  }

  if (sent) {
    return <span style={{ fontSize: fontSize.xs, color: colours.income, fontFamily: fonts.mono }}>✓ Sent</span>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: space[1] }}>
      <button onClick={handleResend} disabled={loading} style={inlineBtn(colours.accent, loading)}>
        {loading ? 'Sending…' : 'Resend'}
      </button>
      {error && <span style={{ fontSize: fontSize.xs, color: colours.danger, fontFamily: fonts.mono }}>{error}</span>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminInvitesTable({ invites }: Props) {
  const colours = useColours()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const pending = invites.filter(isPending).length
  const used    = invites.filter(i => !!i.used_at).length

  function statusColour(inv: Invite): string {
    const s = inviteStatus(inv)
    if (s === 'Used')    return colours.income
    if (s === 'Expired') return colours.danger
    return colours.warning
  }

  return (
    <div style={{ padding: spacing.panel.padding }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: fonts.sans, fontSize: '24px', fontWeight: fontWeight.medium,
          color: colours.textPrimary, margin: 0, marginBottom: '4px',
        }}>Invites</h1>
        <p style={{ fontSize: fontSize.sm, color: colours.textMuted, margin: 0 }}>
          {pending} pending · {used} accepted · {invites.length} total
        </p>
      </div>

      <div style={{
        background: colours.panelBgSolid, border: `1px solid ${colours.borderHairline}`,
        borderRadius: radius.lg, overflow: 'hidden',
      }}>
        <SendInviteForm />

        {/* Header — email | role | status | sent | actions */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 160px',
          padding: '12px 20px', borderBottom: `1px solid ${colours.borderHairline}`,
          background: colours.hoverBg,
        }}>
          {['Email', 'Role', 'Status', 'Sent', ''].map((col, i) => (
            <div key={i} style={{
              fontSize: fontSize.label, fontFamily: fonts.mono,
              letterSpacing: letterSpacing.wide, color: colours.textMuted,
              textTransform: 'uppercase' as const,
            }}>{col}</div>
          ))}
        </div>

        {invites.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: fontSize.sm, color: colours.textMuted }}>
            No invites sent yet.
          </div>
        ) : (
          invites.map(inv => (
            <div
              key={inv.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 160px',
                padding: '12px 20px', borderBottom: `1px solid ${colours.borderHairline}`,
                background: hoveredRow === inv.id ? colours.hoverBg : 'transparent',
                transition: transition.snap, alignItems: 'center',
              }}
              onMouseEnter={() => setHoveredRow(inv.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <div style={{ fontSize: fontSize.base, color: colours.textPrimary, fontFamily: fonts.mono }}>
                {inv.email}
              </div>
              <div>
                <span style={{
                  fontSize: fontSize.label, fontFamily: fonts.mono,
                  letterSpacing: letterSpacing.wide, color: colours.textMuted,
                  background: colours.borderLight, padding: '2px 7px',
                  borderRadius: radius.xs, textTransform: 'uppercase' as const,
                }}>
                  {inv.role.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: fontSize.xs, fontFamily: fonts.mono, color: statusColour(inv) }}>
                ● {inviteStatus(inv)}
              </div>
              <div style={{ fontSize: fontSize.xs, fontFamily: fonts.mono, color: colours.textMuted }}>
                {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Actions — Resend on pending+expired, Withdraw on pending only */}
              <div style={{ display: 'flex', gap: space[3], alignItems: 'center' }}>
                {(isPending(inv) || isExpired(inv)) && <ResendButton inviteId={inv.id} />}
                {isPending(inv) && <WithdrawButton inviteId={inv.id} />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
