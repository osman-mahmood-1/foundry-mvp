'use client'

/**
 * app/portal/components/mobile/tabs/MobileTransactionsTab.tsx
 *
 * All/Income/Expense filter pills + combined transaction list.
 */

import { useState }      from 'react'
import type { Client }   from '@/types'
import { useIncome }     from '@/app/portal/components/tabs/useIncome'
import { useExpenses }   from '@/app/portal/components/tabs/useExpenses'
import { useColours }    from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }        from '@/styles/tokens'
import MobileTransactionRow    from '../MobileTransactionRow'
import MobileTransactionDetail from '../MobileTransactionDetail'
import type { TxRowData }      from '../MobileTransactionRow'

type Filter = 'all' | 'income' | 'expense'

interface Props { client: Client }

export default function MobileTransactionsTab({ client }: Props) {
  const colours    = useColours()
  const [filter,     setFilter]     = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { income,   loading: loadingI } = useIncome(client.id, client.tax_year, client.user_id)
  const { expenses, loading: loadingE } = useExpenses(client.id, client.tax_year, client.user_id)

  const loading = loadingI || loadingE

  const all: TxRowData[] = [
    ...income.map(i => ({
      id: i.id, type: 'income' as const, description: i.description,
      amount: i.amount_pence, date: i.date, category: i.category, source: i.source, status: i.status,
    })),
    ...expenses.map(e => ({
      id: e.id, type: 'expense' as const, description: e.description,
      amount: e.amount_pence, date: e.date, category: e.category, source: e.source, status: e.status,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const filtered = filter === 'all' ? all : all.filter(t => t.type === filter)

  const totalIn  = income.reduce((s, i) => s + i.amount_pence, 0)
  const totalOut = expenses.reduce((s, e) => s + e.amount_pence, 0)
  const net      = totalIn - totalOut

  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All',     value: 'all' },
    { label: 'Income',  value: 'income' },
    { label: 'Expense', value: 'expense' },
  ]

  return (
    <div style={{ paddingBottom: '24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 0' }}>
        <h2 style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: '-0.02em', margin: 0, marginBottom: '4px' }}>
          Transactions
        </h2>
        <div style={{ fontFamily: fonts.sans, fontSize: '12px', color: colours.textMuted, fontWeight: 300 }}>
          {client.tax_year}
        </div>
      </div>

      {/* Summary row */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '16px 16px 0' }}>
          {[
            { label: 'In',  value: fmt(totalIn),        colour: colours.income  },
            { label: 'Out', value: fmt(totalOut),        colour: colours.expense },
            { label: 'Net', value: fmt(Math.abs(net)),  colour: net >= 0 ? colours.income : colours.danger },
          ].map(c => (
            <div key={c.label} style={{
              padding: '12px', borderRadius: radius.md,
              background: colours.cardBg, border: `1px solid ${colours.cardBorder}`,
              textAlign: 'center' as const,
            }}>
              <div style={{ fontFamily: fonts.sans, fontSize: '10px', color: colours.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '4px' }}>
                {c.label}
              </div>
              <div style={{ fontFamily: fonts.sans, fontSize: '14px', fontWeight: fontWeight.semibold, color: c.colour, fontVariantNumeric: 'tabular-nums' }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 16px 0' }}>
        {FILTERS.map(f => {
          const active = filter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                height:       '36px',
                padding:      '0 16px',
                borderRadius: radius.md,
                border:       `1px solid ${active ? colours.accentBorder : colours.borderMedium}`,
                background:   active ? colours.accentLight : colours.hoverBg,
                color:        active ? colours.accent : colours.textSecondary,
                fontFamily:   fonts.sans,
                fontSize:     '13px',
                fontWeight:   active ? fontWeight.medium : fontWeight.regular,
                cursor:       'pointer',
                transition:   'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ padding: '16px 16px 0' }}>
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center' as const, color: colours.textMuted, fontFamily: fonts.sans }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' as const, color: colours.textMuted, fontFamily: fonts.sans, fontSize: fontSize.sm }}>No transactions found.</div>
        ) : (
          <div style={{ borderRadius: radius.lg, border: `1px solid ${colours.cardBorder}`, overflow: 'hidden', background: colours.cardBg }}>
            {filtered.map((tx, idx) => (
              <MobileTransactionRow
                key={tx.id} tx={tx} isLast={idx === filtered.length - 1}
                isSelected={selectedId === tx.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>
      <MobileTransactionDetail
        tx={filtered.find(t => t.id === selectedId) ?? null}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
