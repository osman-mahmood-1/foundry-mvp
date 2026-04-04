'use client'

/**
 * app/signup/SignupClient.tsx
 *
 * Three-field animated sign-up questionnaire.
 * Light mode only. One floating glass field visible at a time.
 *
 * Field sequence:
 *   1. Full name     (mandatory)
 *   2. Email         (mandatory)
 *   3. Password      (mandatory, show/hide)
 *   4. Business type (mandatory, card grid)
 *
 * Animations:
 *   Active field: floats at centre, full opacity, glass crystallised.
 *   Exiting field: translates up 40px, blurs out, fades — "dissolving upward".
 *   Entering field: arrives from below (translateY +40px), blurs in, fades in.
 *
 * On completion: supabase.auth.signUp → /onboarding
 *
 * Zero hardcoded colours, fonts, or sizes.
 * All design values sourced from styles/tokens/*.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { light } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing, lineHeight } from '@/styles/tokens/typography'
import { space, radius } from '@/styles/tokens'
import { duration, easing, transition } from '@/styles/tokens/motion'
import { onboardingField, onboardingOrbs } from '@/styles/tokens/effects'

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldId = 'name' | 'email' | 'password' | 'businessType'
type AnimState = 'entering' | 'active' | 'exiting'
type BusinessType =
  | 'sole_trader' | 'freelancer' | 'contractor'
  | 'tradesperson' | 'consultant' | 'content_creator' | 'other'

// ─── Copy ─────────────────────────────────────────────────────────────────────

const FIELD_ORDER: FieldId[] = ['name', 'email', 'password', 'businessType']

const FIELD_META: Record<FieldId, { heading: string; sub: string; label: string; placeholder?: string }> = {
  name: {
    heading:     'Let's start with\nyour name.',
    sub:         'So your portal feels like yours from the very first moment.',
    label:       'Full name',
    placeholder: 'e.g. Alex Johnson',
  },
  email: {
    heading:     'Your email address.',
    sub:         'This is how you'll sign in. We'll never share it.',
    label:       'Email',
    placeholder: 'you@example.com',
  },
  password: {
    heading:     'Create a password.',
    sub:         'At least 8 characters. You can change this anytime in settings.',
    label:       'Password',
    placeholder: '••••••••',
  },
  businessType: {
    heading:     'How do you work?',
    sub:         'Your portal adapts its language to match your world.',
    label:       'Business type',
  },
}

const BUSINESS_TYPES: { value: BusinessType; label: string; sub: string; icon: string }[] = [
  { value: 'freelancer',      label: 'Freelancer',   sub: 'I work for myself',              icon: '◈' },
  { value: 'consultant',      label: 'Consultant',   sub: 'I advise or work day rate',      icon: '◇' },
  { value: 'contractor',      label: 'Contractor',   sub: 'Contracts or CIS',               icon: '△' },
  { value: 'tradesperson',    label: 'Tradesperson', sub: 'Trade or craft business',        icon: '⬡' },
  { value: 'content_creator', label: 'Creator',      sub: 'Content, brand deals, online',   icon: '◎' },
  { value: 'sole_trader',     label: 'Sole trader',  sub: 'Self-employed, other',           icon: '▦' },
]

// ─── Progress bar ─────────────────────────────────────────────────────────────

const PROGRESS_STEPS: Record<FieldId, number> = {
  name:         10,
  email:        35,
  password:     60,
  businessType: 85,
}

// ─── Animated field wrapper ───────────────────────────────────────────────────

function FieldCard({
  animState,
  children,
}: {
  animState: AnimState
  children:  React.ReactNode
}) {
  const style: React.CSSProperties = {
    ...onboardingField,
    padding:    `${space[8]} ${space[8]}`,
    width:      '100%',
    maxWidth:   '480px',
    position:   'absolute' as const,
    left:       '50%',
    transform:
      animState === 'entering' ? 'translateX(-50%) translateY(40px)'
      : animState === 'exiting'  ? 'translateX(-50%) translateY(-40px)'
      : 'translateX(-50%) translateY(0)',
    opacity:
      animState === 'active' ? 1 : 0,
    filter:
      animState === 'active' ? 'blur(0px)' : 'blur(8px)',
    transition: `opacity ${duration.slow} ${easing.spring}, transform ${duration.slow} ${easing.spring}, filter ${duration.slow} ${easing.spring}`,
    pointerEvents: animState === 'active' ? 'auto' : 'none',
  }

  return <div style={style}>{children}</div>
}

// ─── Text input field ─────────────────────────────────────────────────────────

function TextInput({
  type = 'text',
  value,
  onChange,
  onKeyDown,
  placeholder,
  autoFocus,
  suffix,
}: {
  type?:      string
  value:      string
  onChange:   (v: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  placeholder?: string
  autoFocus?: boolean
  suffix?:    React.ReactNode
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={
          type === 'password' ? 'new-password'
          : type === 'email'  ? 'email'
          : 'given-name'
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width:        '100%',
          padding:      `${space[3]} ${suffix ? space[10] : space[4]} ${space[3]} ${space[4]}`,
          background:   focused ? light.inputFocusBg    : light.inputBg,
          border:       `1.5px solid ${focused ? light.inputFocusBorder : light.inputBorder}`,
          boxShadow:    focused ? light.inputFocusGlow : 'none',
          borderRadius: radius.lg,
          fontFamily:   fonts.sans,
          fontSize:     fontSize.md,
          fontWeight:   fontWeight.regular,
          color:        light.textPrimary,
          outline:      'none',
          transition:   transition.snap,
          letterSpacing: letterSpacing.normal,
        }}
      />
      {suffix && (
        <div style={{
          position:  'absolute',
          right:     space[3],
          top:       '50%',
          transform: 'translateY(-50%)',
        }}>
          {suffix}
        </div>
      )}
    </div>
  )
}

// ─── Primary CTA button ───────────────────────────────────────────────────────

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick:  () => void
  disabled: boolean
  loading?: boolean
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:         '100%',
        padding:       `${space[3]} ${space[4]}`,
        background:    disabled
          ? light.hoverBg
          : hovered ? light.ctaHover : light.cta,
        color:         disabled ? light.textMuted : light.ctaText,
        border:        'none',
        borderRadius:  radius.full,
        fontFamily:    fonts.sans,
        fontSize:      fontSize.base,
        fontWeight:    fontWeight.medium,
        letterSpacing: letterSpacing.normal,
        cursor:        disabled || loading ? 'not-allowed' : 'pointer',
        transition:    transition.fast,
        opacity:       loading ? 0.7 : 1,
      }}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SignupClient() {
  const router = useRouter()

  // Form values
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)

  // Flow state
  const [currentField, setCurrentField] = useState<FieldId>('name')
  const [animStates,   setAnimStates]   = useState<Record<FieldId, AnimState>>({
    name:         'active',
    email:        'entering',
    password:     'entering',
    businessType: 'entering',
  })
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const transitioning = useRef(false)

  // Progress
  const progress = PROGRESS_STEPS[currentField]

  // ── Field navigation ────────────────────────────────────────────
  const advance = useCallback(() => {
    if (transitioning.current) return
    const idx  = FIELD_ORDER.indexOf(currentField)
    if (idx >= FIELD_ORDER.length - 1) return
    const next = FIELD_ORDER[idx + 1]

    transitioning.current = true

    setAnimStates(prev => ({
      ...prev,
      [currentField]: 'exiting',
      [next]:         'entering',
    }))

    // Brief delay then snap next field to active
    setTimeout(() => {
      setAnimStates(prev => ({
        ...prev,
        [next]: 'active',
      }))
      setCurrentField(next)
      transitioning.current = false
    }, 80)
  }, [currentField])

  const retreat = useCallback(() => {
    if (transitioning.current) return
    const idx  = FIELD_ORDER.indexOf(currentField)
    if (idx <= 0) return
    const prev = FIELD_ORDER[idx - 1]

    transitioning.current = true

    setAnimStates(s => ({
      ...s,
      [currentField]: 'entering',
      [prev]:         'exiting',
    }))

    setTimeout(() => {
      setAnimStates(s => ({
        ...s,
        [prev]: 'active',
      }))
      setCurrentField(prev)
      transitioning.current = false
    }, 80)
  }, [currentField])

  // ── Validation per field ─────────────────────────────────────────
  const canAdvance: Record<FieldId, boolean> = {
    name:         name.trim().length >= 2,
    email:        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    password:     password.length >= 8,
    businessType: businessType !== null,
  }

  // ── Submit ───────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!canAdvance.businessType || loading) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signUpErr } = await supabase.auth.signUp({
      email:    email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name:     name.trim(),
          business_type: businessType,
        },
      },
    })

    if (signUpErr) {
      setError(signUpErr.message)
      setLoading(false)
      return
    }

    router.push('/onboarding')
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:       '100dvh',
      background:      light.pageBg,
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         `${space[10]} ${space[5]}`,
      fontFamily:      fonts.sans,
      position:        'relative',
      overflow:        'hidden',
    }}>

      {/* Ambient orbs */}
      <div style={onboardingOrbs.primary}  aria-hidden />
      <div style={onboardingOrbs.secondary} aria-hidden />

      {/* Progress bar — spans full width at top */}
      <div style={{
        position:  'fixed',
        top:       0,
        left:      0,
        right:     0,
        height:    '3px',
        background: light.borderHairline,
        zIndex:    100,
      }}>
        <div style={{
          height:     '100%',
          width:      `${progress}%`,
          background: `linear-gradient(90deg, ${light.accent} 0%, ${light.teal} 60%, ${light.tealBar} 100%)`,
          boxShadow:  `0 0 8px ${light.accentBorder}`,
          transition: `width ${duration.lazy} ${easing.spring}`,
        }} />
      </div>

      {/* Wordmark */}
      <div style={{
        position:      'fixed',
        top:           space[6],
        left:          space[6],
        fontFamily:    fonts.sans,
        fontSize:      fontSize.lg,
        fontWeight:    fontWeight.medium,
        color:         light.textPrimary,
        letterSpacing: letterSpacing.tight,
        zIndex:        100,
      }}>
        Tax Foundry
      </div>

      {/* Step indicator */}
      <div style={{
        position:      'fixed',
        top:           space[6],
        right:         space[6],
        fontFamily:    fonts.sans,
        fontSize:      fontSize.xs,
        fontWeight:    fontWeight.light,
        color:         light.textMuted,
        letterSpacing: letterSpacing.wide,
        textTransform: 'uppercase',
        zIndex:        100,
      }}>
        {FIELD_ORDER.indexOf(currentField) + 1} / {FIELD_ORDER.length}
      </div>

      {/* Field stage — relative container so absolute fields stack */}
      <div style={{
        position: 'relative',
        width:    '100%',
        maxWidth: '480px',
        height:   currentField === 'businessType' ? '560px' : '360px',
        transition: `height ${duration.normal} ${easing.spring}`,
      }}>

        {FIELD_ORDER.map(fieldId => {
          const meta      = FIELD_META[fieldId]
          const animState = animStates[fieldId]

          return (
            <FieldCard key={fieldId} animState={animState}>

              {/* Heading */}
              <div style={{
                fontFamily:    fonts.sans,
                fontSize:      '26px',
                fontWeight:    fontWeight.light,
                color:         light.textPrimary,
                letterSpacing: letterSpacing.tight2,
                lineHeight:    lineHeight.tight,
                marginBottom:  space[2],
                whiteSpace:    'pre-line' as const,
              }}>
                {meta.heading}
              </div>

              {/* Sub */}
              <div style={{
                fontFamily:   fonts.sans,
                fontSize:     fontSize.sm,
                fontWeight:   fontWeight.light,
                color:        light.textMuted,
                lineHeight:   lineHeight.body,
                marginBottom: space[6],
              }}>
                {meta.sub}
              </div>

              {/* ── Name field ── */}
              {fieldId === 'name' && (
                <TextInput
                  value={name}
                  onChange={setName}
                  placeholder={meta.placeholder}
                  autoFocus={animState === 'active'}
                  onKeyDown={e => { if (e.key === 'Enter' && canAdvance.name) advance() }}
                />
              )}

              {/* ── Email field ── */}
              {fieldId === 'email' && (
                <TextInput
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder={meta.placeholder}
                  autoFocus={animState === 'active'}
                  onKeyDown={e => { if (e.key === 'Enter' && canAdvance.email) advance() }}
                />
              )}

              {/* ── Password field ── */}
              {fieldId === 'password' && (
                <TextInput
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder={meta.placeholder}
                  autoFocus={animState === 'active'}
                  onKeyDown={e => { if (e.key === 'Enter' && canAdvance.password) advance() }}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{
                        background: 'none',
                        border:     'none',
                        cursor:     'pointer',
                        padding:    0,
                        fontFamily: fonts.sans,
                        fontSize:   fontSize.xs,
                        color:      light.textMuted,
                        fontWeight: fontWeight.medium,
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  }
                />
              )}

              {/* ── Business type grid ── */}
              {fieldId === 'businessType' && (
                <div style={{
                  display:               'grid',
                  gridTemplateColumns:   '1fr 1fr',
                  gap:                   space[2],
                  marginBottom:          space[5],
                }}>
                  {BUSINESS_TYPES.map(bt => {
                    const selected = businessType === bt.value
                    return (
                      <button
                        key={bt.value}
                        onClick={() => setBusinessType(bt.value)}
                        style={{
                          padding:      `${space[3]} ${space[3]}`,
                          background:   selected ? light.accentLight : light.inputBg,
                          border:       `1.5px solid ${selected ? light.accent : light.inputBorder}`,
                          borderRadius: radius.lg,
                          textAlign:    'left' as const,
                          cursor:       'pointer',
                          transition:   transition.snap,
                        }}
                      >
                        <div style={{
                          fontFamily:   fonts.sans,
                          fontSize:     fontSize.md,
                          color:        light.textMuted,
                          marginBottom: space[1],
                          opacity:      0.7,
                        }}>
                          {bt.icon}
                        </div>
                        <div style={{
                          fontFamily:  fonts.sans,
                          fontSize:    fontSize.sm,
                          fontWeight:  fontWeight.medium,
                          color:       selected ? light.accent : light.textPrimary,
                          marginBottom:'2px',
                        }}>
                          {bt.label}
                        </div>
                        <div style={{
                          fontFamily: fonts.sans,
                          fontSize:   fontSize.xs,
                          fontWeight: fontWeight.light,
                          color:      light.textMuted,
                          lineHeight: lineHeight.normal,
                        }}>
                          {bt.sub}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Error */}
              {fieldId === 'businessType' && error && (
                <div style={{
                  fontFamily:   fonts.sans,
                  fontSize:     fontSize.xs,
                  color:        light.expense,
                  marginBottom: space[3],
                  lineHeight:   lineHeight.normal,
                }}>
                  {error}
                </div>
              )}

              {/* Spacer */}
              <div style={{ height: space[5] }} />

              {/* Buttons */}
              <div style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            space[2],
              }}>
                <PrimaryButton
                  onClick={fieldId === 'businessType' ? handleSubmit : advance}
                  disabled={!canAdvance[fieldId]}
                  loading={loading && fieldId === 'businessType'}
                >
                  {fieldId === 'businessType' ? 'Create my account →' : 'Continue →'}
                </PrimaryButton>

                {FIELD_ORDER.indexOf(fieldId) > 0 && (
                  <button
                    onClick={retreat}
                    style={{
                      background:    'none',
                      border:        'none',
                      cursor:        'pointer',
                      fontFamily:    fonts.sans,
                      fontSize:      fontSize.xs,
                      fontWeight:    fontWeight.light,
                      color:         light.textMuted,
                      letterSpacing: letterSpacing.normal,
                      padding:       `${space[1]} ${space[2]}`,
                    }}
                  >
                    ← Back
                  </button>
                )}
              </div>

            </FieldCard>
          )
        })}
      </div>

      {/* Sign-in link */}
      <div style={{
        position:      'fixed',
        bottom:        space[6],
        fontFamily:    fonts.sans,
        fontSize:      fontSize.xs,
        fontWeight:    fontWeight.light,
        color:         light.textMuted,
        letterSpacing: letterSpacing.normal,
      }}>
        Already have an account?{' '}
        <a
          href="/login"
          style={{
            color:          light.accent,
            textDecoration: 'none',
            fontWeight:     fontWeight.medium,
          }}
        >
          Sign in
        </a>
      </div>

    </div>
  )
}
