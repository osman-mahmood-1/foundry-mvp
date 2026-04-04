'use client'

/**
 * app/portal/components/tabs/SubmissionTab.tsx
 *
 * Submission Centre — guided Self Assessment filing flow.
 *
 * Task 10 changes:
 * - Save progress: persists step + form to localStorage, restores on mount
 * - Right panel: HMRC filing calendar with key deadlines for the tax year
 */

import { useState, useEffect } from 'react'
import type { Client } from '@/types'
import { useIncome }   from './useIncome'
import { useExpenses } from './useExpenses'
import { Spinner, Button, formatGBP } from '../ui'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'
import { glass } from '@/styles/tokens/effects'

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Income',      icon: '↑' },
  { id: 2, label: 'Expenses',    icon: '↓' },
  { id: 3, label: 'Adjustments', icon: '◉' },
  { id: 4, label: 'Submit',      icon: '⬡' },
]

// ─── HMRC key dates ───────────────────────────────────────────────────────────

interface HmrcDate {
  label:    string
  date:     Date
  desc:     string
}

function getHmrcDates(taxYear: string): HmrcDate[] {
  // taxYear format: "2024-25" → endYear = 2025
  const endYear = parseInt(taxYear.split('-')[1] ?? '25') + 2000
  return [
    {
      label: 'Paper deadline',
      date:  new Date(endYear, 9, 31), // Oct 31
      desc:  'Last day to file a paper SA100 return',
    },
    {
      label: 'Online deadline',
      date:  new Date(endYear + 1, 0, 31), // Jan 31 following year
      desc:  'Last day to file online and pay balance',
    },
    {
      label: 'Tax payment due',
      date:  new Date(endYear + 1, 0, 31), // Jan 31
      desc:  'Any unpaid tax balance must be paid',
    },
    {
      label: 'Payment on account',
      date:  new Date(endYear + 1, 6, 31), // Jul 31
      desc:  'Second payment on account for next year',
    },
  ]
}

// ─── Step bar ─────────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  const colours = useColours()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '32px' }}>
      {STEPS.map((step, idx) => {
        const done   = step.id < current
        const active = step.id === current
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width:          '36px',
                height:         '36px',
                borderRadius:   radius.circle,
                background:     done ? colours.income : active ? colours.accent : colours.borderLight,
                border:         active ? `2px solid ${colours.accent}` : 'none',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       done ? '14px' : '13px',
                color:          (done || active) ? colours.white : colours.textMuted,
                transition:     transition.fast,
              }}>
                {done ? '✓' : step.icon}
              </div>
              <div style={{
                fontSize:   fontSize.xs,
                color:      active ? colours.accent : done ? colours.income : colours.textMuted,
                fontFamily: fonts.sans,
                fontWeight: active ? fontWeight.medium : fontWeight.regular,
                whiteSpace: 'nowrap' as const,
              }}>
                {step.label}
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                width:        '80px',
                height:       '2px',
                background:   done ? colours.income : colours.borderLight,
                marginBottom: '22px',
                transition:   transition.fast,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Summary row ─────────────────────────────────────────────────────────────

function SummaryRow({ label, value, colour }: { label: string; value: string; colour?: string }) {
  const colours = useColours()
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '10px 0',
      borderBottom:   `1px solid ${colours.borderHairline}`,
    }}>
      <span style={{ fontSize: fontSize.base, color: colours.textSecondary }}>{label}</span>
      <span style={{ fontFamily: fonts.mono, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colour ?? colours.textPrimary, letterSpacing: letterSpacing.tight }}>
        {value}
      </span>
    </div>
  )
}

// ─── HMRC Calendar panel ──────────────────────────────────────────────────────

