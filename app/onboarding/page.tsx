'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────
type Step = 1 | 2 | 3
type ClientType =
  | 'sole_trader' | 'landlord' | 'content_creator'
  | 'cis_contractor' | 'tradesperson' | 'consultant'
  | 'other'

// ─── Data ─────────────────────────────────────────────────
const PRIMARY_TRADES = [
  {
    value: 'sole_trader',
    label: 'Freelancer',
    sub: 'I work for myself',
    icon: '◈',
  },
  {
    value: 'landlord',
    label: 'Landlord',
    sub: 'I rent out property',
    icon: '▦',
  },
  {
    value: 'tradesperson',
    label: 'Tradesperson',
    sub: 'I run a trade or craft business',
    icon: '⬡',
  },
  {
    value: 'content_creator',
    label: 'Creator',
    sub: 'I make content or earn online',
    icon: '◎',
  },
  {
    value: 'cis_contractor',
    label: 'Contractor',
    sub: 'I work on contracts or through CIS',
    icon: '△',
  },
  {
    value: 'consultant',
    label: 'Consultant',
    sub: 'I advise or work on a day rate',
    icon: '◇',
  },
]

const SECONDARY_TRADES = [
  {
    value: 'sole_trader',
    label: 'I sell things',
    sub: 'Retail, ecommerce, market stall',
    icon: '◈',
  },
  {
    value: 'sole_trader',
    label: 'I provide a service',
    sub: 'Beauty, fitness, therapy, tutoring',
    icon: '◎',
  },
  {
    value: 'landlord',
    label: 'I work in property',
    sub: 'Developer, surveyor, lettings',
    icon: '▦',
  },
  {
    value: 'content_creator',
    label: 'Something creative',
    sub: 'Music, art, photography, writing',
    icon: '◇',
  },
  {
    value: 'other',
    label: 'Not listed',
    sub: "I'll set this up later",
    icon: '—',
  },
]

const GOALS = [
  {
    value: 'cfo',
    label: 'Personal CFO',
    sub: 'Complete visibility of my finances, taxes handled, nothing missed',
    icon: '▦',
  },
  {
    value: 'compliant',
    label: 'Stay Compliant',
    sub: 'Every obligation met, every HMRC deadline hit without the stress',
    icon: '◎',
  },
  {
    value: 'mtd',
    label: 'MTD Ready',
    sub: 'Quarterly submissions handled before HMRC asks twice',
    icon: '△',
  },
  {
    value: 'cashflow',
    label: 'Cash Clarity',
    sub: 'Know exactly what I have, what I owe, and what is truly mine to spend',
    icon: '◈',
  },
]

