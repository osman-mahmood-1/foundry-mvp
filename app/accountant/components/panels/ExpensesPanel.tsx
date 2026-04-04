'use client'

/**
 * app/accountant/components/panels/ExpensesPanel.tsx
 *
 * Right panel — Expenses tab.
 *
 * Shows deductibility review tools:
 *   - Status summary (allowable / pending / not allowable counts)
 *   - Selected expense detail + allowability decision form
 *   - Pending items list (click to select)
 *
 * Clicking an expense row in the left panel (via onExpenseSelect) loads it
 * into the selectedExpenseId slot. The right panel then shows that expense's
 * current review state and allows the accountant to confirm or override.
 *
 * All decisions are saved to expense_reviews via useExpenseReviews.
 */

import { useState, useEffect }      from 'react'
import { useExpenseReviews }        from '../../hooks/useExpenseReviews'
import { useColours, useThemeMode } from '@/styles/ThemeContext'
import { fonts, fontSize, fontWeight, letterSpacing } from '@/styles/tokens/typography'
import { glass }                    from '@/styles/tokens/effects'
import { radius, transition }       from '@/styles/tokens'
import { spacing }                  from '@/styles/tokens/spacing'
import type { Client, Expense, HmrcTreatment, SplitPanelInitialData } from '@/types'

interface Props {
  client:            Client
  accountantId:      string | null
  accountantUserId:  string
  initialData:       SplitPanelInitialData
  selectedExpenseId: string | null
  onExpenseSelect:   (id: string | null) => void
}

// ─── HMRC treatment options ───────────────────────────────────────────────────

