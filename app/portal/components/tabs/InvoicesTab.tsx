'use client'

/**
 * app/portal/components/tabs/InvoicesTab.tsx
 *
 * Invoice management — create, list, track status.
 * Uses the split-panel pattern: list on left, entry panel on right.
 *
 * Task 6: Row click opens detail panel:
 * - Draft invoices: fully editable (pre-populated form)
 * - Sent/Paid/Overdue: read-only view with status actions
 */

import { useState } from 'react'
import type { Client } from '@/types'
import { Panel, Label, EmptyState, Button, Input, Badge, formatGBP, formatDate } from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'
import EntryPanel from '../ui/EntryPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

interface Invoice {
  id:          string
  number:      string
  recipient:   string
  description: string
  amount:      number   // pence
  date:        string
  dueDate:     string
  status:      InvoiceStatus
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_INVOICES: Invoice[] = [
  {
    id:          '1',
    number:      'INV-001',
    recipient:   'Acme Ltd',
    description: 'Web development — June',
    amount:      350000,
    date:        '2025-06-01',
    dueDate:     '2025-06-30',
    status:      'paid',
  },
  {
    id:          '2',
    number:      'INV-002',
    recipient:   'Blue Sky Media',
    description: 'Brand strategy consultation',
    amount:      180000,
    date:        '2025-07-05',
    dueDate:     '2025-08-04',
    status:      'sent',
  },
  {
    id:          '3',
    number:      'INV-003',
    recipient:   'Parkside Properties',
    description: 'Monthly retainer — August',
    amount:      120000,
    date:        '2025-08-01',
    dueDate:     '2025-08-15',
    status:      'overdue',
  },
]

const STATUS_CONFIG: Record<InvoiceStatus, {
  label:   string
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}> = {
  draft:   { label: 'Draft',   variant: 'neutral' },
  sent:    { label: 'Sent',    variant: 'info' },
  paid:    { label: 'Paid',    variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
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

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontSize:      fontSize.xs,
        fontWeight:    fontWeight.medium,
        color:         colours.textSecondary,
        fontFamily:    fonts.sans,
        marginBottom:  '4px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   fontSize.sm,
        color:      colours.textPrimary,
        fontFamily: fonts.sans,
        padding:    '8px 10px',
        background: colours.hoverBg,
        borderRadius: radius.sm,
        border:     `1px solid ${colours.borderLight}`,
      }}>
        {value}
      </div>
    </div>
  )
}

// ─── Invoice row ──────────────────────────────────────────────────────────────

