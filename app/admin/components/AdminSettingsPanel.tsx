'use client'

/**
 * app/admin/components/AdminSettingsPanel.tsx
 *
 * Placeholder settings panel for admin.
 * Will house platform configuration (tax year, default plans, etc.) in a future phase.
 */

import { useColours } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius }  from '@/styles/tokens'
import { spacing } from '@/styles/tokens/spacing'

export default function AdminSettingsPanel() {
  const colours = useColours()

  return (
    <div style={{ padding: spacing.panel.padding }}>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontFamily: fonts.sans,
          fontSize:   '24px',
          fontWeight: fontWeight.medium,
          color:      colours.textPrimary,
          margin:     0,
          marginBottom: '4px',
        }}>
          Settings
        </h1>
        <p style={{
          fontSize: fontSize.sm,
          color:    colours.textMuted,
          margin:   0,
        }}>
          Platform configuration
        </p>
      </div>

      <div style={{
        background:    colours.panelBgSolid,
        border:        `1px solid ${colours.borderHairline}`,
        borderRadius:  radius.lg,
        padding:       '40px 20px',
        textAlign:     'center' as const,
      }}>
        <div style={{
          fontSize: fontSize.base,
          color:    colours.textMuted,
        }}>
          Platform settings will appear here in a future update.
        </div>
      </div>
    </div>
  )
}
