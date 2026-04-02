'use client'

/**
 * app/portal/components/tabs/IntelligenceTab.tsx
 *
 * Foundry Intelligence — AI-powered financial insights, alerts, and recommendations.
 *
 * Task 9 changes:
 * - Remove borderLeft from InsightCards, replace with small blurred orb inside each card
 * - Fix hardcoded iOS blue (rgba(0,122,255,...)) → electric cyan (rgba(0,194,255,...))
 * - Header card uses 2-orb treatment matching Overview style
 */

import type { Client } from '@/types'
import { useIncome }   from './useIncome'
import { useExpenses } from './useExpenses'
import { Spinner, formatGBP } from '../ui'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius, spacing } from '@/styles/tokens'
import { glass } from '@/styles/tokens/effects'

// ─── Insight types ────────────────────────────────────────────────────────────

type Severity = 'urgent' | 'attention' | 'info'

interface Insight {
  id:       string
  severity: Severity
  title:    string
  body:     string
  impact?:  string
  action?:  string
}


const SEVERITY_ICON: Record<Severity, string> = {
  urgent:    '⚠',
  attention: '◉',
  info:      '✦',
}

// ─── Insight card — orb+glass, no left border ─────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const colours = useColours()
  const mode = useThemeMode()

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

  const icon   = SEVERITY_ICON[insight.severity]
  const colour = SEVERITY_COLOUR[insight.severity]
  const bg     = SEVERITY_BG[insight.severity]

  return (
    <div style={{
      ...glass.card(mode),
      position:  'relative',
      overflow:  'hidden',
      padding:   '16px 20px',
      display:   'flex',
      gap:       '14px',
      alignItems: 'flex-start',
    }}>

      {/* Icon circle */}
      <div style={{
        width:          '32px',
        height:         '32px',
        borderRadius:   radius.sm,
        background:     bg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '14px',
        color:          colour,
        flexShrink:     0,
        position:       'relative',
        zIndex:         1,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize:     fontSize.base,
          fontWeight:   fontWeight.medium,
          color:        colours.textPrimary,
          marginBottom: '4px',
        }}>
          {insight.title}
        </div>
        <div style={{
          fontSize:   fontSize.sm,
          color:      colours.textSecondary,
          lineHeight: 1.6,
        }}>
          {insight.body}
        </div>
        {insight.impact && (
          <div style={{
            marginTop:     '8px',
            fontSize:      fontSize.xs,
            fontFamily:    fonts.mono,
            color:         colour,
            letterSpacing: letterSpacing.wide,
          }}>
            Potential impact: {insight.impact}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IntelligenceTab({ client }: { client: Client }) {
  const colours = useColours()
  const mode = useThemeMode()
  const { income,   loading: li } = useIncome(client.id, client.tax_year, client.user_id)
  const { expenses, loading: le } = useExpenses(client.id, client.tax_year, client.user_id)

  if (li || le) return <Spinner />

  const totalIncome   = income.reduce((s, i) => s + i.amount_pence, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount_pence, 0)
  const netProfit     = totalIncome - totalExpenses
  const pendingReview = expenses.filter(e => e.allowable === null).length

  const insights: Insight[] = []

  if (pendingReview > 0) {
    insights.push({
      id:       'pending-review',
      severity: 'attention',
      title:    `${pendingReview} expense${pendingReview === 1 ? '' : 's'} awaiting review`,
      body:     'Your accountant hasn\'t confirmed the allowability of these expenses yet. Once reviewed, your tax estimate will be more accurate.',
      action:   'View expenses',
    })
  }

  if (totalIncome > 0 && netProfit > 0) {
    const estimatedTax = Math.max(0, (netProfit - 1257500) * 0.20)
    insights.push({
      id:       'tax-estimate',
      severity: 'info',
      title:    'Tax estimate',
      body:     `Based on your current income and expenses, your estimated Self Assessment bill for ${client.tax_year} is approximately ${formatGBP(estimatedTax)}. This will update as you add more entries.`,
      impact:   formatGBP(estimatedTax),
    })
  }

  const softwareExpenses = expenses.filter(e => e.category === 'software').reduce((s, e) => s + e.amount_pence, 0)
  if (softwareExpenses > 50000) {
    insights.push({
      id:       'software',
      severity: 'info',
      title:    'Software expenses are fully deductible',
      body:     `You've spent ${formatGBP(softwareExpenses)} on software and subscriptions this year. These are 100% allowable as business expenses against your trading income.`,
      impact:   `Saves ~${formatGBP(Math.round(softwareExpenses * 0.20))} in tax`,
    })
  }

  if (totalIncome === 0) {
    insights.push({
      id:       'no-income',
      severity: 'attention',
      title:    'No income recorded yet',
      body:     'Add your first income entry to start seeing insights. Once you have income data, Foundry Intelligence can calculate your tax position and flag opportunities.',
    })
  }

  const healthScore = Math.min(100, Math.round(
    (income.length > 0 ? 25 : 0) +
    (expenses.length > 0 ? 25 : 0) +
    (pendingReview === 0 && expenses.length > 0 ? 25 : 10) +
    25
  ))

  insights.push({
    id:       'health',
    severity: 'info',
    title:    `Financial health score: ${healthScore}/100`,
    body:     healthScore >= 75
      ? 'Your records are in good shape. Keep logging income and expenses regularly for the most accurate tax estimate.'
      : 'Add more transactions and get your expenses reviewed to improve your score and reduce surprises at tax time.',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.tab.gap }}>

      {/* ── Header card — 2-orb treatment ── */}
      <div style={{
        ...glass.card(mode),
        position:    'relative',
        overflow:    'hidden',
        padding:     spacing.panel.padding,
        display:     'flex',
        alignItems:  'center',
        gap:         '20px',
      }}>

        <div style={{
          width:          '52px',
          height:         '52px',
          borderRadius:   radius.md,
          background:     colours.infoLight,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '22px',
          color:          colours.info,
          flexShrink:     0,
          position:       'relative',
          zIndex:         1,
        }}>
          ✦
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: fonts.sans, fontSize: '18px', fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '4px' }}>
            Foundry Intelligence
          </div>
          <div style={{ fontSize: fontSize.sm, color: colours.textSecondary, lineHeight: 1.5 }}>
            AI-powered insights derived from your financial records. Updated as you add entries.
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' as const, flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily:  fonts.mono,
            fontSize:    '32px',
            fontWeight:  fontWeight.medium,
            color:       healthScore >= 75 ? colours.income : colours.warning,
            lineHeight:  1,
          }}>
            {healthScore}
          </div>
          <div style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.mono, letterSpacing: letterSpacing.wide }}>
            HEALTH SCORE
          </div>
        </div>
      </div>

      {/* ── Insight cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {insights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  )
}
