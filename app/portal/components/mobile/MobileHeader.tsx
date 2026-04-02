'use client'

/**
 * app/portal/components/mobile/MobileHeader.tsx
 *
 * Sticky topbar: wordmark left, Intelligence icon + hamburger right.
 * Height: 52px + safe-area-inset-top.
 * Online/offline: replaces Intelligence icon with amber dot when offline.
 */

import { useState, useEffect } from 'react'
import { useColours }           from '@/styles/ThemeContext'
import { fonts, fontWeight }    from '@/styles/tokens/typography'

interface Props {
  onIntelligence: () => void
  onHamburger:    () => void
}

export default function MobileHeader({ onIntelligence, onHamburger }: Props) {
  const colours = useColours()
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const up   = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online',  up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return (
    <div style={{
      position:       'sticky',
      top:            0,
      zIndex:         50,
      height:         `calc(52px + env(safe-area-inset-top, 0px))`,
      paddingTop:     'env(safe-area-inset-top, 0px)',
      paddingLeft:    '16px',
      paddingRight:   '16px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      background:     colours.panelBg,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:   `1px solid ${colours.borderHairline}`,
    }}>
      {/* Wordmark */}
      <span style={{
        fontFamily:    fonts.sans,
        fontWeight:    fontWeight.bold,
        fontSize:      '16px',
        color:         colours.textPrimary,
        letterSpacing: '-0.02em',
        userSelect:    'none',
      }}>
        Tax Foundry
      </span>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Intelligence / offline indicator */}
        <button
          onClick={onIntelligence}
          aria-label="Foundry Intelligence"
          style={{
            width:          '44px',
            height:         '44px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            background:     'transparent',
            border:         'none',
            cursor:         'pointer',
            borderRadius:   '50%',
            position:       'relative',
          }}
        >
          {isOnline ? (
            <span style={{ fontSize: '18px', color: colours.intelligence }}>✦</span>
          ) : (
            /* Offline: quiet amber dot only */
            <span style={{
              width:        '10px',
              height:       '10px',
              borderRadius: '50%',
              background:   colours.warning,
              display:      'block',
            }} />
          )}
        </button>

        {/* Hamburger */}
        <button
          onClick={onHamburger}
          aria-label="Menu"
          style={{
            width:          '44px',
            height:         '44px',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '5px',
            background:     'transparent',
            border:         'none',
            cursor:         'pointer',
            borderRadius:   '50%',
          }}
        >
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display:      'block',
              width:        '20px',
              height:       '1.5px',
              background:   colours.textPrimary,
              borderRadius: '2px',
            }} />
          ))}
        </button>
      </div>
    </div>
  )
}
