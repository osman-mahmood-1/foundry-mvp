'use client'

/**
 * app/portal/components/mobile/MobileHamburger.tsx
 *
 * Full-screen nav drawer. Always mounted; controlled by `isOpen` so exit
 * animations play. A single fixed div slides in from the top — no separate
 * backdrop overlay, no conditional unmount, no dark-navy flash.
 */

import { useState, useEffect }        from 'react'
import { createPortal }               from 'react-dom'
import type { PortalTab }             from '@/types'
import { useColours }                 from '@/styles/ThemeContext'
import { useThemePreference }         from '../PortalThemeProvider'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { NAV_ITEMS }                  from '@/lib/nav'

interface Props {
  isOpen:     boolean
  activeTab:  PortalTab
  onSelect:   (tab: PortalTab) => void
  onSettings: () => void
  onClose:    () => void
  clientName: string
}

const MOBILE_NAV: PortalTab[] = [
  'overview',
  'income',
  'expenses',
  'transactions',
  'invoices',
  'documents',
  'messages',
  'submission',
]

export default function MobileHamburger({ isOpen, activeTab, onSelect, onSettings, onClose, clientName }: Props) {
  const colours      = useColours()
  const { mode }     = useThemePreference()
  const [mounted, setMounted]   = useState(false)
  const [isDark,  setIsDark]    = useState(true)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const dark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
  }, [mode])

  if (!mounted) return null

  const initial = (clientName ?? 'U').charAt(0).toUpperCase()

  const menu = (
    <div
      style={{
        position:      'fixed',
        inset:          0,
        zIndex:         200,
        display:       'flex',
        flexDirection: 'column',
        background:    isDark ? '#000000' : '#ffffff',
        transform:     isOpen ? 'translateY(0)' : 'translateY(-100%)',
        opacity:       isOpen ? 1 : 0,
        transition:    'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        pointerEvents: isOpen ? 'auto' : 'none',
        overflow:      'hidden',
        paddingTop:    'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Close row */}
      <div style={{
        display:        'flex',
        justifyContent: 'flex-end',
        padding:        '8px 8px 0',
      }}>
        <button
          onClick={onClose}
          aria-label="Close menu"
          style={{
            width:          '44px',
            height:         '44px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            background:     'transparent',
            border:         'none',
            cursor:         'pointer',
            fontSize:       '20px',
            color:          colours.textMuted,
          }}
        >
          ✕
        </button>
      </div>

      {/* Nav items — key on isOpen so animation replays each open */}
      <nav key={String(isOpen)} style={{ padding: '4px 0 0' }}>
        {MOBILE_NAV.map((tabId, idx) => {
          const item     = NAV_ITEMS.find(n => n.id === tabId)
          if (!item) return null
          const isActive = activeTab === tabId

          return (
            <button
              key={tabId}
              onClick={() => { onSelect(tabId); onClose() }}
              style={{
                display:       'block',
                width:         '100%',
                textAlign:     'left' as const,
                padding:       '14px 24px',
                background:    'transparent',
                border:        'none',
                cursor:        'pointer',
                fontFamily:    fonts.sans,
                fontSize:      '22px',
                fontWeight:    isActive ? fontWeight.medium : fontWeight.regular,
                color:         isActive ? colours.teal : colours.textPrimary,
                letterSpacing: '-0.02em',
                animation:     isOpen
                  ? `navItemIn 0.25s ease ${80 + idx * 40}ms both`
                  : 'none',
                opacity:       isOpen ? undefined : 0,
              }}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{
        margin:    '8px 24px',
        borderTop: `0.5px solid ${colours.borderHairline}`,
      }} />

      {/* Settings row */}
      <button
        key={`settings-${String(isOpen)}`}
        onClick={() => { onSettings(); onClose() }}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '12px',
          width:      '100%',
          padding:    '14px 24px',
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          animation:  isOpen
            ? `navItemIn 0.25s ease ${80 + MOBILE_NAV.length * 40 + 40}ms both`
            : 'none',
          opacity:    isOpen ? undefined : 0,
        }}
      >
        <div style={{
          width:          '32px',
          height:         '32px',
          borderRadius:   '50%',
          background:     colours.accentSoft,
          border:         `1px solid ${colours.accentBorder}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '14px',
          fontWeight:     fontWeight.semibold,
          color:          colours.accent,
          fontFamily:     fonts.sans,
          flexShrink:     0,
        }}>
          {initial}
        </div>
        <span style={{
          fontFamily: fonts.sans,
          fontSize:   '16px',
          fontWeight: fontWeight.medium,
          color:      colours.textPrimary,
        }}>
          {clientName}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: fonts.sans,
          fontSize:   fontSize.sm,
          color:      colours.textMuted,
        }}>
          Settings →
        </span>
      </button>
    </div>
  )

  return createPortal(menu, document.body)
}
