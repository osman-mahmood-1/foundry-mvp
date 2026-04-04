'use client'

/**
 * app/login/LoginClient.tsx
 *
 * Sign-in screen for Tax Foundry.
 *
 * Theme:
 *   Desktop → light mode (warm white pageBg, glass.panel light)
 *   Mobile  → dark mode  (deep navy pageBg, glass.panel dark)
 *   Detected via useEffect on window.innerWidth + resize listener.
 *   Initial render defaults to light — no flash on desktop (primary surface).
 *
 * Orb:
 *   A single sapphire orb bounces diagonally around the viewport using a
 *   requestAnimationFrame physics loop. Position and velocity are React state.
 *   The orb is positioned absolutely (not fixed) within the outer container so
 *   it stays within the page bounds. This is a real simulation — not a CSS
 *   keyframe on a fixed path, which would repeat identically every cycle.
 *
 * Typography/colour rules:
 *   - All values from design token system — zero hardcoded colours, sizes, or fonts.
 *   - Wordmark: fonts.sans / fontSize.lg / fontWeight.medium — matches portal topbar brand name.
 *   - Sub-label: fontSize.label / letterSpacing.label / textTransform uppercase — matches
 *     sidebar group labels and admin topbar subtitle.
 *   - Body copy: fontSize.base / lineHeight.body / fonts.sans — matches portal primary UI text.
 *   - Headings: fontSize['4xl'] / fontWeight.semibold / letterSpacing.tight2 — matches inner
 *     page titles across client, accountant, and admin portals.
 *
 * All sub-components (Wordmark, Heading, Sub, ControlRow, PrimaryBtn, ErrorBanner)
 * are defined in this file. No shared portal primitives are imported — this page
 * deliberately has no dependency on portal-specific components to keep it deployable
 * independently and avoid circular imports.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams }                           from 'next/navigation'
import PortalThemeProvider                           from '@/app/portal/components/PortalThemeProvider'
import { useColours, useThemeMode }                  from '@/styles/ThemeContext'
import { glass, orbs, shadows }                      from '@/styles/tokens/effects'
import { fonts, fontSize, fontWeight, letterSpacing, lineHeight } from '@/styles/tokens/typography'
import { radius, space, spacing }                    from '@/styles/tokens'
import { transition }                                from '@/styles/tokens/motion'
import { createClient }                              from '@/lib/supabase'
import { APP_ERRORS }                               from '@/lib/errors'
import type { AppError }                             from '@/lib/errors'

// ─── Orb physics constants ────────────────────────────────────────────────────

const ORB_SIZE    = 900   // px — consistent with portal ambient orb scale
const SPEED       = 0.4   // px per frame — gentle drift, not a screensaver

// ─── Bouncing orb ─────────────────────────────────────────────────────────────

/**
 * BouncingOrb — a single sapphire radial-gradient orb that drifts diagonally
 * around the viewport and bounces off each edge. Uses requestAnimationFrame
 * for smooth 60fps movement. Velocity randomises direction on mount so each
 * page load feels different.
 */
function BouncingOrb({ opacity }: { opacity: number }) {
  const [pos, setPos]   = useState({ x: 0, y: 0 })
  const velRef          = useRef({ vx: SPEED, vy: SPEED * 0.7 })
  const frameRef        = useRef<number>(0)
  const posRef          = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Randomise starting position and direction
    const startX = Math.random() * (window.innerWidth  - ORB_SIZE)
    const startY = Math.random() * (window.innerHeight - ORB_SIZE)
    const angle  = Math.random() * Math.PI * 2
    posRef.current = { x: startX, y: startY }
    velRef.current = {
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
    }
    setPos({ x: startX, y: startY })

    function tick() {
      const vp = { w: window.innerWidth, h: window.innerHeight }
      let { x, y }    = posRef.current
      let { vx, vy }  = velRef.current

      x += vx
      y += vy

      // Bounce off right/left
      if (x + ORB_SIZE > vp.w) { x = vp.w - ORB_SIZE; vx = -Math.abs(vx) }
      if (x < 0)               { x = 0;                vx =  Math.abs(vx) }

      // Bounce off bottom/top
      if (y + ORB_SIZE > vp.h) { y = vp.h - ORB_SIZE; vy = -Math.abs(vy) }
      if (y < 0)               { y = 0;                vy =  Math.abs(vy) }

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
        width:        ORB_SIZE,
        height:       ORB_SIZE,
        borderRadius: '50%',
        background:   orbs.ambient.background,
        filter:       orbs.ambient.filter,
        opacity,
        pointerEvents: 'none',
        zIndex:        0,
        willChange:   'transform',
      }}
    />
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ error }: { error: AppError }) {
  const colours         = useColours()
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(error.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background:    colours.warningLight,
      border:        `1px solid ${colours.warning}33`,
      borderLeft:    `3px solid ${colours.warning}99`,
      borderRadius:  radius.md,
      padding:       `${space[2]} ${space[3]}`,
      marginBottom:  space[4],
      display:       'flex',
      alignItems:    'flex-start',
      gap:           space[3],
      justifyContent: 'space-between',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily:  fonts.sans,
          fontSize:    fontSize.base,
          fontWeight:  fontWeight.medium,
          color:       colours.warning,
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
        title="Copy reference code"
        style={{
          fontFamily:  fonts.mono,
          fontSize:    fontSize.xs,
          color:       copied ? colours.income : colours.warning,
          background:  'transparent',
          border:      `1px solid ${copied ? colours.income : colours.warning}44`,
          borderRadius: radius.sm,
          padding:     `${space[1]} ${space[2]}`,
          cursor:      'pointer',
          flexShrink:  0,
          whiteSpace:  'nowrap',
          alignSelf:   'flex-start',
          transition:  transition.snap,
        }}
      >
        {copied ? '✓ copied' : error.code}
      </button>
    </div>
  )
}

