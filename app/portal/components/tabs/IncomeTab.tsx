'use client'

/**
 * app/portal/components/tabs/IncomeTab.tsx
 *
 * Income tab — presentation layer only.
 *
 * Rules:
 * - No Supabase imports. No data fetching. All data via useIncome().
 * - All design values from @/styles/tokens — no hardcoded values.
 * - Uses shared UI primitives from ../ui/index.tsx throughout.
 */

import { useState } from 'react'
import type { Client, IncomeCategory } from '@/types'
import { useIncome }  from './useIncome'
import {
  Panel, Label, StatCard, EmptyState,
  Spinner, Badge, Button, Input, Select,
  ErrorBanner, formatGBP, formatDate,
} from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'

// ─── Category options ─────────────────────────────────────────────────────────

const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'trading',      label: 'Trading income' },
  { value: 'day_rate',     label: 'Day rate / consultancy' },
  { value: 'fixed_price',  label: 'Fixed price project' },
  { value: 'retainer',     label: 'Retainer' },
  { value: 'platform',     label: 'Platform / marketplace' },
  { value: 'brand_deal',   label: 'Brand deal / sponsorship' },
  { value: 'rental',       label: 'Rental income' },
  { value: 'construction', label: 'Construction / CIS' },
  { value: 'employment',   label: 'Employment (PAYE)' },
  { value: 'dividends',    label: 'Dividends' },
  { value: 'interest',     label: 'Interest' },
  { value: 'grant',        label: 'Grant' },
  { value: 'other',        label: 'Other income' },
]

// ─── Month helper ─────────────────────────────────────────────────────────────

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client: Client
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function IncomeTab({ client }: Props) {
  const [showForm, setShowForm] = useState(false)

  const {
    income,
    totalPence,
    entryCount,
    availableMonths,
    loadedMonths,
    hasMore,
    loadingMore,
    loadMonth,
    loading,
    saving,
    error,
    form,
    setForm,
    isFormValid,
    addIncome,
    deleteIncome,
    resetForm,
  } = useIncome(client.id, client.tax_year, client.user_id)

  // ── Handlers ───────────────────────────────────────────────────
  async function handleAdd() {
    await addIncome()
    setShowForm(false)
  }

  function handleCancel() {
    resetForm()
    setShowForm(false)
  }

  // ── Month grouping ──────────────────────────────────────────────
  const groups: Record<string, typeof income> = {}
  for (const item of income) {
    const m = item.date.slice(0, 7)
    if (!groups[m]) groups[m] = []
    groups[m].push(item)
  }
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  // Next month to load
  const nextMonth = availableMonths.find(m => !loadedMonths.includes(m))

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>

      {/* ── Summary stat ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.tab.gap }}>
        <StatCard
          label="Total income"
          value={totalPence > 0 ? formatGBP(totalPence) : '—'}
          sub={entryCount > 0
            ? `${entryCount} entr${entryCount === 1 ? 'y' : 'ies'} · ${client.tax_year}`
            : `No income logged yet · ${client.tax_year}`
          }
          colour={colours.income}
        />
      </div>

      {/* ── Error banner ── */}
      {error && <ErrorBanner error={error} />}

      {/* ── Add entry form ── */}
      {showForm && (
        <Panel>
          <Label>New income entry</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>

            <Input
              label="Description"
              value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
              placeholder="e.g. Invoice #023 — Acme Ltd"
              autoFocus
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
              <Input
                label="Amount (£)"
                type="number"
                value={form.amount}
                onChange={v => setForm(f => ({ ...f, amount: v }))}
                placeholder="0.00"
              />
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={v => setForm(f => ({ ...f, date: v }))}
              />
            </div>

            <Select
              label="Category"
              value={form.category}
              onChange={v => setForm(f => ({ ...f, category: v as IncomeCategory }))}
              options={INCOME_CATEGORIES}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Button onClick={handleAdd} disabled={saving || !isFormValid}>
                {saving ? 'Saving…' : 'Save entry'}
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* ── Income list ── */}
      <Panel padding="0">
        {/* List header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
          borderBottom:   income.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
        }}>
          <Label>Income · {client.tax_year}</Label>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              + Add entry
            </Button>
          )}
        </div>

        {/* Empty state */}
        {income.length === 0 && entryCount === 0 && (
          <EmptyState
            icon="↑"
            headline="No income logged yet."
            sub="Every payment you receive goes here. Start with your first entry and we'll handle the categorisation."
            action="Log first entry"
            onAction={() => setShowForm(true)}
          />
        )}

        {/* Month groups */}
        {sortedGroupKeys.map(month => {
          const rows      = groups[month]
          const subtotal  = rows.reduce((s, r) => s + r.amount_pence, 0)
          return (
            <div key={month}>
              {/* Month header */}
              <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        `8px ${spacing.panel.padding}`,
                background:     colours.hoverBg,
                borderBottom:   `1px solid ${colours.borderHairline}`,
              }}>
                <span style={{
                  fontSize:      fontSize.xs,
                  fontWeight:    fontWeight.medium,
                  color:         colours.textSecondary,
                  letterSpacing: '0.04em',
                }}>
                  {formatMonthLabel(month)}
                  <span style={{ opacity: 0.5, margin: '0 6px' }}>·</span>
                  {rows.length} entr{rows.length === 1 ? 'y' : 'ies'}
                </span>
                <span style={{
                  fontFamily:    fonts.mono,
                  fontSize:      fontSize.xs,
                  fontWeight:    fontWeight.semibold,
                  color:         colours.income,
                  letterSpacing: letterSpacing.tight,
                }}>
                  {formatGBP(subtotal)}
                </span>
              </div>
              {/* Rows */}
              {rows.map((item, idx) => (
                <IncomeRow
                  key={item.id}
                  item={item}
                  isLast={idx === rows.length - 1}
                  onDelete={() => deleteIncome(item.id, item.amount_pence)}
                />
              ))}
            </div>
          )
        })}

        {/* Load more month */}
        {hasMore && nextMonth && (
          <div style={{
            borderTop:      `1px solid ${colours.borderHairline}`,
            padding:        '14px',
            display:        'flex',
            justifyContent: 'center',
          }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadMonth}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : `Load ${formatMonthLabel(nextMonth)}`}
            </Button>
          </div>
        )}
      </Panel>
    </div>
  )
}

