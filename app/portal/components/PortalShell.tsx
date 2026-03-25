'use client'

/**
 * app/portal/components/PortalShell.tsx
 *
 * The portal layout — sidebar + main content area.
 * Responsibilities:
 *   - Render the sidebar navigation
 *   - Track active tab state
 *   - Render the correct tab component
 *   - Inject global keyframes once (motion tokens)
 *
 * What this file does NOT do:
 *   - Fetch any data (that lives in individual tab hooks)
 *   - Define any colours, radii, or spacing inline
 *   - Know anything about Supabase
 */

import { useState } from 'react'
import type { Client, PortalTab, NavItem } from '@/types'
import { NAV_ITEMS, NAV_GROUPS } from '@/lib/nav'
import {
  colours,
  fonts,
  fontSize,
  fontWeight,
  letterSpacing,
  glass,
  radius,
  spacing,
  transition,
  orbs,
  keyframes,
} from '@/styles/tokens'
import { Divider } from './ui'

// ─── Tab imports ──────────────────────────────────────────────────────────────
// Add imports here as tabs are built. Until a tab exists,
// the shell renders a placeholder — the app never crashes
// because a tab component is missing.
//
// import OverviewTab from './tabs/OverviewTab'

interface Props {
  client: Client
}

export default function PortalShell({ client }: Props) {
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')

  const firstName = client.full_name?.split(' ')[0] ?? 'there'
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

      {/* Global keyframes — injected once here, never in tab files */}
      <style>{keyframes}</style>

      {/* Background orbs — fixed, pointer-events none */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', ...orbs.tealTopRight }} />
        <div style={{ position: 'absolute', ...orbs.navyBottomLeft }} />
      </div>

      {/* ── Sidebar ── */}
      <aside style={{
        width:      '220px',
        flexShrink: 0,
        margin:     '12px 0 12px 12px',
        ...glass.sidebar,
        display:        'flex',
        flexDirection:  'column',
        zIndex:         10,
        overflow:       'hidden',
      }}>

        {/* User identity */}
        <div style={{ padding: `${spacing.sidebar.userPadding} ${spacing.panel.padding} 18px` }}>
          <div style={{
            width:          '38px',
            height:         '38px',
            borderRadius:   radius.circle,
            background:     colours.brand,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       fontSize.base,
            color:          colours.textInverse,
            fontWeight:     fontWeight.semibold,
            marginBottom:   '12px',
          }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div style={{
            fontFamily:    fonts.serif,
            fontSize:      '16px',
            fontWeight:    fontWeight.medium,
            color:         colours.textPrimary,
            lineHeight:    1.2,
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

        <Divider />

        {/* Navigation — grouped */}
        <nav style={{ padding: `12px ${spacing.sidebar.padding}`, flex: 1, overflowY: 'auto' }}>
          {(['overview', 'money', 'tools'] as NavItem['group'][]).map((group, groupIdx) => {
            const items = NAV_ITEMS.filter(item => item.group === group)
            return (
              <div key={group}>
                {/* Group label */}
                {groupIdx > 0 && (
                  <div style={{
                    fontSize:      fontSize.label,
                    color:         colours.textMuted,
                    fontFamily:    fonts.mono,
                    letterSpacing: letterSpacing.widest,
                    textTransform: 'uppercase' as const,
                    padding:       `10px 10px 4px`,
                  }}>
                    {NAV_GROUPS[group]}
                  </div>
                )}
                {items.map(item => {
                  const isActive = activeTab === item.id && !item.comingSoon
                  return (
                    <button
                      key={item.id}
                      onClick={() => !item.comingSoon && setActiveTab(item.id)}
                      style={{
                        width:       '100%',
                        display:     'flex',
                        alignItems:  'center',
                        gap:         '9px',
                        padding:     '8px 10px',
                        borderRadius: radius.sm,
                        background:  isActive ? colours.navActive : 'transparent',
                        border:      'none',
                        color:       item.comingSoon
                          ? colours.textMuted
                          : isActive
                            ? colours.textInverse
                            : colours.navInactive,
                        fontSize:    fontSize.base,
                        fontWeight:  isActive ? fontWeight.medium : fontWeight.regular,
                        cursor:      item.comingSoon ? 'default' : 'pointer',
                        marginBottom: '1px',
                        transition:  transition.snap,
                        textAlign:   'left' as const,
                        fontFamily:  fonts.sans,
                        opacity:     item.comingSoon ? 0.45 : 1,
                      }}
                    >
                      <span style={{ fontSize: '11px', opacity: isActive ? 1 : 0.5 }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.comingSoon && (
                        <span style={{
                          fontSize:      '8px',
                          fontFamily:    fonts.mono,
                          letterSpacing: '0.06em',
                          color:         colours.textMuted,
                          background:    `rgba(5,28,44,0.06)`,
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

        <Divider />

        {/* Sign out */}
        <div style={{ padding: `10px ${spacing.sidebar.padding}` }}>
          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase')
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            style={{
              width:       '100%',
              padding:     '7px 10px',
              background:  'transparent',
              border:      'none',
              color:       colours.textMuted,
              fontSize:    fontSize.sm,
              cursor:      'pointer',
              textAlign:   'left' as const,
              fontFamily:  fonts.sans,
              borderRadius: radius.sm,
              transition:  transition.snap,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = colours.textPrimary }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = colours.textMuted }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex:       1,
        overflowY:  'auto',
        padding:    '12px 12px 12px 10px',
        position:   'relative',
        zIndex:     1,
      }}>

        {/* Top bar */}
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
            fontFamily:    fonts.serif,
            fontSize:      fontSize.xl,
            fontWeight:    fontWeight.medium,
            color:         colours.textPrimary,
            lineHeight:    1.2,
            margin:        0,
          }}>
            {firstName}.
          </h1>
        </div>

        {/* Tab content */}
        <div
          key={activeTab}
          style={{ animation: 'fadeUp 0.4s ease' }}
        >
          <TabRenderer activeTab={activeTab} client={client} />
        </div>
      </main>
    </div>
  )
}

// ─── Tab renderer ─────────────────────────────────────────────────────────────
// Isolated so the import list above stays clean.
// Replace placeholder divs with real tab components as they are built.

function TabRenderer({ activeTab, client }: { activeTab: PortalTab; client: Client }) {
  // As each tab is built, replace its placeholder with its component:
  // case 'overview': return <OverviewTab client={client} />

  return (
    <div style={{
      ...glass.panel,
      padding:        '48px',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '400px',
      textAlign:      'center',
    }}>
      <div style={{
        fontSize:      '28px',
        marginBottom:  '16px',
        opacity:       0.2,
      }}>
        {NAV_ITEMS.find(i => i.id === activeTab)?.icon ?? '◈'}
      </div>
      <div style={{
        fontFamily:    fonts.serif,
        fontSize:      '20px',
        fontWeight:    fontWeight.medium,
        color:         colours.textPrimary,
        marginBottom:  '8px',
      }}>
        {NAV_ITEMS.find(i => i.id === activeTab)?.label}
      </div>
      <div style={{
        fontSize:  fontSize.base,
        color:     colours.textMuted,
        maxWidth:  '260px',
        lineHeight: 1.6,
      }}>
        This tab is being built. Check back shortly.
      </div>
    </div>
  )
}
