'use client'

/**
 * app/portal/components/mobile/MobileTransactionRow.tsx
 *
 * Compact list row. Tapping expands a full-height panel (same card width,
 * top-to-bottom height) via createPortal — keeps the list intact while giving
 * the detail view room to breathe. Same visual language as Prior Returns.
 */

import { useState, useEffect }    from 'react'
import { createPortal }           from 'react-dom'
import { useColours }             from '@/styles/ThemeContext'
import { fonts, fontWeight }      from '@/styles/tokens/typography'
import { radius }                 from '@/styles/tokens'

export interface TxRowData {
  id:          string
  type:        'income' | 'expense'
  description: string
  amount:      number
  date:        string
  category:    string
  source?:     string
  status?:     string
}

interface Props {
  tx:         TxRowData
  isLast:     boolean
  isExpanded: boolean
  onExpand:   (id: string | null) => void
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Expanded detail panel ────────────────────────────────────────────────────

function DetailPanel({ tx, onClose }: { tx: TxRowData; onClose: () => void }) {
  const colours  = useColours()
  const isIncome = tx.type === 'income'
  const amtColour = isIncome ? colours.income : colours.expense

  const metaRows = [
    { label: 'CATEGORY', value: tx.category },
    { label: 'DATE',     value: formatDate(tx.date) },
    { label: 'TYPE',     value: isIncome ? 'Income' : 'Expense' },
    ...(tx.source ? [{ label: 'SOURCE', value: tx.source }] : []),
    ...(tx.status ? [{ label: 'STATUS', value: tx.status.charAt(0).toUpperCase() + tx.status.slice(1) }] : []),
  ]

  const actions = [
    { icon: '📎', label: 'Add attachment' },
    { icon: '📝', label: 'Add note' },
  ]

  return createPortal(
    <>
      {/* Backdrop — tap outside to close */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed',
          inset:      0,
          zIndex:     149,
          background: 'rgba(0,0,0,0.30)',
        }}
      />

      {/* Panel — same horizontal insets as the card, full height below header */}
      <div style={{
        position:      'fixed',
        left:          '16px',
        right:         '16px',
        top:           'calc(52px + env(safe-area-inset-top, 0px) + 8px)',
        bottom:        'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        zIndex:        150,
        background:    colours.cardBg,
        border:        `1px solid ${colours.cardBorder}`,
        borderRadius:  radius.lg,
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
      }}>

        {/* Close button */}
        <div style={{
          display:        'flex',
          justifyContent: 'flex-end',
          padding:        '12px 12px 0',
          flexShrink:     0,
        }}>
          <button
            onClick={onClose}
            style={{
              width:          '32px',
              height:         '32px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     colours.hoverBg,
              border:         `1px solid ${colours.borderHairline}`,
              borderRadius:   '50%',
              cursor:         'pointer',
              fontSize:       '14px',
              color:          colours.textMuted,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 20px' }}>

          {/* Amount */}
          <div style={{
            fontFamily:         fonts.sans,
            fontSize:           '40px',
            fontWeight:         fontWeight.semibold,
            color:              amtColour,
            letterSpacing:      '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight:         1,
            marginBottom:       '12px',
          }}>
            {isIncome ? '+' : '−'}{formatPence(tx.amount)}
          </div>

          {/* Description + actions */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            marginBottom:'16px',
            gap:         '10px',
          }}>
            <span style={{
              fontFamily:  fonts.sans,
              fontSize:    '20px',
              fontWeight:  fontWeight.semibold,
              color:       colours.textPrimary,
              letterSpacing: '-0.01em',
              flex:        1,
              minWidth:    0,
              overflow:    'hidden',
              textOverflow:'ellipsis',
              whiteSpace:  'nowrap' as const,
            }}>
              {tx.description}
            </span>
            <button style={{
              background: 'transparent',
              border:     'none',
              cursor:     'pointer',
              padding:    '6px',
              color:      colours.accent,
              fontSize:   '16px',
              flexShrink: 0,
            }}>
              ✎
            </button>
            <button style={{
              background: 'transparent',
              border:     'none',
              cursor:     'pointer',
              padding:    '6px',
              color:      colours.danger,
              fontSize:   '16px',
              flexShrink: 0,
            }}>
              🗑
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: colours.borderHairline, marginBottom: '4px' }} />

          {/* Metadata rows */}
          {metaRows.map((r, idx) => (
            <div
              key={r.label}
              style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent:'space-between',
                padding:      '13px 0',
                borderBottom: idx === metaRows.length - 1 ? 'none' : `1px solid ${colours.borderHairline}`,
              }}
            >
              <span style={{
                fontFamily:    fonts.sans,
                fontSize:      '11px',
                fontWeight:    fontWeight.medium,
                color:         colours.textMuted,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
              }}>
                {r.label}
              </span>
              <span style={{
                fontFamily: fonts.sans,
                fontSize:   '14px',
                fontWeight: fontWeight.semibold,
                color:      colours.textPrimary,
              }}>
                {r.value}
              </span>
            </div>
          ))}

          {/* Divider */}
          <div style={{ height: '1px', background: colours.borderHairline, margin: '4px 0 4px' }} />

          {/* Action rows */}
          {actions.map((a, idx) => (
            <div
              key={a.label}
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '12px',
                padding:     '14px 0',
                borderBottom: idx === actions.length - 1 ? 'none' : `1px solid ${colours.borderHairline}`,
                cursor:      'default',
                opacity:     0.45,
              }}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' as const }}>
                {a.icon}
              </span>
              <span style={{
                fontFamily: fonts.sans,
                fontSize:   '14px',
                fontWeight: fontWeight.regular,
                color:      colours.textSecondary,
              }}>
                {a.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

export default function MobileTransactionRow({ tx, isLast, isExpanded, onExpand }: Props) {
  const colours   = useColours()
  const isIncome  = tx.type === 'income'
  const amtColour = isIncome ? colours.income : colours.expense
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <div style={{ borderBottom: isLast ? 'none' : `1px solid ${colours.borderHairline}` }}>
        <div
          onClick={() => onExpand(isExpanded ? null : tx.id)}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '12px',
            padding:    '12px 16px',
            minHeight:  '52px',
            cursor:     'pointer',
            background: isExpanded ? colours.accentSoft : 'transparent',
          }}
        >
          {/* Type icon */}
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

          {/* Amount + chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div style={{
              fontFamily:         fonts.sans,
              fontSize:           '14px',
              fontWeight:         fontWeight.semibold,
              color:              amtColour,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {isIncome ? '+' : '−'}{formatPence(tx.amount)}
            </div>
            <span style={{
              fontSize:   '12px',
              color:      colours.textMuted,
              transform:  isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}>▾</span>
          </div>
        </div>
      </div>

      {/* Full-height detail panel — same card width, full viewport height */}
      {isExpanded && mounted && (
        <DetailPanel tx={tx} onClose={() => onExpand(null)} />
      )}
    </>
  )
}
