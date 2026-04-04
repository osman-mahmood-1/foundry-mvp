'use client'

/**
 * app/admin/components/AdminAccountantsTable.tsx
 *
 * Data table for accountant management.
 * Active accountants have a two-stage Revoke Access button.
 */

import { useState }                from 'react'
import { useRouter }               from 'next/navigation'
import { useColours }              from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, space } from '@/styles/tokens'
import { spacing }                 from '@/styles/tokens/spacing'
import { revokeAccountantAccess }  from '@/app/admin/actions'

interface EnrichedAccountant {
  id:          string
  full_name:   string | null
  email:       string
  firm_name:   string | null
  is_active:   boolean
  clientCount: number
  created_at:  string
}

interface Props {
  accountants: EnrichedAccountant[]
}

// ─── Two-stage Revoke button ──────────────────────────────────────────────────

function RevokeButton({ accountantId }: { accountantId: string }) {
  const colours = useColours()
  const router  = useRouter()
  const [stage, setStage] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setStage('loading')
    setError(null)
    const result = await revokeAccountantAccess(accountantId)
    if (result.success) {
      router.refresh()
    } else {
      setError(result.error ?? 'Failed.')
      setStage('idle')
    }
  }

  if (stage === 'confirm') {
    return (
      <div style={{ display: 'flex', gap: space[2], alignItems: 'center', flexWrap: 'wrap' as const }}>
        <button
          onClick={handleConfirm}
          style={{
            fontSize: fontSize.xs, fontFamily: fonts.sans, fontWeight: fontWeight.medium,
            color: colours.white, background: colours.danger, border: 'none',
            borderRadius: radius.sm, padding: `${space[1]} ${space[2]}`,
            cursor: 'pointer', transition: transition.snap, whiteSpace: 'nowrap' as const,
          }}
        >
          Confirm revoke
        </button>
        <button
          onClick={() => setStage('idle')}
          style={{
            fontSize: fontSize.xs, fontFamily: fonts.sans, color: colours.textMuted,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          Cancel
        </button>
        {error && (
          <span style={{ fontSize: fontSize.xs, color: colours.danger, fontFamily: fonts.mono }}>
            {error}
          </span>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setStage('confirm')}
      disabled={stage === 'loading'}
      style={{
        fontSize: fontSize.xs, fontFamily: fonts.sans, color: colours.danger,
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        textDecoration: 'underline', transition: transition.snap,
        opacity: stage === 'loading' ? 0.5 : 1,
      }}
    >
      {stage === 'loading' ? 'Revoking…' : 'Revoke access'}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAccountantsTable({ accountants }: Props) {
  const colours = useColours()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const active   = accountants.filter(a => a.is_active).length
  const inactive = accountants.length - active

  return (
    <div style={{ padding: spacing.panel.padding }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: fonts.sans, fontSize: '24px', fontWeight: fontWeight.medium,
          color: colours.textPrimary, margin: 0, marginBottom: '4px',
        }}>
          Accountants
        </h1>
        <p style={{ fontSize: fontSize.sm, color: colours.textMuted, margin: 0 }}>
          {active} active{inactive > 0 ? `, ${inactive} deactivated` : ''}
        </p>
      </div>

      <div style={{
        background: colours.panelBgSolid, border: `1px solid ${colours.borderHairline}`,
        borderRadius: radius.lg, overflow: 'hidden',
      }}>
        {/* Header — 6 columns: accountant, firm, clients, status, joined, action */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.75fr 0.75fr 0.75fr 140px',
          padding: '12px 20px', borderBottom: `1px solid ${colours.borderHairline}`,
          background: colours.hoverBg,
        }}>
          {['Accountant', 'Firm', 'Clients', 'Status', 'Joined', ''].map((col, i) => (
            <div key={i} style={{
              fontSize: fontSize.label, fontFamily: fonts.mono,
              letterSpacing: letterSpacing.wide, color: colours.textMuted,
              textTransform: 'uppercase' as const,
            }}>
              {col}
            </div>
          ))}
        </div>

        {accountants.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: fontSize.sm, color: colours.textMuted }}>
            No accountants yet. Send an invite to get started.
          </div>
        ) : (
          accountants.map(acct => (
            <div
              key={acct.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 0.75fr 0.75fr 0.75fr 140px',
                padding: '12px 20px', borderBottom: `1px solid ${colours.borderHairline}`,
                background: hoveredRow === acct.id ? colours.hoverBg : 'transparent',
                transition: transition.snap, alignItems: 'center',
              }}
              onMouseEnter={() => setHoveredRow(acct.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Name + email */}
              <div>
                <div style={{
                  fontSize: fontSize.base, fontWeight: fontWeight.medium,
                  color: acct.is_active ? colours.textPrimary : colours.textMuted,
                  marginBottom: '1px',
                }}>
                  {acct.full_name ?? '—'}
                </div>
                <div style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.mono }}>
                  {acct.email}
                </div>
              </div>

              {/* Firm */}
              <div style={{ fontSize: fontSize.sm, color: colours.textSecondary }}>
                {acct.firm_name ?? '—'}
              </div>

              {/* Client count */}
              <div style={{
                fontSize: fontSize.base, fontFamily: fonts.mono,
                color: acct.clientCount > 0 ? colours.textPrimary : colours.textMuted,
              }}>
                {acct.clientCount}
              </div>

              {/* Status */}
              <div style={{
                fontSize: fontSize.xs, fontFamily: fonts.mono,
                color: acct.is_active ? colours.income : colours.danger,
              }}>
                {acct.is_active ? '● Active' : '● Inactive'}
              </div>

              {/* Joined */}
              <div style={{ fontSize: fontSize.xs, fontFamily: fonts.mono, color: colours.textMuted }}>
                {new Date(acct.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Action — only on active accountants */}
              <div>
                {acct.is_active && <RevokeButton accountantId={acct.id} />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
