'use client'

/**
 * app/admin/components/AdminInvitesTable.tsx
 *
 * Data table for invite token management.
 * Shows: email, role, status (pending/used/expired), dates.
 */

import { useState }   from 'react'
import { useColours } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition } from '@/styles/tokens'
import { spacing }    from '@/styles/tokens/spacing'

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

function inviteStatus(inv: Invite): { label: string; colour: string } {
  if (inv.used_at) return { label: 'Used', colour: '' } // filled in component
  if (new Date(inv.expires_at) < new Date()) return { label: 'Expired', colour: '' }
  return { label: 'Pending', colour: '' }
}

export default function AdminInvitesTable({ invites }: Props) {
  const colours = useColours()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const pending = invites.filter(i => !i.used_at && new Date(i.expires_at) >= new Date()).length
  const used    = invites.filter(i => !!i.used_at).length

  function statusColour(inv: Invite): string {
    const s = inviteStatus(inv)
    if (s.label === 'Used')    return colours.income
    if (s.label === 'Expired') return colours.danger
    return colours.warning
  }

  return (
    <div style={{ padding: spacing.panel.padding }}>

      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: fonts.serif,
          fontSize:   '24px',
          fontWeight: fontWeight.medium,
          color:      colours.textPrimary,
          margin:     0,
          marginBottom: '4px',
        }}>
          Invites
        </h1>
        <p style={{
          fontSize: fontSize.sm,
          color:    colours.textMuted,
          margin:   0,
        }}>
          {pending} pending · {used} accepted · {invites.length} total
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
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          padding:       '12px 20px',
          borderBottom:  `1px solid ${colours.borderHairline}`,
          background:    colours.hoverBg,
        }}>
          {['Email', 'Role', 'Status', 'Sent'].map(col => (
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
        {invites.length === 0 ? (
          <div style={{
            padding:   '40px 20px',
            textAlign: 'center',
            fontSize:  fontSize.sm,
            color:     colours.textMuted,
          }}>
            No invites sent yet.
          </div>
        ) : (
          invites.map(inv => {
            const status = inviteStatus(inv)
            return (
              <div
                key={inv.id}
                style={{
                  display:       'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding:       '12px 20px',
                  borderBottom:  `1px solid ${colours.borderHairline}`,
                  background:    hoveredRow === inv.id ? colours.hoverBg : 'transparent',
                  transition:    transition.snap,
                  alignItems:    'center',
                }}
                onMouseEnter={() => setHoveredRow(inv.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Email */}
                <div style={{
                  fontSize:   fontSize.base,
                  color:      colours.textPrimary,
                  fontFamily: fonts.mono,
                }}>
                  {inv.email}
                </div>

                {/* Role badge */}
                <div>
                  <span style={{
                    fontSize:      fontSize.label,
                    fontFamily:    fonts.mono,
                    letterSpacing: letterSpacing.wide,
                    color:         colours.textMuted,
                    background:    colours.borderLight,
                    padding:       '2px 7px',
                    borderRadius:  radius.xs,
                    textTransform: 'uppercase' as const,
                  }}>
                    {inv.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Status */}
                <div style={{
                  fontSize:   fontSize.xs,
                  fontFamily: fonts.mono,
                  color:      statusColour(inv),
                }}>
                  ● {status.label}
                </div>

                {/* Date */}
                <div style={{
                  fontSize:   fontSize.xs,
                  fontFamily: fonts.mono,
                  color:      colours.textMuted,
                }}>
                  {new Date(inv.created_at).toLocaleDateString('en-GB', {
                    day:   'numeric',
                    month: 'short',
                    year:  'numeric',
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
