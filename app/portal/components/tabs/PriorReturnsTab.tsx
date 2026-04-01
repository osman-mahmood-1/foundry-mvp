'use client'

/**
 * app/portal/components/tabs/PriorReturnsTab.tsx
 *
 * Prior Self Assessment returns — view history and download.
 */

import type { Client } from '@/types'
import { Panel, Label, Badge } from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'
import { useState } from 'react'

interface PriorReturn {
  taxYear:   string
  status:    'filed' | 'amended' | 'queried'
  filedDate: string
  taxPaid:   number
  refund:    number
}

const DEMO_RETURNS: PriorReturn[] = [
  { taxYear: '2023-24', status: 'filed',   filedDate: '2025-01-15', taxPaid: 340000, refund: 0       },
  { taxYear: '2022-23', status: 'filed',   filedDate: '2024-01-20', taxPaid: 290000, refund: 0       },
  { taxYear: '2021-22', status: 'amended', filedDate: '2023-03-04', taxPaid: 180000, refund: 12000   },
]

const STATUS_CONFIG = {
  filed:   { label: 'Filed',   variant: 'success' as const },
  amended: { label: 'Amended', variant: 'warning' as const },
  queried: { label: 'Queried', variant: 'danger'  as const },
}

function ReturnRow({ ret, isLast }: { ret: PriorReturn; isLast: boolean }) {
  const [hovered, setHovered] = useState(false)
  const cfg = STATUS_CONFIG[ret.status]

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width:          '36px',
          height:         '36px',
          borderRadius:   radius.sm,
          background:     colours.borderLight,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '13px',
          color:          colours.textMuted,
          flexShrink:     0,
        }}>
          △
        </div>
        <div>
          <div style={{
            fontSize:   fontSize.base,
            fontWeight: fontWeight.medium,
            color:      colours.textPrimary,
          }}>
            Self Assessment {ret.taxYear}
          </div>
          <div style={{
            fontSize:   fontSize.xs,
            color:      colours.textMuted,
            marginTop:  '2px',
            fontFamily: fonts.mono,
          }}>
            Filed {new Date(ret.filedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{
            fontFamily:    fonts.mono,
            fontSize:      fontSize.base,
            fontWeight:    fontWeight.semibold,
            color:         colours.textPrimary,
            letterSpacing: letterSpacing.tight,
          }}>
            £{(ret.taxPaid / 100).toLocaleString('en-GB', { minimumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
            tax paid
          </div>
        </div>
        {hovered && (
          <button
            style={{
              padding:      '6px 12px',
              borderRadius: radius.xs,
              border:       `1px solid ${colours.borderMedium}`,
              background:   'transparent',
              color:        colours.textSecondary,
              fontSize:     fontSize.xs,
              cursor:       'pointer',
              fontFamily:   fonts.sans,
              transition:   transition.snap,
            }}
          >
            Download SA302
          </button>
        )}
      </div>
    </div>
  )
}

export default function PriorReturnsTab({ client }: { client: Client }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>
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
          />
        ))}
      </Panel>

      <Panel padding={spacing.panel.paddingTight}>
        <div style={{
          fontSize:   fontSize.sm,
          color:      colours.textSecondary,
          lineHeight: 1.6,
        }}>
          ◈ &nbsp;Need a copy of an older return? Your accountant can provide SA302 forms and tax year overviews for any previous year.
        </div>
      </Panel>
    </div>
  )
}
