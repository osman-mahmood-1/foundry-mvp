'use client'

import { useState, useEffect }         from 'react'
import type { Client, PortalTab } from '@/types'
import { NAV_ITEMS, NAV_GROUPS, NAV_GROUP_ORDER } from '@/lib/nav'
import type { ShellNavGroup, ShellFooterItem }    from '@/app/components/shells/BaseShell'
import BaseShell                                  from '@/app/components/shells/BaseShell'
import { useColours }        from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius }            from '@/styles/tokens'

import OverviewTab      from './tabs/OverviewTab'
import IncomeTab        from './tabs/IncomeTab'
import ExpensesTab      from './tabs/ExpensesTab'
import DocumentsTab     from './tabs/DocumentsTab'
import MessagesTab      from './tabs/MessagesTab'
import InvoicesTab      from './tabs/InvoicesTab'
import TransactionsTab  from './tabs/TransactionsTab'
import IntelligenceTab  from './tabs/IntelligenceTab'
import SubmissionTab    from './tabs/SubmissionTab'
import PriorReturnsTab  from './tabs/PriorReturnsTab'
import ClientsTab       from './tabs/ClientsTab'
import SettingsTab      from './tabs/SettingsTab'
import { TabErrorBoundary } from './ui'

// ─── Nav config (convert from lib/nav format to ShellNavGroup[]) ─────────────

function buildNavGroups(): ShellNavGroup[] {
  return NAV_GROUP_ORDER.map(groupId => ({
    id:          groupId,
    label:       NAV_GROUPS[groupId],
    collapsible: false,
    defaultOpen: true,
    items:       NAV_ITEMS
      .filter(item => item.group === groupId)
      .map(item => ({
        id:          item.id,
        label:       item.label,
        icon:        item.icon,
        comingSoon:  item.comingSoon,
      })),
  }))
}

const NAV_GROUPS_CONFIG: ShellNavGroup[] = buildNavGroups()

// ─── Tab renderer ─────────────────────────────────────────────────────────────

function TabRenderer({ activeTab, client, onTabChange }: { activeTab: PortalTab; client: Client; onTabChange: (tab: string) => void }) {
  switch (activeTab) {
    case 'overview':      return <OverviewTab     clientId={client.id} onTabChange={onTabChange} />
    case 'income':        return <IncomeTab        client={client} />
    case 'expenses':      return <ExpensesTab      client={client} />
    case 'documents':     return <DocumentsTab     client={client} />
    case 'messages':      return <MessagesTab      client={client} />
    case 'invoices':      return <InvoicesTab      client={client} />
    case 'transactions':  return <TransactionsTab  client={client} />
    case 'intelligence':  return <IntelligenceTab  client={client} />
    case 'submission':    return <SubmissionTab     client={client} />
    case 'prior-returns': return <PriorReturnsTab   client={client} />
    case 'clients':       return <ClientsTab        client={client} />
    case 'settings':      return <SettingsTab        client={client} />
    default:              return null
  }
}

// ─── Portal top-bar content ───────────────────────────────────────────────────

