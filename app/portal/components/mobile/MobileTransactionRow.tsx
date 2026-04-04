'use client'

/**
 * app/portal/components/mobile/MobileTransactionRow.tsx
 *
 * Compact list row. Tapping opens an iOS-style bottom sheet via createPortal.
 * The sheet slides up with Apple quartic easing, uses a solid panelBgSolid
 * fill so content is legible over the layer below, and presents transaction
 * metadata in a modern bank layout (Amex / Starling style).
 */

import { useState, useEffect } from 'react'
import { createPortal }        from 'react-dom'
import { useColours }          from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius, transition }  from '@/styles/tokens'
import { mobileMotion }        from '@/styles/tokens/mobile-physics'

// ─── Row data ─────────────────────────────────────────────────────────────────

export interface TxRowData {
  id:          string
  type:        'income' | 'expense'
  description: string
  amount:      number   // pence
  date:        string   // ISO
  category:    string
  source?:     string
  status?:     string
}

interface Props {
  tx:         TxRowData
  isLast:     boolean
  isExpanded: boolean
  onExpand:   (id: string | null) => void
  onEdit?:    (id: string) => void
  onDelete?:  (id: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Maps a status string to a semantic colour key and display label. */
function resolveStatus(raw?: string): { label: string; colour: 'income' | 'warning' | 'danger' | 'textMuted' } {
  const s = (raw ?? '').toLowerCase()
  if (s === 'confirmed' || s === 'paid' || s === 'complete' || s === 'completed')
    return { label: raw!, colour: 'income' }
  if (s === 'pending' || s === 'processing' || s === 'draft')
    return { label: raw!, colour: 'warning' }
  if (s === 'failed' || s === 'cancelled' || s === 'refunded')
    return { label: raw!, colour: 'danger' }
  return { label: raw ?? 'Unknown', colour: 'textMuted' }
}

/** Derives a simplified HMRC tax category hint from the transaction category string. */
function hmrcHint(category: string, type: 'income' | 'expense'): string {
  const c = category.toLowerCase()
  if (type === 'income') {
    if (c.includes('rental'))   return 'SA105 — Property income'
    if (c.includes('dividend')) return 'SA100 — Dividends'
    if (c.includes('salary'))   return 'SA102 — Employment'
    return 'SA103 — Self-employment'
  }
  // expense
  if (c.includes('travel'))     return 'Travel & subsistence'
  if (c.includes('office'))     return 'Office costs'
  if (c.includes('equipment') || c.includes('tech')) return 'Equipment & tools'
  if (c.includes('marketing') || c.includes('advertising')) return 'Advertising'
  if (c.includes('legal') || c.includes('professional')) return 'Professional fees'
  if (c.includes('staff') || c.includes('wages'))   return 'Staff costs'
  if (c.includes('pension'))    return 'Pension contributions'
  if (c.includes('insurance'))  return 'Insurance'
  return 'General expenses'
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

function TransactionSheet({
  tx, onClose, onEdit, onDelete,
}: {
  tx: TxRowData; onClose: () => void
  onEdit?:   (id: string) => void
  onDelete?: (id: string) => void
}) {
  const colours   = useColours()
  const isIncome  = tx.type === 'income'
  const amtColour = isIncome ? colours.income : colours.expense

  // Entrance / exit animation state
  const [open,     setOpen]     = useState(false)
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(id)
  }, [])

  function handleClose() {
    setOpen(false)
    setTimeout(onClose, 300)
  }

  const statusInfo = tx.status ? resolveStatus(tx.status) : null
  const statusColour = statusInfo
    ? colours[statusInfo.colour as keyof typeof colours] as string
    : colours.textMuted

  // Core metadata rows
  const coreRows: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Category',
      value: tx.category,
    },
    {
      label: 'Date',
      value: formatDateLong(tx.date),
    },
    ...(tx.status ? [{
      label: 'Status',
      value: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '7px', color: statusColour, lineHeight: 1 }}>●</span>
          <span style={{
            color:      statusColour,
            fontWeight: fontWeight.medium,
          }}>
            {statusInfo!.label.charAt(0).toUpperCase() + statusInfo!.label.slice(1)}
          </span>
        </span>
      ),
    }] : []),
    ...(tx.source ? [{
      label: 'Source',
      value: tx.source,
    }] : []),
  ]

  // Extended rows — LTD / SA filing relevant (only real data)
  const extendedRows: { label: string; value: string; note?: string }[] = [
    {
      label: 'Transaction type',
      value: isIncome ? 'Income' : 'Expense',
    },
    {
      label: 'Tax category',
      value: hmrcHint(tx.category, tx.type),
    },
    ...(tx.type === 'expense' ? [{
      label: 'Allowability',
      value: 'Review with accountant',
      note:  'HMRC rules vary by trade and circumstance',
    }] : []),
    ...(tx.source ? [{
      label: 'Reference',
      value: tx.source,
    }] : []),
  ]

  return createPortal(
    <>
      {/* Backdrop — dims + blurs content behind the sheet */}
      <div
        onClick={handleClose}
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         149,
          background:     'rgba(0,0,0,0.35)',
          backdropFilter: open ? 'blur(14px) saturate(140%)' : 'blur(0px) saturate(100%)',
          WebkitBackdropFilter: open ? 'blur(14px) saturate(140%)' : 'blur(0px) saturate(100%)',
          opacity:        open ? 1 : 0,
          transition:     open
            ? `opacity 0.35s ease-out, backdrop-filter 0.45s ${mobileMotion.expand}, -webkit-backdrop-filter 0.45s ${mobileMotion.expand}`
            : `opacity 0.28s ${mobileMotion.collapse}, backdrop-filter 0.28s ${mobileMotion.collapse}, -webkit-backdrop-filter 0.28s ${mobileMotion.collapse}`,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position:      'fixed',
          left:          0,
          right:         0,
          bottom:        0,
          zIndex:        150,
          maxHeight:     '88dvh',
          display:       'flex',
          flexDirection: 'column',
          background:    colours.panelBgSolid,
          borderRadius:  `${radius.lg} ${radius.lg} 0 0`,
          boxShadow:     '0 -4px 40px rgba(0,0,0,0.32)',
          transform:     open ? 'translateY(0)' : 'translateY(100%)',
          transition:    open
            ? `transform 0.45s ${mobileMotion.expand}`
            : `transform 0.28s ${mobileMotion.collapse}`,
          willChange:    'transform',
          overflowY:     'auto',
          WebkitOverflowScrolling: 'touch' as any,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >

        {/* Drag handle */}
        <div style={{
          display:        'flex',
          justifyContent: 'center',
          paddingTop:     '10px',
          paddingBottom:  '4px',
          flexShrink:     0,
        }}>
          <div style={{
            width:        '36px',
            height:       '4px',
            borderRadius: '2px',
            background:   colours.borderMedium,
          }} />
        </div>

        {/* Close row */}
        <div style={{
          display:        'flex',
          justifyContent: 'flex-end',
          padding:        '4px 16px 0',
          flexShrink:     0,
        }}>
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              width:          '30px',
              height:         '30px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              background:     colours.hoverBg,
              border:         `1px solid ${colours.borderHairline}`,
              borderRadius:   '50%',
              cursor:         'pointer',
              fontSize:       '12px',
              color:          colours.textMuted,
              flexShrink:     0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>

          {/* Type pill */}
          <div style={{ marginBottom: '10px' }}>
            <span style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '4px',
              padding:       '3px 10px',
              borderRadius:  radius.pill,
              background:    isIncome ? colours.incomeLight : colours.expenseLight,
              color:         amtColour,
              fontSize:      fontSize.xs,
              fontWeight:    fontWeight.medium,
              fontFamily:    fonts.sans,
              letterSpacing: '0.06em',
              textTransform: 'uppercase' as const,
            }}>
              <span style={{ fontSize: '10px', lineHeight: 1 }}>{isIncome ? '↑' : '↓'}</span>
              {isIncome ? 'Income' : 'Expense'}
            </span>
          </div>

          {/* Amount */}
          <div style={{
            fontFamily:         fonts.sans,
            fontSize:           '40px',
            fontWeight:         fontWeight.semibold,
            color:              amtColour,
            letterSpacing:      '-0.03em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight:         1,
            marginBottom:       '6px',
          }}>
            {isIncome ? '+' : '−'}{formatPence(tx.amount)}
          </div>

          {/* Description */}
          <div style={{
            fontFamily:    fonts.sans,
            fontSize:      '18px',
            fontWeight:    fontWeight.semibold,
            color:         colours.textPrimary,
            letterSpacing: '-0.01em',
            lineHeight:    1.3,
            marginBottom:  '4px',
          }}>
            {tx.description}
          </div>

          {/* Date subtitle */}
          <div style={{
            fontFamily:   fonts.sans,
            fontSize:     fontSize.sm,
            fontWeight:   fontWeight.light,
            color:        colours.textMuted,
            marginBottom: '20px',
          }}>
            {formatDateShort(tx.date)}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: colours.borderHairline, marginBottom: '2px' }} />

          {/* Core metadata */}
          {coreRows.map((row) => (
            <div
              key={row.label}
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '13px 0',
                borderBottom:   `1px solid ${colours.borderHairline}`,
                gap:            '12px',
              }}
            >
              <span style={{
                fontFamily:    fonts.sans,
                fontSize:      fontSize.xs,
                fontWeight:    fontWeight.medium,
                color:         colours.textMuted,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                flexShrink:    0,
              }}>
                {row.label}
              </span>
              <span style={{
                fontFamily:  fonts.sans,
                fontSize:    '14px',
                fontWeight:  fontWeight.medium,
                color:       colours.textPrimary,
                textAlign:   'right' as const,
                lineHeight:  1.3,
              }}>
                {row.value}
              </span>
            </div>
          ))}

          {/* Show more toggle */}
          <button
            onClick={() => setShowMore(s => !s)}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              width:          '100%',
              padding:        '13px 0',
              background:     'transparent',
              border:         'none',
              borderBottom:   `1px solid ${colours.borderHairline}`,
              cursor:         'pointer',
              fontFamily:     fonts.sans,
              fontSize:       '13px',
              fontWeight:     fontWeight.medium,
              color:          colours.textSecondary,
              textAlign:      'left' as const,
            }}
          >
            <span>{showMore ? 'Less detail' : 'More detail'}</span>
            <span style={{
              fontSize:   '11px',
              color:      colours.textMuted,
              transform:  showMore ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}>
              ▾
            </span>
          </button>

          {/* Extended metadata */}
          {showMore && extendedRows.map((row) => (
            <div
              key={row.label}
              style={{
                padding:      '12px 0',
                borderBottom: `1px solid ${colours.borderHairline}`,
              }}
            >
              <div style={{
                display:        'flex',
                alignItems:     'baseline',
                justifyContent: 'space-between',
                gap:            '12px',
              }}>
                <span style={{
                  fontFamily:    fonts.sans,
                  fontSize:      fontSize.xs,
                  fontWeight:    fontWeight.medium,
                  color:         colours.textMuted,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  flexShrink:    0,
                }}>
                  {row.label}
                </span>
                <span style={{
                  fontFamily: fonts.sans,
                  fontSize:   '13px',
                  fontWeight: fontWeight.regular,
                  color:      row.value === '—' ? colours.textMuted : colours.textPrimary,
                  textAlign:  'right' as const,
                  lineHeight: 1.3,
                }}>
                  {row.value}
                </span>
              </div>
              {row.note && (
                <div style={{
                  fontFamily:  fonts.sans,
                  fontSize:    fontSize.xs,
                  fontWeight:  fontWeight.light,
                  color:       colours.textMuted,
                  marginTop:   '3px',
                  textAlign:   'right' as const,
                  lineHeight:  1.4,
                }}>
                  {row.note}
                </div>
              )}
            </div>
          ))}

          {/* Actions — only rendered when handlers are wired up */}
          {(onEdit || onDelete) && (
            <div style={{
              display:   'flex',
              gap:       '10px',
              marginTop: '20px',
            }}>
              {onEdit && (
                <button
                  onClick={() => { onEdit(tx.id); handleClose() }}
                  style={{
                    flex:           1,
                    height:         '44px',
                    borderRadius:   radius.md,
                    border:         `1px solid ${colours.borderMedium}`,
                    background:     'transparent',
                    color:          colours.textSecondary,
                    fontFamily:     fonts.sans,
                    fontSize:       '13px',
                    fontWeight:     fontWeight.medium,
                    cursor:         'pointer',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '7px',
                    transition:     transition.snap,
                  }}
                >
                  <span style={{ fontSize: '13px', lineHeight: 1, opacity: 0.7 }}>✎</span>
                  Edit entry
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(tx.id); handleClose() }}
                  style={{
                    flex:           1,
                    height:         '44px',
                    borderRadius:   radius.md,
                    border:         `1px solid ${colours.dangerLight}`,
                    background:     colours.dangerLight,
                    color:          colours.danger,
                    fontFamily:     fonts.sans,
                    fontSize:       '13px',
                    fontWeight:     fontWeight.medium,
                    cursor:         'pointer',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '7px',
                    transition:     transition.snap,
                  }}
                >
                  <span style={{ fontSize: '12px', lineHeight: 1, opacity: 0.8 }}>✕</span>
                  Delete
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </>,
    document.body
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

export default function MobileTransactionRow({ tx, isLast, isExpanded, onExpand, onEdit, onDelete }: Props) {
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
            transition: `background ${transition.snap}`,
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
            fontWeight:     fontWeight.semibold,
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
              fontWeight: fontWeight.light,
              color:      colours.textMuted,
              marginTop:  '2px',
            }}>
              {new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
      </div>

      {isExpanded && mounted && (
        <TransactionSheet tx={tx} onClose={() => onExpand(null)} onEdit={onEdit} onDelete={onDelete} />
      )}
    </>
  )
}
