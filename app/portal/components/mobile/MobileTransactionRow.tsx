'use client'

/**
 * app/portal/components/mobile/MobileTransactionRow.tsx
 *
 * Tappable list row with inline expand — same pattern as Prior Returns table.
 */

import { useColours }         from '@/styles/ThemeContext'
import { fonts, fontWeight }  from '@/styles/tokens/typography'
import { radius }             from '@/styles/tokens'

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

export default function MobileTransactionRow({ tx, isLast, isExpanded, onExpand }: Props) {
  const colours   = useColours()
  const isIncome  = tx.type === 'income'
  const amtColour = isIncome ? colours.income : colours.expense

  const details = [
    { label: 'Category', value: tx.category },
    { label: 'Date',     value: formatDate(tx.date) },
    { label: 'Type',     value: isIncome ? 'Income' : 'Expense' },
    ...(tx.source ? [{ label: 'Source', value: tx.source }] : []),
    ...(tx.status ? [{ label: 'Status', value: tx.status.charAt(0).toUpperCase() + tx.status.slice(1) }] : []),
  ]

  return (
    <div style={{ borderBottom: isLast && !isExpanded ? 'none' : `1px solid ${colours.borderHairline}` }}>
      {/* Row */}
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

      {/* Inline detail */}
      {isExpanded && (
        <div style={{
          padding:     '12px 16px 16px',
          background:  colours.cardBg,
          borderTop:   `1px solid ${colours.borderHairline}`,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {details.map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: fonts.sans, fontSize: '13px', color: colours.textMuted }}>
                  {r.label}
                </span>
                <span style={{ fontFamily: fonts.sans, fontSize: '13px', color: colours.textPrimary }}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
