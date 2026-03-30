'use client'

/**
 * app/portal/components/tabs/ExpensesTab.tsx
 *
 * Expenses tab — presentation layer only.
 * Follows the identical pattern to IncomeTab.
 *
 * Key addition vs IncomeTab:
 * - Each row shows an allowability badge:
 *   null  → "Pending review"  (amber)
 *   true  → "Allowable"       (green)
 *   false → "Not allowable"   (red)
 */

import { useState } from 'react'
import type { Client, ExpenseCategory } from '@/types'
import { useExpenses } from './useExpenses'
import {
  Panel, Label, StatCard, EmptyState,
  Spinner, Badge, Button, Input, Select,
  ErrorBanner, formatGBP, formatDate,
} from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'

// ─── Category options ─────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'repairs',             label: 'Repairs & maintenance' },
  { value: 'mortgage_interest',   label: 'Mortgage interest' },
  { value: 'agent_fees',          label: 'Letting agent fees' },
  { value: 'insurance',           label: 'Insurance' },
  { value: 'ground_rent',         label: 'Ground rent' },
  { value: 'service_charge',      label: 'Service charge' },
  { value: 'travel',              label: 'Travel' },
  { value: 'vehicle',             label: 'Vehicle' },
  { value: 'fuel',                label: 'Fuel' },
  { value: 'tools',               label: 'Tools & equipment' },
  { value: 'materials',           label: 'Materials' },
  { value: 'protective_clothing', label: 'Protective clothing' },
  { value: 'software',            label: 'Software & subscriptions' },
  { value: 'hardware',            label: 'Hardware' },
  { value: 'phone',               label: 'Phone' },
  { value: 'broadband',           label: 'Broadband' },
  { value: 'home_office',         label: 'Home office' },
  { value: 'office_rent',         label: 'Office rent' },
  { value: 'professional_fees',   label: 'Professional fees' },
  { value: 'training',            label: 'Training & courses' },
  { value: 'marketing',           label: 'Marketing & advertising' },
  { value: 'website',             label: 'Website & hosting' },
  { value: 'subcontractor',       label: 'Subcontractor payments' },
  { value: 'stock',               label: 'Stock & inventory' },
  { value: 'stationery',          label: 'Stationery & postage' },
  { value: 'subscriptions',       label: 'Subscriptions' },
  { value: 'production',          label: 'Production costs' },
  { value: 'props_and_wardrobe',  label: 'Props & wardrobe' },
  { value: 'accommodation',       label: 'Accommodation' },
  { value: 'parking',             label: 'Parking & tolls' },
  { value: 'other',               label: 'Other expense' },
]

// ─── Month helper ─────────────────────────────────────────────────────────────

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ─── Allowability badge ───────────────────────────────────────────────────────

function AllowableBadge({ allowable }: { allowable: boolean | null }) {
  if (allowable === true)  return <Badge variant="success">Allowable</Badge>
  if (allowable === false) return <Badge variant="danger">Not allowable</Badge>
  return <Badge variant="warning">Pending review</Badge>
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client: Client
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExpensesTab({ client }: Props) {
  const [showForm, setShowForm] = useState(false)

  const {
    expenses,
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
    addExpense,
    deleteExpense,
    resetForm,
  } = useExpenses(client.id, client.tax_year, client.user_id)

  async function handleAdd() {
    await addExpense()
    setShowForm(false)
  }

  function handleCancel() {
    resetForm()
    setShowForm(false)
  }

  // ── Month grouping ──────────────────────────────────────────────
  const groups: Record<string, typeof expenses> = {}
  for (const item of expenses) {
    const m = item.date.slice(0, 7)
    if (!groups[m]) groups[m] = []
    groups[m].push(item)
  }
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  const nextMonth = availableMonths.find(m => !loadedMonths.includes(m))

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>

      {/* ── Summary stat ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.tab.gap }}>
        <StatCard
          label="Total expenses"
          value={totalPence > 0 ? formatGBP(totalPence) : '—'}
          sub={entryCount > 0
            ? `${entryCount} entr${entryCount === 1 ? 'y' : 'ies'} · ${client.tax_year}`
            : `No expenses logged yet · ${client.tax_year}`
          }
          colour={colours.expense}
        />
      </div>

      {/* ── Error banner ── */}
      {error && <ErrorBanner error={error} />}

      {/* ── Add entry form ── */}
      {showForm && (
        <Panel>
          <Label>New expense entry</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>

            <Input
              label="Description"
              value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
              placeholder="e.g. Boiler repair — 14 Ashford Rd"
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
              onChange={v => setForm(f => ({ ...f, category: v as ExpenseCategory }))}
              options={EXPENSE_CATEGORIES}
            />

            <div style={{
              padding:      '10px 12px',
              background:   colours.warningLight,
              borderRadius: radius.sm,
              fontSize:     fontSize.xs,
              color:        colours.warning,
              lineHeight:   1.5,
            }}>
              Your accountant will review allowability. Expenses are marked pending until confirmed.
            </div>

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

      {/* ── Expenses list ── */}
      <Panel padding="0">
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
          borderBottom:   expenses.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
        }}>
          <Label>Expenses · {client.tax_year}</Label>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              + Add entry
            </Button>
          )}
        </div>

        {expenses.length === 0 && entryCount === 0 && (
          <EmptyState
            icon="↓"
            headline="No expenses logged yet."
            sub="Every business cost goes here. Your accountant will confirm what's allowable against your tax bill."
            action="Log first expense"
            onAction={() => setShowForm(true)}
          />
        )}

        {/* Month groups */}
        {sortedGroupKeys.map(month => {
          const rows     = groups[month]
          const subtotal = rows.reduce((s, r) => s + r.amount_pence, 0)
          return (
            <div key={month}>
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
                  color:         colours.expense,
                  letterSpacing: letterSpacing.tight,
                }}>
                  {formatGBP(subtotal)}
                </span>
              </div>
              {rows.map((item, idx) => (
                <ExpenseRow
                  key={item.id}
                  item={item}
                  isLast={idx === rows.length - 1}
                  onDelete={() => deleteExpense(item.id, item.amount_pence)}
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

// ─── Expense row ─────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  item:     import('@/types').Expense
  isLast:   boolean
  onDelete: () => void
}

function ExpenseRow({ item, isLast, onDelete }: ExpenseRowProps) {
  const [hovered, setHovered] = useState(false)

  const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === item.category)?.label
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
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   radius.sm,
          background:     colours.expenseLight,
          border:         `1px solid ${colours.expense}22`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '13px',
          color:          colours.expense,
          flexShrink:     0,
        }}>
          ↓
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
            flexWrap:   'wrap' as const,
          }}>
            <span style={{ fontFamily: fonts.mono }}>{formatDate(item.date)}</span>
            <Badge variant="expense">{categoryLabel}</Badge>
            <AllowableBadge allowable={item.allowable ?? null} />
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{
          fontFamily:    fonts.mono,
          fontSize:      fontSize.base,
          fontWeight:    fontWeight.semibold,
          color:         colours.expense,
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
