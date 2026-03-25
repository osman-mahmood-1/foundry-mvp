/**
 * lib/nav.ts
 *
 * Single source of truth for the portal navigation structure.
 *
 * Adding a new tab = add one entry here.
 * Removing a tab = remove one entry here.
 * Marking a tab coming soon = set comingSoon: true.
 *
 * The sidebar, routing, and any breadcrumb components all
 * derive from this list — nothing is duplicated.
 */

import type { NavItem } from '@/types'

export const NAV_ITEMS: NavItem[] = [
  // ─── Overview group ──────────────────────────────────────────────
  {
    id:    'overview',
    label: 'Overview',
    icon:  '▦',
    group: 'overview',
  },
  {
    id:    'calendar',
    label: 'Calendar',
    icon:  '◎',
    group: 'overview',
  },
  {
    id:    'transactions',
    label: 'Transactions',
    icon:  '⇅',
    group: 'overview',
  },

  // ─── Money group ─────────────────────────────────────────────────
  {
    id:    'income',
    label: 'Income',
    icon:  '↑',
    group: 'money',
  },
  {
    id:    'expenses',
    label: 'Expenses',
    icon:  '↓',
    group: 'money',
  },
  {
    id:         'invoices',
    label:      'Invoices',
    icon:       '□',
    group:      'money',
    comingSoon: true,
  },

  // ─── Tools group ─────────────────────────────────────────────────
  {
    id:    'documents',
    label: 'Documents',
    icon:  '◈',
    group: 'tools',
  },
  {
    id:    'intelligence',
    label: 'Foundry Intelligence',
    icon:  '◇',
    group: 'tools',
  },
  {
    id:         'health',
    label:      'Health Score',
    icon:       '△',
    group:      'tools',
    comingSoon: true,
  },
  {
    id:         'integrations',
    label:      'Integrations',
    icon:       '⬡',
    group:      'tools',
    comingSoon: true,
  },
]

/** Group labels shown as dividers in the sidebar */
export const NAV_GROUPS: Record<NavItem['group'], string> = {
  overview: 'Overview',
  money:    'Money',
  tools:    'Tools',
}

/** Derive which tabs are active (not coming soon) */
export const ACTIVE_TABS = NAV_ITEMS
  .filter(item => !item.comingSoon)
  .map(item => item.id)
