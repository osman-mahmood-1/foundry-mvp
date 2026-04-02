'use client'

/**
 * app/accountant/components/AccountantShell.tsx
 *
 * Thin wrapper around BaseShell for the accountant portal.
 * Route-based nav (Clients, Messages). Light theme.
 */

import type { Accountant }  from '@/types'
import BaseShell            from '@/app/components/shells/BaseShell'
import type { ShellNavGroup, ShellFooterItem } from '@/app/components/shells/BaseShell'
import { useColours }       from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'

// ─── Nav config ──────────────────────────────────────────────────────────────

const ACCOUNTANT_NAV: ShellNavGroup[] = [
  {
    id:    'main',
    label: '',
    items: [
      { id: 'clients',  label: 'Clients',  icon: '◎', href: '/accountant' },
      { id: 'messages', label: 'Messages', icon: '◇', href: '/accountant/messages' },
    ],
  },
  {
    id:          'config',
    label:       'Settings',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙', href: '/accountant/settings' },
    ],
  },
]

// ─── Brand top bar ────────────────────────────────────────────────────────────

function AccountantTopBar() {
  const colours = useColours()
  return (
    <div>
      <div style={{
        fontFamily:  fonts.sans,
        fontSize:    '15px',
        fontWeight:  fontWeight.medium,
        color:       colours.textPrimary,
        lineHeight:  1.2,
        marginBottom: '4px',
      }}>
        Tax Foundry
      </div>
      <div style={{
        fontSize:      fontSize.label,
        color:         colours.textMuted,
        fontFamily:    fonts.mono,
        letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase' as const,
      }}>
        Accountant Portal
      </div>
    </div>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface Props {
  accountant: Accountant
  children:   React.ReactNode
}

export default function AccountantShell({ accountant, children }: Props) {
  const firstName = accountant.full_name?.split(' ')[0] ?? 'there'
  const initial   = firstName.charAt(0).toUpperCase()

  const footerItems: ShellFooterItem[] = [
    {
      label:   'Sign out',
      icon:    '↪',
      danger:  true,
      onClick: async () => {
        const { createClient } = await import('@/lib/supabase')
        const { error } = await createClient().auth.signOut()
        if (error) {
          console.error('AUTH_003', error)
          alert('AUTH_003 — Sign-out failed. Clear your browser cookies if needed.')
          return
        }
        window.location.href = '/login'
      },
    },
  ]

  return (
    <BaseShell
      topBarContent={<AccountantTopBar />}
      footerIdentity={{ name: firstName, subtitle: 'Accountant', avatarLetter: initial }}
      email={accountant.email}
      footerItems={footerItems}
      navGroups={ACCOUNTANT_NAV}
      collapsible={true}
      storageKey="foundry-accountant-sidebar"
      showOrbs
      sidebarStyle="floating"
    >
      {children}
    </BaseShell>
  )
}
