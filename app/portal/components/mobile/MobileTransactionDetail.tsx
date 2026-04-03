'use client'

/**
 * app/portal/components/mobile/MobileTransactionDetail.tsx
 *
 * Full-screen transaction detail sheet. Portalled to document.body so it
 * never affects the flex layout of MobilePortalShell. Sits below the sticky
 * header (top = header height) and slides up from the bottom.
 *
 * zIndex: 150 — above tab content (50), below hamburger (200).
 */

import { useState, useEffect }         from 'react'
import { createPortal }                from 'react-dom'
import { useColours }                  from '@/styles/ThemeContext'
import { useThemePreference }          from '../PortalThemeProvider'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }                      from '@/styles/tokens'
import { mobileMotion }                from '@/styles/tokens/mobile-physics'
import type { TxRowData }              from './MobileTransactionRow'

interface Props {
  tx:      TxRowData | null
  onClose: () => void
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function catLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function MobileTransactionDetail({ tx, onClose }: Props) {
  const colours               = useColours()
  const { mode }              = useThemePreference()
  const [mounted, setMounted] = useState(false)
  const [isDark,  setIsDark]  = useState(true)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const dark = mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
  }, [mode])

  if (!mounted) return null

  const isOpen   = tx !== null
  const isIncome = tx?.type === 'income'
  const amtColour = isIncome ? colours.income : colours.expense

  const HEADER_HEIGHT = 'calc(52px + env(safe-area-inset-top, 0px))'

  const sheet = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed',
          inset:      0,
          zIndex:     149,
          background: 'rgba(0,0,0,0.4)',
          opacity:    isOpen ? 1 : 0,
          transition: isOpen
            ? `opacity 0.3s ${mobileMotion.expand}`
            : `opacity 0.2s ${mobileMotion.collapse}`,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Detail panel */}
      <div
        style={{
          position:             'fixed',
          top:                   HEADER_HEIGHT,
          left:                  0,
          right:                 0,
          bottom:                0,
          zIndex:                150,
          display:              'flex',
          flexDirection:        'column',
          background:           isDark ? 'rgba(8,12,22,0.98)' : 'rgba(255,255,255,0.98)',
          backdropFilter:       'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop:            `1px solid ${colours.borderHairline}`,
          overflowY:            'auto',
          overscrollBehavior:   'contain' as React.CSSProperties['overscrollBehavior'],
          transform:            isOpen ? 'translateY(0)' : 'translateY(100%)',
          opacity:              isOpen ? 1 : 0,
          transition:           isOpen
            ? `transform ${mobileMotion.duration.entrance} ${mobileMotion.expand}, opacity 0.3s ease-out`
            : `transform ${mobileMotion.duration.exit} ${mobileMotion.collapse}, opacity 0.2s ease-in`,
          pointerEvents:        isOpen ? 'auto' : 'none',
          willChange:           'transform',
          paddingBottom:        'env(safe-area-inset-bottom, 24px)',
        }}
      >
        {tx && (
          <>
            {/* Header */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '20px 16px 16px',
              borderBottom:   `1px solid ${colours.borderHairline}`,
              flexShrink:     0,
            }}>
              <div>
                <div style={{
                  fontFamily:         fonts.sans,
                  fontSize:           '28px',
                  fontWeight:         fontWeight.semibold,
                  color:              amtColour,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight:         1.1,
                }}>
                  {isIncome ? '+' : '−'}{formatPence(tx.amount)}
                </div>
                <div style={{
                  fontFamily: fonts.sans,
                  fontSize:   '14px',
                  color:      colours.textSecondary,
                  marginTop:  '4px',
                }}>
                  {tx.description}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width:          '44px',
                  height:         '44px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  background:     'transparent',
                  border:         'none',
                  cursor:         'pointer',
                  fontSize:       '18px',
                  color:          colours.textMuted,
                  flexShrink:     0,
                }}
              >
                ✕
              </button>
            </div>

            {/* Detail rows */}
            <div style={{ flex: 1 }}>
              {[
                { label: 'CATEGORY', value: catLabel(tx.category) },
                { label: 'DATE',     value: formatDate(tx.date) },
                { label: 'SOURCE',   value: tx.source ? catLabel(tx.source) : 'Manual entry' },
                { label: 'STATUS',   value: tx.status ? catLabel(tx.status) : 'Confirmed' },
                { label: 'TYPE',     value: tx.type === 'income' ? 'Income' : 'Expense' },
              ].map(row => (
                <div key={row.label} style={{
                  display:      'flex',
                  alignItems:   'center',
                  padding:      '14px 16px',
                  borderBottom: `1px solid ${colours.borderHairline}`,
                }}>
                  <span style={{
                    fontFamily:    fonts.sans,
                    fontSize:      '11px',
                    fontWeight:    fontWeight.medium,
                    color:         colours.textMuted,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    width:         '96px',
                    flexShrink:    0,
                  }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontFamily: fonts.sans,
                    fontSize:   '14px',
                    color:      colours.textPrimary,
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons — anchored above safe area */}
            <div style={{
              display:      'flex',
              gap:          '8px',
              padding:      '16px',
              borderTop:    `1px solid ${colours.borderHairline}`,
              flexShrink:   0,
            }}>
              {[
                { icon: '📎', label: 'Attach' },
                { icon: '✏',  label: 'Note'   },
                { icon: '↕',  label: 'Split'  },
              ].map(action => (
                <button
                  key={action.label}
                  style={{
                    flex:         1,
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    gap:          '6px',
                    padding:      '12px',
                    background:   colours.hoverBg,
                    border:       `1px solid ${colours.borderMedium}`,
                    borderRadius: radius.md,
                    cursor:       'pointer',
                    fontFamily:   fonts.sans,
                    fontSize:     fontSize.sm,
                    color:        colours.textSecondary,
                    minHeight:    '44px',
                  }}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )

  return createPortal(sheet, document.body)
}
