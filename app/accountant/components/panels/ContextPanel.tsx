'use client'

/**
 * app/accountant/components/panels/ContextPanel.tsx
 *
 * Right-panel router for the split-panel client record view.
 * Switches content based on which tab is active in the left panel.
 *
 * Phase 4 delivers the structural shell with placeholder content for each panel.
 * Phase 5 builds out each panel fully (OverviewPanel, IncomePanel,
 * ExpensesPanel, DocumentsPanel, MessagesPanel) with hooks and data.
 *
 * Props flow:
 *   activeTab        → which panel to show
 *   client           → client record (passed through to panel hooks)
 *   accountantId     → the accountant's UUID (for note/review mutations)
 *   selectedExpenseId → the expense selected in the left panel (Expenses tab)
 *   onExpenseSelect  → callback to update selectedExpenseId from panels
 */

import type { Client } from '@/types'
import { light as colours }   from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { glassStatic }        from '@/styles/tokens/effects'
import { spacing }            from '@/styles/tokens/spacing'

type SplitTab = 'overview' | 'income' | 'expenses' | 'documents' | 'messages'

interface Props {
  activeTab:         SplitTab
  client:            Client
  accountantId:      string | null
  selectedExpenseId: string | null
  onExpenseSelect:   (id: string | null) => void
}

// ─── Placeholder panel ────────────────────────────────────────────────────────
// Used for panels not yet built in Phase 5. Renders a clean stub so the
// shell works end-to-end without errors.

function PlaceholderPanel({ title, description }: { title: string; description: string }) {
  return (
    <div style={{
      padding: spacing.panel.padding,
    }}>
      <div style={{
        ...glassStatic.panel,
        padding:        spacing.panel.padding,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '300px',
        textAlign:      'center',
      }}>
        <div style={{
          fontFamily:   fonts.serif,
          fontSize:     '18px',
          fontWeight:   fontWeight.medium,
          color:        colours.textPrimary,
          marginBottom: '8px',
        }}>
          {title}
        </div>
        <div style={{
          fontSize:   fontSize.sm,
          color:      colours.textMuted,
          lineHeight: 1.6,
          maxWidth:   '260px',
        }}>
          {description}
        </div>
      </div>
    </div>
  )
}

// ─── Context panel router ─────────────────────────────────────────────────────

export default function ContextPanel({
  activeTab,
  client,
  accountantId,
  selectedExpenseId,
  onExpenseSelect,
}: Props) {
  // Suppress unused-var warnings for props that will be used in Phase 5
  void client
  void accountantId
  void selectedExpenseId
  void onExpenseSelect

  switch (activeTab) {
    case 'overview':
      return (
        <PlaceholderPanel
          title="Client Health"
          description="Submission status, missing items checklist, SA deadline, and private working notes. Coming in Phase 5."
        />
      )

    case 'income':
      return (
        <PlaceholderPanel
          title="Income Review"
          description="Income summary, HMRC treatment flags, CIS deduction fields, and income notes. Coming in Phase 5."
        />
      )

    case 'expenses':
      return (
        <PlaceholderPanel
          title="Deductibility Review"
          description="Click any expense row on the left to load it here for an allowability decision. Coming in Phase 5."
        />
      )

    case 'documents':
      return (
        <PlaceholderPanel
          title="Document Review"
          description="Mark documents as reviewed, link to expenses, and request missing documents. Coming in Phase 5."
        />
      )

    case 'messages':
      return (
        <PlaceholderPanel
          title="Recent Activity"
          description="Quick links to this client's recent income, expenses, and documents for easy reference while messaging. Coming in Phase 5."
        />
      )

    default:
      return null
  }
}
