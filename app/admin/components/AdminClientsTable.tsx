'use client'

/**
 * app/admin/components/AdminClientsTable.tsx
 *
 * Full-width data table for the admin clients view.
 * Dark theme — colours from useColours() (ThemeProvider wraps at layout).
 *
 * Design: clear column headers in mono uppercase, subtle horizontal
 * row separators, monospaced data cells, hover highlight per row.
 * Inspired by the Shoor data tables (images 3–4).
 */

import { useState }       from 'react'
import Link               from 'next/link'
import { useColours }     from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition } from '@/styles/tokens'
import { spacing }        from '@/styles/tokens/spacing'

// ─── Types ──────────────────────────────────────────────────────────────────

interface EnrichedClient {
  id:         string
  full_name:  string | null
  email:      string
  plan:       string
  accountant: string | null
  hasUtr:     boolean
  hasNi:      boolean
  created_at: string
}

interface Props {
  clients:          EnrichedClient[]
  totalAccountants: number
}

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label:   string
  value:   string | number
  accent?: string
}) {
  const colours = useColours()

  return (
    <div style={{
      background:    colours.panelBgSolid,
      border:        `1px solid ${colours.borderHairline}`,
      borderRadius:  radius.lg,
      padding:       '16px 20px',
      flex:          1,
      minWidth:      '140px',
    }}>
      <div style={{
        fontSize:      fontSize.label,
        fontFamily:    fonts.mono,
        letterSpacing: letterSpacing.wide,
        color:         colours.textMuted,
        textTransform: 'uppercase' as const,
        marginBottom:  '6px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:  fonts.sans,
        fontSize:    '24px',
        fontWeight:  fontWeight.medium,
        color:       accent ?? colours.textPrimary,
      }}>
        {value}
      </div>
    </div>
  )
}

// ─── Table ──────────────────────────────────────────────────────────────────

export default function AdminClientsTable({ clients, totalAccountants }: Props) {
  const colours = useColours()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const unassigned = clients.filter(c => !c.accountant).length
  const missingInfo = clients.filter(c => !c.hasUtr || !c.hasNi).length

  return (
    <div style={{ padding: spacing.panel.padding }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: fonts.sans,
          fontSize:   '24px',
          fontWeight: fontWeight.medium,
          color:      colours.textPrimary,
          margin:     0,
          marginBottom: '4px',
        }}>
          Clients
        </h1>
        <p style={{
          fontSize: fontSize.sm,
          color:    colours.textMuted,
          margin:   0,
        }}>
          All clients across the platform
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{
        display:  'flex',
        gap:      '12px',
        marginBottom: '24px',
        flexWrap: 'wrap' as const,
      }}>
        <StatCard label="Total Clients" value={clients.length} />
        <StatCard label="Accountants" value={totalAccountants} />
        <StatCard
          label="Unassigned"
          value={unassigned}
          accent={unassigned > 0 ? colours.warning : colours.income}
        />
        <StatCard
          label="Missing Info"
          value={missingInfo}
          accent={missingInfo > 0 ? colours.danger : colours.income}
        />
      </div>

      {/* ── Data table ── */}
      <div style={{
        background:   colours.panelBgSolid,
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.lg,
        overflow:     'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display:       'grid',
          gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr',
          padding:       '12px 20px',
          borderBottom:  `1px solid ${colours.borderHairline}`,
          background:    colours.hoverBg,
        }}>
          {['Client', 'Plan', 'Accountant', 'UTR', 'NI'].map(col => (
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

        {/* Data rows */}
        {clients.length === 0 ? (
          <div style={{
            padding:    '40px 20px',
            textAlign:  'center',
            fontSize:   fontSize.sm,
            color:      colours.textMuted,
          }}>
            No clients yet.
          </div>
        ) : (
          clients.map(client => (
            <Link
              key={client.id}
              href={`/accountant/clients/${client.id}`}
              style={{
                display:        'grid',
                gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr',
                padding:        '12px 20px',
                borderBottom:   `1px solid ${colours.borderHairline}`,
                textDecoration: 'none',
                background:     hoveredRow === client.id ? colours.hoverBg : 'transparent',
                transition:     transition.snap,
                cursor:         'pointer',
                alignItems:     'center',
              }}
              onMouseEnter={() => setHoveredRow(client.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Client name + email */}
              <div>
                <div style={{
                  fontSize:   fontSize.base,
                  fontWeight: fontWeight.medium,
                  color:      colours.textPrimary,
                  marginBottom: '1px',
                }}>
                  {client.full_name ?? '—'}
                </div>
                <div style={{
                  fontSize:   fontSize.xs,
                  color:      colours.textMuted,
                  fontFamily: fonts.mono,
                }}>
                  {client.email}
                </div>
              </div>

              {/* Plan badge */}
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
                  {client.plan}
                </span>
              </div>

              {/* Accountant */}
              <div style={{
                fontSize: fontSize.sm,
                color:    client.accountant ? colours.textSecondary : colours.warning,
              }}>
                {client.accountant ?? 'Unassigned'}
              </div>

              {/* UTR status */}
              <div style={{
                fontSize: fontSize.xs,
                color:    client.hasUtr ? colours.income : colours.danger,
                fontFamily: fonts.mono,
              }}>
                {client.hasUtr ? '✓' : '✗ Missing'}
              </div>

              {/* NI status */}
              <div style={{
                fontSize: fontSize.xs,
                color:    client.hasNi ? colours.income : colours.danger,
                fontFamily: fonts.mono,
              }}>
                {client.hasNi ? '✓' : '✗ Missing'}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
