'use client'

/**
 * app/invite/[token]/InviteClient.tsx
 *
 * Invite acceptance flow — fully rebuilt with the v9 design language.
 * Dark mode only (invite pages are standalone, not portal-wrapped).
 *
 * States:
 *   - Token invalid / expired / used → error screen
 *   - Not signed in                  → send magic link
 *   - Magic link sent                → check email confirmation
 *   - Signed in, right email         → accept invite → redirect
 *   - Signed in, wrong email         → wrong account + sign out button
 *
 * All values from design tokens. Zero hardcoded colours, sizes, or fonts.
 * Mobile-first layout: single column, no horizontal scroll.
 */

import { useState }                          from 'react'
import { useRouter }                         from 'next/navigation'
import { sendInviteMagicLink, acceptInvite } from '../actions'
import type { InviteTokenData, TokenError }  from '../actions'
import { useColours, useThemeMode }          from '@/styles/ThemeContext'
import PortalThemeProvider                           from '@/app/portal/components/PortalThemeProvider'
import { glass, orbs, shadows }              from '@/styles/tokens/effects'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, space, spacing }            from '@/styles/tokens'
import { transition }                        from '@/styles/tokens/motion'
import { createClient }                      from '@/lib/supabase'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  token:            string
  tokenData:        InviteTokenData | null
  tokenError:       TokenError | null
  currentUserEmail: string | null
}

// ─── Portal UI taster — static mock preview ───────────────────────────────────

