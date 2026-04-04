'use client'

/**
 * app/portal/components/ui/FoundryIntelligencePanel.tsx
 *
 * Default resident of the PersistentSidebar when no record is selected.
 * Shows a "Ready to Analyse" state wired to Supabase context.
 * No hardcoded intelligence — all copy is contextual scaffolding
 * for future prompt-based analysis.
 */

import { useState } from 'react'
import { useColours } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, spacing } from '@/styles/tokens'

// ─── Tab-specific prompt suggestions ─────────────────────────────────────────

const PROMPTS: Record<string, string[]> = {
  income: [
    'What is my largest income source this year?',
    'Compare this month to last month',
    'Break income down by category',
  ],
  expenses: [
    'Which expenses may be disallowable?',
    'What is my largest cost category?',
    'Flag any unusual transactions',
  ],
  invoices: [
    'What is my total outstanding balance?',
    'Which invoices are overdue?',
    'Summarise invoice status for this year',
  ],
  clients: [
    'Which client generates the most revenue?',
    'Are any clients overdue on payment?',
    'Show revenue by client',
  ],
  transactions: [
    'Are there any uncategorised transactions?',
    'What is the net position this month?',
    'Show income vs expense trend',
  ],
}

const DEFAULT_PROMPTS = [
  'Summarise activity for this period',
  'Flag anything that needs attention',
  'What do I need to action?',
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  tab:      string
  taxYear:  string
  clientId: string
}

export default function FoundryIntelligencePanel({ tab, taxYear }: Props) {
  const colours  = useColours()
  const prompts  = PROMPTS[tab] ?? DEFAULT_PROMPTS
  const [draft,  setDraft] = useState('')

  const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1)

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
      padding:       spacing.panel.padding,
      gap:           '24px',
    }}>

      {/* Ready state */}
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        textAlign:      'center',
        padding:        '28px 12px 20px',
        gap:            '10px',
      }}>
        {/* Icon */}
        <div style={{
          width:          '44px',
          height:         '44px',
          borderRadius:   radius.lg,
          background:     colours.accentLight,
          border:         `1px solid ${colours.accent}22`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '18px',
          color:          colours.accent,
          marginBottom:   '4px',
        }}>
          ✦
        </div>

        {/* Status */}
        <div style={{
          fontSize:      fontSize.label,
          fontWeight:    fontWeight.medium,
          color:         colours.accent,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          fontFamily:    fonts.sans,
        }}>
          Ready to analyse
        </div>

        {/* Context */}
        <div style={{
          fontSize:   fontSize.sm,
          fontWeight: fontWeight.medium,
          color:      colours.textPrimary,
          fontFamily: fonts.sans,
          lineHeight: 1.4,
        }}>
          {tabLabel} · {taxYear}
        </div>

        <div style={{
          fontSize:   fontSize.xs,
          color:      colours.textMuted,
          fontFamily: fonts.sans,
          lineHeight: 1.5,
          maxWidth:   '240px',
        }}>
          Select a record for a detailed breakdown, or ask a question below.
        </div>
      </div>

      {/* Thin divider */}
      <div style={{ height: '1px', background: colours.borderHairline, margin: '0 -4px' }} />

      {/* Suggested prompts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          fontSize:      fontSize.label,
          fontWeight:    fontWeight.medium,
          color:         colours.textMuted,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          fontFamily:    fonts.sans,
          marginBottom:  '2px',
        }}>
          Suggested
        </div>
        {prompts.map(prompt => (
          <button
            key={prompt}
            onClick={() => setDraft(prompt)}
            style={{
              display:       'block',
              width:         '100%',
              textAlign:     'left' as const,
              padding:       '9px 12px',
              background:    colours.hoverBg,
              border:        `1px solid ${colours.borderHairline}`,
              borderRadius:  radius.sm,
              cursor:        'pointer',
              fontFamily:    fonts.sans,
              fontSize:      fontSize.sm,
              color:         colours.textSecondary,
              lineHeight:    1.4,
              transition:    'border-color 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = colours.accent + '55'
              e.currentTarget.style.background  = colours.accentSoft ?? colours.hoverBg
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colours.borderHairline
              e.currentTarget.style.background  = colours.hoverBg
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Prompt input (scaffolding — not yet functional) */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
        paddingTop:    '4px',
        borderTop:     `1px solid ${colours.borderHairline}`,
        marginTop:     'auto',
      }}>
        <div style={{
          display:       'flex',
          gap:           '8px',
          alignItems:    'flex-end',
        }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Ask Foundry Intelligence…"
            rows={2}
            style={{
              flex:         1,
              padding:      '8px 10px',
              background:   colours.inputBg,
              border:       `1px solid ${colours.borderMedium}`,
              borderRadius: radius.sm,
              fontSize:     fontSize.sm,
              fontFamily:   fonts.sans,
              color:        colours.textPrimary,
              resize:       'none' as const,
              outline:      'none',
              lineHeight:   1.5,
            }}
          />
          <button
            disabled
            style={{
              height:         '36px',
              padding:        '0 14px',
              borderRadius:   radius.sm,
              background:     colours.accentLight,
              border:         `1px solid ${colours.accent}33`,
              color:          colours.accent,
              fontFamily:     fonts.sans,
              fontSize:       fontSize.sm,
              fontWeight:     fontWeight.medium,
              cursor:         'not-allowed',
              opacity:        0.5,
              flexShrink:     0,
            }}
          >
            Ask
          </button>
        </div>
        <div style={{
          fontSize:   fontSize.xs,
          color:      colours.textMuted,
          fontFamily: fonts.sans,
          textAlign:  'center' as const,
        }}>
          AI analysis · coming soon
        </div>
      </div>

    </div>
  )
}
