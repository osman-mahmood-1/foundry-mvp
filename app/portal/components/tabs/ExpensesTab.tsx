'use client'

/**
 * app/portal/components/tabs/ExpensesTab.tsx
 *
 * Expenses tab — split-panel layout.
 * Left: expense list (always visible, scrollable).
 * Right: EntryPanel slides in for adding entries — user can reference
 *        existing entries while filling in the form.
 *
 * Key addition vs IncomeTab:
 * - Each row shows an allowability badge (Pending / Allowable / Not allowable)
 * - Receipt upload: paperclip icon next to Amount opens file picker
 * - "Add Another" submits and keeps panel open
 * - "Done" submits and closes the panel
 * - Draft auto-saved to localStorage on every keystroke
 */

import { useState, useRef } from 'react'
import type { Client, ExpenseCategory } from '@/types'
import { useExpenses } from './useExpenses'
import { useDraft }    from '@/lib/useDraft'
import {
  Panel, Label, StatCard, EmptyState,
  Spinner, Badge, Button, Input, Select,
  ErrorBanner, formatGBP, formatDate,
} from '../ui'
import EntryPanel from '../ui/EntryPanel'
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

// ─── Draft state shape ────────────────────────────────────────────────────────

interface ExpenseFormState {
  description: string
  amount:      string
  date:        string
  category:    ExpenseCategory
}

const TODAY = new Date().toISOString().slice(0, 10)

const EMPTY_FORM: ExpenseFormState = {
  description: '',
  amount:      '',
  date:        TODAY,
  category:    'other',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client:           Client
  readOnly?:        boolean
  onExpenseSelect?: (expenseId: string) => void
}

// ─── Draft banner ─────────────────────────────────────────────────────────────

