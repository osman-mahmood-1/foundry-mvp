'use client'

/**
 * app/portal/components/mobile/MobileIntelligenceStrip.tsx
 *
 * Ambient AI strip shown below the header on the home screen.
 * Online: teal strip with ✦ icon + up-to-2-line message, expandable.
 * Offline: amber strip with offline notice.
 * Tapping navigates to the relevant tab.
 */

import { useState, useEffect } from 'react'
import { useColours }           from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }               from '@/styles/tokens'

interface Props {
  message?:   string
  onNavigate: (tab: string) => void
}

const DEFAULT_MESSAGE =
  'James is reviewing your return — 2 expenses still need categorising before he can finalise it.'

export default function MobileIntelligenceStrip({ message, onNavigate }: Props) {
  const colours   = useColours()
  const [isOnline, setIsOnline] = useState(true)
  const [expanded, setExpanded] = useState(false)

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

  const text = message ?? DEFAULT_MESSAGE

  if (!isOnline) {
    return (
      <div style={{
        margin:       '8px 16px 0',
        padding:      '10px 14px',
        background:   colours.warningLight,
        border:       `1px solid ${colours.warningDark}30`,
        borderRadius: radius.md,
      }}>
        <p style={{
          fontFamily: fonts.sans,
          fontSize:   '13px',
          color:      colours.warning,
          margin:     0,
          lineHeight: 1.5,
        }}>
          You&apos;re offline — any entries you add will sync automatically when you reconnect.
        </p>
      </div>
    )
  }

  const lines = text.split(' ')
  // Rough 2-line threshold: ~80 chars
  const needsExpand = text.length > 80
  const preview     = needsExpand && !expanded
    ? text.slice(0, 80).trimEnd() + '…'
    : text

  return (
    <div
      onClick={() => onNavigate('intelligence')}
      style={{
        margin:       '8px 16px 0',
        padding:      '10px 14px',
        background:   colours.tealLight,
        border:       `1px solid ${colours.teal}1f`,
        borderRadius: radius.md,
        cursor:       'pointer',
        display:      'flex',
        gap:          '10px',
        alignItems:   'flex-start',
      }}
    >
      <span style={{ fontSize: '14px', color: colours.teal, flexShrink: 0, lineHeight: 1.6 }}>✦</span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: fonts.sans,
          fontSize:   '13px',
          color:      colours.textPrimary,
          margin:     0,
          lineHeight: 1.6,
        }}>
          {preview}
          {needsExpand && !expanded && (
            <button
              onClick={e => { e.stopPropagation(); setExpanded(true) }}
              style={{
                background:  'transparent',
                border:      'none',
                color:       colours.teal,
                fontSize:    '13px',
                fontFamily:  fonts.sans,
                fontWeight:  fontWeight.medium,
                cursor:      'pointer',
                padding:     '0 0 0 4px',
              }}
            >
              Show more →
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
