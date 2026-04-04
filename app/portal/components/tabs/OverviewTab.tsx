'use client'
import React from 'react'
import { useOverview } from './useOverview'
import { ErrorBanner } from '../ui'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { radius } from '@/styles/tokens'
import { glass } from '@/styles/tokens/effects'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(pence: number): string {
  const p = pence / 100
  return p >= 1000 ? `£${(p / 1000).toFixed(1)}k` : `£${p.toFixed(2)}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function catLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Stat Card — skill-spec glass with NO inline orbs ─────────────────────────

function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string
  accent: string; icon: string
}) {
  const colours = useColours()
  const mode = useThemeMode()
  return (
    <div style={{
      ...glass.card(mode),
      padding:   '20px',
      flex:      '1 1 200px',
      minWidth:  '180px',
    }}>
      {/* Icon */}
      <div style={{
        width:           36,
        height:          36,
        borderRadius:    radius.md,
        background:      `${accent}18`,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        marginBottom:    '12px',
        fontSize:        '18px',
      }}>
        {icon}
      </div>

      {/* Label */}
      <div style={{
        fontSize:      fontSize.xs,
        color:         colours.textMuted,
        fontWeight:    fontWeight.medium,
        fontFamily:    fonts.sans,
        marginBottom:  '4px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize:   fontSize.xl,
        fontWeight: fontWeight.semibold,
        color:      accent,
        fontFamily: fonts.sans,
        lineHeight: 1.1,
      }}>
        {value}
      </div>

      {sub && (
        <div style={{
          fontSize:  fontSize.xs,
          color:     colours.textMuted,
          fontFamily: fonts.sans,
          marginTop: '4px',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Transaction Row ───────────────────────────────────────────────────────────

function TxRow({ description, category, date, amount, type, status }: {
  description: string; category: string; date: string
  amount: number; type: 'income' | 'expense'; status: string
}) {
  const colours = useColours()
  const isIncome = type === 'income'
  const isDraft  = status === 'draft'
  const col      = isIncome ? colours.income : colours.expense

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '12px',
      padding:      '12px 0',
      borderBottom: `1px solid ${colours.borderLight}`,
    }}>
      <div style={{
        width:        8,
        height:       8,
        borderRadius: '50%',
        background:   col,
        flexShrink:   0,
        opacity:      isDraft ? 0.5 : 1,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     fontSize.sm,
          fontWeight:   fontWeight.medium,
          color:        isDraft ? colours.textMuted : colours.textPrimary,
          fontFamily:   fonts.sans,
          whiteSpace:   'nowrap' as const,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {description}
        </div>
        <div style={{
          fontSize:   fontSize.xs,
          color:      colours.textMuted,
          fontFamily: fonts.sans,
          marginTop:  '2px',
          display:    'flex',
          gap:        '8px',
          alignItems: 'center',
        }}>
          <span>{catLabel(category)}</span>
          {isDraft && (
            <span style={{
              background:   colours.warningLight,
              color:        colours.warning,
              padding:      '1px 6px',
              borderRadius: radius.md,
              fontSize:     '10px',
              fontWeight:   fontWeight.medium,
            }}>
              Draft
            </span>
          )}
        </div>
      </div>

      <div style={{
        fontSize:   fontSize.xs,
        color:      colours.textMuted,
        fontFamily: fonts.sans,
        flexShrink: 0,
      }}>
        {fmtDate(date)}
      </div>

      <div style={{
        fontSize:   fontSize.sm,
        fontWeight: fontWeight.semibold,
        color:      col,
        fontFamily: fonts.sans,
        flexShrink: 0,
        opacity:    isDraft ? 0.6 : 1,
      }}>
        {isIncome ? '+' : '−'}{fmt(amount)}
      </div>
    </div>
  )
}

// ── Quick Action ──────────────────────────────────────────────────────────────

function QuickAction({
  icon, label, onClick,
}: {
  icon: string; label: string; onClick: () => void
}) {
  const colours = useColours()
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        padding:      '8px 16px',
        background:   hovered ? colours.accentLight  : colours.hoverBg,
        border:       `1px solid ${hovered ? colours.accentBorder : colours.borderMedium}`,
        borderRadius: radius.md,
        cursor:       'pointer',
        fontSize:     fontSize.sm,
        fontFamily:   fonts.sans,
        fontWeight:   fontWeight.medium,
        color:        hovered ? colours.accent : colours.textSecondary,
        transition:   'all 0.15s ease',
        flexShrink:   0,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

interface Props {
  clientId:      string | null
  readOnly?:     boolean
  onTabChange?:  (tab: string) => void
}

export default function OverviewTab({ clientId, readOnly = false, onTabChange }: Props) {
  const colours = useColours()
  const mode = useThemeMode()
  const { stats, recent, taxYear, clientName, loading, error } = useOverview(clientId)

  if (loading) return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '40vh',
      color:          colours.textMuted,
      fontFamily:     fonts.sans,
      fontSize:       fontSize.sm,
    }}>
      Loading overview…
    </div>
  )

  if (error) return (
    <div style={{ padding: '24px' }}>
      <ErrorBanner error={error} />
    </div>
  )

  const profit = stats.incomePence - stats.expensesPence

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const now      = new Date()
  const dateStr  = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    /* Outer container — full width */
    <div style={{ padding: '4px 0 40px', minHeight: '100%' }}>

      {/* Content */}
      <div>

        {/* Greeting — overview tab only */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize:      fontSize.label,
            color:         colours.textMuted,
            fontFamily:    fonts.mono,
            letterSpacing: letterSpacing.wider,
            textTransform: 'uppercase' as const,
            marginBottom:  '2px',
          }}>
            {greeting}
          </div>
          <h1 style={{
            fontFamily: fonts.sans,
            fontSize:   fontSize['4xl'],
            fontWeight: fontWeight.medium,
            color:      colours.textPrimary,
            lineHeight: 1.2,
            margin:     '0 0 6px',
          }}>
            {clientName ? clientName.split(' ')[0] : 'Overview'}.
          </h1>
          <div style={{
            fontSize:      fontSize.xs,
            color:         colours.textMuted,
            fontFamily:    fonts.mono,
            letterSpacing: letterSpacing.wide,
          }}>
            {dateStr} · {timeStr}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{
          display:      'flex',
          flexWrap:     'wrap' as const,
          gap:          '16px',
          marginBottom: '24px',
        }}>
          <StatCard
            label="Income" value={fmt(stats.incomePence)}
            sub={`${taxYear} tax year`}
            accent={colours.income} icon="↑"
          />
          <StatCard
            label="Expenses" value={fmt(stats.expensesPence)}
            sub="Confirmed + draft"
            accent={colours.expense} icon="↓"
          />
          <StatCard
            label="Est. Tax" value={fmt(stats.estTaxPence)}
            sub="Rough estimate only"
            accent={colours.warning} icon="◈"
          />
          <StatCard
            label="Net Profit" value={fmt(Math.abs(profit))}
            sub={profit >= 0 ? 'Profit' : 'Loss so far'}
            accent={profit >= 0 ? colours.allowable : colours.danger}
            icon={profit >= 0 ? '▲' : '▼'}
          />
        </div>

        {/* Quick actions */}
        {!readOnly && (
          <div style={{
            display:      'flex',
            gap:          '10px',
            flexWrap:     'wrap' as const,
            marginBottom: '24px',
          }}>
            <QuickAction icon="+" label="Add income"       onClick={() => onTabChange?.('income')} />
            <QuickAction icon="+" label="Add expense"      onClick={() => onTabChange?.('expenses')} />
            <QuickAction icon="↑" label="Upload document"  onClick={() => onTabChange?.('documents')} />
          </div>
        )}

        {/* Recent transactions */}
        <div style={{
          ...glass.card(mode),
          padding: '20px',
        }}>
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   '16px',
          }}>
            <h2 style={{
              fontSize:   fontSize.base,
              fontWeight: fontWeight.semibold,
              color:      colours.textPrimary,
              fontFamily: fonts.sans,
              margin:     0,
            }}>
              Recent transactions
            </h2>
            <span style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.sans }}>
              {recent.length > 0 ? `${recent.length} shown` : ''}
            </span>
          </div>

          {recent.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' as const }}>
              <div style={{ fontSize: '28px', marginBottom: '12px', opacity: 0.3 }}>◈</div>
              <div style={{ fontSize: fontSize.sm, color: colours.textMuted, fontFamily: fonts.sans }}>
                No transactions yet for this tax year
              </div>
              <div style={{ fontSize: fontSize.xs, color: colours.textMuted, fontFamily: fonts.sans, marginTop: '4px', opacity: 0.7 }}>
                Add income or expenses to see them here
              </div>
            </div>
          ) : (
            recent.map(tx => (
              <TxRow
                key={tx.id}
                description={tx.description}
                category={tx.category}
                date={tx.date}
                amount={tx.amountPence}
                type={tx.type}
                status={tx.status}
              />
            ))
          )}
        </div>

        {/* Action nudge */}
        {(stats.docsNeedingReview > 0 || stats.openTasks > 0) && (
          <div style={{
            marginTop:    '16px',
            padding:      '16px',
            background:   colours.accentSoft,
            border:       `1px solid ${colours.accentBorder}`,
            borderRadius: radius.lg,
            display:      'flex',
            alignItems:   'center',
            gap:          '12px',
          }}>
            <span style={{ fontSize: '16px', opacity: 0.7 }}>✦</span>
            <div style={{ fontFamily: fonts.sans }}>
              <div style={{
                fontSize:   fontSize.sm,
                fontWeight: fontWeight.medium,
                color:      colours.accent,
              }}>
                {stats.openTasks > 0 && `${stats.openTasks} task${stats.openTasks > 1 ? 's' : ''} to complete`}
                {stats.openTasks > 0 && stats.docsNeedingReview > 0 && ' · '}
                {stats.docsNeedingReview > 0 && `${stats.docsNeedingReview} document${stats.docsNeedingReview > 1 ? 's' : ''} to review`}
              </div>
              <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginTop: '2px' }}>
                Stay on top of your submission checklist
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
