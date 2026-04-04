'use client'

/**
 * app/portal/components/mobile/tabs/MobileExpensesTab.tsx
 */

import { useState, useRef, useCallback } from 'react'
import type { Client }        from '@/types'
import { useExpenses }        from '@/app/portal/components/tabs/useExpenses'
import { useColours }         from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }             from '@/styles/tokens'
import MobileFormSheet          from '../MobileFormSheet'
import MobileTransactionRow    from '../MobileTransactionRow'
import type { TxRowData }      from '../MobileTransactionRow'

interface Props { client: Client }

const PTR_THRESHOLD = 60

export default function MobileExpensesTab({ client }: Props) {
  const colours = useColours()
  const [formOpen,   setFormOpen]   = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [ptrDelta,   setPtrDelta]   = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const triggered = useRef(false)

  const { expenses, totalPence, entryCount, loading } = useExpenses(client.id, client.tax_year, client.user_id)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    triggered.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if ((scrollRef.current?.scrollTop ?? 0) > 0) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) setPtrDelta(Math.min(delta * 0.5, PTR_THRESHOLD))
    if (delta > PTR_THRESHOLD && !triggered.current) triggered.current = true
  }, [])

  const handleTouchEnd = useCallback(async () => {
    setPtrDelta(0)
    if (triggered.current) {
      setRefreshing(true)
      await new Promise(r => setTimeout(r, 800))
      setRefreshing(false)
    }
    triggered.current = false
  }, [])

  const rows: TxRowData[] = expenses.map(e => ({
    id:          e.id,
    type:        'expense' as const,
    description: e.description,
    amount:      e.amount_pence,
    date:        e.date,
    category:    e.category,
    source:      e.source,
    status:      e.status,
  }))

  const formatGBP = (p: number) =>
    `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (formOpen) {
    return <MobileFormSheet type="expense" client={client} onClose={() => setFormOpen(false)} />
  }

  return (
    <>
      <div
        ref={scrollRef}
        style={{ paddingBottom: '24px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {(ptrDelta > 0 || refreshing) && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: `${ptrDelta}px`, transition: 'padding-top 0.1s ease' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              border: `2px solid ${colours.textMuted}`, borderTop: '2px solid transparent',
              animation: refreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
            }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px 12px' }}>
          <div>
            <h2 style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
              Expenses
            </h2>
            <div style={{ fontFamily: fonts.sans, fontSize: '12px', color: colours.textMuted, marginTop: '2px', fontWeight: 300 }}>
              {entryCount > 0 ? `${entryCount} entr${entryCount === 1 ? 'y' : 'ies'}` : ''}
            </div>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="cta-btn"
            style={{
              height: '40px', padding: '0 18px', borderRadius: radius.md,
              border: 'none', background: colours.cta, color: colours.ctaText,
              fontFamily: fonts.sans, fontSize: '13.5px', fontWeight: fontWeight.medium, cursor: 'pointer',
            }}
          >
            + Add entry
          </button>
        </div>

        {!loading && totalPence > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{
              padding: '14px 16px', borderRadius: radius.lg,
              background: colours.expenseLight, border: `1px solid ${colours.expense}22`,
            }}>
              <div style={{ fontFamily: fonts.sans, fontSize: '11px', color: colours.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Total expenses</div>
              <div style={{ fontFamily: fonts.sans, fontSize: '28px', fontWeight: fontWeight.semibold, color: colours.expense, fontVariantNumeric: 'tabular-nums' }}>{formatGBP(totalPence)}</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center' as const, color: colours.textMuted, fontFamily: fonts.sans }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '32px', opacity: 0.25, marginBottom: '12px' }}>↓</div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.base, color: colours.textMuted, marginBottom: '4px' }}>No expenses logged yet.</div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colours.textMuted, opacity: 0.7 }}>Tap Add entry to log your first expense.</div>
          </div>
        ) : (
          <div style={{ margin: '0 16px', borderRadius: radius.lg, border: `1px solid ${colours.cardBorder}`, overflow: 'hidden', background: colours.cardBg }}>
            {rows.map((tx, idx) => (
              <MobileTransactionRow
                key={tx.id} tx={tx} isLast={idx === rows.length - 1}
                isExpanded={expandedId === tx.id}
                onExpand={setExpandedId}
              />
            ))}
          </div>
        )}
      </div>

    </>
  )
}
