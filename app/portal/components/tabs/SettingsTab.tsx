'use client'

/**
 * app/portal/components/tabs/SettingsTab.tsx
 *
 * Portal settings: theme mode switcher + account/tax details (read-only for now).
 */

import { useState } from 'react'
import type { Client } from '@/types'
import { useColours } from '@/styles/ThemeContext'
import { useThemePreference } from '../PortalThemeProvider'
import type { ThemeMode } from '../PortalThemeProvider'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, spacing } from '@/styles/tokens'
import { Panel, Label } from '../ui'

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colours = useColours()
  return (
    <Panel padding={spacing.panel.padding}>
      <div style={{
        fontSize:      fontSize.label,
        color:         colours.textMuted,
        textTransform: 'uppercase' as const,
        letterSpacing: letterSpacing.wide,
        fontFamily:    fonts.mono,
        marginBottom:  '16px',
      }}>
        {title}
      </div>
      {children}
    </Panel>
  )
}

// ─── Theme pill button ────────────────────────────────────────────────────────

function ThemePill({
  label,
  icon,
  active,
  onClick,
}: {
  label:   string
  icon:    string
  active:  boolean
  onClick: () => void
}) {
  const colours  = useColours()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '8px',
        padding:        '10px 18px',
        borderRadius:   radius.lg,
        border:         active
          ? `1.5px solid ${colours.accent}`
          : `1px solid ${colours.borderMedium}`,
        background:     active
          ? colours.accentLight
          : hovered ? colours.hoverBg : 'transparent',
        color:          active ? colours.accent : colours.textSecondary,
        fontSize:       fontSize.base,
        fontWeight:     active ? fontWeight.medium : fontWeight.regular,
        fontFamily:     fonts.sans,
        cursor:         'pointer',
        transition:     'all 0.15s ease',
        flexShrink:     0,
      }}
    >
      <span style={{ fontSize: '14px' }}>{icon}</span>
      {label}
    </button>
  )
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({ label, value }: { label: string; value: string }) {
  const colours = useColours()
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize:     fontSize.xs,
        color:        colours.textMuted,
        fontFamily:   fonts.sans,
        fontWeight:   fontWeight.medium,
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        height:       '40px',
        padding:      '0 12px',
        display:      'flex',
        alignItems:   'center',
        border:       `1px solid ${colours.borderLight}`,
        borderRadius: radius.md,
        background:   colours.inputBg,
        fontSize:     fontSize.base,
        color:        colours.textPrimary,
        fontFamily:   fonts.sans,
        opacity:      0.7,
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function SettingsTab({ client }: { client: Client }) {
  const colours             = useColours()
  const { mode, setMode }   = useThemePreference()

  const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light',  label: 'Light',  icon: '☀' },
    { mode: 'dark',   label: 'Dark',   icon: '◑' },
    { mode: 'system', label: 'System', icon: '⊙' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>

      {/* ── Appearance ── */}
      <Section title="Appearance">
        <div style={{
          fontSize:     fontSize.sm,
          color:        colours.textSecondary,
          marginBottom: '16px',
          fontFamily:   fonts.sans,
        }}>
          Choose how Foundry looks on this device.
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
      </Section>

      {/* ── Account ── */}
      <Section title="Account">
        <ReadField label="Full name"  value={client.full_name ?? ''} />
        <ReadField label="Email"      value={client.email ?? ''} />
      </Section>

      {/* ── Tax details ── */}
      <Section title="Tax details">
        <ReadField label="UTR number"  value={client.utr ?? ''} />
        <ReadField label="NI number"   value={client.ni_number ?? ''} />
        <ReadField label="Tax year"    value={client.tax_year ?? ''} />
      </Section>

      {/* ── Danger zone ── */}
      <Section title="Danger zone">
        <div style={{
          fontSize:     fontSize.sm,
          color:        colours.textMuted,
          marginBottom: '16px',
          fontFamily:   fonts.sans,
        }}>
          Deleting your account is permanent and cannot be undone.
        </div>
        <button
          style={{
            padding:      '9px 20px',
            borderRadius: radius.pill,
            border:       `1px solid ${colours.danger}`,
            background:   'transparent',
            color:        colours.danger,
            fontSize:     fontSize.sm,
            fontWeight:   fontWeight.medium,
            fontFamily:   fonts.sans,
            cursor:       'pointer',
          }}
          onClick={() => alert('Account deletion — coming soon. Contact support@taxfoundry.co.uk.')}
        >
          Delete account
        </button>
      </Section>

    </div>
  )
}
