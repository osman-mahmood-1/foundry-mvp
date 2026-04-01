/**
 * lib/nav.ts
 *
 * Single source of truth for the Foundry portal navigation.
 *
 * Rules:
 * - Adding a tab  → add one entry here, add a case to TabRenderer
 * - Removing a tab → remove one entry here
 * - Coming soon   → set comingSoon: true (greyed, non-clickable)
 * - Group order   → Overview → Money → Invoices → Workspace → Filing
 */

import type { NavItem } from '@/types'

export const NAV_ITEMS: NavItem[] = [

  // ─── Overview ────────────────────────────────────────────────────
  {
    id:    'overview',
    label: 'Overview',
    icon:  '▦',
    group: 'overview',
  },

  // ─── Money ───────────────────────────────────────────────────────
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
    id:    'transactions',
    label: 'Transactions',
    icon:  '⇅',
    group: 'money',
  },

  // ─── Invoices ────────────────────────────────────────────────────
  {
    id:    'invoices',
    label: 'Invoices',
    icon:  '□',
    group: 'invoices',
  },
  {
    id:    'clients',
    label: 'Clients',
    icon:  '◎',
    group: 'invoices',
  },

  // ─── Workspace ───────────────────────────────────────────────────
  {
    id:    'documents',
    label: 'Documents',
    icon:  '◈',
    group: 'workspace',
  },
  {
    id:    'messages',
    label: 'Messages',
    icon:  '◇',
    group: 'workspace',
  },
  {
    id:    'intelligence',
    label: 'Foundry Intelligence',
    icon:  '✦',
    group: 'workspace',
  },

  // ─── Filing ──────────────────────────────────────────────────────
  {
    id:    'submission',
    label: 'Submission Centre',
    icon:  '⬡',
    group: 'filing',
  },
  {
    id:    'prior-returns',
    label: 'Prior Returns',
    icon:  '△',
    group: 'filing',
  },
]

/** Display labels for nav group dividers */
export const NAV_GROUPS: Record<NavItem['group'], string> = {
  overview:  '',           // no divider label for top group
  money:     'Money',
  invoices:  'Invoices',
  workspace: 'Workspace',
  filing:    'Filing',
}

/** Ordered list of groups for sidebar rendering */
export const NAV_GROUP_ORDER: NavItem['group'][] = [
  'overview',
  'money',
  'invoices',
  'workspace',
  'filing',
]

/** All active (non-comingSoon) tab IDs */
export const ACTIVE_TABS = NAV_ITEMS
  .filter(item => !item.comingSoon)
  .map(item => item.id)
