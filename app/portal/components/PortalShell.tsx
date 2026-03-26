'use client'

import { useState } from 'react'
import type { Client, PortalTab, NavItem } from '@/types'
import { NAV_ITEMS, NAV_GROUPS } from '@/lib/nav'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glassStatic, orbs } from '@/styles/tokens/effects'
import { spacing, radius, transition, keyframes } from '@/styles/tokens'

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
      <style>{keyframes}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', ...orbs.blueTopRight }} />
        <div style={{ position: 'absolute', ...orbs.skyBottomLeft }} />
      </div>

      <aside style={{
        width:         '220px',
        flexShrink:    0,
        margin:        '12px 0 12px 12px',
        background:    colours.sidebarBg,
        borderRadius:  radius.xl,
        boxShadow:     '0 0 0 1px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.06)',
        display:       'flex',
        flexDirection: 'column',
        zIndex:        10,
        overflow:      'hidden',
      }}>
        <div style={{ padding: '24px 18px 18px' }}>
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
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontFamily: fonts.serif, fontSize: '16px', fontWeight: fontWeight.medium, color: colours.textPrimary, lineHeight: 1.2 }}>
            {firstName}
          </div>
          <div style={{ fontSize: fontSize.label, color: colours.textMuted, fontFamily: fonts.mono, letterSpacing: letterSpacing.wide, marginTop: '3px' }}>
            {client.tax_year} · {(client.plan ?? 'foundation').toUpperCase()}
          </div>
        </div>

        <div style={{ height: '1px', background: colours.borderHairline, margin: '0 18px' }} />

        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          {(['overview', 'money', 'tools'] as NavItem['group'][]).map((group, groupIdx) => {
            const items = NAV_ITEMS.filter(i => i.group === group)
            return (
              <div key={group}>
                {groupIdx > 0 && (
                  <div style={{ fontSize: fontSize.label, color: colours.navGroupLabel, fontFamily: fonts.mono, letterSpacing: letterSpacing.widest, textTransform: 'uppercase' as const, padding: '10px 10px 4px' }}>
                    {NAV_GROUPS[group]}
                  </div>
                )}
                {items.map(item => {
                  const isSoon   = item.comingSoon === true
                  const isActive = activeTab === item.id && isSoon === false
                  return (
                    <button
                      key={item.id}
                      onClick={() => { if (isSoon === false) setActiveTab(item.id) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                        padding: '8px 10px', borderRadius: radius.sm,
                        background: isActive ? colours.navActiveBg : 'transparent',
                        border: 'none',
                        color: isSoon ? colours.textMuted : isActive ? colours.navActive : colours.navInactive,
                        fontSize: fontSize.base,
                        fontWeight: isActive ? fontWeight.medium : fontWeight.regular,
                        cursor: isSoon ? 'default' : 'pointer',
                        marginBottom: '1px', transition: transition.snap,
                        textAlign: 'left' as const, fontFamily: fonts.sans,
                        opacity: isSoon ? 0.45 : 1,
                      }}
                    >
                      <span style={{ fontSize: '11px', opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isSoon && (
                        <span style={{ fontSize: '8px', fontFamily: fonts.mono, letterSpacing: '0.06em', color: colours.textMuted, background: colours.borderLight, padding: '1px 5px', borderRadius: radius.xs, textTransform: 'uppercase' as const }}>
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

        <div style={{ padding: '10px' }}>
          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase')
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            style={{ width: '100%', padding: '7px 10px', background: 'transparent', border: 'none', color: colours.textMuted, fontSize: fontSize.sm, cursor: 'pointer', textAlign: 'left' as const, fontFamily: fonts.sans, borderRadius: radius.sm, transition: transition.snap }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 12px 10px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '20px', padding: '4px' }}>
          <div style={{ fontSize: fontSize.label, color: colours.textMuted, fontFamily: fonts.mono, letterSpacing: letterSpacing.widest, textTransform: 'uppercase' as const, marginBottom: '4px' }}>
            {greeting}
          </div>
          <h1 style={{ fontFamily: fonts.serif, fontSize: fontSize.xl, fontWeight: fontWeight.medium, color: colours.textPrimary, lineHeight: 1.2, margin: 0 }}>
            {firstName}.
          </h1>
        </div>

        <div key={activeTab} style={{ animation: 'fadeUp 0.4s ease' }}>
          <TabRenderer activeTab={activeTab} client={client} />
        </div>
      </main>
    </div>
  )
}

function TabRenderer({ activeTab, client: _client }: { activeTab: PortalTab; client: Client }) {
  const activeItem = NAV_ITEMS.find(i => i.id === activeTab)
  return (
    <div style={{ ...glassStatic.panel, padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '16px', opacity: 0.2 }}>{activeItem?.icon ?? '◈'}</div>
      <div style={{ fontFamily: fonts.serif, fontSize: '20px', fontWeight: fontWeight.medium, color: '#1D1D1F', marginBottom: '8px' }}>{activeItem?.label}</div>
      <div style={{ fontSize: '13px', color: '#6E6E73', maxWidth: '260px', lineHeight: 1.6 }}>This tab is being built. Check back shortly.</div>
    </div>
  )
}
