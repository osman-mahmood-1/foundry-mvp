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

import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { Panel, Label, TabHeader, EmptyState, Button, Input, Badge, formatGBP, formatDate } from '../ui'
import { useColours } from '@/styles/ThemeContext'
import { useShellSearch } from '@/app/components/shells/BaseShell'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'
import PersistentSidebar from '../ui/PersistentSidebar'

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

const STATUS_CONFIG: Record<InvoiceStatus, {
  label:   string
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
}> = {
  draft:   { label: 'Draft',   variant: 'neutral' },
  sent:    { label: 'Sent',    variant: 'info' },
  paid:    { label: 'Paid',    variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({ label, value }: { label: string; value: string }) {
  const colours = useColours()
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
  const colours = useColours()
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
  const colours = useColours()
  const { query, setPlaceholder } = useShellSearch()
  useEffect(() => { setPlaceholder('Search invoices…') }, [setPlaceholder])

  const [panelMode, setPanelMode]       = useState<'intelligence' | 'new' | 'view' | 'edit'>('intelligence')
  const [selectedInvoice, setSelected]  = useState<Invoice | null>(null)
  const [form, setForm]                 = useState<InvoiceForm>(EMPTY_FORM)
  const [editForm, setEditForm]         = useState<InvoiceForm>(EMPTY_FORM)
  const [invoices, setInvoices]         = useState<Invoice[]>([])
  const [saving, setSaving]             = useState(false)

  const isNewValid = form.recipient.trim() && form.description.trim() && form.amount && form.dueDate
  const isEditValid = editForm.recipient.trim() && editForm.description.trim() && editForm.amount && editForm.dueDate

  // ── Open new invoice panel ──
  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setPanelMode('new')
  }

  // ── Click existing row (toggle to deselect) ──
  function openInvoice(invoice: Invoice) {
    if (selectedInvoice?.id === invoice.id) {
      setSelected(null)
      setPanelMode('intelligence')
      return
    }
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
    if (!keepOpen) { setSelected(null); setPanelMode('intelligence') }
  }

  // ── Save draft edits ──
  async function handleSaveEdit() {
    if (!selectedInvoice || !isEditValid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    setInvoices(prev => prev.map(inv =>
      inv.id === selectedInvoice.id
        ? { ...inv, recipient: editForm.recipient, description: editForm.description, amount: Math.round(parseFloat(editForm.amount) * 100), date: editForm.date, dueDate: editForm.dueDate }
        : inv
    ))
    setSaving(false)
    setSelected(null)
    setPanelMode('intelligence')
  }

  // ── Mark as paid ──
  function markAsPaid() {
    if (!selectedInvoice) return
    setInvoices(prev => prev.map(inv =>
      inv.id === selectedInvoice.id ? { ...inv, status: 'paid' } : inv
    ))
    setSelected(null)
    setPanelMode('intelligence')
  }

  // ── Delete draft ──
  function deleteDraft() {
    if (!selectedInvoice) return
    setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id))
    setSelected(null)
    setPanelMode('intelligence')
  }

  function handleClose() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setPanelMode('intelligence')
  }

  const filteredInvoices = invoices.filter(i =>
    !query ||
    i.recipient?.toLowerCase().includes(query.toLowerCase()) ||
    i.number?.toLowerCase().includes(query.toLowerCase())
  )

  const totalPaid        = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

  const panelTitle = panelMode === 'new'
    ? 'New invoice'
    : panelMode === 'edit'
    ? `${selectedInvoice?.number} — Edit`
    : selectedInvoice?.number ?? 'Invoice'

  const panelSubtitle = panelMode === 'view' && selectedInvoice
    ? STATUS_CONFIG[selectedInvoice.status].label
    : undefined

  // Sidebar children — null = intelligence panel
  const sidebarChildren = panelMode === 'intelligence' ? null : (
    panelMode === 'view' && selectedInvoice ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '22px', fontWeight: fontWeight.semibold, color: selectedInvoice.status === 'paid' ? colours.income : colours.textPrimary }}>
            {formatGBP(selectedInvoice.amount)}
          </div>
          <Badge variant={STATUS_CONFIG[selectedInvoice.status].variant}>
            {STATUS_CONFIG[selectedInvoice.status].label}
          </Badge>
        </div>
        <ReadField label="Recipient"   value={selectedInvoice.recipient} />
        <ReadField label="Description" value={selectedInvoice.description} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
          <ReadField label="Issued"   value={formatDate(selectedInvoice.date)} />
          <ReadField label="Due date" value={formatDate(selectedInvoice.dueDate)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue') && (
            <Button size="sm" onClick={markAsPaid}>Mark as paid</Button>
          )}
          <Button size="sm" disabled title="PDF download coming soon">Download PDF</Button>
        </div>
      </div>
    ) : panelMode === 'edit' && selectedInvoice ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
        <Input label="Recipient" value={editForm.recipient} onChange={v => setEditForm(f => ({ ...f, recipient: v }))} placeholder="e.g. Acme Ltd" autoFocus />
        <Input label="Description" value={editForm.description} onChange={v => setEditForm(f => ({ ...f, description: v }))} placeholder="e.g. Web development — July" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
          <Input label="Amount (£)" type="number" value={editForm.amount} onChange={v => setEditForm(f => ({ ...f, amount: v }))} placeholder="0.00" />
          <Input label="Invoice date" type="date" value={editForm.date} onChange={v => setEditForm(f => ({ ...f, date: v }))} />
        </div>
        <Input label="Due date" type="date" value={editForm.dueDate} onChange={v => setEditForm(f => ({ ...f, dueDate: v }))} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '4px' }}>
          <button onClick={deleteDraft} style={{ background: colours.dangerLight, border: `1px solid ${colours.danger}33`, borderRadius: radius.sm, color: colours.danger, fontSize: fontSize.sm, fontFamily: fonts.sans, fontWeight: fontWeight.medium, padding: '7px 14px', cursor: 'pointer', transition: transition.snap }}>Delete</button>
          <Button size="sm" onClick={handleSaveEdit} disabled={saving || !isEditValid}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </div>
      </div>
    ) : (
      /* new invoice form */
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
        <Input label="Recipient" value={form.recipient} onChange={v => setForm(f => ({ ...f, recipient: v }))} placeholder="e.g. Acme Ltd" autoFocus />
        <Input label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="e.g. Web development — July" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.form.fieldGap }}>
          <Input label="Amount (£)" type="number" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} placeholder="0.00" />
          <Input label="Invoice date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
        </div>
        <Input label="Due date" type="date" value={form.dueDate} onChange={v => setForm(f => ({ ...f, dueDate: v }))} />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button variant="secondary" size="sm" onClick={() => handleSaveNew(true)} disabled={saving || !isNewValid}>{saving ? 'Saving…' : 'Add another'}</Button>
          <Button size="sm" onClick={() => handleSaveNew(false)} disabled={saving || !isNewValid}>{saving ? 'Saving…' : 'Done'}</Button>
        </div>
      </div>
    )
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, minHeight: 0, flex: 1 }}>
      <TabHeader title="Invoices" subtitle={client.tax_year} />

      {/* ── Summary cards — spans full width above both columns ── */}
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

      {/* ── Main row: list panel + sidebar, top-aligned ── */}
      <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0, flex: 1, alignItems: 'stretch' }}>
        {/* ── Left: invoice list ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Invoice list */}
        <Panel padding="0" style={{ flex: 1 }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   invoices.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
          }}>
            <Label>Invoices · {client.tax_year}</Label>
            <Button size="sm" onClick={openNew}>
              + New invoice
            </Button>
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

          {filteredInvoices.map((invoice, idx) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isLast={idx === filteredInvoices.length - 1}
              selected={selectedInvoice?.id === invoice.id}
              onSelect={() => openInvoice(invoice)}
            />
          ))}
        </Panel>
        </div>

        {/* ── Right: persistent sidebar — top aligns with list panel ── */}
        <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <PersistentSidebar
            title={panelTitle}
            subtitle={panelSubtitle}
            intelligenceContext={{ tab: 'invoices', taxYear: client.tax_year, clientId: client.id }}
          >
            {sidebarChildren}
          </PersistentSidebar>
        </div>
      </div>
    </div>
  )
}
