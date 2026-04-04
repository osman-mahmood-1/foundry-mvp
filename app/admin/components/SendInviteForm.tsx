'use client'

/**
 * app/admin/components/SendInviteForm.tsx
 *
 * Form to generate and dispatch an invite token.
 * All sizing, colour, and typography from design tokens.
 * Role <select> shares controlStyle with email <input> — same control type.
 * spacing.form.controlHeight is the single source for the 38px control height.
 */

import { useState }            from 'react'
import { useRouter }           from 'next/navigation'
import { createInviteToken }   from '@/app/invite/actions'
import type { InviteRole }     from '@/types'
import { useColours }          from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, spacing, space }      from '@/styles/tokens'
import { transition }                  from '@/styles/tokens/motion'

export default function SendInviteForm() {
  const colours = useColours()
  const router  = useRouter()

  const [email,      setEmail]      = useState('')
  const [role,       setRole]       = useState<InviteRole>('accountant')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setSubmitting(true)

    const result = await createInviteToken(email.trim(), role)

    if (result.success) {
      setSuccessMsg(`Invite sent to ${email.trim()}.`)
      setEmail('')
      setRole('accountant')
      router.refresh()
    } else {
      setError(result.error ?? 'Something went wrong.')
    }

    setSubmitting(false)
  }

  // Shared style for all text controls — input and select are the same control type
  const controlStyle: React.CSSProperties = {
    width:        '100%',
    height:       spacing.form.controlHeight,
    background:   colours.inputBg,
    border:       `1px solid ${colours.inputBorder}`,
    borderRadius: radius.md,
    padding:      `0 ${space[3]}`,
    fontSize:     fontSize.base,
    color:        colours.textPrimary,
    fontFamily:   fonts.sans,
    outline:      'none',
    boxSizing:    'border-box' as const,
    transition:   transition.snap,
  }

  const labelStyle: React.CSSProperties = {
    display:       'block',
    fontSize:      fontSize.xs,
    color:         colours.textMuted,
    fontFamily:    fonts.mono,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    marginBottom:  space[1],
  }

  const isDisabled = submitting || !email.trim()

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display:      'flex',
        gap:          space[3],
        alignItems:   'flex-end',
        flexWrap:     'wrap' as const,
        padding:      spacing.panel.paddingTight,
        borderBottom: `1px solid ${colours.borderHairline}`,
      }}
    >
      {/* Email */}
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          style={controlStyle}
          disabled={submitting}
        />
      </div>

      {/* Role — same controlStyle as email, cursor differs */}
      <div style={{ flex: '0 0 180px' }}>
        <label style={labelStyle}>Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as InviteRole)}
          disabled={submitting}
          style={{ ...controlStyle, cursor: 'pointer' }}
        >
          <option value="accountant">Accountant</option>
          <option value="platform_editor">Platform Editor</option>
        </select>
      </div>

      {/* Submit */}
      <div style={{ flex: '0 0 auto' }}>
        <button
          type="submit"
          disabled={isDisabled}
          style={{
            height:       spacing.form.controlHeight,
            padding:      `0 ${space[4]}`,
            background:   isDisabled ? colours.borderHairline : colours.cta,
            color:        isDisabled ? colours.textMuted : colours.ctaText,
            border:       'none',
            borderRadius: radius.md,
            fontSize:     fontSize.base,
            fontWeight:   fontWeight.medium,
            fontFamily:   fonts.sans,
            cursor:       isDisabled ? 'not-allowed' : 'pointer',
            transition:   transition.snap,
            whiteSpace:   'nowrap' as const,
          }}
        >
          {submitting ? 'Sending…' : 'Send invite'}
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div style={{
          flex:         '1 1 100%',
          fontSize:     fontSize.sm,
          color:        colours.danger,
          fontFamily:   fonts.sans,
          padding:      `${space[2]} ${space[3]}`,
          background:   colours.dangerLight,
          borderRadius: radius.md,
        }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{
          flex:         '1 1 100%',
          fontSize:     fontSize.sm,
          color:        colours.allowable,
          fontFamily:   fonts.sans,
          padding:      `${space[2]} ${space[3]}`,
          background:   colours.allowableLight,
          borderRadius: radius.md,
        }}>
          {successMsg}
        </div>
      )}
    </form>
  )
}
