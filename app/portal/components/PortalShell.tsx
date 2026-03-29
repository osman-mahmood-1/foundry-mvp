'use client'

import { useState, useRef, useEffect } from 'react'
import type { Client, PortalTab, NavItem } from '@/types'
import { NAV_ITEMS, NAV_GROUPS, NAV_GROUP_ORDER } from '@/lib/nav'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glassStatic, orbs } from '@/styles/tokens/effects'
import { radius, transition, keyframes } from '@/styles/tokens'
import { spacing } from '@/styles/tokens/spacing'
import OverviewTab   from './tabs/OverviewTab'
import IncomeTab     from './tabs/IncomeTab'
import ExpensesTab   from './tabs/ExpensesTab'
import DocumentsTab  from './tabs/DocumentsTab'
import MessagesTab  from './tabs/MessagesTab'

// ─── Stub component for tabs not yet built ───────────────────────────────────

function ComingSoonTab({ id }: { id: string }) {
  const item = NAV_ITEMS.find(i => i.id === id)
  return (
    <div style={{
      ...glassStatic.panel,
      padding:        '48px',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '400px',
      textAlign:      'center',
    }}>
      <div style={{ fontSize: '28px', marginBottom: '16px', opacity: 0.2 }}>
        {item?.icon ?? '◈'}
      </div>
      <div style={{
        fontFamily:   fonts.serif,
        fontSize:     '20px',
        fontWeight:   fontWeight.medium,
        color:        colours.textPrimary,
        marginBottom: '8px',
      }}>
        {item?.label}
      </div>
      <div style={{
        fontSize:   fontSize.base,
        color:      colours.textMuted,
        maxWidth:   '260px',
        lineHeight: 1.6,
      }}>
        This tab is being built. Check back shortly.
      </div>
    </div>
  )
}

// ─── Tab renderer ────────────────────────────────────────────────────────────

function TabRenderer({ activeTab, client }: { activeTab: PortalTab; client: Client }) {
  switch (activeTab) {
    case 'overview':   return <OverviewTab  clientId={client.id} />
    case 'income':     return <IncomeTab    client={client} />
    case 'expenses':   return <ExpensesTab  client={client} />
    case 'documents':  return <DocumentsTab client={client} />
    default:           return <ComingSoonTab id={activeTab} />
  }
}

// ─── Sidebar footer popover ──────────────────────────────────────────────────

interface FooterPopoverProps {
  client:   Client
  onClose:  () => void
}

