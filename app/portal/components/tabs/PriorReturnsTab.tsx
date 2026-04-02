'use client'

/**
 * app/portal/components/tabs/PriorReturnsTab.tsx
 *
 * Prior Self Assessment returns — view history and download.
 *
 * Task 11: Row click opens right panel with:
 * - Return year + status badge
 * - Filed date, reference number
 * - Key figures (income, expenses, tax paid)
 * - Download PDF button (stub)
 * - View on HMRC portal link (stub)
 * - Read-only (prior returns cannot be edited)
 */

import { useState } from 'react'
import type { Client } from '@/types'
import { Panel, Label, Badge, Button } from '../ui'
import EntryPanel from '../ui/EntryPanel'
import { useColours } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriorReturn {
  taxYear:     string
  status:      'filed' | 'amended' | 'queried'
  filedDate:   string
  reference:   string
  income:      number
  expenses:    number
  taxPaid:     number
  refund:      number
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_RETURNS: PriorReturn[] = [
  {
    taxYear:   '2023-24',
    status:    'filed',
    filedDate: '2025-01-15',
    reference: 'SA-202324-AX7F2K',
    income:    7450000,
    expenses:  1230000,
    taxPaid:   340000,
    refund:    0,
  },
  {
    taxYear:   '2022-23',
    status:    'filed',
    filedDate: '2024-01-20',
    reference: 'SA-202223-BM9C4L',
    income:    6200000,
    expenses:  980000,
    taxPaid:   290000,
    refund:    0,
  },
  {
    taxYear:   '2021-22',
    status:    'amended',
    filedDate: '2023-03-04',
    reference: 'SA-202122-TQ1R8X',
    income:    5100000,
    expenses:  720000,
    taxPaid:   180000,
    refund:    12000,
  },
]

const STATUS_CONFIG = {
  filed:   { label: 'Filed',   variant: 'success' as const },
  amended: { label: 'Amended', variant: 'warning' as const },
  queried: { label: 'Queried', variant: 'danger'  as const },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 0 })}`
}

// ─── Detail field ─────────────────────────────────────────────────────────────

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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
        fontSize:    fontSize.sm,
        color:       colours.textPrimary,
        fontFamily:  mono ? fonts.mono : fonts.sans,
        padding:     '8px 10px',
        background:  colours.hoverBg,
        borderRadius: radius.sm,
        border:      `1px solid ${colours.borderLight}`,
      }}>
        {value}
      </div>
    </div>
  )
}

// ─── Return row ───────────────────────────────────────────────────────────────

function ReturnRow({
  ret, isLast, selected, onSelect,
}: {
  ret: PriorReturn; isLast: boolean; selected: boolean; onSelect: () => void
}) {
  const colours  = useColours()
  const [hovered, setHovered] = useState(false)
  const cfg = STATUS_CONFIG[ret.status]

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width:          '36px',
          height:         '36px',
          borderRadius:   radius.sm,
          background:     selected ? colours.accentSoft : colours.borderLight,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '13px',
          color:          selected ? colours.accent : colours.textMuted,
          flexShrink:     0,
          transition:     transition.snap,
        }}>
          △
        </div>
        <div>
          <div style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colours.textPrimary }}>
            Self Assessment {ret.taxYear}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginTop: '2px', fontFamily: fonts.mono }}>
            Filed {new Date(ret.filedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontFamily: fonts.mono, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: letterSpacing.tight }}>
            {fmt(ret.taxPaid)}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
            tax paid
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PriorReturnsTab({ client }: { client: Client }) {
  const colours  = useColours()
  const [selected, setSelected] = useState<PriorReturn | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  function openReturn(ret: PriorReturn) {
    setSelected(ret)
    setPanelOpen(true)
  }

  function handleClose() {
    setPanelOpen(false)
    setSelected(null)
  }

  const cfg = selected ? STATUS_CONFIG[selected.status] : null

  return (
    <div style={{ display: 'flex', gap: spacing.tab.gap, minHeight: 0 }}>

      {/* ── Left: returns list ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.tab.gap, minWidth: 0 }}>
        <Panel padding="0">
          <div style={{
            padding:      `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom: DEMO_RETURNS.length > 0 ? `1px solid ${colours.borderHairline}` : 'none',
          }}>
            <Label>Prior returns · {client.full_name}</Label>
          </div>

          {DEMO_RETURNS.map((ret, idx) => (
            <ReturnRow
              key={ret.taxYear}
              ret={ret}
              isLast={idx === DEMO_RETURNS.length - 1}
              selected={selected?.taxYear === ret.taxYear}
              onSelect={() => openReturn(ret)}
            />
          ))}
        </Panel>

        <Panel padding={spacing.panel.paddingTight}>
          <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, lineHeight: 1.6 }}>
            ◈ &nbsp;Need a copy of an older return? Your accountant can provide SA302 forms and tax year overviews for any previous year.
          </div>
        </Panel>
      </div>

      {/* ── Right: detail panel ── */}
      <EntryPanel
        open={panelOpen}
        title={selected ? `Self Assessment ${selected.taxYear}` : 'Return'}
        subtitle={cfg?.label}
        onClose={handleClose}
      >
        {selected && cfg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.form.fieldGap }}>
            {/* Status + filed date */}
            <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: radius.md, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                <span style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.mono }}>
                  {new Date(selected.filedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <DetailField label="Reference"  value={selected.reference} mono />
              <DetailField label="Tax year"   value={selected.taxYear} />
            </div>

            {/* Financial summary */}
            <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: radius.md, padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colours.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '4px' }}>
                Summary
              </div>
              {[
                { label: 'Total income',    value: fmt(selected.income),   colour: colours.income },
                { label: 'Total expenses',  value: fmt(selected.expenses), colour: colours.expense },
                { label: 'Tax paid',        value: fmt(selected.taxPaid),  colour: colours.danger },
                ...(selected.refund > 0 ? [{ label: 'Refund received', value: fmt(selected.refund), colour: colours.income }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: fontSize.sm, color: colours.textSecondary }}>{row.label}</span>
                  <span style={{ fontFamily: fonts.mono, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: row.colour ?? colours.textPrimary }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <Button size="sm" onClick={() => alert('PDF download — coming soon')}>
                Download SA302
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert('HMRC portal link — coming soon')}
              >
                View on HMRC portal ↗
              </Button>
            </div>
          </div>
        )}
      </EntryPanel>
    </div>
  )
}