function PortalTopBar({ client }: { client: Client }) {
  const colours  = useColours()
  const firstName = client.full_name?.split(' ')[0] ?? 'there'
  const initial   = firstName.charAt(0).toUpperCase()

  return (
    <div style={{ flex: 1 }}>
      {/* Big avatar */}
      <div style={{
        width:          '38px',
        height:         '38px',
        borderRadius:   radius.circle,
        background:     colours.accentSoft,
        border:         `1px solid ${colours.accentBorder}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       fontSize.base,
        color:          colours.accent,
        fontWeight:     fontWeight.medium,
        marginBottom:   '12px',
      }}>
        {initial}
      </div>
      <div style={{
        fontFamily: fonts.sans,
        fontSize:   '16px',
        fontWeight: fontWeight.medium,
        color:      colours.textPrimary,
        lineHeight: 1.2,
      }}>
        {firstName}
      </div>
      <div style={{
        fontSize:      fontSize.label,
        color:         colours.textMuted,
        fontFamily:    fonts.mono,
        letterSpacing: letterSpacing.wide,
        marginTop:     '3px',
      }}>
        {client.tax_year} · {(client.plan ?? 'foundation').toUpperCase()}
      </div>
    </div>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface Props { client: Client }

// ── Rotating status lines — operator / command-centre feel ────────────────────
const STATUS_LINES = [
  'All systems active.',
  'Your numbers are clean.',
  'Tax year on track.',
  'Ready to execute.',
  'Books in order.',
  'No surprises today.',
  'Runway looks healthy.',
  'Figures reconciled.',
  'Operations nominal.',
  'You\'re ahead of schedule.',
]

function GreetingHeader({ firstName, taxYear }: { firstName: string; taxYear: string }) {
  const colours = useColours()
  const hour    = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const [statusIdx, setStatusIdx] = useState(0)
  const [visible,   setVisible]   = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, swap text, fade in
      setVisible(false)
      setTimeout(() => {
        setStatusIdx(i => (i + 1) % STATUS_LINES.length)
        setVisible(true)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: '16px 20px 18px', flexShrink: 0 }}>
      {/* Top row: greeting label + date */}
      <div style={{
        display:        'flex',
        alignItems:     'baseline',
        justifyContent: 'space-between',
        marginBottom:   '2px',
      }}>
        <div style={{
          fontSize:      fontSize.label,
          color:         colours.textMuted,
          fontFamily:    fonts.mono,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
        }}>
          {greeting}
        </div>
        <div style={{
          fontSize:   fontSize.xs,
          color:      colours.textMuted,
          fontFamily: fonts.mono,
          letterSpacing: '0.04em',
        }}>
          {today}
        </div>
      </div>

      {/* Name — primary weight */}
      <h1 style={{
        fontFamily: fonts.sans,
        fontSize:   '24px',
        fontWeight: fontWeight.medium,
        color:      colours.textPrimary,
        lineHeight: 1.2,
        margin:     '0 0 6px',
      }}>
        {firstName}.
      </h1>

      {/* Rotating status line */}
      <div style={{
        fontSize:      fontSize.xs,
        color:         colours.accent,
        fontFamily:    fonts.mono,
        letterSpacing: '0.06em',
        opacity:       visible ? 1 : 0,
        transition:    'opacity 0.3s ease',
        display:       'flex',
        alignItems:    'center',
        gap:           '6px',
      }}>
        <span style={{ fontSize: '8px', opacity: 0.7 }}>◆</span>
        {STATUS_LINES[statusIdx]}
      </div>
    </div>
  )
}

export default function PortalShell({ client }: Props) {
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')

  const firstName  = client.full_name?.split(' ')[0] ?? 'there'
  const initial    = firstName.charAt(0).toUpperCase()
  const colours    = useColours()

  const footerItems: ShellFooterItem[] = [
    {
      label:   'Settings',
      icon:    '⚙',
      onClick: () => { setActiveTab('settings') },
    },
    {
      label:        'Sign out',
      icon:         '↪',
      danger:       true,
      dividerAbove: true,
      onClick:      async () => {
        const { createClient } = await import('@/lib/supabase')
        const { error } = await createClient().auth.signOut()
        if (error) {
          console.error('AUTH_003', error)
console.error('AUTH_003 — Sign-out failed')
          return
        }
        window.location.href = '/login'
      },
    },
  ]

  return (
    <BaseShell
      topBarContent={<PortalTopBar client={client} />}
      footerIdentity={{
        name:          firstName,
        subtitle:      (client.plan ?? 'foundation').charAt(0).toUpperCase() + (client.plan ?? 'foundation').slice(1),
        avatarLetter:  initial,
      }}
      email={client.email}
      footerItems={footerItems}
      navGroups={NAV_GROUPS_CONFIG}
      collapsible={true}
      storageKey="foundry-portal-sidebar"
      showOrbs
      sidebarStyle="floating"
      activeId={activeTab}
      onNavSelect={id => setActiveTab(id as PortalTab)}
    >
      {/* Main content: greeting + tab */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {/* Command centre header */}
        <GreetingHeader firstName={firstName} taxYear={client.tax_year} />

        {/* Tab content */}
        <div key={activeTab} style={{ flex: 1, padding: '0 20px 24px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TabErrorBoundary key={activeTab}>
            <TabRenderer activeTab={activeTab} client={client} onTabChange={id => setActiveTab(id as PortalTab)} />
          </TabErrorBoundary>
        </div>
      </div>
    </BaseShell>
  )
}
