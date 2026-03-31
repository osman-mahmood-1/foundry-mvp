'use client'

/**
 * app/accountant/components/panels/IncomePanel.tsx
 *
 * Right panel — Income tab.
 * Shows income summary, source breakdown, and HMRC treatment flags.
 */

import { light as colours }   from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glassStatic }        from '@/styles/tokens/effects'
import { radius }             from '@/styles/tokens'
import { spacing }            from '@/styles/tokens/spacing'
import type { Client, SplitPanelInitialData } from '@/types'

interface Props {
  client:      Client
  initialData: SplitPanelInitialData
}

function fmt(pence: number): string {
  const p = pence / 100
  return p >= 1000
    ? `£${(p / 1000).toFixed(1)}k`
    : `£${p.toFixed(2)}`
}

function catLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize:      fontSize.label,
      fontFamily:    fonts.mono,
      letterSpacing: letterSpacing.wide,
      color:         colours.textMuted,
      textTransform: 'uppercase' as const,
      marginBottom:  '10px',
      paddingBottom: '6px',
      borderBottom:  `1px solid ${colours.borderHairline}`,
    }}>
      {title}
    </div>
  )
}

export default function IncomePanel({ client, initialData }: Props) {
  const { incomeTotal, incomeSources } = initialData

  return (
    <div style={{ padding: spacing.panel.padding, display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Summary ── */}
      <div style={{ ...glassStatic.panel, padding: spacing.panel.paddingTight }}>
        <SectionHeader title="Income Summary" />
        <div style={{
          fontFamily:   fonts.serif,
          fontSize:     '28px',
          fontWeight:   fontWeight.medium,
          color:        colours.income,
          marginBottom: '12px',
        }}>
          {incomeTotal > 0 ? fmt(incomeTotal) : '—'}
        </div>
        <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginBottom: '12px', fontFamily: fonts.mono }}>
          Total declared · {client.tax_year}
        </div>

        {/* Source split */}
        {incomeSources.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {incomeSources.map(src => (
              <div key={src.category} style={{
                display:        'flex',
                justifyContent: 'space-between',
                alignItems:     'center',
                padding:        '4px 0',
                borderBottom:   `1px solid ${colours.borderHairline}`,
                fontSize:       fontSize.sm,
              }}>
                <span style={{ color: colours.textSecondary }}>{catLabel(src.category)}</span>
                <span style={{ fontFamily: fonts.mono, color: colours.income, fontWeight: fontWeight.semibold }}>
                  {fmt(src.totalPence)}
                </span>
              </div>
            ))}
          </div>
        )}
        {incomeSources.length === 0 && (
          <div style={{ fontSize: fontSize.sm, color: colours.textMuted }}>No income recorded yet.</div>
        )}
      </div>

      {/* ── Client type ── */}
      <div style={{ ...glassStatic.panel, padding: spacing.panel.paddingTight }}>
        <SectionHeader title="HMRC Profile" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSize.sm }}>
            <span style={{ color: colours.textMuted }}>Client type</span>
            <span style={{ color: colours.textPrimary, fontFamily: fonts.mono }}>
              {catLabel(client.client_type)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSize.sm }}>
            <span style={{ color: colours.textMuted }}>SA form</span>
            <span style={{ color: colours.textPrimary, fontFamily: fonts.mono }}>
              {client.portal_config?.sa_form ?? 'SA103'}
            </span>
          </div>
          {client.cis_number && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSize.sm }}>
              <span style={{ color: colours.textMuted }}>CIS number</span>
              <span style={{ color: colours.textPrimary, fontFamily: fonts.mono }}>{client.cis_number}</span>
            </div>
          )}
          {client.utr && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSize.sm }}>
              <span style={{ color: colours.textMuted }}>UTR</span>
              <span style={{ color: colours.textPrimary, fontFamily: fonts.mono }}>{client.utr}</span>
            </div>
          )}
          {client.ni_number && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fontSize.sm }}>
              <span style={{ color: colours.textMuted }}>NI number</span>
              <span style={{ color: colours.textPrimary, fontFamily: fonts.mono }}>{client.ni_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Tax year ── */}
      <div style={{ ...glassStatic.panel, padding: spacing.panel.paddingTight }}>
        <SectionHeader title="Accounting Period" />
        <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, lineHeight: 1.6 }}>
          <div>
            <span style={{ color: colours.textMuted }}>Tax year: </span>
            <span style={{ fontFamily: fonts.mono }}>{client.tax_year}</span>
          </div>
          {client.accounting_period_label && (
            <div>
              <span style={{ color: colours.textMuted }}>Period: </span>
              <span style={{ fontFamily: fonts.mono }}>{client.accounting_period_label}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
