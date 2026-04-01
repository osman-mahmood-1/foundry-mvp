'use client'

/**
 * app/portal/components/tabs/InvoicesTab.tsx
 *
 * Invoice management — create, list, track status.
 * Uses the split-panel pattern: list on left, entry panel on right.
 */

import { useState } from 'react'
import type { Client } from '@/types'
import { Panel, Label, EmptyState, Button, Input, Select, Badge, formatGBP, formatDate } from '../ui'
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

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  draft:   { label: 'Draft',   variant: 'neutral' },
  sent:    { label: 'Sent',    variant: 'info' },
  paid:    { label: 'Paid',    variant: 'success' },
  overdue: { label: 'Overdue', variant: 'danger' },
}

// ─── Invoice row ──────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, isLast }: { invoice: Invoice; isLast: boolean }) {
  const [hovered, setHovered] = useState(false)
  const { label, variant }    = STATUS_CONFIG[invoice.status]

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        {/* Invoice number chip */}
        <div style={{
          padding:       '4px 8px',
          borderRadius:  radius.xs,
          background:    colours.borderLight,
          fontFamily:    fonts.mono,
          fontSize:      fontSize.xs,
          color:         colours.textSecondary,
          whiteSpace:    'nowrap' as const,
          flexShrink:    0,
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
  const [panelOpen, setPanelOpen]   = useState(false)
  const [form, setForm]             = useState<InvoiceForm>(EMPTY_FORM)
  const [invoices, setInvoices]     = useState<Invoice[]>(DEMO_INVOICES)
  const [saving, setSaving]         = useState(false)

  const isValid = form.recipient.trim() && form.description.trim() && form.amount && form.dueDate

  async function handleSave(keepOpen: boolean) {
    if (!isValid) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))

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

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

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
              <Button size="sm" onClick={() => setPanelOpen(true)}>
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
              onAction={() => setPanelOpen(true)}
            />
          )}

          {invoices.map((invoice, idx) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isLast={idx === invoices.length - 1}
            />
          ))}
        </Panel>
      </div>

      {/* ── Right: entry panel ── */}
      <EntryPanel
        open={panelOpen}
        title="New invoice"
        onClose={() => { setPanelOpen(false); setForm(EMPTY_FORM) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
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

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving || !isValid}
            >
              {saving ? 'Saving…' : 'Add another'}
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || !isValid}
            >
              {saving ? 'Saving…' : 'Done'}
            </Button>
          </div>
        </div>
      </EntryPanel>
    </div>
  )
}
