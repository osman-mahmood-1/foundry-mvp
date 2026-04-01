'use client'

/**
 * app/admin/components/AdminAccountantsTable.tsx
 *
 * Data table for accountant management.
 * Shows: name, firm, client count, status, join date.
 */

import { useState }   from 'react'
import { useColours } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition } from '@/styles/tokens'
import { spacing }    from '@/styles/tokens/spacing'

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

export default function AdminAccountantsTable({ accountants }: Props) {
  const colours = useColours()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const active   = accountants.filter(a => a.is_active).length
  const inactive = accountants.length - active

  return (
    <div style={{ padding: spacing.panel.padding }}>

      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: fonts.sans,
          fontSize:   '24px',
          fontWeight: fontWeight.medium,
          color:      colours.textPrimary,
          margin:     0,
          marginBottom: '4px',
        }}>
          Accountants
        </h1>
        <p style={{
          fontSize: fontSize.sm,
          color:    colours.textMuted,
          margin:   0,
        }}>
          {active} active{inactive > 0 ? `, ${inactive} deactivated` : ''}
        </p>
      </div>

      {/* Table */}
      <div style={{
        background:   colours.panelBgSolid,
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.lg,
        overflow:     'hidden',
      }}>
        {/* Header */}
        <div style={{
          display:       'grid',
          gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
          padding:       '12px 20px',
          borderBottom:  `1px solid ${colours.borderHairline}`,
          background:    colours.hoverBg,
        }}>
          {['Accountant', 'Firm', 'Clients', 'Status', 'Joined'].map(col => (
            <div key={col} style={{
              fontSize:      fontSize.label,
              fontFamily:    fonts.mono,
              letterSpacing: letterSpacing.wide,
              color:         colours.textMuted,
              textTransform: 'uppercase' as const,
            }}>
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {accountants.length === 0 ? (
          <div style={{
            padding:   '40px 20px',
            textAlign: 'center',
            fontSize:  fontSize.sm,
            color:     colours.textMuted,
          }}>
            No accountants yet. Send an invite to get started.
          </div>
        ) : (
          accountants.map(acct => (
            <div
              key={acct.id}
              style={{
                display:       'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
                padding:       '12px 20px',
                borderBottom:  `1px solid ${colours.borderHairline}`,
                background:    hoveredRow === acct.id ? colours.hoverBg : 'transparent',
                transition:    transition.snap,
                alignItems:    'center',
              }}
              onMouseEnter={() => setHoveredRow(acct.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Name + email */}
              <div>
                <div style={{
                  fontSize:   fontSize.base,
                  fontWeight: fontWeight.medium,
                  color:      acct.is_active ? colours.textPrimary : colours.textMuted,
                  marginBottom: '1px',
                }}>
                  {acct.full_name ?? '—'}
                </div>
                <div style={{
                  fontSize:   fontSize.xs,
                  color:      colours.textMuted,
                  fontFamily: fonts.mono,
                }}>
                  {acct.email}
                </div>
              </div>

              {/* Firm */}
              <div style={{ fontSize: fontSize.sm, color: colours.textSecondary }}>
                {acct.firm_name ?? '—'}
              </div>

              {/* Client count */}
              <div style={{
                fontSize:   fontSize.base,
                fontFamily: fonts.mono,
                color:      acct.clientCount > 0 ? colours.textPrimary : colours.textMuted,
              }}>
                {acct.clientCount}
              </div>

              {/* Status */}
              <div style={{
                fontSize:   fontSize.xs,
                fontFamily: fonts.mono,
                color:      acct.is_active ? colours.income : colours.danger,
              }}>
                {acct.is_active ? '● Active' : '● Inactive'}
              </div>

              {/* Joined */}
              <div style={{
                fontSize:   fontSize.xs,
                fontFamily: fonts.mono,
                color:      colours.textMuted,
              }}>
                {new Date(acct.created_at).toLocaleDateString('en-GB', {
                  day:   'numeric',
                  month: 'short',
                  year:  'numeric',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
