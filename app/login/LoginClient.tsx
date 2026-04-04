'use client'

/**
 * app/login/LoginClient.tsx
 *
 * Sign-in screen for Tax Foundry.
 *
 * Theme:
 *   Desktop (>768px) → light mode: glass card centred on warm white pageBg.
 *   Mobile  (≤768px) → dark mode:  full-bleed layout, no card container,
 *                                   content fills the whole screen edge to edge.
 *
 *   LoginThemeWrapper detects viewport width via useEffect + resize listener.
 *   It also locks document.body.style.background to the correct pageBg token
 *   so that browser chrome and overscroll areas match — no stray white flash.
 *   Cleaned up on unmount.
 *
 * Orb:
 *   BouncingOrb — requestAnimationFrame physics loop. Position/velocity in refs
 *   to avoid stale closures. Direction randomised on mount. Bounces off all four
 *   viewport edges. aria-hidden (decorative only).
 *
 * Typography hierarchy — exactly matches the portal:
 *   Wordmark:  fontSize.lg   / fontWeight.medium   / fonts.sans  (= portal topbar brand)
 *   Sub-label: fontSize.label / letterSpacing.label / uppercase   (= sidebar group labels)
 *   Heading:   fontSize['4xl'] / fontWeight.semibold / letterSpacing.tight2
 *   Body:      fontSize.base / lineHeight.body / colours.textSecondary
 *   Footer:    fontSize.xs   / fonts.mono  / colours.textMuted
 *
 * Zero hardcoded colours, sizes, or fonts anywhere in this file.
 */

import { useState, useEffect, useRef } from 'react'
import { useSearchParams }              from 'next/navigation'
import PortalThemeProvider              from '@/app/portal/components/PortalThemeProvider'
import { useColours, useThemeMode }     from '@/styles/ThemeContext'
import { glass, orbs, shadows }         from '@/styles/tokens/effects'
import { dark as darkColours, light as lightColours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing, lineHeight } from '@/styles/tokens/typography'
import { radius, space, spacing }       from '@/styles/tokens'
import { transition }                   from '@/styles/tokens/motion'
import { createClient }                 from '@/lib/supabase'
import { APP_ERRORS }                   from '@/lib/errors'
import type { AppError }                from '@/lib/errors'

// ─── Constants ────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768
const ORB_SIZE          = 900   // px — matches portal ambient orb scale
const ORB_SPEED         = 0.4   // px per frame — gentle drift

// ─── Bouncing orb ─────────────────────────────────────────────────────────────