function InvoiceRow({
  invoice, isLast, selected, onSelect,
}: {
  invoice: Invoice; isLast: boolean; selected: boolean; onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const { label, variant }    = STATUS_CONFIG[invoice.status]

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
        cursor:         'pointer',
        borderLeft:     selected ? `2px solid ${colours.accent}` : '2px solid transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {/* Invoice number chip */}
        <div style={{
          padding:    '4px 8px',
          borderRadius: radius.xs,
          background:  colours.borderLight,
          fontFamily:  fonts.mono,
          fontSize:    fontSize.xs,
          color:       colours.textSecondary,
          whiteSpace:  'nowrap' as const,
          flexShrink:  0,
        }}>
          {invoice.number}
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
            {invoice.recipient}
          </div>
          <div style={{
            fontSize:   fontSize.xs,
            color:      colours.textMuted,
            marginTop:  '2px',
            display:    'flex',
            gap:        '8px',
            alignItems: 'center',
          }}>
            <span>{invoice.description}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span style={{ fontFamily: fonts.mono }}>Due {formatDate(invoice.dueDate)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Badge variant={variant}>{label}</Badge>
        <div style={{
          fontFamily:    fonts.mono,
          fontSize:      fontSize.base,
          fontWeight:    fontWeight.semibold,
          color:         invoice.status === 'paid' ? colours.income : colours.textPrimary,
          letterSpacing: letterSpacing.tight,
        }}>
          {formatGBP(invoice.amount)}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface InvoiceForm {
  recipient:   string
  description: string
  amount:      string
  date:        string
  dueDate:     string
}

const EMPTY_FORM: InvoiceForm = {
  recipient:   '',
  description: '',
  amount:      '',
  date:        new Date().toISOString().slice(0, 10),
  dueDate:     '',
}

export default function InvoicesTab({ client }: { client: Client }) {
  const [panelOpen, setPanelOpen]       = useState(false)
  const [panelMode, setPanelMode]       = useState<'new' | 'view' | 'edit'>('new')
  const [selectedInvoice, setSelected]  = useState<Invoice | null>(null)
  const [form, setForm]                 = useState<InvoiceForm>(EMPTY_FORM)
  const [editForm, setEditForm]         = useState<InvoiceForm>(EMPTY_FORM)
  const [invoices, setInvoices]         = useState<Invoice[]>(DEMO_INVOICES)
  const [saving, setSaving]             = useState(false)

  const isNewValid = form.recipient.trim() && form.description.trim() && form.amount && form.dueDate
  const isEditValid = editForm.recipient.trim() && editForm.description.trim() && editForm.amount && editForm.dueDate

  // ── Open new invoice panel ──
  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setPanelMode('new')
    setPanelOpen(true)
  }

  // ── Click existing row ──
  function openInvoice(invoice: Invoice) {
    setSelected(invoice)
    if (invoice.status === 'draft') {
      setEditForm({
        recipient:   invoice.recipient,
        description: invoice.description,
        amount:      (invoice.amount / 100).toFixed(2),
        date:        invoice.date,
        dueDate:     invoice.dueDate,
      })
      setPanelMode('edit')
    } else {
      setPanelMode('view')
    }
    setPanelOpen(true)
  }

  // ── Save new ──
  async function handleSaveNew(keepOpen: boolean) {
    if (!isNewValid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    const next: Invoice = {
      id:          Date.now().toString(),
      number:      `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      recipient:   form.recipient,
      description: form.description,
      amount:      Math.round(parseFloat(form.amount) * 100),
      date:        form.date,
      dueDate:     form.dueDate,
      status:      'draft',
    }
    setInvoices(prev => [next, ...prev])
    setForm(EMPTY_FORM)
    setSaving(false)
    if (!keepOpen) setPanelOpen(false)
  }

  // ── Save draft edits ──
  async function handleSaveEdit() {
    if (!selectedInvoice || !isEditValid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    setInvoices(prev => prev.map(inv =>
      inv.id === selectedInvoice.id
        ? {
            ...inv,
            recipient:   editForm.recipient,
            description: editForm.description,
            amount:      Math.round(parseFloat(editForm.amount) * 100),
            date:        editForm.date,
            dueDate:     editForm.dueDate,
          }
        : inv
    ))
    setSaving(false)
    setPanelOpen(false)
    setSelected(null)
  }

  // ── Mark as paid ──
  function markAsPaid() {
    if (!selectedInvoice) return
    setInvoices(prev => prev.map(inv =>
      inv.id === selectedInvoice.id ? { ...inv, status: 'paid' } : inv
    ))
    setSelected(prev => prev ? { ...prev, status: 'paid' } : null)
    setPanelOpen(false)
  }

  // ── Delete draft ──
  function deleteDraft() {
    if (!selectedInvoice) return
    setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id))
    setSelected(null)
    setPanelOpen(false)
  }

  function handleClose() {
    setPanelOpen(false)
    setSelected(null)
    setForm(EMPTY_FORM)
  }

  const totalPaid        = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

  // Panel title/subtitle
  const panelTitle = panelMode === 'new'
    ? 'New invoice'
    : panelMode === 'edit'
    ? `${selectedInvoice?.number} — Edit`
    : selectedInvoice?.number ?? 'Invoice'

  const panelSubtitle = panelMode === 'view' && selectedInvoice
    ? STATUS_CONFIG[selectedInvoice.status].label
    : undefined

  return (
    <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0 }}>
      {/* ── Left: invoice list ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, minWidth: 0 }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.tab.gap }}>
          <Panel padding={spacing.panel.paddingTight}>
            <div style={{ fontSize: fontSize.label, color: colours.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: fonts.mono, marginBottom: '10px' }}>
              Collected
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: '24px', fontWeight: fontWeight.medium, color: colours.income, lineHeight: 1 }}>
              {formatGBP(totalPaid)}
            </div>
          </Panel>
          <Panel padding={spacing.panel.paddingTight}>
            <div style={{ fontSize: fontSize.label, color: colours.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontFamily: fonts.mono, marginBottom: '10px' }}>
              Outstanding
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: '24px', fontWeight: fontWeight.medium, color: colours.textPrimary, lineHeight: 1 }}>
              {formatGBP(totalOutstanding)}
            </div>
          </Panel>
        </div>

        {/* Invoice list */}
        <Panel padding="0">
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   invoices.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
          }}>
            <Label>Invoices · {client.tax_year}</Label>
            {!panelOpen && (
              <Button size="sm" onClick={openNew}>
                + New invoice
              </Button>
            )}
          </div>

          {invoices.length === 0 && (
            <EmptyState
              icon="□"
              headline="No invoices yet."
              sub="Create your first invoice and track it from draft to paid."
              action="New invoice"
              onAction={openNew}
            />
          )}

          {invoices.map((invoice, idx) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isLast={idx === invoices.length - 1}
              selected={selectedInvoice?.id === invoice.id}
              onSelect={() => openInvoice(invoice)}
            />
          ))}
        </Panel>
      </div>

      {/* ── Right: panel ── */}
      <EntryPanel
        open={panelOpen}
        title={panelTitle}
        subtitle={panelSubtitle}
        onClose={handleClose}
      >
        {panelMode === 'view' && selectedInvoice ? (
          /* ── Read-only view (sent / paid / overdue) ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
            <div style={fieldGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: fonts.mono, fontSize: '22px', fontWeight: fontWeight.semibold, color: selectedInvoice.status === 'paid' ? colours.income : colours.textPrimary }}>
                  {formatGBP(selectedInvoice.amount)}
                </div>
                <Badge variant={STATUS_CONFIG[selectedInvoice.status].variant}>
                  {STATUS_CONFIG[selectedInvoice.status].label}
                </Badge>
              </div>
              <ReadField label="Recipient"    value={selectedInvoice.recipient} />
              <ReadField label="Description"  value={selectedInvoice.description} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
                <ReadField label="Issued"   value={formatDate(selectedInvoice.date)} />
                <ReadField label="Due date" value={formatDate(selectedInvoice.dueDate)} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {selectedInvoice.status === 'sent' && (
                <Button size="sm" onClick={markAsPaid}>
                  Mark as paid
                </Button>
              )}
              {selectedInvoice.status === 'overdue' && (
                <Button size="sm" onClick={markAsPaid}>
                  Mark as paid
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert('PDF download — coming soon')}
              >
                Download PDF
              </Button>
            </div>
          </div>
        ) : panelMode === 'edit' && selectedInvoice ? (
          /* ── Edit draft invoice ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
            <div style={fieldGroup}>
              <Input
                label="Recipient"
                value={editForm.recipient}
                onChange={v => setEditForm(f => ({ ...f, recipient: v }))}
                placeholder="e.g. Acme Ltd"
                autoFocus
              />
              <Input
                label="Description"
                value={editForm.description}
                onChange={v => setEditForm(f => ({ ...f, description: v }))}
                placeholder="e.g. Web development — July"
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
                  label="Invoice date"
                  type="date"
                  value={editForm.date}
                  onChange={v => setEditForm(f => ({ ...f, date: v }))}
                />
              </div>
              <Input
                label="Due date"
                type="date"
                value={editForm.dueDate}
                onChange={v => setEditForm(f => ({ ...f, dueDate: v }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '4px' }}>
              <button
                onClick={deleteDraft}
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
                onClick={handleSaveEdit}
                disabled={saving || !isEditValid}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        ) : (
          /* ── New invoice form ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
            <div style={fieldGroup}>
              <Input
                label="Recipient"
                value={form.recipient}
                onChange={v => setForm(f => ({ ...f, recipient: v }))}
                placeholder="e.g. Acme Ltd"
                autoFocus
              />
              <Input
                label="Description"
                value={form.description}
                onChange={v => setForm(f => ({ ...f, description: v }))}
                placeholder="e.g. Web development — July"
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
                  label="Invoice date"
                  type="date"
                  value={form.date}
                  onChange={v => setForm(f => ({ ...f, date: v }))}
                />
              </div>
              <Input
                label="Due date"
                type="date"
                value={form.dueDate}
                onChange={v => setForm(f => ({ ...f, dueDate: v }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSaveNew(true)}
                disabled={saving || !isNewValid}
              >
                {saving ? 'Saving…' : 'Add another'}
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveNew(false)}
                disabled={saving || !isNewValid}
              >
                {saving ? 'Saving…' : 'Done'}
              </Button>
            </div>
          </div>
        )}
      </EntryPanel>
    </div>
  )
}