// ─── Inner page content ───────────────────────────────────────────────────────

function LoginContent() {
  const colours     = useColours()
  const mode        = useThemeMode()
  const searchParams = useSearchParams()

  const errorCode  = searchParams.get('error')
  const authError  = errorCode && errorCode in APP_ERRORS
    ? APP_ERRORS[errorCode as keyof typeof APP_ERRORS]
    : null

  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)

  const orbOpacity = mode === 'dark' ? orbs.ambientOpacityDark : orbs.ambientOpacityLight

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

  // ── Shared card layout ────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    ...glass.panel(mode),
    padding:   `${space[8]} ${space[6]}`,
    boxShadow: shadows.xl,
    width:     '100%',
  }

  // ── Wordmark — matches portal topbar brand name exactly ───────────────────────
  const Wordmark = () => (
    <div style={{ marginBottom: space[6] }}>
      <div style={{
        fontFamily:    fonts.sans,
        fontSize:      fontSize.lg,          // matches AdminTopBar brand name
        fontWeight:    fontWeight.medium,    // matches AdminTopBar brand name
        color:         colours.textPrimary,
        lineHeight:    1.2,
        marginBottom:  space[1],
      }}>
        Tax Foundry
      </div>
      <div style={{
        fontFamily:    fonts.sans,
        fontSize:      fontSize.label,       // matches sidebar group label
        fontWeight:    fontWeight.regular,
        color:         colours.textMuted,
        letterSpacing: letterSpacing.label,  // matches sidebar group label
        textTransform: 'uppercase' as const,
      }}>
        Client Portal
      </div>
    </div>
  )

  // ── Submitted state ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <PageShell orbOpacity={orbOpacity}>
        <div style={cardStyle}>
          <Wordmark />
          <div style={{
            fontFamily:  fonts.sans,
            fontSize:    fontSize['4xl'],
            fontWeight:  fontWeight.semibold,
            color:       colours.textPrimary,
            letterSpacing: letterSpacing.tight2,
            marginBottom: space[3],
            lineHeight:  lineHeight.tight,
          }}>
            Check your email
          </div>
          <p style={{
            fontFamily: fonts.sans,
            fontSize:   fontSize.base,
            color:      colours.textSecondary,
            lineHeight: lineHeight.body,
            margin:     0,
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
            Link expires in 10 minutes · Check your spam folder if it doesn't arrive.
          </p>
        </div>
      </PageShell>
    )
  }

  // ── Sign-in form ──────────────────────────────────────────────────────────────
  const isDisabled = loading || !email.trim()

  return (
    <PageShell orbOpacity={orbOpacity}>
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
          fontFamily:  fonts.sans,
          fontSize:    fontSize.base,
          color:       colours.textSecondary,
          lineHeight:  lineHeight.body,
          margin:      0,
          marginBottom: space[5],
        }}>
          Enter your email and we'll send you a secure sign-in link.
          No password needed.
        </p>

        {authError && <ErrorBanner error={authError} />}

        {/* Email input */}
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
          onKeyDown={e => e.key === 'Enter' && !isDisabled && handleLogin()}
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

        {/* Submit */}
        <button
          onClick={handleLogin}
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

        {/* Footer note */}
        <p style={{
          fontFamily:  fonts.mono,
          fontSize:    fontSize.xs,
          color:       colours.textMuted,
          textAlign:   'center',
          marginTop:   space[4],
          marginBottom: 0,
          lineHeight:  lineHeight.body,
        }}>
          Sign-in links expire after 10 minutes and are single use.
        </p>
      </div>
    </PageShell>
  )
}

// ─── Page shell — outer container with bouncing orb ──────────────────────────

function PageShell({
  children,
  orbOpacity,
}: {
  children:   React.ReactNode
  orbOpacity: number
}) {
  const colours = useColours()

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
      {/* Bouncing sapphire orb */}
      <BouncingOrb opacity={orbOpacity} />

      {/* Card column — capped width, sits above orb */}
      <div style={{
        position:  'relative',
        zIndex:    1,
        width:     '100%',
        maxWidth:  '400px',
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Theme wrapper — switches dark/light by viewport width ───────────────────

/**
 * LoginThemeWrapper detects viewport width and forces the correct theme.
 * Mobile (≤768px) → dark. Desktop (>768px) → light.
 * Defaults to light on first render to avoid flash on desktop.
 * A resize listener keeps the theme correct if the window is resized.
 */
function LoginThemeWrapper({ children }: { children: React.ReactNode }) {
  const MOBILE_BREAKPOINT = 768
  const [mode, setMode]   = useState<'light' | 'dark'>('light')

  useEffect(() => {
    function update() {
      setMode(window.innerWidth <= MOBILE_BREAKPOINT ? 'dark' : 'light')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
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
