'use client'

/**
 * app/portal/components/mobile/MobileProfileSheet.tsx
 *
 * Bottom sheet: avatar, name, email, plan badge, theme toggle, sign out.
 * Rendered via React Portal into document.body to avoid fixed-in-transform bug.
 * --radius-lg on top corners only.
 */

import { useState, useEffect }   from 'react'
import { createPortal }          from 'react-dom'
import type { Client }           from '@/types'
import { useColours }            from '@/styles/ThemeContext'
import { useThemePreference }    from '@/app/portal/components/PortalThemeProvider'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius }                from '@/styles/tokens'

interface Props {
  client:  Client
  onClose: () => void
}

type ThemeOption = 'light' | 'dark' | 'system'
const THEME_OPTIONS: { value: ThemeOption; label: string }[] = [
  { value: 'light',  label: 'Light' },
  { value: 'dark',   label: 'Dark'  },
  { value: 'system', label: 'System'},
]

export default function MobileProfileSheet({ client, onClose }: Props) {
  const colours          = useColours()
  const { mode, setMode} = useThemePreference()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const firstName = client.full_name?.split(' ')[0] ?? 'You'
  const initial   = (client.full_name ?? 'U').charAt(0).toUpperCase()
  const planLabel = (client.plan ?? 'foundation').charAt(0).toUpperCase() +
                    (client.plan ?? 'foundation').slice(1)

  async function handleSignOut() {
    const { createClient } = await import('@/lib/supabase')
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  if (!mounted) return null

  const sheet = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:   'fixed',
          inset:      0,
          background: 'rgba(0,0,0,0.50)',
          zIndex:     210,
        }}
      />

      {/* Sheet */}
      <div
        className="bottom-sheet-portal"
        style={{
          background:   colours.panelBgSolid,
          borderTop:    `1px solid ${colours.borderHairline}`,
          borderRadius: `${radius.lg} ${radius.lg} 0 0`,
          padding:      '20px 20px 32px',
          zIndex:       211,
        }}
      >
        {/* Drag handle */}
        <div style={{
          width:        '36px',
          height:       '4px',
          borderRadius: '2px',
          background:   colours.borderMedium,
          margin:       '0 auto 20px',
        }} />

        {/* Avatar + identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width:          '48px',
            height:         '48px',
            borderRadius:   radius.circle,
            background:     colours.accentSoft,
            border:         `1px solid ${colours.accentBorder}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       '20px',
            fontWeight:     fontWeight.semibold,
            color:          colours.accent,
            fontFamily:     fonts.sans,
            flexShrink:     0,
          }}>
            {initial}
          </div>
          <div>
            <div style={{ fontFamily: fonts.sans, fontSize: '16px', fontWeight: fontWeight.semibold, color: colours.textPrimary }}>
              {client.full_name ?? firstName}
            </div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colours.textMuted, marginTop: '2px' }}>
              {client.email}
            </div>
            <div style={{
              display:      'inline-block',
              marginTop:    '6px',
              padding:      '2px 8px',
              background:   colours.accentLight,
              borderRadius: radius.sm,
              fontSize:     '11px',
              fontWeight:   fontWeight.medium,
              color:        colours.accent,
              fontFamily:   fonts.sans,
              letterSpacing:'0.04em',
              textTransform:'uppercase' as const,
            }}>
              {planLabel}
            </div>
          </div>
        </div>

        {/* Theme toggle */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize:      '11px',
            fontWeight:    fontWeight.medium,
            color:         colours.textMuted,
            fontFamily:    fonts.sans,
            letterSpacing: '0.10em',
            textTransform: 'uppercase' as const,
            marginBottom:  '10px',
          }}>
            Appearance
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {THEME_OPTIONS.map(opt => {
              const isActive = mode === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  style={{
                    flex:         1,
                    height:       '40px',
                    borderRadius: radius.md,
                    border:       `1px solid ${isActive ? colours.accentBorder : colours.borderMedium}`,
                    background:   isActive ? colours.accentLight : colours.hoverBg,
                    color:        isActive ? colours.accent : colours.textSecondary,
                    fontFamily:   fonts.sans,
                    fontSize:     '13px',
                    fontWeight:   isActive ? fontWeight.medium : fontWeight.regular,
                    cursor:       'pointer',
                    transition:   'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${colours.borderHairline}`, marginBottom: '16px' }} />

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width:        '100%',
            height:       '48px',
            borderRadius: radius.md,
            border:       `1px solid ${colours.dangerLight}`,
            background:   colours.dangerLight,
            color:        colours.danger,
            fontFamily:   fonts.sans,
            fontSize:     '14px',
            fontWeight:   fontWeight.medium,
            cursor:       'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </>
  )

  return createPortal(sheet, document.body)
}
