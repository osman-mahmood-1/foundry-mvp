'use client'

/**
 * app/portal/components/mobile/MobileHamburger.tsx
 *
 * Full-screen cascading nav menu.
 * Opens: overlay dissolves in, panel slides down from top,
 *        nav items stagger in with blur+translateY.
 * Closes: items fade together, panel slides back up.
 * Rendered via React Portal to avoid fixed-in-transform bug.
 */

import { useState, useEffect, useRef } from 'react'
import { createPortal }                from 'react-dom'
import type { PortalTab }              from '@/types'
import { useColours }                  from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { NAV_ITEMS }                   from '@/lib/nav'

interface Props {
  activeTab:    PortalTab
  onSelect:     (tab: PortalTab) => void
  onSettings:   () => void
  onClose:      () => void
  clientName:   string
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

export default function MobileHamburger({ activeTab, onSelect, onSettings, onClose, clientName }: Props) {
  const colours         = useColours()
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  function startClose() {
    setClosing(true)
    closeTimer.current = setTimeout(() => {
      setClosing(false)
      onClose()
    }, 200)
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  function selectTab(tab: PortalTab) {
    onSelect(tab)
    startClose()
  }

  if (!mounted) return null

  const initial = (clientName ?? 'U').charAt(0).toUpperCase()

  const menu = (
    <div
      className="hamburger-overlay"
      style={{ background: 'rgba(5,8,16,0.92)' }}
      onClick={e => { if (e.target === e.currentTarget) startClose() }}
    >
      {/* Panel */}
      <div
        className="hamburger-panel"
        style={{
          background:    colours.panelBgSolid,
          borderBottom:  `1px solid ${colours.borderHairline}`,
          paddingTop:    'env(safe-area-inset-top, 0px)',
          paddingBottom: '20px',
          transform:     closing ? 'translateY(-100%)' : 'translateY(0)',
          transition:    closing
            ? 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)'
            : 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Close row */}
        <div style={{
          display:        'flex',
          justifyContent: 'flex-end',
          padding:        '8px 8px 0',
        }}>
          <button
            onClick={startClose}
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
              <button
                key={tabId}
                onClick={() => selectTab(tabId)}
                style={{
                  display:     'block',
                  width:       '100%',
                  textAlign:   'left' as const,
                  padding:     '14px 24px',
                  background:  'transparent',
                  border:      'none',
                  cursor:      'pointer',
                  fontFamily:  fonts.sans,
                  fontSize:    '22px',
                  fontWeight:  isActive ? fontWeight.medium : fontWeight.regular,
                  color:       isActive ? colours.teal : colours.textPrimary,
                  letterSpacing: '-0.02em',
                  opacity:     closing ? 0 : 1,
                  transition:  closing
                    ? 'opacity 120ms ease'
                    : `opacity 0.25s ease ${80 + idx * 40}ms, filter 0.25s ease ${80 + idx * 40}ms, transform 0.25s ease ${80 + idx * 40}ms`,
                  filter:      closing ? 'none' : 'blur(0)',
                  transform:   closing ? 'none' : 'translateY(0)',
                  // Initial animation handled by CSS keyframe via inline style trick
                  animation:   closing
                    ? 'none'
                    : `navItemIn 0.25s ease ${80 + idx * 40}ms both`,
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div style={{
          margin:     '8px 24px',
          borderTop:  `0.5px solid ${colours.borderHairline}`,
        }} />

        {/* Settings row */}
        <button
          onClick={() => { onSettings(); startClose() }}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '12px',
            width:       '100%',
            padding:     '14px 24px',
            background:  'transparent',
            border:      'none',
            cursor:      'pointer',
            animation:   closing ? 'none' : `navItemIn 0.25s ease ${80 + MOBILE_NAV.length * 40 + 40}ms both`,
            opacity:     closing ? 0 : 1,
            transition:  closing ? 'opacity 120ms ease' : 'none',
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
