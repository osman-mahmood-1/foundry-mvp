'use client'

/**
 * app/portal/components/mobile/tabs/MobileInvoicesTab.tsx
 *
 * Invoice list — read-only on mobile.
 * Invoices are not yet wired to Supabase. Shows an honest empty state
 * until the invoices data layer is built. No mock data.
 */

import type { Client } from '@/types'
import { useColours }  from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }      from '@/styles/tokens'

interface Props { client: Client }

export default function MobileInvoicesTab({ client }: Props) {
  const colours = useColours()

  return (
    <div style={{ paddingBottom: '24px' }}>
      <div style={{ padding: '20px 16px 16px' }}>
        <h2 style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: '-0.02em', margin: 0, marginBottom: '4px' }}>
          Invoices
        </h2>
      </div>

      {/* Empty state — invoices not yet connected to data layer */}
      <div style={{
        margin:         '8px 16px 0',
        padding:        '40px 24px',
        borderRadius:   radius.lg,
        border:         `1px solid ${colours.cardBorder}`,
        background:     colours.cardBg,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        gap:            '10px',
        textAlign:      'center',
      }}>
        <span style={{ fontSize: '28px', opacity: 0.4 }}>◻</span>
        <p style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: colours.textMuted, margin: 0, lineHeight: 1.6 }}>
          No invoices yet.{'\n'}Create your first invoice on desktop.
        </p>
      </div>
    </div>
  )
}