// ─── Income row ──────────────────────────────────────────────────────────────

interface IncomeRowProps {
  item:     ReturnType<typeof useIncome>['income'][number]
  isLast:   boolean
  onDelete: () => void
}

function IncomeRow({ item, isLast, onDelete }: IncomeRowProps) {
  const [hovered, setHovered] = useState(false)

  const categoryLabel = INCOME_CATEGORIES.find(c => c.value === item.category)?.label
    ?? item.category

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        spacing.table.rowPadding,
        borderBottom:   isLast ? 'none' : `1px solid ${colours.borderHairline}`,
        background:     hovered ? colours.hoverBg : 'transparent',
        transition:     transition.snap,
      }}
    >
      {/* Left — icon + description */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   radius.sm,
          background:     colours.incomeLight,
          border:         `1px solid ${colours.income}22`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '13px',
          color:          colours.income,
          flexShrink:     0,
        }}>
          ↑
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
            {item.description}
          </div>
          <div style={{
            fontSize:   fontSize.xs,
            color:      colours.textMuted,
            marginTop:  '2px',
            display:    'flex',
            gap:        '8px',
            alignItems: 'center',
          }}>
            <span style={{ fontFamily: fonts.mono }}>{formatDate(item.date)}</span>
            <Badge variant="income">{categoryLabel}</Badge>
          </div>
        </div>
      </div>

      {/* Right — amount + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{
          fontFamily:    fonts.mono,
          fontSize:      fontSize.base,
          fontWeight:    fontWeight.semibold,
          color:         colours.income,
          letterSpacing: letterSpacing.tight,
        }}>
          {formatGBP(item.amount_pence)}
        </div>
        {hovered && (
          <button
            onClick={onDelete}
            title="Remove entry"
            style={{
              width:          '24px',
              height:         '24px',
              borderRadius:   radius.circle,
              background:     colours.dangerLight,
              border:         'none',
              color:          colours.danger,
              fontSize:       '11px',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              transition:     transition.snap,
              flexShrink:     0,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
