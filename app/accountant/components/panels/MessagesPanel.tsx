'use client'

/**
 * app/accountant/components/panels/MessagesPanel.tsx
 *
 * Right panel — Messages tab.
 * Shows recent income and expense activity as quick-reference links,
 * so the accountant can reference specific items while composing a message.
 *
 * The full message thread is rendered in the left panel (MessagesTab).
 * This right panel provides context — not a second compose area.
 */

import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glass }              from '@/styles/tokens/effects'
import { spacing }            from '@/styles/tokens/spacing'
import type { Client, SplitPanelInitialData } from '@/types'

interface Props {
  client:      Client
  initialData: SplitPanelInitialData
}

function fmt(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

function SectionHeader({ title }: { title: string }) {
  const colours = useColours()
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

function ActivityRow({
  icon,
  description,
  amount,
  date,
  colour,
}: {
  icon:        string
  description: string
  amount:      number
  date:        string
  colour:      string
}) {
  const colours = useColours()
  return (
    <div style={{
      display:   'flex',
      alignItems: 'center',
      gap:       '10px',
      padding:   '6px 0',
      borderBottom: `1px solid ${colours.borderHairline}`,
    }}>
      <span style={{ fontSize: '11px', color: colour, opacity: 0.7 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     fontSize.xs,
          color:        colours.textSecondary,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap' as const,
        }}>
          {description}
        </div>
        <div style={{ fontSize: '10px', color: colours.textMuted, fontFamily: fonts.mono }}>
          {date}
        </div>
      </div>
      <span style={{
        fontFamily:  fonts.mono,
        fontSize:    fontSize.xs,
        fontWeight:  fontWeight.semibold,
        color:       colour,
        flexShrink:  0,
      }}>
        {fmt(amount)}
      </span>
    </div>
  )
}

export default function MessagesPanel({ client, initialData }: Props) {
  const colours = useColours()
  const mode = useThemeMode()
  const { recentIncome, recentExpenses } = initialData
  const firstName = client.full_name?.split(' ')[0] ?? 'the client'

  return (
    <div style={{ padding: spacing.panel.padding, display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <div style={{
        fontSize:   fontSize.sm,
        color:      colours.textMuted,
        lineHeight: 1.5,
      }}>
        Quick reference while messaging {firstName}. The full thread is in the left panel.
      </div>

      {/* ── Recent income ── */}
      {recentIncome.length > 0 && (
        <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
          <SectionHeader title="Recent Income" />
          {recentIncome.map(item => (
            <ActivityRow
              key={item.id}
              icon="↑"
              description={item.description}
              amount={item.amount_pence}
              date={item.date}
              colour={colours.income}
            />
          ))}
        </div>
      )}

      {/* ── Recent expenses ── */}
      {recentExpenses.length > 0 && (
        <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
          <SectionHeader title="Recent Expenses" />
          {recentExpenses.map(item => (
            <ActivityRow
              key={item.id}
              icon="↓"
              description={item.description}
              amount={item.amount_pence}
              date={item.date}
              colour={colours.expense}
            />
          ))}
        </div>
      )}

      {recentIncome.length === 0 && recentExpenses.length === 0 && (
        <div style={{
          ...glass.card(mode),
          padding:        spacing.panel.padding,
          textAlign:      'center',
          color:          colours.textMuted,
          fontSize:       fontSize.sm,
        }}>
          No recent activity to display.
        </div>
      )}

    </div>
  )
}