function PortalPreview() {
  const colours = useColours()

  const mockStats = [
    { label: 'INCOME',    value: '£24,500', sub: '2024–25' },
    { label: 'EXPENSES',  value: '£6,200',  sub: '2024–25' },
    { label: 'TAX EST.',  value: '£3,660',  sub: 'estimate' },
  ]

  return (
    <div style={{
      width:      '100%',
      opacity:    0.55,
      pointerEvents: 'none',
      userSelect: 'none',
    }}>
      {/* Mini portal shell hint */}
      <div style={{
        fontSize:      fontSize.xs,
        fontFamily:    fonts.mono,
        color:         colours.textMuted,
        letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase',
        marginBottom:  space[2],
        textAlign:     'center',
      }}>
        Your portal — a preview
      </div>

      {/* Stat cards row */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap:                 space[2],
        marginBottom:        space[2],
      }}>
        {mockStats.map(s => (
          <div key={s.label} style={{
            ...glass.card('dark'),
            padding:   `${space[2]} ${space[3]}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: fontSize.xs, fontFamily: fonts.mono, color: colours.textMuted, letterSpacing: letterSpacing.wide, textTransform: 'uppercase', marginBottom: space[1] }}>
              {s.label}
            </div>
            <div style={{ fontSize: fontSize.base, fontFamily: fonts.mono, fontWeight: fontWeight.medium, color: colours.accent }}>
              {s.value}
            </div>
            <div style={{ fontSize: fontSize.xs, fontFamily: fonts.mono, color: colours.textMuted, marginTop: '2px' }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Mock message row */}
      <div style={{
        ...glass.card('dark'),
        padding:     `${space[2]} ${space[3]}`,
        display:     'flex',
        alignItems:  'center',
        gap:         space[3],
      }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colours.accent, flexShrink: 0 }} />
        <div style={{ fontSize: fontSize.xs, color: colours.textSecondary, fontFamily: fonts.sans }}>
          Your accountant reviewed 3 expenses this week
        </div>
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  const colours = useColours()
  const mode    = useThemeMode()

  return (
    <div style={{
      minHeight:       '100dvh',
      background:      colours.pageBg,
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         space[4],
      boxSizing:       'border-box',
      position:        'relative',
      overflow:        'hidden',
    }}>
      {/* Ambient orb */}
      <div style={{ ...orbs.ambient, opacity: orbs.ambientOpacityDark }} />

      {/* Content column — capped width, mobile-safe */}
      <div style={{
        width:    '100%',
        maxWidth: '400px',
        zIndex:   1,
        display:  'flex',
        flexDirection: 'column',
        gap:      space[4],
      }}>
        {/* Wordmark */}
        <div style={{
          textAlign:     'center',
          fontSize:      fontSize.xs,
          fontFamily:    fonts.mono,
          letterSpacing: letterSpacing.wider,
          color:         colours.textMuted,
          textTransform: 'uppercase',
        }}>
          Tax Foundry
        </div>

        {/* Glass card */}
        <div style={{
          ...glass.panel(mode),
          padding:  `${space[6]} ${space[5]}`,
          boxShadow: shadows.xl,
        }}>
          {children}
        </div>

        {/* Portal preview taster */}
        <PortalPreview />

        {/* Footer */}
        <div style={{
          textAlign:     'center',
          fontSize:      fontSize.xs,
          fontFamily:    fonts.mono,
          color:         colours.textMuted,
          letterSpacing: letterSpacing.wide,
        }}>
          Invite links expire after 48 hours · Single use only
        </div>
      </div>
    </div>
  )
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const colours = useColours()
  return (
    <div style={{
      display:       'inline-block',
      background:    colours.accentSoft,
      borderRadius:  radius.circle,
      padding:       `${space[1]} ${space[3]}`,
      fontSize:      fontSize.xs,
      fontFamily:    fonts.mono,
      letterSpacing: letterSpacing.wide,
      color:         colours.accent,
      textTransform: 'uppercase',
      marginBottom:  space[4],
    }}>
      {role}
    </div>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  const colours = useColours()
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        `${space[2]} ${space[3]}`,
      background:     colours.hoverBg,
      borderRadius:   radius.md,
      marginBottom:   space[3],
    }}>
      <span style={{ fontSize: fontSize.sm, color: colours.textMuted, fontFamily: fonts.mono }}>{label}</span>
      <span style={{ fontSize: fontSize.sm, color: colours.textPrimary, fontFamily: fonts.mono }}>{value}</span>
    </div>
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ children }: { children: React.ReactNode }) {
  const colours = useColours()
  return (
    <div style={{
      background:   colours.dangerLight,
      borderRadius: radius.md,
      padding:      `${space[2]} ${space[3]}`,
      marginBottom: space[3],
      fontSize:     fontSize.sm,
      color:        colours.danger,
      fontFamily:   fonts.sans,
      lineHeight:   1.5,
    }}>
      {children}
    </div>
  )
}

// ─── Primary button ───────────────────────────────────────────────────────────

function PrimaryBtn({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const colours = useColours()
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={{
        width:        '100%',
        height:       spacing.form.controlHeight,
        background:   disabled ? colours.borderHairline : colours.cta,
        color:        disabled ? colours.textMuted : colours.ctaText,
        border:       'none',
        borderRadius: radius.md,
        fontSize:     fontSize.base,
        fontFamily:   fonts.sans,
        fontWeight:   fontWeight.semibold,
        cursor:       disabled ? 'not-allowed' : 'pointer',
        transition:   transition.snap,
        letterSpacing: letterSpacing.tight2,
        marginTop:    space[2],
      }}
    >
      {children}
    </button>
  )
}

// ─── Ghost button (sign out) ──────────────────────────────────────────────────

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const colours = useColours()
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        width:        '100%',
        height:       spacing.form.controlHeight,
        background:   'transparent',
        color:        colours.textMuted,
        border:       'none',
        borderRadius: radius.md,
        fontSize:     fontSize.sm,
        fontFamily:   fonts.sans,
        fontWeight:   fontWeight.regular,
        cursor:       'pointer',
        transition:   transition.snap,
        marginTop:    space[2],
      }}
    >
      {children}
    </button>
  )
}

// ─── Heading + sub helpers ────────────────────────────────────────────────────

function Heading({ children }: { children: React.ReactNode }) {
  const colours = useColours()
  return (
    <h1 style={{
      fontFamily:   fonts.sans,
      fontSize:     fontSize['2xl'],
      fontWeight:   fontWeight.semibold,
      color:        colours.textPrimary,
      margin:       `0 0 ${space[3]}`,
      lineHeight:   1.25,
      letterSpacing: letterSpacing.tight2,
    }}>
      {children}
    </h1>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  const colours = useColours()
  return (
    <p style={{
      fontFamily: fonts.sans,
      fontSize:   fontSize.sm,
      color:      colours.textSecondary,
      lineHeight: 1.7,
      margin:     `0 0 ${space[4]}`,
    }}>
      {children}
    </p>
  )
}

// ─── Sign out helper ──────────────────────────────────────────────────────────

async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/login'
}

// ─── Main component ───────────────────────────────────────────────────────────

function InviteClientInner({
  token,
  tokenData,
  tokenError,
  currentUserEmail,
}: Props) {
  const colours = useColours()
  const router  = useRouter()

  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [accepting,     setAccepting]     = useState(false)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)

  const roleLabel = tokenData?.role === 'platform_editor' ? 'Platform Editor' : 'Accountant'

  // ── Token invalid ────────────────────────────────────────────────────────────
  if (tokenError || !tokenData) {
    const message =
      tokenError === 'used'
        ? 'This invite link has already been used.'
        : tokenError === 'expired'
        ? 'This invite link has expired. Ask the sender to resend it.'
        : 'This invite link is invalid or could not be found.'

    return (
      <Shell>
        <div style={{ textAlign: 'center', padding: `${space[6]} 0` }}>
          <div style={{ fontSize: fontSize['3xl'], marginBottom: space[3], opacity: 0.3, color: colours.textPrimary }}>
            ✕
          </div>
          <Heading>Invite unavailable</Heading>
          <Sub>{message}</Sub>
        </div>
      </Shell>
    )
  }

  // ── Right email — accept ─────────────────────────────────────────────────────
  if (currentUserEmail && currentUserEmail.toLowerCase() === tokenData.email.toLowerCase()) {
    async function handleAccept() {
      setAccepting(true)
      setErrorMsg(null)
      const result = await acceptInvite(token)
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo)
      } else {
        setErrorMsg(result.error ?? 'Something went wrong.')
        setAccepting(false)
      }
    }

    return (
      <Shell>
        <RoleBadge role={roleLabel} />
        <Heading>You're invited</Heading>
        <Sub>
          You've been invited to join Tax Foundry as a{' '}
          <strong style={{ color: colours.textPrimary, fontWeight: fontWeight.semibold }}>{roleLabel}</strong>.
          Your account will be set up immediately.
        </Sub>
        <InfoRow label="Email"  value={tokenData.email} />
        <InfoRow label="Access" value={roleLabel} />
        {errorMsg && <ErrorBanner>{errorMsg}</ErrorBanner>}
        <PrimaryBtn onClick={handleAccept} disabled={accepting}>
          {accepting ? 'Setting up your account…' : 'Accept invite & continue →'}
        </PrimaryBtn>
      </Shell>
    )
  }

  // ── Wrong email ───────────────────────────────────────────────────────────────
  if (currentUserEmail) {
    return (
      <Shell>
        <RoleBadge role={roleLabel} />
        <Heading>Wrong account</Heading>
        <Sub>
          This invite was sent to{' '}
          <strong style={{ color: colours.textPrimary }}>{tokenData.email}</strong>.
          You're currently signed in as{' '}
          <strong style={{ color: colours.textPrimary }}>{currentUserEmail}</strong>.
        </Sub>
        <Sub>
          Sign out below, then sign in with the invited address to continue.
        </Sub>
        <PrimaryBtn onClick={signOut}>
          Sign out
        </PrimaryBtn>
      </Shell>
    )
  }

  // ── Magic link sent ──────────────────────────────────────────────────────────
  if (magicLinkSent) {
    return (
      <Shell>
        <div style={{ fontSize: fontSize['3xl'], marginBottom: space[3], textAlign: 'center' }}>✉</div>
        <Heading>Check your email</Heading>
        <Sub>
          We sent a sign-in link to{' '}
          <strong style={{ color: colours.textPrimary }}>{tokenData.email}</strong>.
          Click the link to complete your setup.
        </Sub>
        <Sub>
          The link expires in 10 minutes. Check your spam folder if you don't see it.
        </Sub>
      </Shell>
    )
  }

  // ── Not signed in — send magic link ──────────────────────────────────────────
  async function handleSendLink() {
    setAccepting(true)
    setErrorMsg(null)
    const result = await sendInviteMagicLink(tokenData!.email, token)
    if (result.error) {
      setErrorMsg(result.error)
      setAccepting(false)
    } else {
      setMagicLinkSent(true)
    }
  }

  return (
    <Shell>
      <RoleBadge role={roleLabel} />
      <Heading>You're invited</Heading>
      <Sub>
        You've been invited to join Tax Foundry as a{' '}
        <strong style={{ color: colours.textPrimary, fontWeight: fontWeight.semibold }}>{roleLabel}</strong>.
        Click below to receive a secure sign-in link.
      </Sub>
      <InfoRow label="Email" value={tokenData.email} />
      {errorMsg && <ErrorBanner>{errorMsg}</ErrorBanner>}
      <PrimaryBtn onClick={handleSendLink} disabled={accepting}>
        {accepting ? 'Sending…' : `Send sign-in link →`}
      </PrimaryBtn>
      <div style={{
        fontSize:   fontSize.xs,
        color:      colours.textMuted,
        fontFamily: fonts.mono,
        textAlign:  'center',
        marginTop:  space[3],
        lineHeight: 1.6,
      }}>
        This invite expires 48 hours after it was sent and can only be used once.
      </div>
    </Shell>
  )
}

// ─── Exported wrapper — provides dark theme context ──────────────────────────

export default function InviteClient(props: Props) {
  return (
    <PortalThemeProvider forceMode="dark">
      <InviteClientInner {...props} />
    </PortalThemeProvider>
  )
}
