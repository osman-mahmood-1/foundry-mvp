'use client'

/**
 * app/portal/components/mobile/tabs/MobileSubmissionTab.tsx
 *
 * Two sections in one scroll:
 *   1. Current submission — progress bar + checklist + deadline badge
 *   2. Prior Returns — list of previous tax years, tap to expand inline
 */

import { useState }       from 'react'
import type { Client, PortalTab } from '@/types'
import { useIncome }      from '@/app/portal/components/tabs/useIncome'
import { useExpenses }    from '@/app/portal/components/tabs/useExpenses'
import { useColours }     from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }         from '@/styles/tokens'
import { Button }         from '@/app/portal/components/ui'

interface Props {
  client:      Client
  onTabChange: (tab: PortalTab) => void
}

// Mock prior returns data
const PRIOR_RETURNS = [
  { year: '2023-24', status: 'filed',       date: '2024-01-15', refund: 0 },
  { year: '2022-23', status: 'filed',       date: '2023-01-20', refund: 0 },
  { year: '2021-22', status: 'filed',       date: '2022-01-28', refund: 0 },
]

function statusStyle(colours: { income: string; warningDark: string; danger: string; accentLight: string; accent: string; borderHairline: string; textMuted: string }, status: string): { bg: string; text: string } {
  if (status === 'filed')       return { bg: colours.accentLight,  text: colours.accent }
  if (status === 'in_progress') return { bg: colours.accentLight,  text: colours.accent }
  if (status === 'overdue')     return { bg: 'rgba(0,0,0,0.06)',   text: colours.danger }
  return { bg: colours.accentLight, text: colours.textMuted }
}

// Tasks are derived from real data — no hardcoded state

