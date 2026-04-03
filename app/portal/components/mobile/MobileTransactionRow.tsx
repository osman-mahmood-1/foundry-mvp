'use client'

/**
 * app/portal/components/mobile/MobileTransactionRow.tsx
 *
 * Tappable list row. No inline expansion — detail opens via
 * MobileTransactionDetail portal in the parent tab.
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
  isSelected: boolean
  onSelect:   (id: string) => void
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MobileTransactionRow({ tx, isLast, isSelected, onSelect }: Props) {
  const colours   = useColours()
  const isIncome  = tx.type === 'income'
  const amtColour = isIncome ? colours.income : colours.expense

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : `1px solid ${colours.borderHairline}`,
      }}
    >
      <div
        onClick={() => onSelect(tx.id)}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '12px',
          padding:    '12px 16px',
          minHeight:  '48px',
          cursor:     'pointer',
          background: isSelected ? colours.accentSoft : 'transparent',
          transition: 'background 0.15s ease',
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
  )
}
