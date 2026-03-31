'use client'

/**
 * app/accountant/components/SplitPanel.tsx
 *
 * The core working screen for the accountant portal.
 *
 * Layout:
 *   Left panel  (60%): client's portal tabs in read-only mode
 *   Right panel (40%): contextual professional tools, driven by activeTab state
 *
 * The left panel renders the existing tab components with readOnly={true}.
 * No add/edit/delete controls are visible. All data comes from the same hooks —
 * no separate data layer. The accountant's JWT determines what RLS permits.
 *
 * The right panel is a ContextPanel that switches content based on the
 * active tab. Clicking an expense row on the left loads it into the right panel.
 *
 * Mobile: stacked vertically (out of scope for this phase — desktop first).
 */

import { useState }       from 'react'
import type { Client }    from '@/types'
import { light as colours }   from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition } from '@/styles/tokens'
import { spacing }            from '@/styles/tokens/spacing'

import OverviewTab   from '@/app/portal/components/tabs/OverviewTab'
import IncomeTab     from '@/app/portal/components/tabs/IncomeTab'
import ExpensesTab   from '@/app/portal/components/tabs/ExpensesTab'
import DocumentsTab  from '@/app/portal/components/tabs/DocumentsTab'
import MessagesTab   from '@/app/portal/components/tabs/MessagesTab'
import { TabErrorBoundary } from '@/app/portal/components/ui'
import ContextPanel  from './panels/ContextPanel'

// ─── Tab definition ───────────────────────────────────────────────────────────

type SplitTab = 'overview' | 'income' | 'expenses' | 'documents' | 'messages'

const SPLIT_TABS: { id: SplitTab; label: string }[] = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'income',     label: 'Income'     },
  { id: 'expenses',   label: 'Expenses'   },
  { id: 'documents',  label: 'Documents'  },
  { id: 'messages',   label: 'Messages'   },
]

// ─── Left panel tab renderer ──────────────────────────────────────────────────

function LeftTabRenderer({
  activeTab,
  client,
  onExpenseSelect,
}: {
  activeTab:       SplitTab
  client:          Client
  onExpenseSelect: (expenseId: string) => void
}) {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab clientId={client.id} readOnly />
    case 'income':
      return <IncomeTab client={client} readOnly />
    case 'expenses':
      return <ExpensesTab client={client} readOnly onExpenseSelect={onExpenseSelect} />
    case 'documents':
      return <DocumentsTab client={client} readOnly />
    case 'messages':
      return <MessagesTab client={client} readOnly />
    default:
      return null
  }
}

// ─── Header ───────────────────────────────────────────────────────────────────

function SplitHeader({ client }: { client: Client }) {
  const daysToDeadline = null // TODO: wire to deadlines table in Phase 5

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '12px',
      padding:        `14px ${spacing.panel.padding}`,
      background:     colours.sidebarBg,
      borderBottom:   `1px solid ${colours.borderHairline}`,
      flexShrink:     0,
    }}>
      <a
        href="/accountant"
        style={{
          fontSize:       fontSize.sm,
          color:          colours.textMuted,
          textDecoration: 'none',
          display:        'flex',
          alignItems:     'center',
          gap:            '4px',
          transition:     transition.snap,
          flexShrink:     0,
        }}
      >
        ← Clients
      </a>

      <span style={{ color: colours.borderHairline }}>|</span>

      <div style={{
        fontFamily:  fonts.serif,
        fontSize:    fontSize.base,
        fontWeight:  fontWeight.medium,
        color:       colours.textPrimary,
      }}>
        {client.full_name ?? 'Unknown client'}
      </div>

      <div style={{
        fontSize:      fontSize.label,
        fontFamily:    fonts.mono,
        letterSpacing: letterSpacing.wide,
        color:         colours.textMuted,
        background:    colours.borderLight,
        padding:       '2px 7px',
        borderRadius:  radius.xs,
        textTransform: 'uppercase' as const,
      }}>
        {client.plan ?? 'foundation'}
      </div>

      {daysToDeadline !== null && (
        <div style={{
          fontSize:      fontSize.label,
          fontFamily:    fonts.mono,
          letterSpacing: letterSpacing.wide,
          color:         daysToDeadline <= 14 ? colours.danger : colours.textMuted,
          background:    daysToDeadline <= 14 ? colours.dangerLight : colours.borderLight,
          padding:       '2px 7px',
          borderRadius:  radius.xs,
        }}>
          SA: {daysToDeadline}d
        </div>
      )}
    </div>
  )
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function TabBar({
  activeTab,
  onSelect,
}: {
  activeTab: SplitTab
  onSelect:  (tab: SplitTab) => void
}) {
  return (
    <div style={{
      display:      'flex',
      borderBottom: `1px solid ${colours.borderHairline}`,
      padding:      '0 16px',
      background:   colours.sidebarBg,
      flexShrink:   0,
    }}>
      {SPLIT_TABS.map(tab => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              padding:      '10px 14px',
              background:   'transparent',
              border:       'none',
              borderBottom: active ? `2px solid ${colours.accent}` : '2px solid transparent',
              fontSize:     fontSize.sm,
              fontWeight:   active ? fontWeight.medium : fontWeight.regular,
              color:        active ? colours.accent : colours.textMuted,
              cursor:       'pointer',
              transition:   transition.snap,
              fontFamily:   fonts.sans,
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  client:       Client
  accountantId: string | null
}

export default function SplitPanel({ client, accountantId }: Props) {
  const [activeTab,        setActiveTab]        = useState<SplitTab>('overview')
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null)

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        'calc(100vh - 24px)',   // 24px = 12px top + 12px bottom margin
      overflow:      'hidden',
    }}>

      {/* ── Header ── */}
      <SplitHeader client={client} />

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left panel (60%) ── */}
        <div style={{
          width:     '60%',
          flexShrink: 0,
          display:   'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${colours.borderHairline}`,
          overflow:  'hidden',
        }}>
          <TabBar activeTab={activeTab} onSelect={tab => {
            setActiveTab(tab)
            setSelectedExpenseId(null)
          }} />

          <div
            key={activeTab}
            style={{
              flex:      1,
              overflowY: 'auto',
              padding:   spacing.panel.padding,
              animation: 'fadeUp 0.3s ease',
            }}
          >
            <TabErrorBoundary key={activeTab}>
              <LeftTabRenderer
                activeTab={activeTab}
                client={client}
                onExpenseSelect={setSelectedExpenseId}
              />
            </TabErrorBoundary>
          </div>
        </div>

        {/* ── Right panel (40%) ── */}
        <div style={{
          flex:      1,
          overflowY: 'auto',
          background: colours.pageBg,
        }}>
          <ContextPanel
            activeTab={activeTab}
            client={client}
            accountantId={accountantId}
            selectedExpenseId={selectedExpenseId}
            onExpenseSelect={setSelectedExpenseId}
          />
        </div>

      </div>
    </div>
  )
}