function BouncingOrb({
  opacity,
  size,
  background,
  filter,
}: {
  opacity:    number
  size:       number
  background: string
  filter:     string
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const velRef        = useRef({ vx: ORB_SPEED, vy: ORB_SPEED * 0.7 })
  const posRef        = useRef({ x: 0, y: 0 })
  const frameRef      = useRef<number>(0)

  useEffect(() => {
    const startX = Math.random() * Math.max(0, window.innerWidth  - size)
    const startY = Math.random() * Math.max(0, window.innerHeight - size)
    const angle  = Math.random() * Math.PI * 2
    posRef.current = { x: startX, y: startY }
    velRef.current = {
      vx: Math.cos(angle) * ORB_SPEED,
      vy: Math.sin(angle) * ORB_SPEED,
    }
    setPos({ x: startX, y: startY })

    function tick() {
      const vp = { w: window.innerWidth, h: window.innerHeight }
      let { x, y }   = posRef.current
      let { vx, vy } = velRef.current

      x += vx
      y += vy

      if (x + size > vp.w) { x = vp.w - size; vx = -Math.abs(vx) }
      if (x < 0)           { x = 0;            vx =  Math.abs(vx) }
      if (y + size > vp.h) { y = vp.h - size;  vy = -Math.abs(vy) }
      if (y < 0)           { y = 0;             vy =  Math.abs(vy) }

      posRef.current = { x, y }
      velRef.current = { vx, vy }
      setPos({ x, y })
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  return (
    <div
      aria-hidden
      style={{
        position:     'absolute',
        left:         pos.x,
        top:          pos.y,
        width:        size,
        height:       size,
        borderRadius: '50%',
        background,
        filter,
        opacity,
        pointerEvents: 'none',
        zIndex:        0,
        willChange:   'left, top',
      }}
    />
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ error }: { error: AppError }) {
  const colours             = useColours()
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(error.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background:     colours.warningLight,
      border:         `1px solid ${colours.warning}33`,
      borderLeft:     `3px solid ${colours.warning}99`,
      borderRadius:   radius.md,
      padding:        `${space[2]} ${space[3]}`,
      marginBottom:   space[4],
      display:        'flex',
      alignItems:     'flex-start',
      gap:            space[3],
      justifyContent: 'space-between',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily:   fonts.sans,
          fontSize:     fontSize.base,
          fontWeight:   fontWeight.medium,
          color:        colours.warning,
          marginBottom: space[1],
        }}>
          {error.title}
        </div>
        <div style={{
          fontFamily: fonts.sans,
          fontSize:   fontSize.sm,
          color:      colours.textSecondary,
          lineHeight: lineHeight.body,
        }}>
          {error.message}
          {error.action && (
            <span style={{ color: colours.textMuted }}> {error.action}</span>
          )}
        </div>
      </div>
      <button
        onClick={copyCode}
        style={{
          fontFamily:   fonts.mono,
          fontSize:     fontSize.xs,
          color:        copied ? colours.income : colours.warning,
          background:   'transparent',
          border:       `1px solid ${copied ? colours.income : colours.warning}44`,
          borderRadius: radius.sm,
          padding:      `${space[1]} ${space[2]}`,
          cursor:       'pointer',
          flexShrink:   0,
          whiteSpace:   'nowrap',
          alignSelf:    'flex-start',
          transition:   transition.snap,
        }}
      >
        {copied ? '✓ copied' : error.code}
      </button>
    </div>
  )
}

// ─── Wordmark ─────────────────────────────────────────────────────────────────
// Matches portal topbar brand name exactly: fontSize.lg, fontWeight.medium.
// Sub-label matches sidebar group label: fontSize.label, letterSpacing.label, uppercase.

function Wordmark({ spaceBelow }: { spaceBelow?: string }) {
  const colours = useColours()
  return (
    <div style={{ marginBottom: spaceBelow ?? space[6] }}>
      <div style={{
        fontFamily:   fonts.sans,
        fontSize:     fontSize.lg,
        fontWeight:   fontWeight.medium,
        color:        colours.textPrimary,
        lineHeight:   1.2,
        marginBottom: space[1],
      }}>
        Tax Foundry
      </div>
      <div style={{
        fontFamily:    fonts.sans,
        fontSize:      fontSize.label,
        fontWeight:    fontWeight.regular,
        color:         colours.textMuted,
        letterSpacing: letterSpacing.label,
        textTransform: 'uppercase' as const,
      }}>
        Client Portal
      </div>
    </div>
  )
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function FormFields({
  email,
  setEmail,
  loading,
  onSubmit,
  authError,
}: {
  email:     string
  setEmail:  (v: string) => void
  loading:   boolean
  onSubmit:  () => void
  authError: AppError | null
}) {
  const colours    = useColours()
  const isDisabled = loading || !email.trim()

  return (
    <>
      {authError && <ErrorBanner error={authError} />}

      <label style={{
        display:       'block',
        fontFamily:    fonts.sans,
        fontSize:      fontSize.xs,
        fontWeight:    fontWeight.regular,
        color:         colours.textMuted,
        letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase' as const,
        marginBottom:  space[1],
      }}>
        Email address
      </label>

      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !isDisabled && onSubmit()}
        disabled={loading}
        style={{
          width:        '100%',
          height:       spacing.form.controlHeight,
          background:   colours.inputBg,
          border:       `1px solid ${colours.inputBorder}`,
          borderRadius: radius.md,
          padding:      `0 ${space[3]}`,
          fontSize:     fontSize.base,
          fontFamily:   fonts.sans,
          color:        colours.textPrimary,
          outline:      'none',
          boxSizing:    'border-box' as const,
          transition:   transition.snap,
          marginBottom: space[3],
        }}
      />

      <button
        onClick={onSubmit}
        disabled={isDisabled}
        style={{
          width:         '100%',
          height:        spacing.form.controlHeight,
          background:    isDisabled ? colours.borderHairline : colours.cta,
          color:         isDisabled ? colours.textMuted : colours.ctaText,
          border:        'none',
          borderRadius:  radius.md,
          fontSize:      fontSize.base,
          fontFamily:    fonts.sans,
          fontWeight:    fontWeight.semibold,
          letterSpacing: letterSpacing.tight2,
          cursor:        isDisabled ? 'not-allowed' : 'pointer',
          transition:    transition.snap,
        }}
      >
        {loading ? 'Sending…' : 'Send sign-in link →'}
      </button>

      <p style={{
        fontFamily:   fonts.mono,
        fontSize:     fontSize.xs,
        color:        colours.textMuted,
        textAlign:    'center',
        marginTop:    space[4],
        marginBottom: 0,
        lineHeight:   lineHeight.body,
      }}>
        Sign-in links expire after 10 minutes and are single use.
      </p>
    </>
  )
}

// ─── Desktop layout — glass card centred on pageBg ────────────────────────────

function DesktopLayout({
  authError,
  email,
  setEmail,
  loading,
  submitted,
  onSubmit,
}: {
  authError: AppError | null
  email:     string
  setEmail:  (v: string) => void
  loading:   boolean
  submitted: boolean
  onSubmit:  () => void
}) {
  const colours    = useColours()
  const orbOpacity = orbs.ambientOpacityDesktopLight

  const cardStyle: React.CSSProperties = {
    ...glass.panel('light'),
    padding:   `${space[8]} ${space[6]}`,
    boxShadow: shadows.xl,
    width:     '100%',
  }

  return (
    <div style={{
      position:       'relative',
      minHeight:      '100dvh',
      background:     colours.pageBg,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        space[4],
      boxSizing:      'border-box',
      overflow:       'hidden',
    }}>
      <BouncingOrb
        opacity={orbOpacity}
        size={parseInt(orbs.ambientDesktop.width)}
        background={orbs.ambientDesktop.background}
        filter={orbs.ambientDesktop.filter}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
        {submitted ? (
          <div style={cardStyle}>
            <Wordmark />
            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      fontSize['4xl'],
              fontWeight:    fontWeight.semibold,
              color:         colours.textPrimary,
              letterSpacing: letterSpacing.tight2,
              marginBottom:  space[3],
              lineHeight:    lineHeight.tight,
            }}>
              Check your email
            </div>
            <p style={{
              fontFamily:   fonts.sans,
              fontSize:     fontSize.base,
              color:        colours.textSecondary,
              lineHeight:   lineHeight.body,
              margin:       0,
              marginBottom: space[2],
            }}>
              We sent a sign-in link to{' '}
              <strong style={{ color: colours.textPrimary, fontWeight: fontWeight.medium }}>
                {email}
              </strong>.
              Click the link in your email to continue.
            </p>
            <p style={{
              fontFamily: fonts.mono,
              fontSize:   fontSize.xs,
              color:      colours.textMuted,
              lineHeight: lineHeight.body,
              margin:     0,
            }}>
              Link expires in 10 minutes · Check spam if it doesn't arrive.
            </p>
          </div>
        ) : (
          <div style={cardStyle}>
            <Wordmark />
            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      fontSize['4xl'],
              fontWeight:    fontWeight.semibold,
              color:         colours.textPrimary,
              letterSpacing: letterSpacing.tight2,
              lineHeight:    lineHeight.tight,
              marginBottom:  space[2],
            }}>
              Sign in
            </div>
            <p style={{
              fontFamily:   fonts.sans,
              fontSize:     fontSize.base,
              color:        colours.textSecondary,
              lineHeight:   lineHeight.body,
              margin:       0,
              marginBottom: space[5],
            }}>
              Enter your email and we'll send you a secure sign-in link.
              No password needed.
            </p>
            <FormFields
              email={email}
              setEmail={setEmail}
              loading={loading}
              onSubmit={onSubmit}
              authError={authError}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Mobile layout — full bleed dark, no card container ───────────────────────

function MobileLayout({
  authError,
  email,
  setEmail,
  loading,
  submitted,
  onSubmit,
}: {
  authError: AppError | null
  email:     string
  setEmail:  (v: string) => void
  loading:   boolean
  submitted: boolean
  onSubmit:  () => void
}) {
  const colours    = useColours()
  const orbOpacity = orbs.ambientOpacityDark

  return (
    <div style={{
      position:    'relative',
      minHeight:   '100dvh',
      background:  colours.pageBg,
      display:     'flex',
      flexDirection: 'column',
      padding:     `${space[8]} ${space[5]}`,
      boxSizing:   'border-box',
      overflow:    'hidden',
    }}>
      <BouncingOrb
        opacity={orbOpacity}
        size={parseInt(orbs.ambient.width)}
        background={orbs.ambient.background}
        filter={orbs.ambient.filter}
      />

      {/* Content — sits above orb, fills the screen naturally */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Wordmark spaceBelow={space[10]} />

        {submitted ? (
          <>
            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      fontSize['4xl'],
              fontWeight:    fontWeight.semibold,
              color:         colours.textPrimary,
              letterSpacing: letterSpacing.tight2,
              marginBottom:  space[3],
              lineHeight:    lineHeight.tight,
            }}>
              Check your email
            </div>
            <p style={{
              fontFamily:   fonts.sans,
              fontSize:     fontSize.base,
              color:        colours.textSecondary,
              lineHeight:   lineHeight.body,
              margin:       0,
              marginBottom: space[2],
            }}>
              We sent a sign-in link to{' '}
              <strong style={{ color: colours.textPrimary, fontWeight: fontWeight.medium }}>
                {email}
              </strong>.
              Click the link in your email to continue.
            </p>
            <p style={{
              fontFamily: fonts.mono,
              fontSize:   fontSize.xs,
              color:      colours.textMuted,
              lineHeight: lineHeight.body,
              margin:     0,
            }}>
              Link expires in 10 minutes · Check spam if it doesn't arrive.
            </p>
          </>
        ) : (
          <>
            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      fontSize['4xl'],
              fontWeight:    fontWeight.semibold,
              color:         colours.textPrimary,
              letterSpacing: letterSpacing.tight2,
              lineHeight:    lineHeight.tight,
              marginBottom:  space[2],
            }}>
              Sign in
            </div>
            <p style={{
              fontFamily:   fonts.sans,
              fontSize:     fontSize.base,
              color:        colours.textSecondary,
              lineHeight:   lineHeight.body,
              margin:       0,
              marginBottom: space[5],
            }}>
              Enter your email and we'll send you a secure sign-in link.
              No password needed.
            </p>
            <FormFields
              email={email}
              setEmail={setEmail}
              loading={loading}
              onSubmit={onSubmit}
              authError={authError}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Root content — picks layout based on mode ────────────────────────────────

function LoginContent() {
  const mode       = useThemeMode()
  const searchParams = useSearchParams()

  const errorCode  = searchParams.get('error')
  const authError  = errorCode && errorCode in APP_ERRORS
    ? APP_ERRORS[errorCode as keyof typeof APP_ERRORS]
    : null

  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function handleLogin() {
    if (!email.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
    setSubmitted(true)
    setLoading(false)
  }

  const shared = { authError, email, setEmail, loading, submitted, onSubmit: handleLogin }

  return mode === 'dark'
    ? <MobileLayout {...shared} />
    : <DesktopLayout {...shared} />
}

// ─── Theme wrapper — sets mode by viewport, locks body background ─────────────

function LoginThemeWrapper({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    function update() {
      const next = window.innerWidth <= MOBILE_BREAKPOINT ? 'dark' : 'light'
      setMode(next)
      // Lock body background so overscroll areas and browser chrome match
      document.body.style.background = next === 'dark'
        ? darkColours.pageBg
        : lightColours.pageBg
    }

    update()
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      document.body.style.background = ''
    }
  }, [])

  return (
    <PortalThemeProvider forceMode={mode}>
      {children}
    </PortalThemeProvider>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────

export default function LoginClient() {
  return (
    <LoginThemeWrapper>
      <LoginContent />
    </LoginThemeWrapper>
  )
}
