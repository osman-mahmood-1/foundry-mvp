'use client'

/**
 * app/portal/components/mobile/tabs/MobileOverviewTab.tsx
 *
 * Overview: greeting, scroll cards, quick actions, recent transactions list.
 */

import type { Client, PortalTab } from '@/types'
import { useOverview }            from '@/app/portal/components/tabs/useOverview'
import { useColours }             from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }                 from '@/styles/tokens'
import MobileScrollCards          from '../MobileScrollCards'
import MobileTransactionRow       from '../MobileTransactionRow'
import type { TxRowData }         from '../MobileTransactionRow'
import { useState }               from 'react'

interface Props {
  client:      Client
  onTabChange: (tab: PortalTab) => void
}

export default function MobileOverviewTab({ client, onTabChange }: Props) {
  const colours = useColours()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { stats, recent, loading } = useOverview(client.id)

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = client.full_name?.split(' ')[0] ?? 'there'

  const quickActions = [
    { label: '+ Income',   tab: 'income'    as PortalTab },
    { label: '+ Expense',  tab: 'expenses'  as PortalTab },
    { label: '↑ Document', tab: 'documents' as PortalTab },
  ]

  const txRows: TxRowData[] = recent.map(r => ({
    id:          r.id,
    type:        r.type,
    description: r.description,
    amount:      r.amountPence,
    date:        r.date,
    category:    r.category,
    status:      r.status,
  }))

  return (
    <div style={{ paddingBottom: '24px' }}>
      {/* Greeting */}
      <div style={{ padding: '20px 16px 8px' }}>
        <div style={{
          fontFamily:    fonts.sans,
          fontSize:      fontSize.xs,
          color:         colours.textMuted,
          letterSpacing: '0.10em',
          textTransform: 'uppercase' as const,
          marginBottom:  '4px',
        }}>
          {greeting}
        </div>
        <h1 style={{
          fontFamily:    fonts.sans,
          fontSize:      '22px',
          fontWeight:    fontWeight.semibold,
          color:         colours.textPrimary,
          letterSpacing: '-0.02em',
          margin:        0,
          lineHeight:    1.2,
        }}>
          {firstName}.
        </h1>
        <div style={{
          fontFamily:  fonts.sans,
          fontSize:    '12px',
          color:       colours.textMuted,
          marginTop:   '4px',
          fontWeight:  300,
        }}>
          {client.tax_year} · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Scroll cards */}
      {!loading && (
        <MobileScrollCards
          incomePence={stats.incomePence}
          expensesPence={stats.expensesPence}
          estTaxPence={stats.estTaxPence}
        />
      )}

      {/* Quick actions */}
      <div style={{
        display:  'flex',
        gap:      '8px',
        padding:  '16px 16px 0',
        overflowX:'auto',
        scrollbarWidth: 'none',
      }}>
        {quickActions.map(a => (
          <button
            key={a.tab}
            onClick={() => onTabChange(a.tab)}
            style={{
              height:       '40px',
              padding:      '0 16px',
              borderRadius: radius.md,
              border:       `1px solid ${colours.accentBorder}`,
              background:   colours.accentLight,
              color:        colours.accent,
              fontFamily:   fonts.sans,
              fontSize:     '13px',
              fontWeight:   fontWeight.medium,
              cursor:       'pointer',
              whiteSpace:   'nowrap' as const,
              flexShrink:   0,
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Recent transactions */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          marginBottom:  '12px',
        }}>
          <span style={{
            fontFamily:    fonts.sans,
            fontSize:      '11px',
            fontWeight:    fontWeight.medium,
            color:         colours.textMuted,
            letterSpacing: '0.10em',
            textTransform: 'uppercase' as const,
          }}>
            Recent
          </span>
          <button
            onClick={() => onTabChange('transactions')}
            style={{
              background:  'transparent',
              border:      'none',
              cursor:      'pointer',
              fontFamily:  fonts.sans,
              fontSize:    fontSize.xs,
              color:       colours.accent,
            }}
          >
            See all →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center' as const, color: colours.textMuted, fontFamily: fonts.sans, fontSize: fontSize.sm }}>
            Loading…
          </div>
        ) : txRows.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center' as const }}>
            <div style={{ fontSize: '28px', opacity: 0.3, marginBottom: '8px' }}>◈</div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: colours.textMuted }}>
              No transactions yet
            </div>
          </div>
        ) : (
          <div style={{
            borderRadius: radius.lg,
            border:       `1px solid ${colours.cardBorder}`,
            overflow:     'hidden',
            background:   colours.cardBg,
          }}>
            {txRows.map((tx, idx) => (
              <MobileTransactionRow
                key={tx.id}
                tx={tx}
                isLast={idx === txRows.length - 1}
                expandedId={expandedId}
                onExpand={setExpandedId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
