'use client'

/**
 * app/portal/components/mobile/MobileFormSheet.tsx
 *
 * Full-screen form for adding income or expense.
 * Renders in normal document flow beneath the sticky shell header —
 * no portal, no fixed positioning. The parent tab hides its own content
 * when the form is open, so the form occupies the full scroll area.
 *
 * Bottom action row: Cancel (flex:1) + Save (flex:2) — 1/3 + 2/3 split.
 * Delight sequence on save: teal fill → checkmark → haptic → particles → fade.
 */

import { useState, useRef, useCallback } from 'react'
import type { Client, IncomeCategory, ExpenseCategory } from '@/types'
import { useIncome }   from '@/app/portal/components/tabs/useIncome'
import { useExpenses } from '@/app/portal/components/tabs/useExpenses'
import { useColours }  from '@/styles/ThemeContext'
import { fonts, fontWeight } from '@/styles/tokens/typography'
import { radius, spacing }   from '@/styles/tokens'
import { estimateTax }       from '@/lib/tax'

// ─── Category lists ───────────────────────────────────────────────────────────

const INCOME_CATS: { value: IncomeCategory; label: string }[] = [
  { value: 'trading',      label: 'Trading income' },
  { value: 'day_rate',     label: 'Day rate / consultancy' },
  { value: 'fixed_price',  label: 'Fixed price project' },
  { value: 'retainer',     label: 'Retainer' },
  { value: 'platform',     label: 'Platform / marketplace' },
  { value: 'brand_deal',   label: 'Brand deal / sponsorship' },
  { value: 'rental',       label: 'Rental income' },
  { value: 'construction', label: 'Construction / CIS' },
  { value: 'employment',   label: 'Employment (PAYE)' },
  { value: 'dividends',    label: 'Dividends' },
  { value: 'interest',     label: 'Interest' },
  { value: 'grant',        label: 'Grant' },
  { value: 'other',        label: 'Other income' },
]

