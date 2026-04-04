'use client'

/**
 * app/admin/components/SendInviteForm.tsx
 *
 * Form to generate and dispatch an invite token.
 * Calls createInviteToken server action — all token generation,
 * DB writes, and email dispatch happen server-side.
 *
 * On success: calls onSuccess() so the parent can refresh the invite list.
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

  const [email,       setEmail]       = useState('')
  const [role,        setRole]        = useState<InviteRole>('accountant')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)

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
      router.refresh() // re-fetches the invite list server-side
    } else {
      setError(result.error ?? 'Something went wrong.')
    }

    setSubmitting(false)
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    height:       '38px',
    background:   colours.inputBg,
    border:       `1px solid ${colours.inputBorder}`,
    borderRadius: radius.md,
    padding:      `0 ${space[3]}`,
    fontSize:     fontSize.base,
    color:        colours.textPrimary,
    fontFamily:   fonts.sans,
    outline:      'none',
    boxSizing:    'border-box',
    transition:   transition.snap,
  }

  const labelStyle: React.CSSProperties = {
    display:      'block',
    fontSize:     fontSize.xs,
    color:        colours.textMuted,
    fontFamily:   fonts.mono,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: space[1],
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display:       'flex',
        gap:           space[3],
        alignItems:    'flex-end',
        flexWrap:      'wrap' as const,
        padding:       spacing.panel.paddingTight,
        borderBottom:  `1px solid ${colours.borderHairline}`,
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
          style={inputStyle}
          disabled={submitting}
        />
      </div>

      {/* Role */}
      <div style={{ flex: '0 0 180px' }}>
        <label style={labelStyle}>Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as InviteRole)}
          disabled={submitting}
          style={{
            height:       '38px',
            width:        '100%',
            padding:      `0 ${space[3]}`,
            background:   colours.borderHairline,
            color:        colours.textPrimary,
            border:       'none',
            borderRadius: radius.md,
            fontSize:     fontSize.base,
            fontFamily:   fonts.sans,
            fontWeight:   fontWeight.regular,
            cursor:       'pointer',
            outline:      'none',
            transition:   transition.snap,
            boxSizing:    'border-box' as const,
            appearance:   'auto' as const,
          }}
        >
          <option value="accountant">Accountant</option>
          <option value="platform_editor">Platform Editor</option>
        </select>
      </div>

      {/* Submit */}
      <div style={{ flex: '0 0 auto', paddingBottom: '0' }}>
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          style={{
            height:       '38px',
            padding:      `0 ${space[4]}`,
            background:   submitting || !email.trim() ? colours.borderHairline : colours.cta,
            color:        submitting || !email.trim() ? colours.textMuted : colours.ctaText,
            border:       'none',
            borderRadius: radius.md,
            fontSize:     fontSize.base,
            fontWeight:   fontWeight.medium,
            fontFamily:   fonts.sans,
            cursor:       submitting || !email.trim() ? 'not-allowed' : 'pointer',
            transition:   transition.snap,
            whiteSpace:   'nowrap' as const,
          }}
        >
          {submitting ? 'Sending…' : 'Send invite'}
        </button>
      </div>

      {/* Feedback — spans full width */}
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
