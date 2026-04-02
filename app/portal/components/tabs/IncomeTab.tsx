'use client'

/**
 * app/portal/components/tabs/IncomeTab.tsx
 *
 * Income tab — split-panel layout.
 * Left: income list (always visible, scrollable).
 * Right: EntryPanel slides in for adding/editing entries.
 *
 * UX principles:
 * - Click a row → open detail panel (edit/delete)
 * - "Add Another" submits and keeps panel open with cursor back on Description
 * - "Done" submits and closes the panel
 * - Draft auto-saved to localStorage on every keystroke
 * - Delete on row hover (icon only) OR in detail panel (danger button)
 * - Button sizing: intrinsic width, right-aligned — never full-width on desktop
 */

import { useState, useEffect } from 'react'
import type { Client, IncomeCategory } from '@/types'
import { useIncome }   from './useIncome'
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

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ─── Draft state shape ────────────────────────────────────────────────────────

interface IncomeFormState {
  description: string
  amount:      string
  date:        string
  category:    IncomeCategory
  notes:       string
}

const TODAY = new Date().toISOString().slice(0, 10)

const EMPTY_FORM: IncomeFormState = {
  description: '',
  amount:      '',
  date:        TODAY,
  category:    'trading',
  notes:       '',
}

// ─── Field group container (Task 3) ──────────────────────────────────────────

const fieldGroup: React.CSSProperties = {
  background:   'rgba(0,0,0,0.03)',
  borderRadius: radius.md,
  padding:      '14px',
  display:      'flex',
  flexDirection: 'column',
  gap:          spacing.form.fieldGap,
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client:    Client
  readOnly?: boolean
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
          background:  'transparent',
          border:      'none',
          color:       colours.warning,
          cursor:      'pointer',
          fontSize:    fontSize.xs,
          fontFamily:  fonts.sans,
          padding:     '2px 6px',
        }}
      >
        Discard
      </button>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

type IncomeItem = ReturnType<typeof useIncome>['income'][number]

