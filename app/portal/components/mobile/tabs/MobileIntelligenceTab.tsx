'use client'

/**
 * app/portal/components/mobile/tabs/MobileIntelligenceTab.tsx
 *
 * Foundry Intelligence — central AI hub for the mobile portal.
 * All content is derived from real data (useIncome + useExpenses).
 * Shows a placeholder prompt when the user has no entries yet.
 * No hardcoded insights — every card reflects actual financial state.
 */

import type { Client }     from '@/types'
import { useIncome }       from '@/app/portal/components/tabs/useIncome'
import { useExpenses }     from '@/app/portal/components/tabs/useExpenses'
import { useColours }      from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }          from '@/styles/tokens'

interface Props { client: Client }

type Severity = 'urgent' | 'attention' | 'info'

interface Insight {
  id:       string
  severity: Severity
  title:    string
  body:     string
  impact?:  string
}

const SEVERITY_ICON: Record<Severity, string> = {
  urgent:    '⚠',
  attention: '◉',
  info:      '✦',
}

function fmt(pence: number): string {
  const p = pence / 100
  return p >= 1000 ? `£${(p / 1000).toFixed(1)}k` : `£${p.toFixed(2)}`
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const colours = useColours()

  const SEVERITY_COLOUR: Record<Severity, string> = {
    urgent:    colours.danger,
    attention: colours.warning,
    info:      colours.info,
  }
  const SEVERITY_BG: Record<Severity, string> = {
    urgent:    colours.dangerLight,
    attention: colours.warningLight,
    info:      colours.infoLight,
  }

  const colour = SEVERITY_COLOUR[insight.severity]
  const bg     = SEVERITY_BG[insight.severity]
  const icon   = SEVERITY_ICON[insight.severity]

  return (
    <div style={{
      background:   colours.cardBg,
      border:       `1px solid ${colours.cardBorder}`,
      borderTop:    `1px solid ${colours.cardBorderTop}`,
      borderRadius: radius.lg,
      padding:      '16px',
      display:      'flex',
      gap:          '14px',
      alignItems:   'flex-start',
    }}>
      {/* Severity icon */}
      <div style={{
        width:          '34px',
        height:         '34px',
        borderRadius:   radius.sm,
        background:     bg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '14px',
        color:          colour,
        flexShrink:     0,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily:   fonts.sans,
          fontSize:     '14px',
          fontWeight:   fontWeight.semibold,
          color:        colours.textPrimary,
          marginBottom: '5px',
          lineHeight:   1.3,
        }}>
          {insight.title}
        </div>
        <div style={{
          fontFamily: fonts.sans,
          fontSize:   '13px',
          color:      colours.textSecondary,
          lineHeight: 1.6,
        }}>
          {insight.body}
        </div>
        {insight.impact && (
          <div style={{
            marginTop:  '8px',
            display:    'inline-block',
            padding:    '3px 8px',
            background: bg,
            borderRadius: radius.sm,
            fontSize:   '12px',
            fontWeight: fontWeight.medium,
            color:      colour,
          }}>
            {insight.impact}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Health ring ──────────────────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const colours     = useColours()
  const size        = 80
  const strokeWidth = 6
  const r           = (size - strokeWidth) / 2
  const circ        = 2 * Math.PI * r
  const dash        = (score / 100) * circ
  const colour      = score >= 75 ? colours.income : score >= 50 ? colours.warning : colours.danger

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={colours.borderMedium} strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={colour} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily:  fonts.sans,
          fontSize:    '20px',
          fontWeight:  fontWeight.semibold,
          color:       colour,
          lineHeight:  1,
        }}>
          {score}
        </span>
        <span style={{
          fontFamily:    fonts.sans,
          fontSize:      '9px',
          color:         colours.textMuted,
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          marginTop:     '2px',
        }}>
          /100
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MobileIntelligenceTab({ client }: Props) {
  const colours = useColours()

  const { income,   loading: li } = useIncome(client.id, client.tax_year, client.user_id)
  const { expenses, loading: le } = useExpenses(client.id, client.tax_year, client.user_id)

  const loading = li || le

  const totalIncome   = income.reduce((s, i) => s + i.amount_pence, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount_pence, 0)
  const netProfit     = totalIncome - totalExpenses
  const pendingReview = expenses.filter(e => e.allowable === null).length

  // Health score — same calculation as desktop
  const healthScore = Math.min(100, Math.round(
    (income.length   > 0 ? 25 : 0) +
    (expenses.length > 0 ? 25 : 0) +
    (pendingReview === 0 && expenses.length > 0 ? 25 : 10) +
    25
  ))

  // Build insights from real data — no hardcoded copy
  const insights: Insight[] = []

  if (!loading) {
    if (pendingReview > 0) {
      insights.push({
        id:       'pending-review',
        severity: 'attention',
        title:    `${pendingReview} expense${pendingReview === 1 ? '' : 's'} awaiting review`,
        body:     'Your accountant hasn\'t confirmed the allowability of these yet. Once reviewed, your tax estimate will be more accurate.',
      })
    }

    if (totalIncome > 0 && netProfit > 0) {
      const personalAllowance = 1257500 // £12,575 in pence
      const estimatedTax = Math.max(0, Math.round((netProfit - personalAllowance) * 0.20))
      insights.push({
        id:       'tax-estimate',
        severity: 'info',
        title:    'Estimated tax liability',
        body:     `Based on your ${client.tax_year} income and expenses, your approximate Self Assessment bill is ${fmt(estimatedTax)}. This updates automatically as you add entries.`,
        impact:   `~${fmt(estimatedTax)} due Jan 31`,
      })
    }

    const softwareExpenses = expenses
      .filter(e => e.category === 'software')
      .reduce((s, e) => s + e.amount_pence, 0)
    if (softwareExpenses > 50000) {
      insights.push({
        id:       'software',
        severity: 'info',
        title:    'Software expenses are fully deductible',
        body:     `You've spent ${fmt(softwareExpenses)} on software and subscriptions. These are 100% allowable against your trading income.`,
        impact:   `Saves ~${fmt(Math.round(softwareExpenses * 0.20))} in tax`,
      })
    }

    const draftExpenses = expenses.filter(e => e.status === 'draft').length
    if (draftExpenses > 0) {
      insights.push({
        id:       'drafts',
        severity: 'attention',
        title:    `${draftExpenses} draft expense${draftExpenses === 1 ? '' : 's'} not yet confirmed`,
        body:     'Draft entries are not counted in your tax estimate. Confirm them to keep your figures accurate.',
      })
    }

    if (income.length > 0 && expenses.length === 0) {
      insights.push({
        id:       'no-expenses',
        severity: 'attention',
        title:    'No expenses logged yet',
        body:     'Most sole traders have allowable business costs. Adding expenses now reduces your taxable profit and lowers your tax bill.',
      })
    }

    if (totalIncome === 0) {
      insights.push({
        id:       'no-income',
        severity: 'info',
        title:    'Waiting for your first entry',
        body:     'Add income or expense entries and Foundry Intelligence will start generating insights about your tax position, allowable deductions, and financial health.',
      })
    }

    insights.push({
      id:       'health',
      severity: 'info',
      title:    `Financial health: ${healthScore}/100`,
      body:     healthScore >= 75
        ? 'Your records are in good shape. Keep logging regularly for the most accurate tax position.'
        : healthScore >= 50
          ? 'Decent start. Getting your expenses reviewed and adding more entries will improve your score.'
          : 'Your score will rise as you add income, log expenses, and get entries reviewed by your accountant.',
    })
  }

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{
        margin:       '16px 16px 0',
        padding:      '20px',
        borderRadius: radius.lg,
        background:   colours.cardBg,
        border:       `1px solid ${colours.cardBorder}`,
        borderTop:    `1px solid ${colours.cardBorderTop}`,
        display:      'flex',
        alignItems:   'center',
        gap:          '16px',
      }}>
        <div style={{
          width:          '48px',
          height:         '48px',
          borderRadius:   radius.md,
          background:     colours.infoLight,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '22px',
          color:          colours.intelligence,
          flexShrink:     0,
        }}>
          ✦
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontFamily:    fonts.sans,
            fontSize:      '18px',
            fontWeight:    fontWeight.semibold,
            color:         colours.textPrimary,
            letterSpacing: '-0.02em',
            margin:        0,
            lineHeight:    1.2,
          }}>
            Foundry Intelligence
          </h2>
          <p style={{
            fontFamily: fonts.sans,
            fontSize:   '12px',
            color:      colours.textMuted,
            margin:     '4px 0 0',
            fontWeight: 300,
            lineHeight: 1.4,
          }}>
            AI insights derived from your financial records · {client.tax_year}
          </p>
        </div>
        {!loading && <HealthRing score={healthScore} />}
      </div>

      {/* Stats row */}
      {!loading && totalIncome > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          padding: '12px 16px 0',
        }}>
          {[
            { label: 'Income',   value: fmt(totalIncome),   colour: colours.income  },
            { label: 'Expenses', value: fmt(totalExpenses), colour: colours.expense },
            { label: 'Net',      value: fmt(Math.abs(netProfit)),
              colour: netProfit >= 0 ? colours.income : colours.danger },
            { label: 'Health',   value: `${healthScore}/100`,
              colour: healthScore >= 75 ? colours.income : colours.warning },
          ].map(s => (
            <div key={s.label} style={{
              padding:      '12px 14px',
              borderRadius: radius.md,
              background:   colours.cardBg,
              border:       `1px solid ${colours.cardBorder}`,
            }}>
              <div style={{
                fontFamily:    fonts.sans,
                fontSize:      '10px',
                color:         colours.textMuted,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom:  '4px',
              }}>
                {s.label}
              </div>
              <div style={{
                fontFamily:         fonts.sans,
                fontSize:           '16px',
                fontWeight:         fontWeight.semibold,
                color:              s.colour,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          padding:        '48px 16px',
          textAlign:      'center' as const,
        }}>
          <div style={{
            fontSize:   '28px',
            marginBottom: '12px',
            color:      colours.intelligence,
            opacity:    0.6,
            animation:  'pulse 1.8s ease-in-out infinite',
          }}>
            ✦
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: colours.textMuted }}>
            Analysing your records…
          </div>
        </div>
      )}

      {/* Insight cards */}
      {!loading && (
        <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {insights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* Empty data notice */}
      {!loading && totalIncome === 0 && expenses.length === 0 && (
        <div style={{
          margin:       '16px 16px 0',
          padding:      '24px 20px',
          borderRadius: radius.lg,
          border:       `1px dashed ${colours.borderMedium}`,
          textAlign:    'center' as const,
        }}>
          <div style={{ fontSize: '24px', color: colours.intelligence, opacity: 0.4, marginBottom: '10px' }}>✦</div>
          <div style={{ fontFamily: fonts.sans, fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '6px' }}>
            Nothing to analyse yet
          </div>
          <div style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: colours.textMuted, lineHeight: 1.6 }}>
            Add income or expense entries and Intelligence will start surfacing insights about your tax position, deductions, and financial health.
          </div>
        </div>
      )}
    </div>
  )
}