const HMRC_OPTIONS: { value: HmrcTreatment; label: string }[] = [
  { value: 'wholly_and_exclusively', label: 'Wholly and exclusively' },
  { value: 'partial',                label: 'Partially allowable'    },
  { value: 'capital',                label: 'Capital expenditure'    },
  { value: 'not_business',           label: 'Not business related'   },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

function catLabel(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function SectionHeader({ title }: { title: string }) {
  const colours = useColours()
  return (
    <div style={{
      fontSize:      fontSize.label,
      fontFamily:    fonts.mono,
      letterSpacing: letterSpacing.wide,
      color:         colours.textMuted,
      textTransform: 'uppercase' as const,
      marginBottom:  '10px',
      paddingBottom: '6px',
      borderBottom:  `1px solid ${colours.borderHairline}`,
    }}>
      {title}
    </div>
  )
}

// ─── Review form ──────────────────────────────────────────────────────────────

interface ReviewFormProps {
  expense:          Expense
  accountantId:     string | null
  accountantUserId: string
  clientId:         string
}

function ReviewForm({ expense, accountantId, accountantUserId, clientId }: ReviewFormProps) {
  const colours = useColours()
  const {
    reviews,
    saving,
    error,
    saveReview,
  } = useExpenseReviews(clientId, accountantId, 0)

  const existing = reviews[expense.id] ?? null

  const [allowable,     setAllowable]     = useState<boolean | null>(existing?.allowable ?? null)
  const [hmrcTreatment, setHmrcTreatment] = useState<HmrcTreatment | null>(existing?.hmrc_treatment ?? null)
  const [reason,        setReason]        = useState(existing?.reason ?? '')
  const [saved,         setSaved]         = useState(false)

  // Re-sync form when a different expense is selected
  useEffect(() => {
    const rev = reviews[expense.id] ?? null
    setAllowable(rev?.allowable ?? null)
    setHmrcTreatment(rev?.hmrc_treatment ?? null)
    setReason(rev?.reason ?? '')
    setSaved(false)
  }, [expense.id, reviews])

  async function handleSave() {
    if (allowable === null) return
    await saveReview({
      expenseId:     expense.id,
      allowable,
      hmrcTreatment,
      reason,
      actorId:       accountantUserId,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const btnBase: React.CSSProperties = {
    flex:         1,
    padding:      '9px',
    border:       'none',
    borderRadius: radius.sm,
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.medium,
    fontFamily:   fonts.sans,
    cursor:       'pointer',
    transition:   transition.snap,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {error && (
        <div style={{
          fontSize: fontSize.xs, color: colours.danger,
          background: colours.dangerLight, borderRadius: radius.sm, padding: '6px 10px',
        }}>
          {error.code} — {error.message}
        </div>
      )}

      {/* Expense detail */}
      <div style={{
        background:   colours.hoverBg,
        borderRadius: radius.sm,
        padding:      '10px 12px',
        fontSize:     fontSize.sm,
      }}>
        <div style={{ fontWeight: fontWeight.medium, color: colours.textPrimary, marginBottom: '4px' }}>
          {expense.description}
        </div>
        <div style={{ color: colours.textMuted, display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
          <span style={{ fontFamily: fonts.mono }}>{fmt(expense.amount_pence)}</span>
          <span>{catLabel(expense.category)}</span>
          <span style={{ fontFamily: fonts.mono }}>{expense.date}</span>
        </div>
      </div>

      {/* Allowability decision */}
      <div>
        <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginBottom: '6px' }}>
          Allowability decision
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setAllowable(true)}
            style={{
              ...btnBase,
              background: allowable === true  ? colours.income    : colours.hoverBg,
              color:      allowable === true  ? colours.textInverse : colours.textSecondary,
            }}
          >
            ✓ Allowable
          </button>
          <button
            onClick={() => setAllowable(false)}
            style={{
              ...btnBase,
              background: allowable === false ? colours.danger     : colours.hoverBg,
              color:      allowable === false ? colours.textInverse : colours.textSecondary,
            }}
          >
            ✗ Not allowable
          </button>
        </div>
      </div>

      {/* HMRC treatment */}
      <div>
        <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginBottom: '6px' }}>
          HMRC treatment
        </div>
        <select
          value={hmrcTreatment ?? ''}
          onChange={e => setHmrcTreatment((e.target.value || null) as HmrcTreatment | null)}
          style={{
            width:        '100%',
            padding:      '8px 10px',
            border:       `1px solid ${colours.borderMedium}`,
            borderRadius: radius.sm,
            fontSize:     fontSize.sm,
            fontFamily:   fonts.sans,
            color:        colours.textPrimary,
            background:   colours.inputBg,
            cursor:       'pointer',
            outline:      'none',
          }}
        >
          <option value="">Select treatment…</option>
          {HMRC_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Reason */}
      <div>
        <div style={{ fontSize: fontSize.xs, color: colours.textMuted, marginBottom: '6px' }}>
          Reason <span style={{ opacity: 0.6 }}>(shown to client)</span>
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Allowable as a repair to existing structure…"
          style={{
            width:        '100%',
            padding:      '8px 10px',
            border:       `1px solid ${colours.borderMedium}`,
            borderRadius: radius.sm,
            fontSize:     fontSize.sm,
            fontFamily:   fonts.sans,
            color:        colours.textPrimary,
            background:   colours.inputBg,
            resize:       'vertical' as const,
            outline:      'none',
            lineHeight:   1.5,
            boxSizing:    'border-box' as const,
          }}
          onFocus={e => { e.target.style.borderColor = colours.accent }}
          onBlur={e  => { e.target.style.borderColor = colours.borderMedium }}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || allowable === null}
        style={{
          padding:      '9px',
          background:   saved ? colours.income : allowable === null ? colours.borderLight : colours.accent,
          color:        allowable === null ? colours.textMuted : colours.textInverse,
          border:       'none',
          borderRadius: radius.sm,
          fontSize:     fontSize.sm,
          fontWeight:   fontWeight.medium,
          fontFamily:   fonts.sans,
          cursor:       saving || allowable === null ? 'not-allowed' : 'pointer',
          transition:   transition.snap,
        }}
      >
        {saving ? 'Saving…' : saved ? '✓ Decision saved' : 'Save decision'}
      </button>
    </div>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function ExpensesPanel({
  client,
  accountantId,
  accountantUserId,
  initialData,
  selectedExpenseId,
  onExpenseSelect,
}: Props) {
  const colours = useColours()
  const mode = useThemeMode()
  const { expenses } = initialData
  const {
    reviews,
    allowableCount,
    pendingCount,
    notAllowableCount,
  } = useExpenseReviews(client.id, accountantId, expenses.length)

  const selectedExpense = selectedExpenseId
    ? expenses.find(e => e.id === selectedExpenseId) ?? null
    : null

  // Pending = expenses without a review
  const pendingExpenses = expenses.filter(e => !reviews[e.id])

  return (
    <div style={{ padding: spacing.panel.padding, display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Status summary ── */}
      <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
        <SectionHeader title="Status" />
        <div style={{ display: 'flex', gap: '12px' }}>
          {[
            { label: 'Allowable',     count: allowableCount,    colour: colours.income },
            { label: 'Pending',       count: pendingCount,      colour: colours.warningDark },
            { label: 'Not allowable', count: notAllowableCount, colour: colours.danger  },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center' as const }}>
              <div style={{
                fontFamily:  fonts.sans,
                fontSize:    '22px',
                fontWeight:  fontWeight.medium,
                color:       s.colour,
              }}>
                {s.count}
              </div>
              <div style={{ fontSize: fontSize.xs, color: colours.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Selected expense ── */}
      {selectedExpense ? (
        <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
          <SectionHeader title="Review Selected Expense" />
          <ReviewForm
            expense={selectedExpense}
            accountantId={accountantId}
            accountantUserId={accountantUserId}
            clientId={client.id}
          />
        </div>
      ) : (
        <div style={{
          ...glass.card(mode),
          padding:        spacing.panel.padding,
          textAlign:      'center',
          color:          colours.textMuted,
          fontSize:       fontSize.sm,
          minHeight:      '100px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          Click any expense on the left to review it here.
        </div>
      )}

      {/* ── Pending list ── */}
      {pendingExpenses.length > 0 && (
        <div style={{ ...glass.card(mode), padding: spacing.panel.paddingTight }}>
          <SectionHeader title={`Pending (${pendingExpenses.length})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {pendingExpenses.slice(0, 8).map(exp => (
              <button
                key={exp.id}
                onClick={() => onExpenseSelect(exp.id)}
                style={{
                  display:     'flex',
                  justifyContent: 'space-between',
                  alignItems:  'center',
                  padding:     '6px 8px',
                  background:  selectedExpenseId === exp.id ? colours.accentSoft : 'transparent',
                  border:      'none',
                  borderRadius: radius.xs,
                  cursor:      'pointer',
                  fontSize:    fontSize.xs,
                  textAlign:   'left' as const,
                  fontFamily:  fonts.sans,
                  transition:  transition.snap,
                  width:       '100%',
                }}
                onMouseEnter={e => {
                  if (selectedExpenseId !== exp.id) e.currentTarget.style.background = colours.hoverBg
                }}
                onMouseLeave={e => {
                  if (selectedExpenseId !== exp.id) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ color: colours.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flex: 1, marginRight: '8px' }}>
                  → {exp.description}
                </span>
                <span style={{ fontFamily: fonts.mono, color: colours.expense, flexShrink: 0 }}>
                  £{(exp.amount_pence / 100).toFixed(2)}
                </span>
              </button>
            ))}
            {pendingExpenses.length > 8 && (
              <div style={{ fontSize: fontSize.xs, color: colours.textMuted, padding: '4px 8px' }}>
                + {pendingExpenses.length - 8} more — select from the left panel
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
