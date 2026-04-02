'use client'

/**
 * app/portal/components/tabs/ExpensesTab.tsx
 *
 * Expenses tab — split-panel layout.
 * Left: expense list (always visible, scrollable).
 * Right: EntryPanel slides in for adding/editing entries.
 *
 * Key features:
 * - Click a row → detail panel (edit description, amount, date, category, notes, receipt)
 * - Allowability badge (Pending / Allowable / Not allowable)
 * - Receipt upload: paperclip icon next to Amount
 * - "Add Another" submits and keeps panel open
 * - "Done" submits and closes the panel
 * - Draft auto-saved to localStorage on every keystroke
 */

import { useState, useRef, useEffect } from 'react'
import type { Client, ExpenseCategory } from '@/types'
import { useExpenses } from './useExpenses'
import { useDraft }    from '@/lib/useDraft'
import {
  Panel, Label, StatCard, EmptyState,
  Spinner, Badge, Button, Input, Select,
  ErrorBanner, formatGBP, formatDate,
} from '../ui'
import EntryPanel from '../ui/EntryPanel'
import { useColours } from '@/styles/ThemeContext'
import { useShellSearch } from '@/app/components/shells/BaseShell'
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
  notes:       string
}

const TODAY = new Date().toISOString().slice(0, 10)

const EMPTY_FORM: ExpenseFormState = {
  description: '',
  amount:      '',
  date:        TODAY,
  category:    'other',
  notes:       '',
}

// ─── Field group container (Task 3) ──────────────────────────────────────────

const fieldGroup: React.CSSProperties = {
  background:    'rgba(0,0,0,0.03)',
  borderRadius:  radius.md,
  padding:       '14px',
  display:       'flex',
  flexDirection: 'column',
  gap:           spacing.form.fieldGap,
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client:           Client
  readOnly?:        boolean
  onExpenseSelect?: (expenseId: string) => void
}

// ─── Draft banner ─────────────────────────────────────────────────────────────

