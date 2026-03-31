'use client'

/**
 * app/accountant/components/panels/ContextPanel.tsx
 *
 * Right-panel router for the split-panel client record view.
 * Switches between fully-built panels based on which left-panel tab is active.
 */

import type { Client, SplitPanelInitialData } from '@/types'
import OverviewPanel  from './OverviewPanel'
import IncomePanel    from './IncomePanel'
import ExpensesPanel  from './ExpensesPanel'
import DocumentsPanel from './DocumentsPanel'
import MessagesPanel  from './MessagesPanel'

type SplitTab = 'overview' | 'income' | 'expenses' | 'documents' | 'messages'

interface Props {
  activeTab:          SplitTab
  client:             Client
  accountantId:       string | null
  accountantUserId:   string
  selectedExpenseId:  string | null
  onExpenseSelect:    (id: string | null) => void
  initialData:        SplitPanelInitialData
}

export default function ContextPanel({
  activeTab,
  client,
  accountantId,
  accountantUserId,
  selectedExpenseId,
  onExpenseSelect,
  initialData,
}: Props) {
  switch (activeTab) {
    case 'overview':
      return (
        <OverviewPanel
          client={client}
          accountantId={accountantId}
          initialData={initialData}
        />
      )

    case 'income':
      return (
        <IncomePanel
          client={client}
          initialData={initialData}
        />
      )

    case 'expenses':
      return (
        <ExpensesPanel
          client={client}
          accountantId={accountantId}
          accountantUserId={accountantUserId}
          initialData={initialData}
          selectedExpenseId={selectedExpenseId}
          onExpenseSelect={onExpenseSelect}
        />
      )

    case 'documents':
      return (
        <DocumentsPanel
          client={client}
          initialData={initialData}
        />
      )

    case 'messages':
      return (
        <MessagesPanel
          client={client}
          initialData={initialData}
        />
      )

    default:
      return null
  }
}