export default function MobileSubmissionTab({ client, onTabChange }: Props) {
  const colours = useColours()
  const [expandedYear, setExpandedYear] = useState<string | null>(null)

  const { income   } = useIncome(client.id, client.tax_year, client.user_id)
  const { expenses } = useExpenses(client.id, client.tax_year, client.user_id)

  const incomePence   = income.reduce((s, i) => s + i.amount_pence, 0)
  const expensesPence = expenses.reduce((s, e) => s + e.amount_pence, 0)
  const taxablePence  = Math.max(0, incomePence - expensesPence)

  // Derive checklist from real data — each item reflects actual portal state
  const tasks = [
    { id: 1, label: 'Add at least one income entry',    done: income.length > 0 },
    { id: 2, label: 'Add at least one expense',         done: expenses.length > 0 },
    { id: 3, label: 'Review your tax estimate',         done: incomePence > 0 },
  ]
  const doneTasks  = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const progress   = Math.round((doneTasks / totalTasks) * 100)

  // SA deadline — Jan 31 following the end year
  const endYear = parseInt(client.tax_year.split('-')[1] ?? '25') + 2000
  const deadline = new Date(endYear + 1, 0, 31)
  const today    = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Section 1 — Current submission */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   '16px',
        }}>
          <h2 style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Submission Centre
          </h2>
          {daysLeft > 0 && (
            <span style={{
              padding:      '4px 10px',
              borderRadius: radius.sm,
              background:   daysLeft < 30 ? colours.warningLight : colours.accentLight,
              color:        daysLeft < 30 ? colours.warning : colours.accent,
              fontFamily:   fonts.sans,
              fontSize:     '11px',
              fontWeight:   fontWeight.medium,
            }}>
              {daysLeft}d left
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontFamily: fonts.sans, fontSize: '12px', color: colours.textMuted }}>
              {doneTasks} of {totalTasks} tasks complete
            </span>
            <span style={{ fontFamily: fonts.sans, fontSize: '12px', fontWeight: fontWeight.medium, color: colours.teal }}>
              {progress}%
            </span>
          </div>
          <div style={{
            height:       '3px',
            borderRadius: '2px',
            background:   colours.borderHairline,
            overflow:     'hidden',
          }}>
            <div style={{
              height:       '100%',
              width:        `${progress}%`,
              background:   colours.teal,
              borderRadius: '2px',
              transition:   'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Summary figures */}
        <div style={{
          display:      'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:          '8px',
          marginBottom: '16px',
        }}>
          {[
            { label: 'Total income',   value: fmt(incomePence),   colour: colours.income },
            { label: 'Total expenses', value: fmt(expensesPence), colour: colours.expense },
            { label: 'Taxable profit', value: fmt(taxablePence),  colour: colours.textPrimary },
          ].map(r => (
            <div key={r.label} style={{
              padding:      '12px 14px',
              borderRadius: radius.md,
              background:   colours.cardBg,
              border:       `1px solid ${colours.cardBorder}`,
            }}>
              <div style={{ fontFamily: fonts.sans, fontSize: '10px', color: colours.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '4px' }}>
                {r.label}
              </div>
              <div style={{ fontFamily: fonts.sans, fontSize: '16px', fontWeight: fontWeight.semibold, color: r.colour, fontVariantNumeric: 'tabular-nums' }}>
                {r.value}
              </div>
            </div>
          ))}
        </div>

        {/* Task checklist */}
        <div style={{
          borderRadius: radius.lg,
          border:       `1px solid ${colours.cardBorder}`,
          overflow:     'hidden',
          background:   colours.cardBg,
          marginBottom: '16px',
        }}>
          {tasks.map((task, idx) => (
            <div key={task.id} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              padding:      '12px 16px',
              borderBottom: idx === tasks.length - 1 ? 'none' : `1px solid ${colours.borderHairline}`,
              minHeight:    '48px',
            }}>
              <div style={{
                width:          '20px',
                height:         '20px',
                borderRadius:   '50%',
                border:         `1.5px solid ${task.done ? colours.teal : colours.borderMedium}`,
                background:     task.done ? colours.tealLight : 'transparent',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}>
                {task.done && <span style={{ fontSize: '10px', color: colours.teal }}>✓</span>}
              </div>
              <span style={{
                fontFamily:  fonts.sans,
                fontSize:    '14px',
                color:       task.done ? colours.textMuted : colours.textPrimary,
                textDecoration: task.done ? 'line-through' : 'none',
                opacity:     task.done ? 0.6 : 1,
              }}>
                {task.label}
              </span>
            </div>
          ))}
        </div>

        {/* Submit CTA */}
        <Button shimmer onClick={() => {}}>
          Submit to HMRC ⬡
        </Button>
      </div>

      {/* Section 2 — Prior Returns */}
      <div style={{ padding: '28px 16px 0' }}>
        <div style={{
          fontFamily:    fonts.sans,
          fontSize:      '11px',
          fontWeight:    fontWeight.medium,
          color:         colours.textMuted,
          letterSpacing: '0.10em',
          textTransform: 'uppercase' as const,
          marginBottom:  '12px',
        }}>
          Prior Returns
        </div>

        <div style={{
          borderRadius: radius.lg,
          border:       `1px solid ${colours.cardBorder}`,
          overflow:     'hidden',
          background:   colours.cardBg,
        }}>
          {PRIOR_RETURNS.map((pr, idx) => {
            const sc       = statusStyle(colours, pr.status)
            const expanded = expandedYear === pr.year
            return (
              <div key={pr.year} style={{ borderBottom: idx === PRIOR_RETURNS.length - 1 && !expanded ? 'none' : `1px solid ${colours.borderHairline}` }}>
                {/* Row */}
                <div
                  onClick={() => setExpandedYear(expanded ? null : pr.year)}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    padding:     '14px 16px',
                    cursor:      'pointer',
                    minHeight:   '52px',
                    background:  expanded ? colours.accentSoft : 'transparent',
                  }}
                >
                  <span style={{ fontFamily: fonts.sans, fontSize: '14px', fontWeight: fontWeight.medium, color: colours.textPrimary, flex: 1 }}>
                    {pr.year}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: radius.sm,
                    background: sc.bg, color: sc.text,
                    fontSize: '11px', fontFamily: fonts.sans, fontWeight: fontWeight.medium,
                    marginRight: '8px',
                  }}>
                    {pr.status}
                  </span>
                  <span style={{ fontSize: '12px', color: colours.textMuted, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>▾</span>
                </div>

                {/* Expanded detail */}
                {expanded && (
                  <div style={{ padding: '12px 16px 16px', background: colours.cardBg, borderTop: `1px solid ${colours.borderHairline}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Tax year',  value: pr.year },
                        { label: 'Filed',     value: new Date(pr.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
                        { label: 'Status',    value: pr.status.charAt(0).toUpperCase() + pr.status.slice(1) },
                      ].map(r => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: fonts.sans, fontSize: '13px', color: colours.textMuted }}>{r.label}</span>
                          <span style={{ fontFamily: fonts.sans, fontSize: '13px', color: colours.textPrimary }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <button style={{
                      marginTop:    '12px',
                      width:        '100%',
                      height:       '40px',
                      borderRadius: radius.md,
                      border:       `1px solid ${colours.borderMedium}`,
                      background:   colours.hoverBg,
                      color:        colours.textSecondary,
                      fontFamily:   fonts.sans,
                      fontSize:     '13px',
                      cursor:       'pointer',
                    }}>
                      Download SA302 ↓
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
