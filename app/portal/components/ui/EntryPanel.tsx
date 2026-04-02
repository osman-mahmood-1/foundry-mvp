'use client'

/**
 * app/portal/components/ui/EntryPanel.tsx
 *
 * Right-column slide-in panel for data entry.
 *
 * Modelled on the AccountantShell's SplitPanel pattern — the main content
 * list stays fully visible on the left while this panel slides in from the
 * right for data entry. User can still see and reference earlier entries
 * while filling in the form.
 *
 * When `open` is false: the panel collapses and fades away entirely.
 * When `open` is true: panel animates in from the right, fixed 340px width.
 *
 * Dismiss: Escape key, close button, or parent setting open=false.
 */

import { useEffect, useRef } from 'react'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, transition } from '@/styles/tokens'
import { glass } from '@/styles/tokens/effects'
import { spacing } from '@/styles/tokens/spacing'

interface EntryPanelProps {
  open:     boolean
  title:    string
  onClose:  () => void
  children: React.ReactNode
  /** Optional subtitle shown below the title */
  subtitle?: string
}

export default function EntryPanel({
  open,
  title,
  onClose,
  children,
  subtitle,
}: EntryPanelProps) {
  const colours = useColours()
  const mode = useThemeMode()
  // Dismiss on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Auto-focus first input when panel opens
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea')
      first?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [open])

  return (
    <div
      ref={panelRef}
      style={{
        width:      open ? '340px' : '0',
        flexShrink: 0,
        overflow:   'hidden',
        opacity:    open ? 1 : 0,
        transition: `width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease`,
        // Don't render content height/space when closed
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Inner container — always 340px wide so content doesn't squish */}
      <div style={{
        width:         '340px',
        height:        '100%',
        display:       'flex',
        flexDirection: 'column',
        paddingLeft:   spacing.tab.gap,
      }}>
        <div style={{
          ...glass.card(mode),
          display:       'flex',
          flexDirection: 'column',
          height:        '100%',
          overflow:      'auto',
        }}>
          {/* Panel header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
            borderBottom:   `1px solid ${colours.borderHairline}`,
            flexShrink:     0,
          }}>
            <div>
              <div style={{
                fontSize:   fontSize.base,
                fontWeight: fontWeight.medium,
                color:      colours.textPrimary,
                fontFamily: fonts.sans,
              }}>
                {title}
              </div>
              {subtitle && (
                <div style={{
                  fontSize:   fontSize.xs,
                  color:      colours.textMuted,
                  marginTop:  '2px',
                  fontFamily: fonts.sans,
                }}>
                  {subtitle}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close panel"
              style={{
                width:          '28px',
                height:         '28px',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                background:     'transparent',
                border:         `1px solid ${colours.borderHairline}`,
                borderRadius:   radius.sm,
                color:          colours.textMuted,
                cursor:         'pointer',
                fontSize:       '12px',
                transition:     transition.snap,
                flexShrink:     0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = colours.hoverBg
                e.currentTarget.style.borderColor = colours.borderMedium
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'transparent'
                e.currentTarget.style.borderColor = colours.borderHairline
              }}
            >
              ✕
            </button>
          </div>

          {/* Panel body — the form content */}
          <div style={{ padding: spacing.panel.padding, flex: 1 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
