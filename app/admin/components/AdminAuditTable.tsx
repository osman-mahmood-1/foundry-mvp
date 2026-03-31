'use client'

/**
 * app/admin/components/AdminAuditTable.tsx
 *
 * Data table for audit log entries.
 * Shows: action, table, actor, timestamp.
 * Most recent 100 entries.
 */

import { useState }   from 'react'
import { useColours } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition } from '@/styles/tokens'
import { spacing }    from '@/styles/tokens/spacing'

interface AuditEntry {
  id:           string
  action:       string
  table_name:   string
  record_id:    string | null
  client_id:    string | null
  performed_by: string | null
  metadata:     Record<string, unknown> | null
  created_at:   string
}

interface Props {
  entries: AuditEntry[]
}

function actionColour(action: string, colours: ReturnType<typeof useColours>): string {
  if (action === 'created') return colours.income
  if (action === 'updated') return colours.info
  if (action === 'deleted') return colours.danger
  return colours.textMuted
}

export default function AdminAuditTable({ entries }: Props) {
  const colours = useColours()
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

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
          Audit Log
        </h1>
        <p style={{
          fontSize: fontSize.sm,
          color:    colours.textMuted,
          margin:   0,
        }}>
          Most recent {entries.length} entries
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
          gridTemplateColumns: '1fr 1fr 1.5fr 2fr',
          padding:       '12px 20px',
          borderBottom:  `1px solid ${colours.borderHairline}`,
          background:    colours.hoverBg,
        }}>
          {['Action', 'Table', 'Actor', 'Time'].map(col => (
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
        {entries.length === 0 ? (
          <div style={{
            padding:   '40px 20px',
            textAlign: 'center',
            fontSize:  fontSize.sm,
            color:     colours.textMuted,
          }}>
            No audit entries yet.
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              style={{
                display:       'grid',
                gridTemplateColumns: '1fr 1fr 1.5fr 2fr',
                padding:       '10px 20px',
                borderBottom:  `1px solid ${colours.borderHairline}`,
                background:    hoveredRow === entry.id ? colours.hoverBg : 'transparent',
                transition:    transition.snap,
                alignItems:    'center',
              }}
              onMouseEnter={() => setHoveredRow(entry.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Action */}
              <div style={{
                fontSize:   fontSize.xs,
                fontFamily: fonts.mono,
                color:      actionColour(entry.action, colours),
              }}>
                {entry.action}
              </div>

              {/* Table */}
              <div style={{
                fontSize:   fontSize.xs,
                fontFamily: fonts.mono,
                color:      colours.textSecondary,
              }}>
                {entry.table_name}
              </div>

              {/* Actor (truncated user ID) */}
              <div style={{
                fontSize:     fontSize.xs,
                fontFamily:   fonts.mono,
                color:        colours.textMuted,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap' as const,
              }}>
                {entry.performed_by ? entry.performed_by.slice(0, 12) + '…' : '—'}
              </div>

              {/* Timestamp */}
              <div style={{
                fontSize:   fontSize.xs,
                fontFamily: fonts.mono,
                color:      colours.textMuted,
              }}>
                {new Date(entry.created_at).toLocaleString('en-GB', {
                  day:    'numeric',
                  month:  'short',
                  hour:   '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
