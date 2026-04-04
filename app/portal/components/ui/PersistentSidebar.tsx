'use client'

/**
 * app/portal/components/ui/PersistentSidebar.tsx
 *
 * Permanent master-detail right-hand column.
 * Always 340px wide — no open/close toggle. The sidebar is a persistent
 * part of the grid: aligned to the list via the parent's alignItems: stretch.
 *
 * State machine:
 *   children === null  →  FoundryIntelligencePanel (default resident)
 *   children !== null  →  form/detail content (cross-dissolves in at 0.2s)
 *
 * The inner content area is overflow-y: auto so it scrolls independently
 * while remaining sticky within the flex row.
 */

import { useId }           from 'react'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { spacing }         from '@/styles/tokens/spacing'
import { radius }          from '@/styles/tokens'
import { glass }           from '@/styles/tokens/effects'
import FoundryIntelligencePanel from './FoundryIntelligencePanel'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IntelligenceContext {
  tab:      string
  taxYear:  string
  clientId: string
}

interface Props {
  /** Displayed in the header when showing form content. */
  title:     string
  /** Optional sub-label beneath the title in form mode. */
  subtitle?: string
  /**
   * Form / detail content.
   * Pass null to fall back to FoundryIntelligencePanel.
   */
  children:  React.ReactNode | null
  /** Context forwarded to the intelligence panel. */
  intelligenceContext: IntelligenceContext
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PersistentSidebar({
  title,
  subtitle,
  children,
  intelligenceContext,
}: Props) {
  const colours = useColours()
  const mode    = useThemeMode()

  const showIntelligence = children === null
  // Key drives the 0.2s fadeIn keyframe on content switch
  const contentKey = showIntelligence ? 'intelligence' : 'form'

  return (
    <div style={{
      ...glass.card(mode),
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
      overflow:      'hidden',
    }}>

      {/* ── Header — matches list panel header baseline exactly ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        `${spacing.panel.paddingTight} ${spacing.panel.padding}`,
        borderBottom:   `1px solid ${colours.borderHairline}`,
        flexShrink:     0,
        minHeight:      0,
      }}>
        <div>
          <div style={{
            fontSize:      showIntelligence ? fontSize.label : fontSize.base,
            fontWeight:    showIntelligence ? fontWeight.medium : fontWeight.medium,
            color:         showIntelligence ? colours.textMuted : colours.textPrimary,
            fontFamily:    fonts.sans,
            letterSpacing: showIntelligence ? '0.08em' : undefined,
            textTransform: showIntelligence ? 'uppercase' as const : undefined,
          }}>
            {showIntelligence ? 'Foundry Intelligence' : title}
          </div>
          {!showIntelligence && subtitle && (
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

        {/* Mode indicator */}
        <div style={{
          width:          '6px',
          height:         '6px',
          borderRadius:   '50%',
          background:     showIntelligence ? colours.accent : colours.income,
          flexShrink:     0,
          opacity:        0.7,
        }} />
      </div>

      {/* ── Content — keyed so React remounts on mode switch, triggering fadeIn ── */}
      <div
        key={contentKey}
        style={{
          flex:      1,
          overflowY: 'auto' as const,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {showIntelligence ? (
          <FoundryIntelligencePanel {...intelligenceContext} />
        ) : (
          <div style={{ padding: spacing.panel.padding }}>
            {children}
          </div>
        )}
      </div>

    </div>
  )
}
