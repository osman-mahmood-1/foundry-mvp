'use client'

/**
 * app/portal/components/mobile/MobileTransactionRow.tsx
 *
 * Single row with tap-to-expand inline detail panel.
 * Auto-collapses via IntersectionObserver when < 20% visible.
 * Only one row can be expanded at a time (controlled by parent via expandedId).
 */

import { useRef, useEffect } from 'react'
import { useColours }         from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }             from '@/styles/tokens'

export interface TxRowData {
  id:          string
  type:        'income' | 'expense'
  description: string
  amount:      number   // pence
  date:        string
  category:    string
  source?:     string
  status?:     string
}

interface Props {
  tx:          TxRowData
  isLast:      boolean
  expandedId:  string | null
  onExpand:    (id: string | null) => void
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function catLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function MobileTransactionRow({ tx, isLast, expandedId, onExpand }: Props) {
  const colours   = useColours()
  const expanded  = expandedId === tx.id
  const rowRef    = useRef<HTMLDivElement>(null)
  const isIncome  = tx.type === 'income'
  const amtColour = isIncome ? colours.income : colours.expense

  // Auto-collapse via IntersectionObserver
  useEffect(() => {
    if (!expanded || !rowRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.2) onExpand(null)
      },
      { threshold: 0.2 },
    )
    observer.observe(rowRef.current)
    return () => observer.disconnect()
  }, [expanded, onExpand])

  // Scroll expanded panel into view
  useEffect(() => {
    if (expanded && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [expanded])

  return (
    <div
      ref={rowRef}
      style={{
        borderBottom: isLast && !expanded ? 'none' : `1px solid ${colours.borderHairline}`,
      }}
    >
      {/* Row */}
      <div
        onClick={() => onExpand(expanded ? null : tx.id)}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '12px',
          padding:     '12px 16px',
          minHeight:   '48px',
          cursor:      'pointer',
          background:  expanded ? colours.accentSoft : 'transparent',
          transition:  'background 0.15s ease',
        }}
      >
        {/* Category dot */}
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   radius.sm,
          background:     isIncome ? colours.incomeLight : colours.expenseLight,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '13px',
          color:          amtColour,
          flexShrink:     0,
        }}>
          {isIncome ? '↑' : '↓'}
        </div>

        {/* Description + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily:   fonts.sans,
            fontSize:     '14px',
            fontWeight:   fontWeight.medium,
            color:        colours.textPrimary,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap' as const,
          }}>
            {tx.description}
          </div>
          <div style={{
            fontFamily: fonts.sans,
            fontSize:   '12px',
            fontWeight: 300,
            color:      colours.textMuted,
            marginTop:  '2px',
          }}>
            {formatDate(tx.date)}
          </div>
        </div>

        {/* Amount */}
        <div style={{
          fontFamily:         fonts.sans,
          fontSize:           '14px',
          fontWeight:         fontWeight.semibold,
          color:              amtColour,
          fontVariantNumeric: 'tabular-nums',
          flexShrink:         0,
        }}>
          {isIncome ? '+' : '−'}{formatPence(tx.amount)}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          margin:       '0 16px 16px',
          borderRadius: radius.lg,
          background:   colours.cardBg,
          border:       `1px solid ${colours.cardBorder}`,
          borderTop:    `1px solid ${colours.cardBorderTop}`,
          boxShadow:    '0 8px 32px rgba(0,0,0,0.24)',
          overflow:     'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '16px 16px 12px',
            borderBottom:   `1px solid ${colours.borderHairline}`,
          }}>
            <div>
              <div style={{
                fontFamily: fonts.sans,
                fontSize:   '22px',
                fontWeight: fontWeight.semibold,
                color:      amtColour,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {isIncome ? '+' : '−'}{formatPence(tx.amount)}
              </div>
              <div style={{
                fontFamily: fonts.sans,
                fontSize:   '13px',
                color:      colours.textSecondary,
                marginTop:  '2px',
              }}>
                {tx.description}
              </div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onExpand(null) }}
              aria-label="Close"
              style={{
                width:          '44px',
                height:         '44px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                background:     'transparent',
                border:         'none',
                cursor:         'pointer',
                fontSize:       '16px',
                color:          colours.textMuted,
              }}
            >
              ✕
            </button>
          </div>

          {/* Detail rows */}
          {[
            { label: 'CATEGORY', value: catLabel(tx.category) },
            { label: 'DATE',     value: formatDate(tx.date) },
            { label: 'SOURCE',   value: tx.source ? catLabel(tx.source) : 'Manual entry' },
            { label: 'STATUS',   value: tx.status ? catLabel(tx.status) : 'Confirmed' },
          ].map(row => (
            <div key={row.label} style={{
              display:      'flex',
              alignItems:   'center',
              padding:      '10px 16px',
              borderBottom: `1px solid ${colours.borderHairline}`,
            }}>
              <span style={{
                fontFamily:    fonts.sans,
                fontSize:      '11px',
                fontWeight:    fontWeight.medium,
                color:         colours.textMuted,
                letterSpacing: '0.08em',
                width:         '96px',
                flexShrink:    0,
                textTransform: 'uppercase' as const,
              }}>
                {row.label}
              </span>
              <span style={{
                fontFamily: fonts.sans,
                fontSize:   '13px',
                color:      colours.textPrimary,
              }}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Action row */}
          <div style={{
            display:  'flex',
            gap:      '8px',
            padding:  '12px 16px',
          }}>
            {[
              { icon: '📎', label: 'Attach' },
              { icon: '✏', label: 'Note'   },
              { icon: '↕', label: 'Split'  },
            ].map(action => (
              <button
                key={action.label}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '6px',
                  padding:      '8px 12px',
                  background:   colours.hoverBg,
                  border:       `1px solid ${colours.borderMedium}`,
                  borderRadius: radius.md,
                  cursor:       'pointer',
                  fontFamily:   fonts.sans,
                  fontSize:     fontSize.xs,
                  color:        colours.textSecondary,
                  minHeight:    '36px',
                }}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