function DraftBanner({ onDiscard }: { onDiscard: () => void }) {
  const colours = useColours()
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

// ─── Receipt upload button ────────────────────────────────────────────────────

function ReceiptButton({
  file, onClick,
}: { file: File | null; onClick: () => void }) {
  const colours = useColours()
  return (
    <button
      type="button"
      title="Attach receipt"
      onClick={onClick}
      style={{
        width:          '34px',
        height:         '34px',
        borderRadius:   radius.sm,
        border:         `1px solid ${file ? colours.accent : colours.borderMedium}`,
        background:     file ? colours.accentLight : 'transparent',
        color:          file ? colours.accent : colours.textMuted,
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '14px',
        transition:     transition.snap,
        flexShrink:     0,
        marginBottom:   '1px',
      }}
    >
      📎
    </button>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

type ExpenseItem = import('@/types').Expense

export default function ExpensesTab({ client, readOnly = false, onExpenseSelect }: Props) {
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()

  useEffect(() => { setPlaceholder('Search expenses…') }, [setPlaceholder])

  const [panelOpen, setPanelOpen]       = useState(false)
  const [editItem, setEditItem]         = useState<ExpenseItem | null>(null)
  const [editForm, setEditForm]         = useState<ExpenseFormState>(EMPTY_FORM)
  const [receiptFile, setReceiptFile]   = useState<File | null>(null)
  const [editReceipt, setEditReceipt]   = useState<File | null>(null)
  const receiptInputRef                 = useRef<HTMLInputElement>(null)
  const editReceiptRef                  = useRef<HTMLInputElement>(null)

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

  // ── New entry ──

  function openNewPanel() {
    setEditItem(null)
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
    hookSetForm(f => ({ ...f, [field]: value as ExpenseCategory }))
  }

  async function handleSave(keepOpen: boolean) {
    await addExpense()
    clearDraft()
    setReceiptFile(null)
    hookSetForm(() => EMPTY_FORM)
    setDraftForm(EMPTY_FORM)
    if (!keepOpen) setPanelOpen(false)
  }

  // ── Edit existing ──

  function openEditPanel(item: ExpenseItem) {
    setEditItem(item)
    setEditReceipt(null)
    setEditForm({
      description: item.description,
      amount:      (item.amount_pence / 100).toFixed(2),
      date:        item.date,
      category:    item.category as ExpenseCategory,
      notes:       '',
    })
    setPanelOpen(true)
  }

  async function handleEditSave() {
    if (!editItem) return
    await deleteExpense(editItem.id, editItem.amount_pence)
    hookSetForm(() => ({
      description: editForm.description,
      amount:      editForm.amount,
      date:        editForm.date,
      category:    editForm.category,
    }))
    await addExpense()
    resetForm()
    hookSetForm(() => EMPTY_FORM)
    setEditItem(null)
    setPanelOpen(false)
  }

  async function handleEditDelete() {
    if (!editItem) return
    await deleteExpense(editItem.id, editItem.amount_pence)
    setEditItem(null)
    setPanelOpen(false)
  }

  function handleClose() {
    resetForm()
    setEditItem(null)
    setPanelOpen(false)
  }

  // Search filter
  const filteredExpenses = expenses.filter(e =>
    !query ||
    e.description?.toLowerCase().includes(query.toLowerCase()) ||
    e.category?.toLowerCase().includes(query.toLowerCase())
  )

  // Month grouping
  const groups: Record<string, typeof expenses> = {}
  for (const item of filteredExpenses) {
    const m = item.date.slice(0, 7)
    if (!groups[m]) groups[m] = []
    groups[m].push(item)
  }
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a))
  const nextMonth = availableMonths.find(m => !loadedMonths.includes(m))

  if (loading) return <Spinner />

  const isNewFormValid = isFormValid && !editItem
  const isEditFormValid = editForm.description.trim() && editForm.amount && editForm.date

  return (
    <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0, flex: 1 }}>

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
        <Panel padding="0" style={{ flex: 1 }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   expenses.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
          }}>
            <Label>Expenses · {client.tax_year}</Label>
            {!readOnly && !panelOpen && (
              <Button size="sm" onClick={openNewPanel}>
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
              onAction={readOnly ? undefined : openNewPanel}
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
                    selected={editItem?.id === item.id}
                    onSelect={readOnly ? undefined : () => openEditPanel(item)}
                    onDelete={readOnly ? undefined : () => deleteExpense(item.id, item.amount_pence)}
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

      {/* ── Right: entry / detail panel ── */}
      {!readOnly && (
        <EntryPanel
          open={panelOpen}
          title={editItem ? 'Expense entry' : 'New expense entry'}
          subtitle={editItem ? formatDate(editItem.date) : client.tax_year}
          onClose={handleClose}
        >
          {editItem ? (
            /* ── Edit mode ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
              <div style={fieldGroup}>
                <Input
                  label="Description"
                  value={editForm.description}
                  onChange={v => setEditForm(f => ({ ...f, description: v }))}
                  placeholder="e.g. Boiler repair — 14 Ashford Rd"
                  autoFocus
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
                  {/* Amount + receipt */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                      <div style={{ flex: 1 }}>
                        <Input
                          label="Amount (£)"
                          type="number"
                          value={editForm.amount}
                          onChange={v => setEditForm(f => ({ ...f, amount: v }))}
                          placeholder="0.00"
                        />
                      </div>
                      <ReceiptButton file={editReceipt} onClick={() => editReceiptRef.current?.click()} />
                      <input
                        ref={editReceiptRef}
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={e => setEditReceipt(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    {editReceipt && (
                      <div style={{ marginTop: '4px', fontSize: fontSize.xs, color: colours.accent, display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span>✓</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{editReceipt.name}</span>
                        <button onClick={() => setEditReceipt(null)} style={{ background: 'none', border: 'none', color: colours.textMuted, cursor: 'pointer', padding: '0 2px', fontSize: fontSize.xs }}>✕</button>
                      </div>
                    )}
                  </div>
                  <Input
                    label="Date"
                    type="date"
                    value={editForm.date}
                    onChange={v => setEditForm(f => ({ ...f, date: v }))}
                  />
                </div>
                <Select
                  label="Category"
                  value={editForm.category}
                  onChange={v => setEditForm(f => ({ ...f, category: v as ExpenseCategory }))}
                  options={EXPENSE_CATEGORIES}
                />
              </div>

              {/* Notes */}
              <div style={fieldGroup}>
                <div>
                  <div style={{
                    fontSize:      fontSize.xs,
                    fontWeight:    fontWeight.medium,
                    color:         colours.textSecondary,
                    fontFamily:    fonts.sans,
                    marginBottom:  '6px',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                  }}>
                    Notes
                  </div>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes for your records…"
                    rows={3}
                    style={{
                      width:        '100%',
                      padding:      '8px 10px',
                      background:   colours.inputBg,
                      border:       `1px solid ${colours.borderMedium}`,
                      borderRadius: radius.sm,
                      fontSize:     fontSize.sm,
                      fontFamily:   fonts.sans,
                      color:        colours.textPrimary,
                      resize:       'vertical' as const,
                      outline:      'none',
                      lineHeight:   1.5,
                      boxSizing:    'border-box' as const,
                    }}
                  />
                </div>
              </div>

              {/* Allowability note */}
              <div style={{
                padding:      '8px 10px',
                background:   colours.warningLight,
                borderRadius: radius.sm,
                fontSize:     fontSize.xs,
                color:        colours.warning,
                lineHeight:   1.5,
              }}>
                <AllowableBadge allowable={editItem.allowable ?? null} /> Your accountant will confirm allowability.
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '4px' }}>
                <button
                  onClick={handleEditDelete}
                  style={{
                    background:   colours.dangerLight,
                    border:       `1px solid ${colours.danger}33`,
                    borderRadius: radius.sm,
                    color:        colours.danger,
                    fontSize:     fontSize.sm,
                    fontFamily:   fonts.sans,
                    fontWeight:   fontWeight.medium,
                    padding:      '7px 14px',
                    cursor:       'pointer',
                    transition:   transition.snap,
                  }}
                >
                  Delete
                </button>
                <Button
                  size="sm"
                  onClick={handleEditSave}
                  disabled={saving || !isEditFormValid}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          ) : (
            /* ── New entry mode ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
              {hasDraft && <DraftBanner onDiscard={() => { clearDraft(); hookSetForm(() => EMPTY_FORM) }} />}

              <div style={fieldGroup}>
                <Input
                  label="Description"
                  value={draftForm.description}
                  onChange={v => handleFieldChange('description', v)}
                  placeholder="e.g. Boiler repair — 14 Ashford Rd"
                  autoFocus
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
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
                      <ReceiptButton file={receiptFile} onClick={() => receiptInputRef.current?.click()} />
                      <input
                        ref={receiptInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: 'none' }}
                        onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    {receiptFile && (
                      <div style={{ marginTop: '4px', fontSize: fontSize.xs, color: colours.accent, display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span>✓</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{receiptFile.name}</span>
                        <button onClick={() => setReceiptFile(null)} style={{ background: 'none', border: 'none', color: colours.textMuted, cursor: 'pointer', padding: '0 2px', fontSize: fontSize.xs }}>✕</button>
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
              </div>

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

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={saving || !isNewFormValid}
                >
                  {saving ? 'Saving…' : 'Add another'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={saving || !isNewFormValid}
                >
                  {saving ? 'Saving…' : 'Done'}
                </Button>
              </div>
            </div>
          )}
        </EntryPanel>
      )}
    </div>
  )
}

// ─── Expense row ─────────────────────────────────────────────────────────────

interface ExpenseRowProps {
  item:      ExpenseItem
  isLast:    boolean
  selected?: boolean
  onSelect?: () => void
  onDelete?: () => void
}

function ExpenseRow({ item, isLast, selected, onSelect, onDelete }: ExpenseRowProps) {
  const colours = useColours()
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
        background:     selected ? colours.accentLight : hovered ? colours.hoverBg : 'transparent',
        transition:     transition.snap,
        cursor:         onSelect ? 'pointer' : 'default',
        borderLeft:     selected ? `2px solid ${colours.accent}` : '2px solid transparent',
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
            {item.allowable === true  && <Badge variant="success">Allowable</Badge>}
            {item.allowable === false && <Badge variant="danger">Not allowable</Badge>}
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
        {hovered && onDelete && !onSelect && (
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
