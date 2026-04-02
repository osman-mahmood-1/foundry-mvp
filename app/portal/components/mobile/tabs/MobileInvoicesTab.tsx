'use client'

/**
 * app/portal/components/mobile/tabs/MobileInvoicesTab.tsx
 *
 * Simple list of invoices for mobile — read-only display.
 */

import type { Client } from '@/types'
import { useColours }  from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }      from '@/styles/tokens'

interface Props { client: Client }

// Placeholder invoice data (matches desktop InvoicesTab mock data)
const MOCK_INVOICES = [
  { id: '1', number: 'INV-001', client: 'Acme Ltd',            amount: 420000, date: '2024-10-15', status: 'paid'    },
  { id: '2', number: 'INV-002', client: 'Blue Sky Media',      amount: 360000, date: '2024-11-01', status: 'paid'    },
  { id: '3', number: 'INV-003', client: 'Parkside Properties', amount: 300000, date: '2024-11-20', status: 'overdue' },
  { id: '4', number: 'INV-004', client: 'James Thornton',      amount:  75000, date: '2024-12-05', status: 'draft'   },
]

const STATUS_COLOURS: Record<string, { bg: string; text: string }> = {
  paid:    { bg: 'rgba(34,211,165,0.14)', text: '#22d3a5' },
  overdue: { bg: 'rgba(248,113,113,0.14)', text: '#f87171' },
  draft:   { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.55)' },
  sent:    { bg: 'rgba(59,130,246,0.14)',  text: '#3b82f6' },
}

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MobileInvoicesTab({ client }: Props) {
  const colours = useColours()

  return (
    <div style={{ paddingBottom: '24px' }}>
      <div style={{ padding: '20px 16px 16px' }}>
        <h2 style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: '-0.02em', margin: 0, marginBottom: '4px' }}>
          Invoices
        </h2>
        <div style={{ fontFamily: fonts.sans, fontSize: '12px', color: colours.textMuted, fontWeight: 300 }}>
          {client.tax_year}
        </div>
      </div>

      <div style={{ margin: '0 16px', borderRadius: radius.lg, border: `1px solid ${colours.cardBorder}`, overflow: 'hidden', background: colours.cardBg }}>
        {MOCK_INVOICES.map((inv, idx) => {
          const sc = STATUS_COLOURS[inv.status] ?? STATUS_COLOURS.draft
          return (
            <div key={inv.id} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              padding:      '14px 16px',
              borderBottom: idx === MOCK_INVOICES.length - 1 ? 'none' : `1px solid ${colours.borderHairline}`,
              minHeight:    '56px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: fonts.sans, fontSize: '14px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '2px' }}>
                  {inv.client}
                </div>
                <div style={{ fontFamily: fonts.sans, fontSize: '12px', color: colours.textMuted, fontWeight: 300 }}>
                  {inv.number} · {formatDate(inv.date)}
                </div>
              </div>
              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontFamily: fonts.sans, fontSize: '14px', fontWeight: fontWeight.semibold, color: colours.textPrimary, fontVariantNumeric: 'tabular-nums', marginBottom: '4px' }}>
                  {formatGBP(inv.amount)}
                </div>
                <span style={{
                  display: 'inline-block', padding: '2px 8px',
                  background: sc.bg, color: sc.text,
                  borderRadius: radius.sm, fontSize: '11px',
                  fontFamily: fonts.sans, fontWeight: fontWeight.medium,
                  textTransform: 'capitalize' as const,
                }}>
                  {inv.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '16px 16px 0', textAlign: 'center' as const }}>
        <p style={{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colours.textMuted }}>
          Full invoice creation available on desktop.
        </p>
      </div>
    </div>
  )
}
