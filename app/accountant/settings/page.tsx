'use client'

/**
 * app/accountant/settings/page.tsx
 *
 * Accountant portal settings — theme switcher.
 */

import { useState } from 'react'
import { useColours } from '@/styles/ThemeContext'
import { useThemePreference } from '@/app/portal/components/PortalThemeProvider'
import type { ThemeMode } from '@/app/portal/components/PortalThemeProvider'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius }  from '@/styles/tokens'
import { spacing } from '@/styles/tokens/spacing'

function ThemePill({ label, icon, active, onClick }: {
  label: string; icon: string; active: boolean; onClick: () => void
}) {
  const colours = useColours()
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        padding:    '10px 18px',
        borderRadius: radius.lg,
        border:     active ? `1.5px solid ${colours.accent}` : `1px solid ${colours.borderMedium}`,
        background: active ? colours.accentLight : hovered ? colours.hoverBg : 'transparent',
        color:      active ? colours.accent : colours.textSecondary,
        fontSize:   fontSize.base,
        fontWeight: active ? fontWeight.medium : fontWeight.regular,
        fontFamily: fonts.sans,
        cursor:     'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </button>
  )
}

export default function AccountantSettingsPage() {
  const colours           = useColours()
  const { mode, setMode } = useThemePreference()

  const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light',  label: 'Light',  icon: '☀' },
    { mode: 'dark',   label: 'Dark',   icon: '◑' },
    { mode: 'system', label: 'System', icon: '⊙' },
  ]

  return (
    <div style={{ padding: spacing.panel.padding }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily:   fonts.sans,
          fontSize:     '24px',
          fontWeight:   fontWeight.medium,
          color:        colours.textPrimary,
          margin:       0,
          marginBottom: '4px',
        }}>
          Settings
        </h1>
        <p style={{ fontSize: fontSize.sm, color: colours.textMuted, margin: 0 }}>
          Accountant portal preferences
        </p>
      </div>

      <div style={{
        background:   colours.panelBgSolid,
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.lg,
        padding:      spacing.panel.padding,
      }}>
        <div style={{
          fontSize:      fontSize.label,
          color:         colours.textMuted,
          textTransform: 'uppercase' as const,
          letterSpacing: letterSpacing.wide,
          fontFamily:    fonts.mono,
          marginBottom:  '16px',
        }}>
          Appearance
        </div>
        <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '16px', fontFamily: fonts.sans }}>
          Choose how the accountant portal looks on this device.
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
          {THEME_OPTIONS.map(opt => (
            <ThemePill
              key={opt.mode}
              label={opt.label}
              icon={opt.icon}
              active={mode === opt.mode}
              onClick={() => setMode(opt.mode)}
            />
          ))}
        </div>
      </div>

    </div>
  )
}
