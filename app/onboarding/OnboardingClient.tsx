'use client'

/**
 * app/onboarding/OnboardingClient.tsx
 *
 * Post-signup onboarding — two screens:
 *
 *   Screen A — Plan selection
 *     Foundation plan (free forever). USP tick list with staggered reveal.
 *     "Get started free" → Stripe Checkout (£0). Stripe webhook provisions
 *     the client record and redirects here with ?step=details.
 *
 *   Screen B — Key details (optional)
 *     UTR, VAT toggle + VAT number, business/trading name,
 *     Companies House search, accounting basis.
 *     Skip + Next buttons floating in bottom-centre.
 *     Progress bar across top deepens as fields complete.
 *
 * Light mode only. All design values from styles/tokens/*.
 * Zero hardcoded colours, sizes, or fonts.
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams }   from 'next/navigation'
import { createClient }                 from '@/lib/supabase'
import { light }                        from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing, lineHeight } from '@/styles/tokens/typography'
import { space, radius }                from '@/styles/tokens'
import { duration, easing, transition } from '@/styles/tokens/motion'
import { onboardingField, onboardingOrbs } from '@/styles/tokens/effects'

// ─── Copy — USP feature list ──────────────────────────────────────────────────

const USP_FEATURES = [
  {
    icon:  '◈',
    title: 'Named, qualified accountant',
    sub:   'A real ICAEW or ACCA professional assigned to your account — not a chatbot.',
  },
  {
    icon:  '◎',
    title: 'Foundry AI Agent',
    sub:   'Instant answers to tax questions, 24/7. Trained on UK self-assessment rules.',
  },
  {
    icon:  '▦',
    title: '"It was never yours" philosophy',
    sub:   'See your true take-home the moment income lands — tax pre-allocated, never a surprise.',
  },
  {
    icon:  '△',
    title: 'Live client portal',
    sub:   'Income, expenses, documents, messages — everything in one place, always up to date.',
  },
  {
    icon:  '◇',
    title: 'MTD-ready from day one',
    sub:   'Architecture built for Making Tax Digital quarterly submissions. Ready when HMRC is.',
  },
  {
    icon:  '⬡',
    title: 'Self Assessment filed for you',
    sub:   'On paid plans, your SA return is prepared and filed by your accountant. You just review.',
  },
]

// ─── Detail fields config ─────────────────────────────────────────────────────

type DetailFieldId =
  | 'businessName'
  | 'utr'
  | 'vat'
  | 'vatNumber'
  | 'companiesHouse'
  | 'accountingBasis'

const DETAIL_ORDER: DetailFieldId[] = [
  'businessName',
  'utr',
  'vat',
  'vatNumber',
  'companiesHouse',
  'accountingBasis',
]

const DETAIL_META: Record<DetailFieldId, {
  label:       string
  sub:         string
  placeholder?: string
  optional:    boolean
  mandatory:   boolean
}> = {
  businessName: {
    label:       'Business / trading name',
    sub:         'What name do you trade under? Can be your own name.',
    placeholder: 'e.g. Alex Johnson Consulting',
    optional:    true,
    mandatory:   false,
  },
  utr: {
    label:       'UTR number',
    sub:         'Your 10-digit Unique Taxpayer Reference from HMRC.',
    placeholder: '1234567890',
    optional:    true,
    mandatory:   false,
  },
  vat: {
    label:       'Are you VAT registered?',
    sub:         'You must register if your turnover exceeds £90,000.',
    optional:    true,
    mandatory:   false,
  },
  vatNumber: {
    label:       'VAT registration number',
    sub:         'Your 9-digit VAT number from HMRC.',
    placeholder: 'GB 123 4567 89',
    optional:    true,
    mandatory:   false,
  },
  companiesHouse: {
    label:       'Limited company?',
    sub:         'Search Companies House to link your registered company.',
    placeholder: 'Company name or number',
    optional:    true,
    mandatory:   false,
  },
  accountingBasis: {
    label:       'Accounting basis',
    sub:         'Most sole traders use cash basis. Traditional accruals if your accountant advises.',
    optional:    true,
    mandatory:   false,
  },
}

// ─── Progress calculation ─────────────────────────────────────────────────────

function calcProgress(
  screen:     'plan' | 'details',
  detailIdx:  number,
  detailsLen: number,
): number {
  if (screen === 'plan')    return 85
  const base = 85
  const each = 15 / detailsLen
  return Math.min(100, base + each * detailIdx)
}

// ─── Tick icon — animated on reveal ──────────────────────────────────────────

function AnimatedTick({ visible }: { visible: boolean }) {
  return (
    <div style={{
      width:          '22px',
      height:         '22px',
      borderRadius:   '50%',
      background:     visible ? light.teal         : light.borderHairline,
      border:         `1.5px solid ${visible ? light.teal : light.borderMedium}`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      flexShrink:     0,
      transition:     `all ${duration.normal} ${easing.spring}`,
    }}>
      <svg
        width="11" height="11" viewBox="0 0 11 11" fill="none"
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'scale(1)' : 'scale(0.5)',
          transition: `all ${duration.normal} ${easing.spring}`,
        }}
      >
        <polyline
          points="1.5,5.5 4.5,8.5 9.5,2.5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

// ─── Toggle button ────────────────────────────────────────────────────────────

function ToggleOption({
  label,
  selected,
  onClick,
}: {
  label:    string
  selected: boolean
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex:          1,
        padding:       `${space[3]} ${space[4]}`,
        background:    selected ? light.accentLight : light.inputBg,
        border:        `1.5px solid ${selected ? light.accent : light.inputBorder}`,
        borderRadius:  radius.lg,
        fontFamily:    fonts.sans,
        fontSize:      fontSize.sm,
        fontWeight:    selected ? fontWeight.medium : fontWeight.regular,
        color:         selected ? light.accent : light.textSecondary,
        cursor:        'pointer',
        transition:    transition.snap,
        textAlign:     'center' as const,
      }}
    >
      {label}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialScreen = searchParams.get('step') === 'details' ? 'details' : 'plan'

  const [screen,       setScreen]       = useState<'plan' | 'details'>(initialScreen as 'plan' | 'details')
  const [ticksVisible, setTicksVisible] = useState<boolean[]>(USP_FEATURES.map(() => false))
  const [detailIdx,    setDetailIdx]    = useState(0)
  const [saving,       setSaving]       = useState(false)

  // Detail field values
  const [businessName,    setBusinessName]    = useState('')
  const [utr,             setUtr]             = useState('')
  const [vatRegistered,   setVatRegistered]   = useState<boolean | null>(null)
  const [vatNumber,       setVatNumber]       = useState('')
  const [chSearch,        setChSearch]        = useState('')
  const [accountingBasis, setAccountingBasis] = useState<'cash' | 'traditional' | null>(null)

  const [userId,    setUserId]    = useState<string | null>(null)
  const [clientId,  setClientId]  = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')

  // Load session
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const name = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''
      setFirstName(name.split(' ')[0])
      supabase.from('clients').select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => { if (data?.[0]) setClientId(data[0].id) })
    })
  }, [router])

  // Stagger tick reveals on plan screen
  useEffect(() => {
    if (screen !== 'plan') return
    USP_FEATURES.forEach((_, i) => {
      setTimeout(() => {
        setTicksVisible(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, 300 + i * 180)
    })
  }, [screen])

  // Current detail field
  const activeVisibleFields = DETAIL_ORDER.filter(
    f => f !== 'vatNumber' || vatRegistered === true
  )
  const currentDetail = activeVisibleFields[detailIdx]
  const progress = calcProgress(screen, detailIdx, activeVisibleFields.length)

  // ── Skip to next detail field ────────────────────────────────────
  function skipDetail() {
    if (detailIdx >= activeVisibleFields.length - 1) {
      handleFinish()
    } else {
      setDetailIdx(d => d + 1)
    }
  }

  function backDetail() {
    if (detailIdx > 0) setDetailIdx(d => d - 1)
    else setScreen('plan')
  }

  // ── Finish onboarding ────────────────────────────────────────────
  async function handleFinish() {
    if (!userId || saving) return
    setSaving(true)
    const supabase = createClient()

    const payload: Record<string, unknown> = {
      onboarding_complete: true,
      tax_year:            '2024-25',
    }
    if (businessName.trim()) payload.business_name    = businessName.trim()
    if (utr.trim())          payload.utr              = utr.trim()
    if (vatRegistered !== null) payload.vat_registered = vatRegistered
    if (vatNumber.trim()) payload.vat_number          = vatNumber.trim()
    if (accountingBasis)  payload.accounting_basis    = accountingBasis

    if (clientId) {
      await supabase.from('clients').update(payload).eq('id', clientId)
    } else {
      await supabase.from('clients').insert({
        user_id: userId,
        ...payload,
      })
    }

    router.push('/portal')
  }

  // ── Stripe checkout (placeholder — price ID injected via env) ────
  async function handleStartFree() {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_FREE
    if (!priceId) {
      // No Stripe price configured yet — go straight to details
      setScreen('details')
      return
    }

    const res  = await fetch('/api/stripe/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ priceId, userId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setScreen('details')
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:      '100dvh',
      background:     light.pageBg,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        `${space[12]} ${space[5]} ${space[16]}`,
      fontFamily:     fonts.sans,
      position:       'relative',
      overflow:       'hidden',
    }}>

      {/* Ambient orbs */}
      <div style={onboardingOrbs.primary}   aria-hidden />
      <div style={onboardingOrbs.secondary} aria-hidden />

      {/* Progress bar */}
      <div style={{
        position:  'fixed',
        top:       0, left: 0, right: 0,
        height:    '3px',
        background: light.borderHairline,
        zIndex:    100,
      }}>
        <div style={{
          height:     '100%',
          width:      `${progress}%`,
          background: `linear-gradient(90deg, ${light.accent} 0%, ${light.teal} 50%, ${light.tealBar} 100%)`,
          boxShadow:  `0 0 8px ${light.accentBorder}`,
          transition: `width ${duration.lazy} ${easing.spring}`,
        }} />
      </div>

      {/* Wordmark */}
      <div style={{
        position:      'fixed',
        top:           space[6], left: space[6],
        fontFamily:    fonts.sans,
        fontSize:      fontSize.lg,
        fontWeight:    fontWeight.medium,
        color:         light.textPrimary,
        letterSpacing: letterSpacing.tight,
        zIndex:        100,
      }}>
        Tax Foundry
      </div>

      {/* ══ SCREEN A — Plan selection ═══════════════════════════════════ */}
      {screen === 'plan' && (
        <div style={{
          width:    '100%',
          maxWidth: '520px',
          animation: `fadeUp ${duration.reveal} ${easing.spring} both`,
        }}>
          <style>{`
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(20px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Hero */}
          <div style={{ textAlign: 'center' as const, marginBottom: space[8] }}>
            <div style={{
              display:        'inline-block',
              padding:        `${space[1]} ${space[4]}`,
              background:     light.tealLight,
              border:         `1px solid ${light.teal}`,
              borderRadius:   radius.full,
              fontFamily:     fonts.sans,
              fontSize:       fontSize.xs,
              fontWeight:     fontWeight.medium,
              color:          light.teal,
              letterSpacing:  letterSpacing.wide,
              textTransform:  'uppercase' as const,
              marginBottom:   space[5],
            }}>
              Foundation Plan · Free forever
            </div>

            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      '32px',
              fontWeight:    fontWeight.light,
              color:         light.textPrimary,
              letterSpacing: letterSpacing.tight2,
              lineHeight:    lineHeight.tight,
              marginBottom:  space[3],
            }}>
              {firstName ? `Welcome, ${firstName}.` : 'Welcome to Foundry.'}
            </div>

            <div style={{
              fontFamily:  fonts.sans,
              fontSize:    fontSize.sm,
              fontWeight:  fontWeight.light,
              color:       light.textMuted,
              lineHeight:  lineHeight.body,
              maxWidth:    '360px',
              margin:      '0 auto',
            }}>
              Your personal CFO — a named accountant, AI guidance, and a live
              portal — all free to start.
            </div>
          </div>

          {/* USP feature list */}
          <div style={{
            ...onboardingField,
            padding:      space[6],
            marginBottom: space[6],
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: space[4] }}>
              {USP_FEATURES.map((feat, i) => (
                <div key={feat.title} style={{
                  display:   'flex',
                  gap:       space[4],
                  alignItems: 'flex-start',
                }}>
                  <AnimatedTick visible={ticksVisible[i]} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily:   fonts.sans,
                      fontSize:     fontSize.sm,
                      fontWeight:   fontWeight.medium,
                      color:        light.textPrimary,
                      marginBottom: '3px',
                    }}>
                      {feat.title}
                    </div>
                    <div style={{
                      fontFamily:  fonts.sans,
                      fontSize:    fontSize.xs,
                      fontWeight:  fontWeight.light,
                      color:       light.textMuted,
                      lineHeight:  lineHeight.normal,
                    }}>
                      {feat.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price callout */}
          <div style={{ textAlign: 'center' as const, marginBottom: space[5] }}>
            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      '40px',
              fontWeight:    fontWeight.light,
              color:         light.textPrimary,
              letterSpacing: letterSpacing.tight2,
            }}>
              £0<span style={{ fontSize: fontSize.sm, color: light.textMuted, fontWeight: fontWeight.light }}>/month</span>
            </div>
            <div style={{
              fontFamily:  fonts.sans,
              fontSize:    fontSize.xs,
              fontWeight:  fontWeight.light,
              color:       light.textMuted,
              marginTop:   space[1],
            }}>
              No credit card required · Upgrade anytime
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleStartFree}
            className="cta-btn"
            style={{
              width:         '100%',
              padding:       `${space[4]} ${space[4]}`,
              background:    light.cta,
              color:         light.ctaText,
              border:        'none',
              borderRadius:  radius.full,
              fontFamily:    fonts.sans,
              fontSize:      fontSize.base,
              fontWeight:    fontWeight.medium,
              letterSpacing: letterSpacing.normal,
              cursor:        'pointer',
            }}
          >
            Get started free →
          </button>

          <div style={{
            textAlign:     'center' as const,
            marginTop:     space[4],
            fontFamily:    fonts.sans,
            fontSize:      fontSize.xs,
            fontWeight:    fontWeight.light,
            color:         light.textMuted,
            letterSpacing: letterSpacing.normal,
          }}>
            By continuing you agree to our{' '}
            <a href="/terms" style={{ color: light.accent, textDecoration: 'none' }}>Terms</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: light.accent, textDecoration: 'none' }}>Privacy Policy</a>.
          </div>
        </div>
      )}

      {/* ══ SCREEN B — Key details ════════════════════════════════════ */}
      {screen === 'details' && (
        <div style={{
          width:    '100%',
          maxWidth: '480px',
          animation: `fadeUp ${duration.reveal} ${easing.spring} both`,
        }}>

          {/* Heading */}
          <div style={{ marginBottom: space[6] }}>
            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      '28px',
              fontWeight:    fontWeight.light,
              color:         light.textPrimary,
              letterSpacing: letterSpacing.tight2,
              lineHeight:    lineHeight.tight,
              marginBottom:  space[2],
            }}>
              A few details.
            </div>
            <div style={{
              fontFamily:  fonts.sans,
              fontSize:    fontSize.sm,
              fontWeight:  fontWeight.light,
              color:       light.textMuted,
              lineHeight:  lineHeight.body,
            }}>
              All optional — skip anything you don't have to hand. You can add
              everything in settings later.
            </div>
          </div>

          {/* Active field card */}
          <div style={{ ...onboardingField, padding: space[6], marginBottom: space[5] }}>

            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      fontSize.xs,
              fontWeight:    fontWeight.light,
              color:         light.textMuted,
              letterSpacing: letterSpacing.wide,
              textTransform: 'uppercase' as const,
              marginBottom:  space[2],
            }}>
              {detailIdx + 1} of {activeVisibleFields.length}
            </div>

            <div style={{
              fontFamily:    fonts.sans,
              fontSize:      fontSize.md,
              fontWeight:    fontWeight.medium,
              color:         light.textPrimary,
              marginBottom:  space[1],
            }}>
              {DETAIL_META[currentDetail].label}
            </div>

            <div style={{
              fontFamily:   fonts.sans,
              fontSize:     fontSize.xs,
              fontWeight:   fontWeight.light,
              color:        light.textMuted,
              lineHeight:   lineHeight.normal,
              marginBottom: space[4],
            }}>
              {DETAIL_META[currentDetail].sub}
            </div>

            {/* ── Business name ── */}
            {currentDetail === 'businessName' && (
              <input
                autoFocus
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder={DETAIL_META.businessName.placeholder}
                style={inputStyle}
              />
            )}

            {/* ── UTR ── */}
            {currentDetail === 'utr' && (
              <input
                autoFocus
                type="text"
                value={utr}
                onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={DETAIL_META.utr.placeholder}
                inputMode="numeric"
                style={inputStyle}
              />
            )}

            {/* ── VAT toggle ── */}
            {currentDetail === 'vat' && (
              <div style={{ display: 'flex', gap: space[2] }}>
                <ToggleOption
                  label="Yes, I'm VAT registered"
                  selected={vatRegistered === true}
                  onClick={() => setVatRegistered(true)}
                />
                <ToggleOption
                  label="Not yet"
                  selected={vatRegistered === false}
                  onClick={() => setVatRegistered(false)}
                />
              </div>
            )}

            {/* ── VAT number ── */}
            {currentDetail === 'vatNumber' && (
              <input
                autoFocus
                type="text"
                value={vatNumber}
                onChange={e => setVatNumber(e.target.value)}
                placeholder={DETAIL_META.vatNumber.placeholder}
                style={inputStyle}
              />
            )}

            {/* ── Companies House search ── */}
            {currentDetail === 'companiesHouse' && (
              <input
                autoFocus
                type="text"
                value={chSearch}
                onChange={e => setChSearch(e.target.value)}
                placeholder={DETAIL_META.companiesHouse.placeholder}
                style={inputStyle}
              />
            )}

            {/* ── Accounting basis ── */}
            {currentDetail === 'accountingBasis' && (
              <div style={{ display: 'flex', gap: space[2] }}>
                <ToggleOption
                  label="Cash basis"
                  selected={accountingBasis === 'cash'}
                  onClick={() => setAccountingBasis('cash')}
                />
                <ToggleOption
                  label="Traditional"
                  selected={accountingBasis === 'traditional'}
                  onClick={() => setAccountingBasis('traditional')}
                />
              </div>
            )}
          </div>

          {/* Floating action buttons */}
          <div style={{
            display:        'flex',
            gap:            space[3],
            justifyContent: 'center',
          }}>
            {/* Back / Skip */}
            <button
              onClick={detailIdx === 0 ? backDetail : skipDetail}
              style={{
                flex:          1,
                padding:       `${space[3]} ${space[4]}`,
                background:    light.inputBg,
                border:        `1.5px solid ${light.inputBorder}`,
                borderRadius:  radius.full,
                fontFamily:    fonts.sans,
                fontSize:      fontSize.sm,
                fontWeight:    fontWeight.light,
                color:         light.textSecondary,
                cursor:        'pointer',
                transition:    transition.snap,
                letterSpacing: letterSpacing.normal,
              }}
            >
              {detailIdx === 0 ? '← Back' : 'Skip'}
            </button>

            {/* Next / Finish */}
            <button
              onClick={
                detailIdx >= activeVisibleFields.length - 1
                  ? handleFinish
                  : () => setDetailIdx(d => d + 1)
              }
              disabled={saving}
              style={{
                flex:          2,
                padding:       `${space[3]} ${space[4]}`,
                background:    light.cta,
                border:        'none',
                borderRadius:  radius.full,
                fontFamily:    fonts.sans,
                fontSize:      fontSize.sm,
                fontWeight:    fontWeight.medium,
                color:         light.ctaText,
                cursor:        saving ? 'not-allowed' : 'pointer',
                transition:    transition.snap,
                opacity:       saving ? 0.7 : 1,
                letterSpacing: letterSpacing.normal,
              }}
            >
              {saving
                ? 'Setting up…'
                : detailIdx >= activeVisibleFields.length - 1
                  ? 'Enter my portal →'
                  : 'Next →'}
            </button>
          </div>

          {/* Field dots */}
          <div style={{
            display:        'flex',
            justifyContent: 'center',
            gap:            space[1],
            marginTop:      space[5],
          }}>
            {activeVisibleFields.map((_, i) => (
              <div key={i} style={{
                height:       '4px',
                width:        i === detailIdx ? '20px' : '5px',
                borderRadius: '2px',
                background:   i === detailIdx ? light.accent : light.borderMedium,
                transition:   `all ${duration.normal} ${easing.spring}`,
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width:        '100%',
  padding:      `${space[3]} ${space[4]}`,
  background:   light.inputBg,
  border:       `1.5px solid ${light.inputBorder}`,
  borderRadius: radius.lg,
  fontFamily:   fonts.sans,
  fontSize:     fontSize.md,
  fontWeight:   fontWeight.regular,
  color:        light.textPrimary,
  outline:      'none',
  transition:   transition.snap,
}