function HmrcCalendar({ taxYear }: { taxYear: string }) {
  const colours = useColours()
  const mode = useThemeMode()
  const dates = getHmrcDates(taxYear)
  const now   = new Date()

  function getStatus(d: Date): 'past' | 'today' | 'upcoming' {
    const diff = d.getTime() - now.getTime()
    if (Math.abs(diff) < 86400000) return 'today'
    return diff < 0 ? 'past' : 'upcoming'
  }

  const statusColour = {
    past:     colours.textMuted,
    today:    colours.warning,
    upcoming: colours.accent,
  }

  return (
    <div style={{
      ...glass.card(mode),
      padding:         '20px',
      position:        'relative',
      overflow:        'hidden',
    }}>
      {/* Subtle cyan orb */}
      <div style={{
        position:      'absolute',
        top:           '-40px',
        right:         '-40px',
        width:         '160px',
        height:        '160px',
        borderRadius:  '50%',
        background:    `radial-gradient(circle, ${colours.accentSoft} 0%, transparent 70%)`,
        filter:        'blur(40px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize:      fontSize.xs,
        fontWeight:    fontWeight.medium,
        color:         colours.textMuted,
        fontFamily:    fonts.mono,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        marginBottom:  '16px',
      }}>
        HMRC Key Dates · {taxYear}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {dates.map((d, idx) => {
          const status = getStatus(d.date)
          const col    = statusColour[status]
          return (
            <div
              key={d.label}
              style={{
                display:    'flex',
                gap:        '12px',
                paddingBottom: idx < dates.length - 1 ? '16px' : '0',
                position:   'relative',
              }}
            >
              {/* Timeline line */}
              {idx < dates.length - 1 && (
                <div style={{
                  position:   'absolute',
                  left:       '7px',
                  top:        '16px',
                  bottom:     '0',
                  width:      '2px',
                  background: colours.borderLight,
                }} />
              )}

              {/* Dot */}
              <div style={{
                width:        '16px',
                height:       '16px',
                borderRadius: '50%',
                background:   status === 'today' ? colours.warning : status === 'upcoming' ? colours.accent : colours.borderMedium,
                flexShrink:   0,
                marginTop:    '2px',
                boxShadow:    status === 'upcoming' ? `0 0 8px ${colours.accent}44` : 'none',
                transition:   transition.snap,
              }} />

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: col }}>
                  {d.label}
                </div>
                <div style={{
                  fontSize:   fontSize.xs,
                  fontFamily: fonts.mono,
                  color:      col,
                  opacity:    0.9,
                  marginTop:  '1px',
                }}>
                  {d.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '11px', color: colours.textMuted, marginTop: '2px', lineHeight: 1.4 }}>
                  {d.desc}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Need help */}
      <div style={{
        marginTop:    '20px',
        paddingTop:   '16px',
        borderTop:    `1px solid ${colours.borderHairline}`,
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
      }}>
        <span style={{ fontSize: '14px', opacity: 0.5 }}>◇</span>
        <span style={{ fontSize: fontSize.xs, color: colours.textMuted }}>
          Need help? Message your accountant via the Messages tab.
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubmissionTab({ client }: { client: Client }) {
  const colours = useColours()
  const mode = useThemeMode()
  const DRAFT_KEY = `foundry-submission-draft-${client.id}`

  const [step,         setStep]         = useState(1)
  const [submitted,    setSubmitted]    = useState(false)
  const [draftBanner,  setDraftBanner]  = useState(false)
  const [lastSaved,    setLastSaved]    = useState<Date | null>(null)
  const [savedBanner,  setSavedBanner]  = useState(false)

  const { income,   loading: li } = useIncome(client.id, client.tax_year, client.user_id)
  const { expenses, loading: le } = useExpenses(client.id, client.tax_year, client.user_id)

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.step && parsed.step > 1) {
          setStep(parsed.step)
          setDraftBanner(true)
          setLastSaved(parsed.savedAt ? new Date(parsed.savedAt) : null)
        }
      }
    } catch {
      // ignore
    }
  }, [DRAFT_KEY])

  function saveProgress() {
    const now = new Date()
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, savedAt: now.toISOString() }))
    } catch {
      // ignore storage quota issues
    }
    setLastSaved(now)
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 2500)
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    setDraftBanner(false)
    setLastSaved(null)
  }

  if (li || le) return <Spinner />

  const totalIncome       = income.reduce((s, i) => s + i.amount_pence, 0)
  const totalExpenses     = expenses.reduce((s, e) => s + e.amount_pence, 0)
  const allowable         = expenses.filter(e => e.allowable === true).reduce((s, e) => s + e.amount_pence, 0)
  const netProfit         = totalIncome - allowable
  const personalAllowance = 1257500
  const taxableIncome     = Math.max(0, netProfit - personalAllowance)
  const estimatedTax      = taxableIncome > 0 ? Math.round(taxableIncome * 0.20) : 0

  if (submitted) {
    return (
      <div style={{ display: 'flex', gap: spacing.tab.gap }}>
        <div style={{
          ...glass.card(mode),
          flex:       1,
          textAlign:  'center' as const,
          padding:    '64px 32px',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
          <div style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.medium, color: colours.income, marginBottom: '12px' }}>
            Submission received
          </div>
          <div style={{ fontSize: fontSize.base, color: colours.textSecondary, lineHeight: 1.6, maxWidth: '360px', margin: '0 auto 24px' }}>
            Your Self Assessment for {client.tax_year} has been submitted to HMRC.
            Your accountant will confirm when it's been accepted.
          </div>
          <div style={{ fontSize: fontSize.sm, fontFamily: fonts.mono, color: colours.textMuted, letterSpacing: '0.06em' }}>
            Reference: SA-{client.tax_year.replace('-', '')}-{Date.now().toString(36).toUpperCase().slice(-6)}
          </div>
        </div>
        <div style={{ width: '280px', flexShrink: 0 }}>
          <HmrcCalendar taxYear={client.tax_year} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: spacing.tab.gap, alignItems: 'flex-start' }}>

      {/* ── Left: stepper ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>

        {/* Draft restored banner */}
        {draftBanner && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
            padding:      '8px 14px',
            background:   colours.warningLight,
            border:       `1px solid ${colours.warning}33`,
            borderRadius: radius.sm,
            fontSize:     fontSize.xs,
            color:        colours.warning,
          }}>
            <span>
              ◉ Draft restored
              {lastSaved ? ` — last saved ${lastSaved.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
            <button
              onClick={clearDraft}
              style={{ background: 'none', border: 'none', color: colours.warning, cursor: 'pointer', fontSize: fontSize.xs, padding: '0 4px' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Saved confirmation */}
        {savedBanner && (
          <div style={{
            padding:      '8px 14px',
            background:   colours.accentSoft,
            border:       `1px solid ${colours.accentBorder}`,
            borderRadius: radius.sm,
            fontSize:     fontSize.xs,
            color:        colours.accent,
          }}>
            ✓ Progress saved on this device
          </div>
        )}

        <div style={{ ...glass.card(mode), padding: spacing.panel.padding }}>
          <StepBar current={step} />

          {/* Step 1: Income */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: fonts.sans, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '8px' }}>
                Income summary
              </div>
              <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
                Review your total income for {client.tax_year}. This will be reported on your SA103 form.
              </div>
              <SummaryRow label="Total trading income" value={formatGBP(totalIncome)} colour={colours.income} />
              <SummaryRow label="Entries recorded"     value={`${income.length} item${income.length === 1 ? '' : 's'}`} />
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={saveProgress}>Save progress</Button>
                <Button onClick={() => setStep(2)}>Continue to Expenses →</Button>
              </div>
            </div>
          )}

          {/* Step 2: Expenses */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: fonts.sans, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '8px' }}>
                Allowable expenses
              </div>
              <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
                Only allowable expenses reduce your tax bill. Pending expenses aren't included until your accountant reviews them.
              </div>
              <SummaryRow label="Total expenses logged" value={formatGBP(totalExpenses)} />
              <SummaryRow label="Confirmed allowable"   value={formatGBP(allowable)} colour={colours.expense} />
              <SummaryRow label="Pending review"        value={`${expenses.filter(e => e.allowable === null).length} items`} />
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={() => setStep(1)}>← Back</Button>
                  <Button variant="secondary" size="sm" onClick={saveProgress}>Save progress</Button>
                </div>
                <Button onClick={() => setStep(3)}>Continue to Adjustments →</Button>
              </div>
            </div>
          )}

          {/* Step 3: Adjustments */}
          {step === 3 && (
            <div>
              <div style={{ fontFamily: fonts.sans, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '8px' }}>
                Adjustments & calculation
              </div>
              <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
                Your personal allowance reduces the amount of income subject to tax.
              </div>
              <SummaryRow label="Net profit"          value={formatGBP(netProfit)} />
              <SummaryRow label="Personal allowance"  value={`(${formatGBP(personalAllowance)})`} colour={colours.expense} />
              <SummaryRow label="Taxable income"      value={formatGBP(taxableIncome)} />
              <SummaryRow label="Estimated tax (20%)" value={formatGBP(estimatedTax)} colour={estimatedTax > 0 ? colours.danger : colours.income} />
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={() => setStep(2)}>← Back</Button>
                  <Button variant="secondary" size="sm" onClick={saveProgress}>Save progress</Button>
                </div>
                <Button onClick={() => setStep(4)}>Review & Submit →</Button>
              </div>
            </div>
          )}

          {/* Step 4: Submit */}
          {step === 4 && (
            <div>
              <div style={{ fontFamily: fonts.sans, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '8px' }}>
                Review & submit
              </div>
              <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
                Your accountant has prepared your return. Review the summary below and submit to HMRC.
              </div>
              <SummaryRow label="Tax year"            value={client.tax_year} />
              <SummaryRow label="Total income"        value={formatGBP(totalIncome)} colour={colours.income} />
              <SummaryRow label="Allowable expenses"  value={formatGBP(allowable)} colour={colours.expense} />
              <SummaryRow label="Net profit"          value={formatGBP(netProfit)} />
              <SummaryRow label="Tax due"             value={formatGBP(estimatedTax)} colour={colours.danger} />
              <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: radius.sm, background: colours.infoLight, fontSize: fontSize.xs, color: colours.info, lineHeight: 1.5 }}>
                By submitting, you confirm that the information provided is correct to the best of your knowledge.
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={() => setStep(3)}>← Back</Button>
                <Button shimmer onClick={() => { clearDraft(); setSubmitted(true) }}>
                  Submit to HMRC ⬡
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: HMRC calendar ── */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <HmrcCalendar taxYear={client.tax_year} />
      </div>
    </div>
  )
}
