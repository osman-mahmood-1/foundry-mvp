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
import { easing, duration, stagger }  from '@/styles/tokens/motion'
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
        background:           isDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter:       'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        transform:     isOpen ? 'translateY(0)' : 'translateY(-100%)',
        opacity:       isOpen ? 1 : 0,
        transition:    isOpen
          ? `transform ${duration.appleOpen} ${easing.appleExpand}, opacity 0.5s ease-out`
          : `transform ${duration.appleClose} ${easing.appleCollapse} 0.06s, opacity 0.25s ease-in 0.06s`,
        pointerEvents: isOpen ? 'auto' : 'none',
        willChange:    'transform',
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

      {/* Nav items */}
      <nav style={{ padding: '4px 0 0' }}>
        {MOBILE_NAV.map((tabId, idx) => {
          const item     = NAV_ITEMS.find(n => n.id === tabId)
          if (!item) return null
          const isActive = activeTab === tabId

          return (
            <div
              key={tabId}
              style={{
                opacity:    isOpen ? 1 : 0,
                transform:  isOpen ? 'translateY(0)' : 'translateY(30px)',
                filter:     isOpen ? 'blur(0px)' : 'blur(20px)',
                transition: isOpen
                  ? `all 0.6s ${easing.appleExpand} ${idx * stagger}s`
                  : `all 0.15s ease-in`,
                willChange: 'transform, opacity, filter',
              }}
            >
              <button
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
                }}
              >
                {item.label}
              </button>
            </div>
          )
        })}
      </nav>

      {/* Divider */}
      <div style={{
        margin:    '8px 24px',
        borderTop: `0.5px solid ${colours.borderHairline}`,
      }} />

      {/* Settings row */}
      <div
        style={{
          opacity:    isOpen ? 1 : 0,
          transform:  isOpen ? 'translateY(0)' : 'translateY(30px)',
          filter:     isOpen ? 'blur(0px)' : 'blur(20px)',
          transition: isOpen
            ? `all 0.6s ${easing.appleExpand} ${MOBILE_NAV.length * stagger}s`
            : `all 0.25s ease-in`,
          willChange: 'transform, opacity, filter',
        }}
      >
      <button
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
    </div>
  )

  return createPortal(menu, document.body)
}