// ─── Styles ───────────────────────────────────────────────
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`

const navy = '#051C2C'
const teal = '#00D4AA'
const bg = '#F0F4FA'
const muted = '#94A3B8'
const secondary = '#475569'

// ─── Component ────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [showSecondary, setShowSecondary] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [clientType, setClientType] = useState<ClientType | null>(null)
  const [tradeLabel, setTradeLabel] = useState('')
  const [goal, setGoal] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [clientEmail, setClientEmail] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      // Pre-fill name from email if available
      const emailName = user.email?.split('@')[0] ?? ''
      if (emailName) {
        const cleaned = emailName.replace(/[^a-zA-Z]/g, '')
        setFirstName(cleaned.charAt(0).toUpperCase() + cleaned.slice(1))
      }
      // Get client ID
      supabase.from('clients').select('id').eq('user_id', user.id).single()
        .then(({ data }) => { if (data) setClientId(data.id)
        setClientEmail(user.email ?? '') })
    })
  }, [])

  // ─── Save + continue ──────────────────────────────────
  async function handleComplete(skipGoal = false) {
    if (!clientId) return
    setSaving(true)
    const supabase = createClient()

    await supabase.from('clients').update({
      full_name: firstName.trim(),
      client_type: clientType ?? 'other',
      trade_label: tradeLabel || tradeLabel,
      portal_config: await getPortalConfig(clientType ?? 'other'),
      onboarding_complete: true,
    }).eq('id', clientId)

    fetch('/api/email/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, tradeLabel, email: clientEmail }),
    }).catch(() => {})

    window.location.href = '/portal'
  }

  async function getPortalConfig(type: string) {
    // Will be replaced by the DB function in Phase 2
    // For now returns a sensible default per type
    const defaults: Record<string, object> = {
      landlord: {
        income_label: 'Rental income',
        expense_label: 'Property costs',
        nav_items: ['income', 'expenses', 'documents', 'messages', 'tasks'],
        sa_form: 'SA105',
      },
      content_creator: {
        income_label: 'Creator revenue',
        expense_label: 'Creator costs',
        nav_items: ['income', 'expenses', 'documents', 'messages', 'tasks'],
        sa_form: 'SA103',
      },
      cis_contractor: {
        income_label: 'Contract income',
        expense_label: 'Site costs',
        nav_items: ['income', 'expenses', 'documents', 'messages', 'tasks'],
        sa_form: 'SA103',
      },
    }
    return defaults[type] ?? {
      income_label: 'Income',
      expense_label: 'Expenses',
      nav_items: ['income', 'expenses', 'documents', 'messages', 'tasks'],
      sa_form: 'SA103',
    }
  }

  // ─── Progress bar ─────────────────────────────────────
  const progress = ((step - 1) / 3) * 100

  // ─── Render ───────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <style>{FONTS}</style>

      {/* Background orb */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border: '1px solid rgba(255,255,255,0.98)',
        borderRadius: '24px',
        boxShadow: '0 8px 48px rgba(5,28,44,0.09), inset 0 1px 0 rgba(255,255,255,1)',
        overflow: 'hidden',
        animation: 'fadeUp 0.5s ease',
      }}>

        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(5,28,44,0.06)' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${teal}, #00F5C4)`,
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 8px rgba(0,212,170,0.4)',
          }} />
        </div>

        {/* Header */}
        <div style={{ padding: '28px 32px 0' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}>
            <div style={{
              fontSize: '10px', color: muted,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              {step === 1 ? 'Step 1 of 3 · Welcome' : step === 2 ? 'Step 2 of 3 · Your work' : 'Step 3 of 3 · Your goals'}
            </div>
            {step > 1 && (
              <button
                onClick={() => {
                  if (step === 3) setStep(2)
                  else if (step === 2 && showSecondary) setShowSecondary(false)
                  else setStep((s) => (s - 1) as Step)
                }}
                style={{
                  fontSize: '12px', color: muted, background: 'none',
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                ← Back
              </button>
            )}
          </div>
        </div>

        {/* Step content */}
        <div style={{ padding: '16px 32px 32px', animation: 'fadeUp 0.35s ease' }} key={`${step}-${showSecondary}`}>

          {/* ─── STEP 1: Name ─────────────────────────── */}
          {step === 1 && (
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '28px', fontWeight: '500',
                color: navy, marginBottom: '8px',
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>
                Let's start with<br />your name.
              </h1>
              <p style={{ fontSize: '13px', color: muted, marginBottom: '28px', lineHeight: 1.6 }}>
                So we know what to call you — and your portal feels like yours from the first moment.
              </p>

              <div style={{ marginBottom: '8px' }}>
                <label style={{
                  fontSize: '11px', color: secondary,
                  display: 'block', marginBottom: '6px',
                  fontWeight: '500', letterSpacing: '0.02em',
                }}>
                  First name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && firstName.trim()) setStep(2) }}
                  placeholder="Your first name"
                  style={{
                    width: '100%', padding: '13px 16px',
                    border: '1px solid rgba(5,28,44,0.12)',
                    borderRadius: '12px', fontSize: '16px',
                    color: navy, outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    background: 'rgba(255,255,255,0.8)',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = teal}
                  onBlur={e => e.target.style.borderColor = 'rgba(5,28,44,0.12)'}
                />
              </div>

              <p style={{
                fontSize: '11px', color: muted,
                marginBottom: '24px', lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                You can update this anytime in settings.
              </p>

              <button
                onClick={() => setStep(2)}
                disabled={!firstName.trim()}
                style={{
                  width: '100%', padding: '14px',
                  background: firstName.trim() ? navy : 'rgba(5,28,44,0.1)',
                  color: firstName.trim() ? 'white' : muted,
                  border: 'none', borderRadius: '100px',
                  fontSize: '14px', fontWeight: '500',
                  cursor: firstName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s',
                  letterSpacing: '-0.01em',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ─── STEP 2: Trade type ───────────────────── */}
          {step === 2 && (
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '26px', fontWeight: '500',
                color: navy, marginBottom: '8px',
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>
                {showSecondary ? 'A little more detail.' : `Good to meet you, ${firstName}.`}
              </h1>
              <p style={{ fontSize: '13px', color: muted, marginBottom: '24px', lineHeight: 1.6 }}>
                {showSecondary
                  ? 'Pick whichever feels closest — your portal vocabulary will match your world.'
                  : 'Your portal adapts to how you work. Pick whichever feels closest — you can refine this later.'}
              </p>

              {/* Pills */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '24px',
              }}>
                {(showSecondary ? SECONDARY_TRADES : PRIMARY_TRADES).map((trade) => {
                  const isSelected = !showSecondary && clientType === trade.value
                    || (showSecondary && tradeLabel === trade.label)
                  return (
                    <button
                      key={trade.label}
                      onClick={() => {
                        if (!showSecondary) {
                          if (trade.label === 'My work is a bit different') {
                            setShowSecondary(true)
                            return
                          }
                          setClientType(trade.value as ClientType)
                          setTradeLabel(trade.label)
                        } else {
                          setClientType(trade.value as ClientType)
                          setTradeLabel(trade.label)
                        }
                      }}
                      style={{
                        padding: '14px 12px',
                        background: isSelected ? navy : 'rgba(5,28,44,0.03)',
                        border: `1px solid ${isSelected ? navy : 'rgba(5,28,44,0.1)'}`,
                        borderRadius: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        fontSize: '16px', marginBottom: '6px',
                        color: isSelected ? 'rgba(255,255,255,0.6)' : muted,
                      }}>
                        {trade.icon}
                      </div>
                      <div style={{
                        fontSize: '13px', fontWeight: '500',
                        color: isSelected ? 'white' : navy,
                        marginBottom: '3px',
                      }}>
                        {trade.label}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: isSelected ? 'rgba(255,255,255,0.55)' : muted,
                        lineHeight: 1.4,
                      }}>
                        {trade.sub}
                      </div>
                    </button>
                  )
                })}

                {/* Escape hatch — primary only */}
                {!showSecondary && (
                  <button
                    onClick={() => setShowSecondary(true)}
                    style={{
                      padding: '14px 12px',
                      background: 'transparent',
                      border: '1px dashed rgba(5,28,44,0.15)',
                      borderRadius: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '6px', color: muted }}>↗</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: secondary, marginBottom: '3px' }}>
                      My work is a bit different
                    </div>
                    <div style={{ fontSize: '11px', color: muted, lineHeight: 1.4 }}>
                      See more options
                    </div>
                  </button>
                )}
              </div>

              <p style={{
                fontSize: '11px', color: muted,
                marginBottom: '20px', lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                This can be changed anytime in your settings.
              </p>

              <button
                onClick={() => setStep(3)}
                disabled={!clientType}
                style={{
                  width: '100%', padding: '14px',
                  background: clientType ? navy : 'rgba(5,28,44,0.1)',
                  color: clientType ? 'white' : muted,
                  border: 'none', borderRadius: '100px',
                  fontSize: '14px', fontWeight: '500',
                  cursor: clientType ? 'pointer' : 'not-allowed',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ─── STEP 3: Goals ────────────────────────── */}
          {step === 3 && (
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '26px', fontWeight: '500',
                color: navy, marginBottom: '8px',
                letterSpacing: '-0.02em', lineHeight: 1.2,
              }}>
                What are you here<br />to achieve?
              </h1>
              <p style={{ fontSize: '13px', color: muted, marginBottom: '24px', lineHeight: 1.6 }}>
                Your portal will surface what matters most to you. This shapes your experience from day one.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {GOALS.map((g) => {
                  const isSelected = goal === g.value
                  return (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      style={{
                        padding: '14px 16px',
                        background: isSelected ? navy : 'rgba(5,28,44,0.03)',
                        border: `1px solid ${isSelected ? navy : 'rgba(5,28,44,0.1)'}`,
                        borderRadius: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}
                    >
                      <span style={{
                        fontSize: '18px',
                        color: isSelected ? 'rgba(255,255,255,0.5)' : muted,
                        flexShrink: 0,
                      }}>
                        {g.icon}
                      </span>
                      <div>
                        <div style={{
                          fontSize: '13px', fontWeight: '500',
                          color: isSelected ? 'white' : navy,
                          marginBottom: '3px',
                        }}>
                          {g.label}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: isSelected ? 'rgba(255,255,255,0.55)' : muted,
                          lineHeight: 1.4,
                        }}>
                          {g.sub}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{
                          marginLeft: 'auto', width: '18px', height: '18px',
                          borderRadius: '50%', background: teal,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: '10px', color: navy, fontWeight: '700',
                        }}>
                          ✓
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <p style={{
                fontSize: '11px', color: muted,
                marginBottom: '20px', lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                This can be changed anytime · All responses are editable in settings.
              </p>

              <button
                onClick={() => handleComplete()}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px',
                  background: navy, color: 'white',
                  border: 'none', borderRadius: '100px',
                  fontSize: '14px', fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  marginBottom: '10px',
                  opacity: saving ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Setting up your portal...' : 'Enter your portal →'}
              </button>

              <button
                onClick={() => handleComplete(true)}
                disabled={saving}
                style={{
                  width: '100%', padding: '12px',
                  background: 'transparent', color: muted,
                  border: 'none', borderRadius: '100px',
                  fontSize: '13px', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Skip for now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid rgba(5,28,44,0.05)',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                height: '4px',
                width: step === s ? '20px' : '6px',
                borderRadius: '2px',
                background: step === s ? navy : 'rgba(5,28,44,0.12)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Brand mark */}
      <div style={{
        marginTop: '24px',
        fontSize: '11px', color: muted,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '0.1em',
      }}>
        FOUNDRY · Your finances, accelerated.
      </div>
    </div>
  )
}