function DraftBanner({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '8px 12px',
      background:     colours.warningLight,
      borderRadius:   radius.sm,
      fontSize:       fontSize.xs,
      color:          colours.warning,
      marginBottom:   '12px',
    }}>
      <span>◉ Draft restored — your previous entry has been reloaded.</span>
      <button
        onClick={onDiscard}
        style={{
          background: 'transparent',
          border:     'none',
          color:      colours.warning,
          cursor:     'pointer',
          fontSize:   fontSize.xs,
          fontFamily: fonts.sans,
          padding:    '2px 6px',
        }}
      >
        Discard
      </button>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ExpensesTab({ client, readOnly = false, onExpenseSelect }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  const {
    expenses, totalPence, entryCount,
    availableMonths, loadedMonths, hasMore, loadingMore, loadMonth,
    loading, saving, error,
    form: hookForm, setForm: hookSetForm, isFormValid, addExpense, deleteExpense, resetForm,
  } = useExpenses(client.id, client.tax_year, client.user_id)

  const draftKey = `foundry-draft-expense-${client.id}`
  const { state: draftForm, setState: setDraftForm, clearDraft, hasDraft } = useDraft<ExpenseFormState>(
    draftKey,
    EMPTY_FORM,
  )

  function openPanel() {
    hookSetForm(() => ({
      description: draftForm.description,
      amount:      draftForm.amount,
      date:        draftForm.date,
      category:    draftForm.category,
    }))
    setPanelOpen(true)
  }

  function handleFieldChange(field: keyof ExpenseFormState, value: string) {
    const updated = { ...draftForm, [field]: value }
    setDraftForm(updated)
    hookSetForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(keepOpen: boolean) {
    await addExpense()
    clearDraft()
    setReceiptFile(null)
    hookSetForm(() => EMPTY_FORM)
    setDraftForm(EMPTY_FORM)
    if (!keepOpen) setPanelOpen(false)
  }

  function handleClose() {
    resetForm()
    setPanelOpen(false)
  }

  // Month grouping
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
    <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0 }}>

      {/* ── Left: expense list (always visible) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, minWidth: 0 }}>

        {/* Summary stat */}
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

        {error && <ErrorBanner error={error} />}

        {/* Expense list */}
        <Panel padding="0">
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   expenses.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
          }}>
            <Label>Expenses · {client.tax_year}</Label>
            {!readOnly && !panelOpen && (
              <Button size="sm" onClick={openPanel}>
                + Add entry
              </Button>
            )}
          </div>

          {expenses.length === 0 && entryCount === 0 && (
            <EmptyState
              icon="↓"
              headline="No expenses logged yet."
              sub="Every business cost goes here. Your accountant will confirm what's allowable against your tax bill."
              action={readOnly ? undefined : 'Log first expense'}
              onAction={readOnly ? undefined : openPanel}
            />
          )}

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
                    onDelete={readOnly ? undefined : () => deleteExpense(item.id, item.amount_pence)}
                    onSelect={onExpenseSelect ? () => onExpenseSelect(item.id) : undefined}
                  />
                ))}
              </div>
            )
          })}

          {hasMore && nextMonth && (
            <div style={{
              borderTop:      `1px solid ${colours.borderHairline}`,
              padding:        '14px',
              display:        'flex',
              justifyContent: 'center',
            }}>
              <button
                onClick={loadMonth}
                disabled={loadingMore}
                style={{
                  background: 'transparent',
                  border:     'none',
                  color:      colours.textMuted,
                  fontSize:   fontSize.sm,
                  cursor:     loadingMore ? 'default' : 'pointer',
                  fontFamily: fonts.sans,
                  padding:    '4px 8px',
                  transition: transition.snap,
                  opacity:    loadingMore ? 0.5 : 1,
                }}
              >
                {loadingMore ? 'Loading…' : `+ Load ${formatMonthLabel(nextMonth)}`}
              </button>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Right: entry panel ── */}
      {!readOnly && (
        <EntryPanel
          open={panelOpen}
          title="New expense entry"
          subtitle={client.tax_year}
          onClose={handleClose}
        >
          {hasDraft && <DraftBanner onDiscard={() => { clearDraft(); hookSetForm(() => EMPTY_FORM) }} />}

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
            <Input
              label="Description"
              value={draftForm.description}
              onChange={v => handleFieldChange('description', v)}
              placeholder="e.g. Boiler repair — 14 Ashford Rd"
              autoFocus
            />

            {/* Amount + Date row with receipt upload */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
              {/* Amount + receipt icon stacked together */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Amount (£)"
                      type="number"
                      value={draftForm.amount}
                      onChange={v => handleFieldChange('amount', v)}
                      placeholder="0.00"
                    />
                  </div>
                  {/* Receipt upload button */}
                  <button
                    type="button"
                    title="Attach receipt"
                    onClick={() => receiptInputRef.current?.click()}
                    style={{
                      width:        '34px',
                      height:       '34px',
                      borderRadius: radius.sm,
                      border:       `1px solid ${receiptFile ? colours.accent : colours.borderMedium}`,
                      background:   receiptFile ? colours.accentLight : 'transparent',
                      color:        receiptFile ? colours.accent : colours.textMuted,
                      cursor:       'pointer',
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent: 'center',
                      fontSize:     '14px',
                      transition:   transition.snap,
                      flexShrink:   0,
                      marginBottom: '1px',
                    }}
                    onMouseEnter={e => {
                      if (!receiptFile) {
                        e.currentTarget.style.background   = colours.hoverBg
                        e.currentTarget.style.borderColor  = colours.borderMedium
                      }
                    }}
                    onMouseLeave={e => {
                      if (!receiptFile) {
                        e.currentTarget.style.background  = 'transparent'
                        e.currentTarget.style.borderColor = colours.borderMedium
                      }
                    }}
                  >
                    📎
                  </button>
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                {/* Receipt filename hint */}
                {receiptFile && (
                  <div style={{
                    marginTop:    '4px',
                    fontSize:     fontSize.xs,
                    color:        colours.accent,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '4px',
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap' as const,
                  }}>
                    <span>✓</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {receiptFile.name}
                    </span>
                    <button
                      onClick={() => setReceiptFile(null)}
                      style={{
                        background: 'transparent',
                        border:     'none',
                        color:      colours.textMuted,
                        cursor:     'pointer',
                        padding:    '0 2px',
                        fontSize:   fontSize.xs,
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <Input
                label="Date"
                type="date"
                value={draftForm.date}
                onChange={v => handleFieldChange('date', v)}
              />
            </div>

            <Select
              label="Category"
              value={draftForm.category}
              onChange={v => handleFieldChange('category', v)}
              options={EXPENSE_CATEGORIES}
            />

            {/* Allowability note */}
            <div style={{
              padding:      '8px 10px',
              background:   colours.warningLight,
              borderRadius: radius.sm,
              fontSize:     fontSize.xs,
              color:        colours.warning,
              lineHeight:   1.5,
            }}>
              Your accountant will review allowability. Entries are marked pending until confirmed.
            </div>

            {/* Action buttons — right-aligned, intrinsic width */}
            <div style={{
              display:        'flex',
              gap:            '8px',
              justifyContent: 'flex-end',
              marginTop:      '4px',
            }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSave(true)}
                disabled={saving || !isFormValid}
              >
                {saving ? 'Saving…' : 'Add another'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleSave(false)}
                disabled={saving || !isFormValid}
              >
                {saving ? 'Saving…' : 'Done'}
              </Button>
            </div>
          </div>
        </EntryPanel>
      )}
    </div>
  )
}

// ─── Expense row ─────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  item:      import('@/types').Expense
  isLast:    boolean
  onDelete?: () => void
  onSelect?: () => void
}

function ExpenseRow({ item, isLast, onDelete, onSelect }: ExpenseRowProps) {
  const [hovered, setHovered] = useState(false)

  const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === item.category)?.label
    ?? item.category

  return (
    <div
      onClick={onSelect}
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
        cursor:         onSelect ? 'pointer' : 'default',
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
        {hovered && onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
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