export default function IncomeTab({ client, readOnly = false }: Props) {
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()
  useEffect(() => { setPlaceholder('Search income…') }, [setPlaceholder])

  const [panelOpen, setPanelOpen] = useState(false)
  const [editItem, setEditItem]   = useState<IncomeItem | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editForm, setEditForm]   = useState<IncomeFormState>(EMPTY_FORM)

  const {
    income, totalPence, entryCount,
    availableMonths, loadedMonths, hasMore, loadingMore, loadMonth,
    loading, saving, error,
    form: hookForm, setForm: hookSetForm, isFormValid, addIncome, deleteIncome, resetForm,
  } = useIncome(client.id, client.tax_year, client.user_id)

  // Draft persistence — new entries only
  const draftKey = `foundry-draft-income-${client.id}`
  const { state: draftForm, setState: setDraftForm, clearDraft, hasDraft } = useDraft<IncomeFormState>(
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

  function handleFieldChange(field: keyof IncomeFormState, value: string) {
    const updated = { ...draftForm, [field]: value }
    setDraftForm(updated)
    hookSetForm(f => ({ ...f, [field]: value as IncomeCategory }))
  }

  async function handleSave(keepOpen: boolean) {
    await addIncome()
    clearDraft()
    hookSetForm(() => EMPTY_FORM)
    setDraftForm(EMPTY_FORM)
    if (!keepOpen) setPanelOpen(false)
  }

  // ── Edit existing ──

  function openEditPanel(item: IncomeItem) {
    setEditItem(item)
    setEditNotes('')
    setEditForm({
      description: item.description,
      amount:      (item.amount_pence / 100).toFixed(2),
      date:        item.date,
      category:    item.category as IncomeCategory,
      notes:       '',
    })
    setPanelOpen(true)
  }

  async function handleEditSave() {
    if (!editItem) return
    // Delete old, add updated (upsert-style for demo)
    await deleteIncome(editItem.id, editItem.amount_pence)
    hookSetForm(() => ({
      description: editForm.description,
      amount:      editForm.amount,
      date:        editForm.date,
      category:    editForm.category,
    }))
    await addIncome()
    resetForm()
    hookSetForm(() => EMPTY_FORM)
    setEditItem(null)
    setPanelOpen(false)
  }

  async function handleEditDelete() {
    if (!editItem) return
    await deleteIncome(editItem.id, editItem.amount_pence)
    setEditItem(null)
    setPanelOpen(false)
  }

  function handleClose() {
    resetForm()
    setEditItem(null)
    setPanelOpen(false)
  }

  // Filter by shell search query
  const filteredIncome = income.filter(item =>
    !query ||
    item.description?.toLowerCase().includes(query.toLowerCase()) ||
    item.category?.toLowerCase().includes(query.toLowerCase())
  )

  // Month grouping
  const groups: Record<string, typeof income> = {}
  for (const item of filteredIncome) {
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

      {/* ── Left: income list (always visible) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, minWidth: 0 }}>

        {/* Summary stat */}
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

        {error && <ErrorBanner error={error} />}

        {/* Income list */}
        <Panel padding="0" style={{ flex: 1 }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   income.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
          }}>
            <Label>Income · {client.tax_year}</Label>
            {!readOnly && !panelOpen && (
              <Button size="sm" onClick={openNewPanel}>
                + Add entry
              </Button>
            )}
          </div>

          {filteredIncome.length === 0 && entryCount === 0 && (
            <EmptyState
              icon="↑"
              headline="No income logged yet."
              sub="Every payment you receive goes here. Start with your first entry and we'll handle the categorisation."
              action={readOnly ? undefined : 'Log first entry'}
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
                    color:         colours.income,
                    letterSpacing: letterSpacing.tight,
                  }}>
                    {formatGBP(subtotal)}
                  </span>
                </div>
                {rows.map((item, idx) => (
                  <IncomeRow
                    key={item.id}
                    item={item}
                    isLast={idx === rows.length - 1}
                    selected={editItem?.id === item.id}
                    onSelect={readOnly ? undefined : () => openEditPanel(item)}
                    onDelete={readOnly ? undefined : () => deleteIncome(item.id, item.amount_pence)}
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
                  background:  'transparent',
                  border:      'none',
                  color:       colours.textMuted,
                  fontSize:    fontSize.sm,
                  cursor:      loadingMore ? 'default' : 'pointer',
                  fontFamily:  fonts.sans,
                  padding:     '4px 8px',
                  transition:  transition.snap,
                  opacity:     loadingMore ? 0.5 : 1,
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
          title={editItem ? 'Income entry' : 'New income entry'}
          subtitle={editItem ? formatDate(editItem.date) : client.tax_year}
          onClose={handleClose}
        >
          {editItem ? (
            /* ── Edit / view mode ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
              <div style={fieldGroup}>
                <Input
                  label="Description"
                  value={editForm.description}
                  onChange={v => setEditForm(f => ({ ...f, description: v }))}
                  placeholder="e.g. Invoice #023 — Acme Ltd"
                  autoFocus
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
                  <Input
                    label="Amount (£)"
                    type="number"
                    value={editForm.amount}
                    onChange={v => setEditForm(f => ({ ...f, amount: v }))}
                    placeholder="0.00"
                  />
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
                  onChange={v => setEditForm(f => ({ ...f, category: v as IncomeCategory }))}
                  options={INCOME_CATEGORIES}
                />
              </div>

              {/* Notes */}
              <div style={fieldGroup}>
                <div>
                  <div style={{
                    fontSize:     fontSize.xs,
                    fontWeight:   fontWeight.medium,
                    color:        colours.textSecondary,
                    fontFamily:   fonts.sans,
                    marginBottom: '6px',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                  }}>
                    Notes
                  </div>
                  <textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
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
                  placeholder="e.g. Invoice #023 — Acme Ltd"
                  autoFocus
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
                  <Input
                    label="Amount (£)"
                    type="number"
                    value={draftForm.amount}
                    onChange={v => handleFieldChange('amount', v)}
                    placeholder="0.00"
                  />
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
                  options={INCOME_CATEGORIES}
                />
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

// ─── Income row ──────────────────────────────────────────────────────────────

interface IncomeRowProps {
  item:      ReturnType<typeof useIncome>['income'][number]
  isLast:    boolean
  selected?: boolean
  onSelect?: () => void
  onDelete?: () => void
}

function IncomeRow({ item, isLast, selected, onSelect, onDelete }: IncomeRowProps) {
  const colours = useColours()
  const [hovered, setHovered] = useState(false)

  const categoryLabel = INCOME_CATEGORIES.find(c => c.value === item.category)?.label
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