function FooterPopover({ client, onClose }: FooterPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const menuItem = (label: string, icon: string, onClick: () => void, danger = false) => (
    <button
      onClick={onClick}
      style={{
        width:        '100%',
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        padding:      '8px 12px',
        background:   'transparent',
        border:       'none',
        borderRadius: radius.sm,
        fontSize:     fontSize.base,
        color:        danger ? colours.danger : colours.textSecondary,
        cursor:       'pointer',
        fontFamily:   fonts.sans,
        textAlign:    'left' as const,
        transition:   transition.snap,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? colours.dangerLight : colours.hoverBg
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span style={{ fontSize: '13px', opacity: 0.6 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )

  return (
    <div
      ref={ref}
      style={{
        position:     'absolute',
        bottom:       '100%',
        left:         spacing.sidebar.padding,
        right:        spacing.sidebar.padding,
        marginBottom: '8px',
        background:   colours.panelBgSolid,
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.panel,
        boxShadow:    '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        overflow:     'hidden',
        zIndex:       50,
        animation:    'fadeUp 0.2s ease',
      }}
    >
      {/* Email */}
      <div style={{
        padding:      '12px 14px',
        fontSize:     fontSize.xs,
        color:        colours.textMuted,
        fontFamily:   fonts.mono,
        borderBottom: `1px solid ${colours.borderHairline}`,
      }}>
        {client.email}
      </div>

      {/* Menu items */}
      <div style={{ padding: '6px' }}>
        {menuItem('Settings', '⚙', () => { window.location.href = '/settings' })}
      </div>

      <div style={{ height: '1px', background: colours.borderHairline, margin: '0 12px' }} />

      <div style={{ padding: '6px' }}>
        {menuItem(
          'Upgrade plan',
          '↑',
          () => { window.location.href = '/settings/billing' },
        )}
      </div>

      <div style={{ height: '1px', background: colours.borderHairline, margin: '0 12px' }} />

      <div style={{ padding: '6px' }}>
        {menuItem('Sign out', '↪', async () => {
          const { createClient } = await import('@/lib/supabase')
          await createClient().auth.signOut()
          window.location.href = '/login'
        }, false)}
      </div>
    </div>
  )
}

// ─── Main shell ──────────────────────────────────────────────────────────────

interface Props {
  client: Client
}

export default function PortalShell({ client }: Props) {
  const [activeTab,     setActiveTab]     = useState<PortalTab>('overview')
  const [popoverOpen,   setPopoverOpen]   = useState(false)

  const firstName = client.full_name?.split(' ')[0] ?? 'there'
  const initial   = firstName.charAt(0).toUpperCase()
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{
      display:    'flex',
      height:     '100vh',
      background: colours.pageBg,
      fontFamily: fonts.sans,
      overflow:   'hidden',
    }}>
      <style>{keyframes}</style>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', ...orbs.blueTopRight }} />
        <div style={{ position: 'absolute', ...orbs.skyBottomLeft }} />
      </div>

      {/* ── Sidebar ── */}
      <aside style={{
        width:         '220px',
        flexShrink:    0,
        margin:        '12px 0 12px 12px',
        background:    colours.sidebarBg,
        borderRadius:  radius.sidebar,
        boxShadow:     `0 0 0 1px ${colours.borderHairline}, 0 4px 24px ${colours.sidebarShadow}`,
        display:       'flex',
        flexDirection: 'column',
        zIndex:        10,
        overflow:      'visible', // allows popover to escape
        position:      'relative',
      }}>

        {/* User identity */}
        <div style={{
          padding:      `${spacing.sidebar.userPadding} 18px 18px`,
          borderRadius: `${radius.sidebar} ${radius.sidebar} 0 0`,
          overflow:     'hidden',
        }}>
          <div style={{
            width:          '38px',
            height:         '38px',
            borderRadius:   radius.circle,
            background:     colours.accent,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       fontSize.base,
            color:          colours.textInverse,
            fontWeight:     fontWeight.semibold,
            marginBottom:   '12px',
          }}>
            {initial}
          </div>
          <div style={{
            fontFamily: fonts.serif,
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

        <div style={{ height: '1px', background: colours.borderHairline, margin: '0 18px' }} />

        {/* Nav */}
        <nav style={{
          padding:    `${spacing.sidebar.padding} 10px`,
          flex:       1,
          overflowY:  'auto',
          overflowX:  'visible',
        }}>
          {NAV_GROUP_ORDER.map((group, groupIdx) => {
            const items = NAV_ITEMS.filter(i => i.group === group)
            const groupLabel = NAV_GROUPS[group]
            return (
              <div key={group}>
                {groupIdx > 0 && groupLabel && (
                  <div style={{
                    fontSize:      fontSize.label,
                    color:         colours.navGroupLabel,
                    fontFamily:    fonts.mono,
                    letterSpacing: letterSpacing.widest,
                    textTransform: 'uppercase' as const,
                    padding:       '10px 10px 4px',
                  }}>
                    {groupLabel}
                  </div>
                )}
                {items.map(item => {
                  const isSoon   = item.comingSoon === true
                  const isActive = activeTab === item.id && !isSoon
                  return (
                    <button
                      key={item.id}
                      onClick={() => { if (!isSoon) setActiveTab(item.id) }}
                      style={{
                        width:        '100%',
                        display:      'flex',
                        alignItems:   'center',
                        gap:          '9px',
                        padding:      '8px 10px',
                        borderRadius: radius.sm,
                        background:   isActive ? colours.navActiveBg : 'transparent',
                        border:       'none',
                        color:        isSoon
                                        ? colours.textMuted
                                        : isActive
                                          ? colours.navActive
                                          : colours.navInactive,
                        fontSize:     fontSize.base,
                        fontWeight:   isActive ? fontWeight.medium : fontWeight.regular,
                        cursor:       isSoon ? 'default' : 'pointer',
                        marginBottom: '1px',
                        transition:   transition.snap,
                        textAlign:    'left' as const,
                        fontFamily:   fonts.sans,
                        opacity:      isSoon ? 0.45 : 1,
                      }}
                    >
                      <span style={{ fontSize: '11px', opacity: isActive ? 1 : 0.5 }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isSoon && (
                        <span style={{
                          fontSize:      '8px',
                          fontFamily:    fonts.mono,
                          letterSpacing: '0.06em',
                          color:         colours.textMuted,
                          background:    colours.borderLight,
                          padding:       '1px 5px',
                          borderRadius:  radius.xs,
                          textTransform: 'uppercase' as const,
                        }}>
                          Soon
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div style={{ height: '1px', background: colours.borderHairline, margin: '0 18px' }} />

        {/* Footer — Claude-style user card + popover */}
        <div style={{ padding: '10px', position: 'relative' }}>

          {popoverOpen && (
            <FooterPopover
              client={client}
              onClose={() => setPopoverOpen(false)}
            />
          )}

          <button
            onClick={() => setPopoverOpen(o => !o)}
            style={{
              width:        '100%',
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '8px 10px',
              background:   popoverOpen ? colours.hoverBg : 'transparent',
              border:       'none',
              borderRadius: radius.sm,
              cursor:       'pointer',
              transition:   transition.snap,
              textAlign:    'left' as const,
            }}
            onMouseEnter={e => {
              if (!popoverOpen) e.currentTarget.style.background = colours.hoverBg
            }}
            onMouseLeave={e => {
              if (!popoverOpen) e.currentTarget.style.background = 'transparent'
            }}
          >
            {/* Avatar */}
            <div style={{
              width:          '28px',
              height:         '28px',
              borderRadius:   radius.circle,
              background:     colours.accent,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       fontSize.xs,
              color:          colours.textInverse,
              fontWeight:     fontWeight.semibold,
              flexShrink:     0,
            }}>
              {initial}
            </div>
            {/* Name + plan */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize:     fontSize.sm,
                fontWeight:   fontWeight.medium,
                color:        colours.textPrimary,
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                whiteSpace:   'nowrap' as const,
              }}>
                {firstName}
              </div>
              <div style={{
                fontSize:   fontSize.xs,
                color:      colours.textMuted,
                fontFamily: fonts.mono,
              }}>
                {(client.plan ?? 'foundation').charAt(0).toUpperCase() +
                 (client.plan ?? 'foundation').slice(1)}
              </div>
            </div>
            {/* Chevron */}
            <span style={{
              fontSize:   '10px',
              color:      colours.textMuted,
              transform:  popoverOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: transition.snap,
            }}>
              ⌃
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex:      1,
        overflowY: 'auto',
        padding:   '12px 12px 12px 10px',
        position:  'relative',
        zIndex:    1,
      }}>
        {/* Greeting */}
        <div style={{ marginBottom: '20px', padding: '4px' }}>
          <div style={{
            fontSize:      fontSize.label,
            color:         colours.textMuted,
            fontFamily:    fonts.mono,
            letterSpacing: letterSpacing.widest,
            textTransform: 'uppercase' as const,
            marginBottom:  '4px',
          }}>
            {greeting}
          </div>
          <h1 style={{
            fontFamily: fonts.serif,
            fontSize:   fontSize.xl,
            fontWeight: fontWeight.medium,
            color:      colours.textPrimary,
            lineHeight: 1.2,
            margin:     0,
          }}>
            {firstName}.
          </h1>
        </div>

        {/* Active tab content */}
        <div key={activeTab} style={{ animation: 'fadeUp 0.4s ease' }}>
          <TabRenderer activeTab={activeTab} client={client} />
        </div>
      </main>
    </div>
  )
}