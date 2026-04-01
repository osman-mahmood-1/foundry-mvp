'use client'

/**
 * app/portal/components/tabs/SubmissionTab.tsx
 *
 * Submission Centre — guided Self Assessment filing flow.
 * 4-step stepper: Income summary → Expenses → Adjustments → Submit
 */

import { useState } from 'react'
import type { Client } from '@/types'
import { useIncome }   from './useIncome'
import { useExpenses } from './useExpenses'
import { Panel, Spinner, Button, formatGBP } from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, glassStatic, transition, spacing } from '@/styles/tokens'

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Income',      icon: '↑' },
  { id: 2, label: 'Expenses',    icon: '↓' },
  { id: 3, label: 'Adjustments', icon: '◉' },
  { id: 4, label: 'Submit',      icon: '⬡' },
]

function StepBar({ current }: { current: number }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '0',
      marginBottom:   '32px',
    }}>
      {STEPS.map((step, idx) => {
        const done    = step.id < current
        const active  = step.id === current
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Step circle */}
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '6px',
            }}>
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
                color:          (done || active) ? '#FFFFFF' : colours.textMuted,
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
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div style={{
                width:      '80px',
                height:     '2px',
                background: done ? colours.income : colours.borderLight,
                marginBottom: '22px',
                transition: transition.fast,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step panels ─────────────────────────────────────────────────────────────

function SummaryRow({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '10px 0',
      borderBottom:   `1px solid ${colours.borderHairline}`,
    }}>
      <span style={{ fontSize: fontSize.base, color: colours.textSecondary }}>{label}</span>
      <span style={{
        fontFamily:    fonts.mono,
        fontSize:      fontSize.base,
        fontWeight:    fontWeight.semibold,
        color:         colour ?? colours.textPrimary,
        letterSpacing: letterSpacing.tight,
      }}>
        {value}
      </span>
    </div>
  )
}

export default function SubmissionTab({ client }: { client: Client }) {
  const [step, setStep]     = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const { income,   loading: li } = useIncome(client.id, client.tax_year, client.user_id)
  const { expenses, loading: le } = useExpenses(client.id, client.tax_year, client.user_id)

  if (li || le) return <Spinner />

  const totalIncome   = income.reduce((s, i) => s + i.amount_pence, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount_pence, 0)
  const allowable     = expenses.filter(e => e.allowable === true).reduce((s, e) => s + e.amount_pence, 0)
  const netProfit     = totalIncome - allowable
  const personalAllowance = 1257500
  const taxableIncome     = Math.max(0, netProfit - personalAllowance)
  const estimatedTax      = taxableIncome > 0 ? Math.round(taxableIncome * 0.20) : 0

  if (submitted) {
    return (
      <Panel style={{ textAlign: 'center' as const, padding: '64px 32px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
        <div style={{
          fontFamily:   fonts.serif,
          fontSize:     '22px',
          fontWeight:   fontWeight.medium,
          color:        colours.income,
          marginBottom: '12px',
        }}>
          Submission received
        </div>
        <div style={{
          fontSize:   fontSize.base,
          color:      colours.textSecondary,
          lineHeight: 1.6,
          maxWidth:   '360px',
          margin:     '0 auto 24px',
        }}>
          Your Self Assessment for {client.tax_year} has been submitted to HMRC.
          Your accountant will confirm when it's been accepted.
        </div>
        <div style={{
          fontSize:      fontSize.sm,
          fontFamily:    fonts.mono,
          color:         colours.textMuted,
          letterSpacing: '0.06em',
        }}>
          Reference: SA-{client.tax_year.replace('-', '')}-{Date.now().toString(36).toUpperCase().slice(-6)}
        </div>
      </Panel>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>
      <div style={{
        ...glassStatic.panel,
        padding: `${spacing.panel.padding} ${spacing.panel.padding} ${spacing.panel.padding}`,
      }}>
        <StepBar current={step} />

        {/* Step 1: Income */}
        {step === 1 && (
          <div>
            <div style={{
              fontFamily:   fonts.serif,
              fontSize:     '18px',
              fontWeight:   fontWeight.medium,
              color:        colours.textPrimary,
              marginBottom: '8px',
            }}>
              Income summary
            </div>
            <div style={{
              fontSize:     fontSize.sm,
              color:        colours.textSecondary,
              marginBottom: '24px',
              lineHeight:   1.6,
            }}>
              Review your total income for {client.tax_year}. This will be reported on your SA103 form.
            </div>
            <SummaryRow label="Total trading income"   value={formatGBP(totalIncome)} colour={colours.income} />
            <SummaryRow label="Entries recorded"       value={`${income.length} item${income.length === 1 ? '' : 's'}`} />
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setStep(2)}>
                Continue to Expenses →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Expenses */}
        {step === 2 && (
          <div>
            <div style={{ fontFamily: fonts.serif, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '8px' }}>
              Allowable expenses
            </div>
            <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
              Only allowable expenses reduce your tax bill. Pending expenses aren't included until your accountant reviews them.
            </div>
            <SummaryRow label="Total expenses logged"  value={formatGBP(totalExpenses)} />
            <SummaryRow label="Confirmed allowable"    value={formatGBP(allowable)} colour={colours.expense} />
            <SummaryRow label="Pending review"         value={`${expenses.filter(e => e.allowable === null).length} items`} />
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)}>Continue to Adjustments →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Adjustments */}
        {step === 3 && (
          <div>
            <div style={{ fontFamily: fonts.serif, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '8px' }}>
              Adjustments & calculation
            </div>
            <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
              Your personal allowance reduces the amount of income subject to tax.
            </div>
            <SummaryRow label="Net profit"              value={formatGBP(netProfit)} />
            <SummaryRow label="Personal allowance"      value={`(${formatGBP(personalAllowance)})`} colour={colours.expense} />
            <SummaryRow label="Taxable income"          value={formatGBP(taxableIncome)} />
            <SummaryRow label="Estimated tax (20%)"     value={formatGBP(estimatedTax)} colour={estimatedTax > 0 ? colours.danger : colours.income} />
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={() => setStep(4)}>Review & Submit →</Button>
            </div>
          </div>
        )}

        {/* Step 4: Submit */}
        {step === 4 && (
          <div>
            <div style={{ fontFamily: fonts.serif, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '8px' }}>
              Review & submit
            </div>
            <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, marginBottom: '24px', lineHeight: 1.6 }}>
              Your accountant has prepared your return. Review the summary below and submit to HMRC.
            </div>
            <SummaryRow label="Tax year"          value={client.tax_year} />
            <SummaryRow label="Total income"      value={formatGBP(totalIncome)} colour={colours.income} />
            <SummaryRow label="Allowable expenses" value={formatGBP(allowable)} colour={colours.expense} />
            <SummaryRow label="Net profit"         value={formatGBP(netProfit)} />
            <SummaryRow label="Tax due"            value={formatGBP(estimatedTax)} colour={colours.danger} />
            <div style={{
              marginTop:    '16px',
              padding:      '12px 16px',
              borderRadius: radius.sm,
              background:   colours.infoLight,
              fontSize:     fontSize.xs,
              color:        colours.info,
              lineHeight:   1.5,
            }}>
              By submitting, you confirm that the information provided is correct to the best of your knowledge.
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={() => setStep(3)}>← Back</Button>
              <Button onClick={() => setSubmitted(true)}>
                Submit to HMRC ⬡
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
