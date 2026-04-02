'use client'

/**
 * app/portal/components/tabs/TransactionsTab.tsx
 *
 * Combined income + expense view with filtering and sorting.
 * Pulls from both useIncome and useExpenses hooks.
 */

import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { useIncome }   from './useIncome'
import { useExpenses } from './useExpenses'
import { Panel, Label, Spinner, Badge, ErrorBanner, formatGBP, formatDate } from '../ui'
import { useColours } from '@/styles/ThemeContext'
import { useShellSearch } from '@/app/components/shells/BaseShell'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'

type Filter = 'all' | 'income' | 'expense'

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const colours = useColours()
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:      '6px 14px',
        borderRadius: radius.pill,
        border:       `1px solid ${active ? colours.accent : colours.borderMedium}`,
        background:   active ? colours.navActiveBg : (hovered ? colours.hoverBg : 'transparent'),
        color:        active ? colours.navActive : colours.textSecondary,
        fontSize:     fontSize.sm,
        fontWeight:   active ? fontWeight.medium : fontWeight.regular,
        cursor:       'pointer',
        fontFamily:   fonts.sans,
        transition:   transition.snap,
      }}
    >
      {label}
    </button>
  )
}

export default function TransactionsTab({ client }: { client: Client }) {
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()
  useEffect(() => { setPlaceholder('Search transactions…') }, [setPlaceholder])

  const [filter, setFilter] = useState<Filter>('all')

  const {
    income, loading: loadingIncome, error: errorIncome,
  } = useIncome(client.id, client.tax_year, client.user_id)

  const {
    expenses, loading: loadingExpenses, error: errorExpenses,
  } = useExpenses(client.id, client.tax_year, client.user_id)

  if (loadingIncome || loadingExpenses) return <Spinner />

  // Merge and sort by date descending
  const all = [
    ...income.map(i => ({
      id:          i.id,
      type:        'income' as const,
      description: i.description,
      amount:      i.amount_pence,
      date:        i.date,
      category:    i.category as string,
    })),
    ...expenses.map(e => ({
      id:          e.id,
      type:        'expense' as const,
      description: e.description,
      amount:      e.amount_pence,
      date:        e.date,
      category:    e.category as string,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const filtered = all
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => !query || t.description?.toLowerCase().includes(query.toLowerCase()))

  const totalIn  = income.reduce((s, i) => s + i.amount_pence, 0)
  const totalOut = expenses.reduce((s, e) => s + e.amount_pence, 0)
  const net      = totalIn - totalOut

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, flex: 1 }}>

      {/* ── Summary row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.tab.gap }}>
        {[
          { label: 'Total in',  value: formatGBP(totalIn),  colour: colours.income },
          { label: 'Total out', value: formatGBP(totalOut), colour: colours.expense },
          { label: 'Net',       value: formatGBP(Math.abs(net)), colour: net >= 0 ? colours.income : colours.danger },
        ].map(({ label, value, colour }) => (
          <Panel key={label} padding={spacing.panel.paddingTight}>
            <div style={{ fontSize: fontSize.label, color: colours.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: fonts.mono, marginBottom: '10px' }}>
              {label}
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: '24px', fontWeight: fontWeight.medium, color: colour, lineHeight: 1 }}>
              {value}
            </div>
          </Panel>
        ))}
      </div>

      {(errorIncome || errorExpenses) && (
        <ErrorBanner error={(errorIncome ?? errorExpenses)!} />
      )}

      {/* ── Filter + list ── */}
      <Panel padding="0" style={{ flex: 1 }}>
        <div style={{
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          padding:      `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
          borderBottom: `1px solid ${colours.borderHairline}`,
        }}>
          <Label>Transactions · {client.tax_year}</Label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <FilterPill label="All"     active={filter === 'all'}     onClick={() => setFilter('all')} />
            <FilterPill label="Income"  active={filter === 'income'}  onClick={() => setFilter('income')} />
            <FilterPill label="Expense" active={filter === 'expense'} onClick={() => setFilter('expense')} />
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: colours.textMuted, fontSize: fontSize.base }}>
            No transactions found.
          </div>
        )}

        {filtered.map((tx, idx) => (
          <div
            key={tx.id}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        spacing.table.rowPadding,
              borderBottom:   idx === filtered.length - 1 ? 'none' : `1px solid ${colours.borderHairline}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{
                width:          '28px',
                height:         '28px',
                borderRadius:   radius.sm,
                background:     tx.type === 'income' ? colours.incomeLight : colours.expenseLight,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '11px',
                color:          tx.type === 'income' ? colours.income : colours.expense,
                flexShrink:     0,
              }}>
                {tx.type === 'income' ? '↑' : '↓'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize:     fontSize.base,
                  fontWeight:   fontWeight.medium,
                  color:        colours.textPrimary,
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap' as const,
                }}>
                  {tx.description}
                </div>
                <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginTop: '2px', fontFamily: fonts.mono }}>
                  {formatDate(tx.date)}
                </div>
              </div>
            </div>
            <div style={{
              fontFamily:    fonts.mono,
              fontSize:      fontSize.base,
              fontWeight:    fontWeight.semibold,
              color:         tx.type === 'income' ? colours.income : colours.expense,
              letterSpacing: letterSpacing.tight,
              flexShrink:    0,
            }}>
              {tx.type === 'income' ? '+' : '−'}{formatGBP(tx.amount)}
            </div>
          </div>
        ))}
      </Panel>
    </div>
  )
}
