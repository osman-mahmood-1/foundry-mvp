'use client'
import React from 'react'
import { useOverview } from './useOverview'
import { ErrorBanner } from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius } from '@/styles/tokens'

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

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, glow, icon }: {
  label: string; value: string; sub?: string
  accent: string; glow: string; icon: string
}) {
  return (
    <div style={{
      background:           colours.panelBg,
      backdropFilter:       'blur(48px)',
      WebkitBackdropFilter: 'blur(48px)',
      border:               `1px solid ${colours.borderLight}`,
      borderRadius:         radius.lg,
      padding:              '20px',
      position:             'relative',
      overflow:             'hidden',
      flex:                 '1 1 200px',
      minWidth:             '180px',
    }}>
      {/* Glow orb */}
      <div style={{
        position:      'absolute',
        top:           -20,
        right:         -20,
        width:         80,
        height:        80,
        borderRadius:  '50%',
        background:    glow,
        filter:        'blur(24px)',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width:           36,
        height:          36,
        borderRadius:    radius.md,
        background:      glow,
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
        fontSize:       fontSize.xs,
        color:          colours.textMuted,
        fontWeight:     fontWeight.medium,
        fontFamily:     fonts.sans,
        marginBottom:   '4px',
        textTransform:  'uppercase',
        letterSpacing:  '0.06em',
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize:   fontSize.xl,
        fontWeight: fontWeight.semibold,
        color:      accent,
        fontFamily: fonts.sans,
        lineHeight:  1.1,
      }}>
        {value}
      </div>

      {sub && (
        <div style={{
          fontSize:   fontSize.xs,
          color:      colours.textMuted,
          fontFamily: fonts.sans,
          marginTop:  '4px',
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
          whiteSpace:   'nowrap',
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

function QuickAction({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        padding:    '8px 16px',
        background: colours.hoverBg,
        border:     `1px solid ${colours.borderLight}`,
        borderRadius: radius.md,
        cursor:     'pointer',
        fontSize:   fontSize.sm,
        fontFamily: fonts.sans,
        fontWeight: fontWeight.medium,
        color:      colours.textSecondary,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        const t = e.currentTarget
        t.style.background   = colours.accentLight
        t.style.borderColor  = colours.accentBorder
        t.style.color        = colours.accent
      }}
      onMouseLeave={e => {
        const t = e.currentTarget
        t.style.background   = colours.hoverBg
        t.style.borderColor  = colours.borderLight
        t.style.color        = colours.textSecondary
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

export default function OverviewTab({ clientId }: { clientId: string | null }) {
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

  return (
    <div style={{ padding: '24px 24px 40px', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize:   fontSize.xl,
          fontWeight: fontWeight.semibold,
          color:      colours.textPrimary,
          fontFamily: fonts.sans,
          margin:     0,
          lineHeight: 1.2,
        }}>
          {clientName ? `Good to see you, ${clientName.split(' ')[0]}` : 'Overview'}
        </h1>
        <p style={{
          fontSize:   fontSize.sm,
          color:      colours.textMuted,
          fontFamily: fonts.sans,
          margin:     '4px 0 0',
        }}>
          Tax year {taxYear} · {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display:      'flex',
        flexWrap:     'wrap',
        gap:          '16px',
        marginBottom: '24px',
      }}>
        <StatCard
          label="Income" value={fmt(stats.incomePence)}
          sub={`${taxYear} tax year`}
          accent={colours.income} glow={colours.incomeGlow} icon="📈"
        />
        <StatCard
          label="Expenses" value={fmt(stats.expensesPence)}
          sub="Confirmed + draft"
          accent={colours.expense} glow={colours.expenseGlow} icon="📉"
        />
        <StatCard
          label="Est. Tax" value={fmt(stats.estTaxPence)}
          sub="Rough estimate only"
          accent={colours.warning} glow={colours.warningGlow} icon="🧾"
        />
        <StatCard
          label="Net Profit" value={fmt(Math.abs(profit))}
          sub={profit >= 0 ? 'Profit' : 'Loss so far'}
          accent={profit >= 0 ? colours.allowable : colours.danger}
          glow={profit >= 0 ? colours.incomeGlow : colours.dangerLight}
          icon={profit >= 0 ? '✅' : '⚠️'}
        />
      </div>

      {/* Quick actions */}
      <div style={{
        display:      'flex',
        gap:          '12px',
        flexWrap:     'wrap',
        marginBottom: '24px',
      }}>
        <QuickAction icon="+" label="Add income" />
        <QuickAction icon="+" label="Add expense" />
        <QuickAction icon="↑" label="Upload document" />
      </div>

      {/* Recent transactions */}
      <div style={{
        background:           colours.panelBg,
        backdropFilter:       'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border:               `1px solid ${colours.borderLight}`,
        borderRadius:         radius.lg,
        padding:              '20px',
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
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
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
          <span style={{ fontSize: '20px' }}>💡</span>
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
  )
}