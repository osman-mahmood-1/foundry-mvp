'use client'

/**
 * app/admin/components/AdminShell.tsx
 *
 * Thin wrapper around BaseShell for the platform editor portal.
 * Dark theme (ThemeProvider wraps at layout level).
 * Collapsible sidebar, grouped nav, docked style.
 */

import type { PlatformEditor } from '@/types'
import BaseShell               from '@/app/components/shells/BaseShell'
import type { ShellNavGroup, ShellFooterItem } from '@/app/components/shells/BaseShell'
import { useColours }          from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'

// ─── Nav config ──────────────────────────────────────────────────────────────

const ADMIN_NAV: ShellNavGroup[] = [
  {
    id:          'people',
    label:       'People',
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: 'clients',     label: 'Clients',     icon: '◎', href: '/admin' },
      { id: 'accountants', label: 'Accountants', icon: '◇', href: '/admin/accountants' },
      { id: 'invites',     label: 'Invites',     icon: '✉', href: '/admin/invites' },
    ],
  },
  {
    id:          'operations',
    label:       'Operations',
    collapsible: true,
    defaultOpen: true,
    items: [
      { id: 'audit', label: 'Audit Log', icon: '⊙', href: '/admin/audit' },
    ],
  },
  {
    id:          'config',
    label:       'Settings',
    collapsible: true,
    defaultOpen: false,
    items: [
      { id: 'settings', label: 'Platform', icon: '⚙', href: '/admin/settings' },
    ],
  },
]

// ─── Brand top bar ────────────────────────────────────────────────────────────

function AdminTopBar() {
  const colours = useColours()
  return (
    <div>
      <div style={{
        fontFamily:   fonts.sans,
        fontSize:     '15px',
        fontWeight:   fontWeight.medium,
        color:        colours.textPrimary,
        lineHeight:   1.2,
        marginBottom: '2px',
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
        Platform
      </div>
    </div>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface Props {
  editor:   PlatformEditor
  children: React.ReactNode
}

export default function AdminShell({ editor, children }: Props) {
  const firstName = editor.full_name?.split(' ')[0] ?? 'Editor'
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
      topBarContent={<AdminTopBar />}
      footerIdentity={{ name: firstName, subtitle: 'Editor', avatarLetter: initial }}
      email={editor.email}
      footerItems={footerItems}
      navGroups={ADMIN_NAV}
      collapsible
      storageKey="foundry-admin-sidebar"
      showOrbs={true}
      sidebarStyle="docked"
    >
      {children}
    </BaseShell>
  )
}