const EXPENSE_CATS: { value: ExpenseCategory; label: string }[] = [
  { value: 'software',          label: 'Software & subscriptions' },
  { value: 'hardware',          label: 'Hardware & equipment' },
  { value: 'travel',            label: 'Travel' },
  { value: 'vehicle',           label: 'Vehicle' },
  { value: 'home_office',       label: 'Home office' },
  { value: 'phone',             label: 'Phone & broadband' },
  { value: 'professional_fees', label: 'Professional fees' },
  { value: 'marketing',         label: 'Marketing' },
  { value: 'training',          label: 'Training & education' },
  { value: 'materials',         label: 'Materials & supplies' },
  { value: 'insurance',         label: 'Insurance' },
  { value: 'repairs',           label: 'Repairs & maintenance' },
  { value: 'office_rent',       label: 'Office rent' },
  { value: 'subcontractor',     label: 'Subcontractor' },
  { value: 'other',             label: 'Other' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type FormType = 'income' | 'expense'

interface Particle {
  id: number; tx: string; ty: string; size: number; colour: string; delay: string
}

interface Props {
  type:    FormType
  client:  Client
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

function taxCalc(amountStr: string, taxYear: string) {
  const pence = Math.round(parseFloat(amountStr || '0') * 100)
  const taxP  = estimateTax(pence, 0, taxYear)
  return { gross: pence, tax: taxP, net: pence - taxP }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileFormSheet({ type, client, onClose }: Props) {
  const colours = useColours()

  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState<string>(
    type === 'income' ? INCOME_CATS[0].value : EXPENSE_CATS[0].value
  )
  const [date,        setDate]        = useState(TODAY)
  const [description, setDescription] = useState('')
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [btnColour,   setBtnColour]   = useState<string | null>(null)
  const [particles,   setParticles]   = useState<Particle[]>([])
  const [fading,      setFading]      = useState(false)

  const btnRef = useRef<HTMLButtonElement>(null)

  const incomeHook  = useIncome(client.id, client.tax_year, client.user_id)
  const expenseHook = useExpenses(client.id, client.tax_year, client.user_id)

  const isValid = description.trim().length > 0 && parseFloat(amount || '0') > 0
  const calc    = taxCalc(amount, client.tax_year)

  function spawnParticles() {
    const shades = [colours.teal, colours.tealBar, colours.tealLight, colours.income]
    const items: Particle[] = Array.from({ length: 10 }, (_, i) => {
      const rad = (i / 10) * 2 * Math.PI
      const dist = 40 + Math.random() * 60
      return {
        id: i, size: 4 + Math.random() * 6, delay: `${Math.random() * 100}ms`,
        colour: shades[Math.floor(Math.random() * shades.length)],
        tx: `${Math.cos(rad) * dist}px`, ty: `${Math.sin(rad) * dist}px`,
      }
    })
    setParticles(items)
    setTimeout(() => setParticles([]), 600)
  }

  const handleSave = useCallback(async () => {
    if (!isValid || saving) return
    setSaving(true)
    const data = { description, amount, date, category }
    try {
      if (type === 'income') {
        await incomeHook.addIncomeWithData({ ...data, category: category as IncomeCategory })
      } else {
        await expenseHook.addExpenseWithData({ ...data, category: category as ExpenseCategory })
      }
      setBtnColour(colours.teal)
      setSaved(true)
      if (type === 'income') spawnParticles()
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(50)
      setTimeout(() => { setFading(true); setTimeout(onClose, 300) }, 800)
    } catch {
      setSaving(false)
    }
  }, [isValid, saving, type, description, amount, date, category, colours.teal, incomeHook, expenseHook, onClose])

  const cats  = type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const label = type === 'income' ? 'Save Income' : 'Save Expense'

  const fieldStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: `${spacing.form.fieldGap} 0`,
    borderBottom: `1px solid ${colours.borderHairline}`,
    gap: '16px',
  }
  const labelStyle: React.CSSProperties = {
    fontFamily: fonts.sans, fontSize: '13.5px',
    color: colours.textMuted, flexShrink: 0, minWidth: '96px',
  }
  const inputStyle: React.CSSProperties = {
    background: 'transparent', border: 'none', outline: 'none',
    fontFamily: fonts.sans, fontSize: '14px',
    color: colours.textPrimary, textAlign: 'right' as const,
    flex: 1, padding: 0, minWidth: 0,
  }

  return (
    <div
      className="form-screen"
      style={{
        display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
        background: colours.pageBg,
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 0.3s ease' : 'none',
      }}
    >
      {/* Scrollable body */}
      <div className="mobile-scroll-area" style={{ flex: 1, padding: '0 16px' }}>

        {/* Amount */}
        <div style={{ padding: '24px 0 20px', borderBottom: `1px solid ${colours.borderHairline}`, marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: fonts.sans, fontSize: '32px', fontWeight: fontWeight.semibold, color: colours.textMuted }}>£</span>
            <input
              type="number" inputMode="decimal" autoFocus
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: fonts.sans, fontSize: '32px', fontWeight: fontWeight.semibold,
                color: colours.textPrimary, fontVariantNumeric: 'tabular-nums',
              }}
            />
          </div>
        </div>

        {/* Fields */}
        <div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Category</span>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Date</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Tax Year</span>
            <span style={{ fontFamily: fonts.sans, fontSize: '14px', color: colours.textPrimary }}>{client.tax_year}</span>
          </div>
          <div style={fieldStyle}>
            <span style={labelStyle}>Description</span>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Invoice #023 — Acme Ltd" style={inputStyle} />
          </div>
          <div style={{ ...fieldStyle, alignItems: 'flex-start' }}>
            <span style={{ ...labelStyle, paddingTop: '4px' }}>Notes</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional…" rows={3} style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 }} />
          </div>
        </div>

        {/* Live tax breakdown — income only */}
        {type === 'income' && (
          <div style={{ marginTop: '20px', padding: '16px', background: colours.cardBg, borderRadius: radius.lg, border: `1px solid ${colours.cardBorder}` }}>
            {[
              { label: 'Gross',      value: `£${(calc.gross / 100).toFixed(2)}`,  colour: colours.textPrimary },
              { label: 'Tax (est.)', value: `–£${(calc.tax  / 100).toFixed(2)}`,  colour: colours.expense },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colours.borderHairline}` }}>
                <span style={{ fontFamily: fonts.sans, fontSize: '13px', color: colours.textMuted }}>{r.label}</span>
                <span style={{ fontFamily: fonts.sans, fontSize: '13px', fontWeight: fontWeight.medium, color: r.colour }}>{r.value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0' }}>
              <span style={{ fontFamily: fonts.sans, fontSize: '13px', fontWeight: fontWeight.semibold, color: colours.textPrimary }}>Yours</span>
              <span style={{ fontFamily: fonts.sans, fontSize: '16px', fontWeight: fontWeight.semibold, color: colours.income, fontVariantNumeric: 'tabular-nums' }}>
                £{(calc.net / 100).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div style={{ height: '16px' }} />
      </div>

      {/* ── Action row ───────────────────────────────────────────────────────── */}
      {/* Cancel: flex:1 (1/3). Save: flex:2 (2/3). Both 52px tall, radius.md. */}
      <div style={{
        display: 'flex', gap: '10px',
        padding: `12px 16px calc(12px + env(safe-area-inset-bottom, 0px))`,
        borderTop: `1px solid ${colours.borderHairline}`,
        background: colours.pageBg,
        flexShrink: 0,
      }}>
        {/* Cancel — secondary surface, no fill weight */}
        <button
          onClick={onClose}
          style={{
            flex: 1, height: '52px', borderRadius: radius.md,
            border: `1px solid ${colours.borderHairline}`,
            background: colours.inputBg,
            color: colours.textSecondary,
            fontFamily: fonts.sans, fontSize: '15px', fontWeight: fontWeight.medium,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>

        {/* Save — primary CTA */}
        <button
          ref={btnRef}
          onClick={handleSave}
          disabled={!isValid || saving}
          className={!saved ? 'cta-btn' : undefined}
          style={{
            flex: 2, height: '52px', borderRadius: radius.md,
            border: 'none',
            background: btnColour ?? colours.cta,
            color: saved ? colours.white : colours.ctaText,
            fontFamily: fonts.sans, fontSize: '15px', fontWeight: fontWeight.semibold,
            cursor: isValid && !saving ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s ease',
            position: 'relative', overflow: 'visible',
            opacity: !isValid && !saving ? 0.5 : 1,
          }}
        >
          {saved ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polyline points="4,12 10,18 20,6" stroke={colours.white} strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 40, strokeDashoffset: 0, animation: 'draw-check 350ms ease forwards' }}
              />
            </svg>
          ) : saving ? 'Saving…' : label}

          {particles.map(p => (
            <span key={p.id} style={{
              position: 'absolute', left: '50%', top: '50%',
              width: `${p.size}px`, height: `${p.size}px`,
              borderRadius: '50%', background: p.colour,
              pointerEvents: 'none', transformOrigin: 'center',
              animationName: 'particle-burst', animationDuration: '500ms',
              animationDelay: p.delay, animationFillMode: 'both',
              animationTimingFunction: 'ease-out',
              // @ts-expect-error CSS custom properties
              '--tx': p.tx, '--ty': p.ty,
            }} />
          ))}
        </button>
      </div>
    </div>
  )
}
