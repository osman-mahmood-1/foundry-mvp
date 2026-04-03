'use client'

/**
 * app/portal/components/mobile/tabs/MobileIncomeTab.tsx
 *
 * Income list + pull-to-refresh + MobileFormSheet for adding entries.
 */

import { useState, useRef, useCallback } from 'react'
import type { Client }        from '@/types'
import { useIncome }          from '@/app/portal/components/tabs/useIncome'
import { useColours }         from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }             from '@/styles/tokens'
import MobileFormSheet          from '../MobileFormSheet'
import MobileTransactionRow    from '../MobileTransactionRow'
import MobileTransactionDetail from '../MobileTransactionDetail'
import type { TxRowData }      from '../MobileTransactionRow'

interface Props { client: Client }

const PTR_THRESHOLD = 60

export default function MobileIncomeTab({ client }: Props) {
  const colours = useColours()
  const [formOpen,   setFormOpen]   = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [ptrDelta,   setPtrDelta]   = useState(0)
  const scrollRef  = useRef<HTMLDivElement>(null)
  const startYRef  = useRef(0)
  const triggered  = useRef(false)

  const { income, totalPence, entryCount, loading } = useIncome(client.id, client.tax_year, client.user_id)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    triggered.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollTop = scrollRef.current?.scrollTop ?? 0
    if (scrollTop > 0) return
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) setPtrDelta(Math.min(delta * 0.5, PTR_THRESHOLD))
    if (delta > PTR_THRESHOLD && !triggered.current) {
      triggered.current = true
    }
  }, [])

  const handleTouchEnd = useCallback(async () => {
    setPtrDelta(0)
    if (triggered.current) {
      setRefreshing(true)
      // hooks re-fetch on mount; simulate a brief delay
      await new Promise(r => setTimeout(r, 800))
      setRefreshing(false)
    }
    triggered.current = false
  }, [])

  const rows: TxRowData[] = income.map(i => ({
    id:          i.id,
    type:        'income' as const,
    description: i.description,
    amount:      i.amount_pence,
    date:        i.date,
    category:    i.category,
    source:      i.source,
    status:      i.status,
  }))

  const formatGBP = (p: number) =>
    `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <>
      <div
        ref={scrollRef}
        style={{ paddingBottom: '24px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* PTR indicator */}
        {(ptrDelta > 0 || refreshing) && (
          <div style={{
            display:        'flex',
            justifyContent: 'center',
            paddingTop:     `${ptrDelta}px`,
            transition:     'padding-top 0.1s ease',
          }}>
            <div style={{
              width:        '20px',
              height:       '20px',
              borderRadius: '50%',
              border:       `2px solid ${colours.textMuted}`,
              borderTop:    '2px solid transparent',
              animation:    refreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
            }} />
          </div>
        )}

        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '20px 16px 12px',
        }}>
          <div>
            <h2 style={{
              fontFamily:    fonts.sans,
              fontSize:      '22px',
              fontWeight:    fontWeight.semibold,
              color:         colours.textPrimary,
              letterSpacing: '-0.02em',
              margin:        0,
            }}>
              Income
            </h2>
            <div style={{
              fontFamily:  fonts.sans,
              fontSize:    '12px',
              color:       colours.textMuted,
              marginTop:   '2px',
              fontWeight:  300,
            }}>
              {entryCount > 0 ? `${entryCount} entr${entryCount === 1 ? 'y' : 'ies'} · ` : ''}{client.tax_year}
            </div>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="cta-btn"
            style={{
              height:       '40px',
              padding:      '0 18px',
              borderRadius: radius.md,
              border:       'none',
              background:   colours.cta,
              color:        colours.ctaText,
              fontFamily:   fonts.sans,
              fontSize:     '13.5px',
              fontWeight:   fontWeight.medium,
              cursor:       'pointer',
            }}
          >
            + Add entry
          </button>
        </div>

        {/* Total card */}
        {!loading && totalPence > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{
              padding:      '14px 16px',
              borderRadius: radius.lg,
              background:   colours.incomeLight,
              border:       `1px solid ${colours.income}22`,
            }}>
              <div style={{ fontFamily: fonts.sans, fontSize: '11px', color: colours.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '4px' }}>
                Total income
              </div>
              <div style={{ fontFamily: fonts.sans, fontSize: '28px', fontWeight: fontWeight.semibold, color: colours.income, fontVariantNumeric: 'tabular-nums' }}>
                {formatGBP(totalPence)}
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center' as const, color: colours.textMuted, fontFamily: fonts.sans }}>
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center' as const }}>
            <div style={{ fontSize: '32px', opacity: 0.25, marginBottom: '12px' }}>↑</div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.base, color: colours.textMuted, marginBottom: '4px' }}>No income logged yet.</div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colours.textMuted, opacity: 0.7 }}>Add your first entry above.</div>
          </div>
        ) : (
          <div style={{
            margin:       '0 16px',
            borderRadius: radius.lg,
            border:       `1px solid ${colours.cardBorder}`,
            overflow:     'hidden',
            background:   colours.cardBg,
          }}>
            {rows.map((tx, idx) => (
              <MobileTransactionRow
                key={tx.id}
                tx={tx}
                isLast={idx === rows.length - 1}
                isSelected={selectedId === tx.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <MobileFormSheet
          type="income"
          client={client}
          onClose={() => setFormOpen(false)}
        />
      )}
      <MobileTransactionDetail
        tx={rows.find(t => t.id === selectedId) ?? null}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
