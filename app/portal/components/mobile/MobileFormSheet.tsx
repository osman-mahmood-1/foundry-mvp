'use client'

/**
 * app/portal/components/mobile/MobileFormSheet.tsx
 *
 * Full-screen fade-in form for adding income or expense.
 * Live tax calculation. Delight sequence on save:
 *   - Button → teal fill (200ms)
 *   - Checkmark SVG draw (350ms)
 *   - navigator.vibrate(50) haptic
 *   - Income: 10 particle burst
 *   - After 800ms: form fades out, parent callback fires
 */

import { useState, useRef, useCallback } from 'react'
import type { Client, IncomeCategory, ExpenseCategory } from '@/types'
import { useIncome }   from '@/app/portal/components/tabs/useIncome'
import { useExpenses } from '@/app/portal/components/tabs/useExpenses'
import { useColours }  from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius, spacing }   from '@/styles/tokens'
import { estimateTax }       from '@/lib/tax'

// ─── Category lists (shared with desktop tabs) ────────────────────────────────

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
  { value: 'software',       label: 'Software & subscriptions' },
  { value: 'hardware',       label: 'Hardware & equipment' },
  { value: 'travel',         label: 'Travel' },
  { value: 'vehicle',        label: 'Vehicle' },
  { value: 'home_office',    label: 'Home office' },
  { value: 'phone',          label: 'Phone & broadband' },
  { value: 'professional_fees', label: 'Professional fees' },
  { value: 'marketing',      label: 'Marketing' },
  { value: 'training',       label: 'Training & education' },
  { value: 'materials',      label: 'Materials & supplies' },
  { value: 'insurance',      label: 'Insurance' },
  { value: 'repairs',        label: 'Repairs & maintenance' },
  { value: 'office_rent',    label: 'Office rent' },
  { value: 'subcontractor',  label: 'Subcontractor' },
  { value: 'other',          label: 'Other' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type FormType = 'income' | 'expense'

interface Particle {
  id:     number
  tx:     string
  ty:     string
  size:   number
  colour: string
  delay:  string
}

interface Props {
  type:    FormType
  client:  Client
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

function taxCalc(amountStr: string, taxYear: string) {
  const pence  = Math.round(parseFloat(amountStr || '0') * 100)
  const taxP   = estimateTax(pence, 0, taxYear)
  const netP   = pence - taxP
  return { gross: pence, tax: taxP, net: netP }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MobileFormSheet({ type, client, onClose }: Props) {
  const colours = useColours()

  // Form state
  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState<string>(
    type === 'income' ? INCOME_CATS[0].value : EXPENSE_CATS[0].value
  )
  const [date,        setDate]        = useState(TODAY)
  const [description, setDescription] = useState('')
  const [notes,       setNotes]       = useState('')

  // Delight state
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [btnColour,   setBtnColour]   = useState<string | null>(null)
  const [particles,   setParticles]   = useState<Particle[]>([])
  const [fading,      setFading]      = useState(false)

  const btnRef = useRef<HTMLButtonElement>(null)

  // Hooks — called unconditionally, result used by type
  const incomeHook  = useIncome(client.id, client.tax_year, client.user_id)
  const expenseHook = useExpenses(client.id, client.tax_year, client.user_id)

  const isValid = description.trim().length > 0 && parseFloat(amount || '0') > 0

  const calc = taxCalc(amount, client.tax_year)

  function spawnParticles() {
    const tealShades = [colours.teal, colours.tealBar, colours.tealLight, colours.income]
    const items: Particle[] = Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * 360
      const dist  = 40 + Math.random() * 60
      const rad   = angle * Math.PI / 180
      return {
        id:     i,
        tx:     `${Math.cos(rad) * dist}px`,
        ty:     `${Math.sin(rad) * dist}px`,
        size:   4 + Math.random() * 6,
        colour: tealShades[Math.floor(Math.random() * tealShades.length)],
        delay:  `${Math.random() * 100}ms`,
      }
    })
    setParticles(items)
    setTimeout(() => setParticles([]), 600)
  }

  const handleSave = useCallback(async () => {
    if (!isValid || saving) return
    setSaving(true)

    try {
      if (type === 'income') {
        incomeHook.setForm(() => ({
          description,
          amount,
          date,
          category: category as IncomeCategory,
        }))
        await incomeHook.addIncome()
      } else {
        expenseHook.setForm(() => ({
          description,
          amount,
          date,
          category: category as ExpenseCategory,
        }))
        await expenseHook.addExpense()
      }

      // Delight sequence
      setBtnColour(colours.teal)
      setSaved(true)
      if (type === 'income') spawnParticles()
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }

      setTimeout(() => {
        setFading(true)
        setTimeout(() => onClose(), 300)
      }, 800)
    } catch {
      setSaving(false)
    }
  }, [isValid, saving, type, description, amount, date, category, colours.teal, incomeHook, expenseHook, onClose])

  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const title = type === 'income' ? 'Log Income' : 'Log Expense'

  const fieldStyle: React.CSSProperties = {
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'space-between',
    padding:      `${spacing.form.fieldGap} 0`,
    borderBottom: `1px solid ${colours.borderHairline}`,
    gap:          '16px',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily:  fonts.sans,
    fontSize:    '13.5px',
    color:       colours.textMuted,
    flexShrink:  0,
    minWidth:    '96px',
  }

  const inputStyle: React.CSSProperties = {
    background:   'transparent',
    border:       'none',
    outline:      'none',
    fontFamily:   fonts.sans,
    fontSize:     '14px',
    color:        colours.textPrimary,
    textAlign:    'right' as const,
    flex:         1,
    padding:      0,
    minWidth:     0,
  }

  return (
    <div
      className="form-screen"
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     300,
        background: colours.pageBg,
        display:    'flex',
        flexDirection: 'column',
        opacity:    fading ? 0 : 1,
        transition: fading ? 'opacity 0.3s ease' : 'none',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Top bar */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 16px',
        height:         '52px',
        borderBottom:   `1px solid ${colours.borderHairline}`,
        flexShrink:     0,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border:     'none',
            cursor:     'pointer',
            fontFamily: fonts.sans,
            fontSize:   '15px',
            color:      colours.textSecondary,
            padding:    '0',
            minWidth:   '60px',
          }}
        >
          Cancel
        </button>
        <span style={{
          fontFamily:    fonts.sans,
          fontSize:      '16px',
          fontWeight:    fontWeight.semibold,
          color:         colours.textPrimary,
          letterSpacing: '-0.02em',
        }}>
          {title}
        </span>
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          style={{
            background:  'transparent',
            border:      'none',
            cursor:      isValid && !saving ? 'pointer' : 'default',
            fontFamily:  fonts.sans,
            fontSize:    '15px',
            fontWeight:  fontWeight.medium,
            color:       isValid ? colours.accent : colours.textMuted,
            padding:     '0',
            minWidth:    '60px',
            textAlign:   'right' as const,
          }}
        >
          Save
        </button>
      </div>

      {/* Scrollable body */}
      <div className="mobile-scroll-area" style={{ flex: 1, padding: '0 16px' }}>

        {/* Large amount input */}
        <div style={{
          padding:      '24px 0 20px',
          borderBottom: `1px solid ${colours.borderHairline}`,
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily:  fonts.sans,
              fontSize:    '32px',
              fontWeight:  fontWeight.semibold,
              color:       colours.textMuted,
            }}>
              £
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                flex:           1,
                background:     'transparent',
                border:         'none',
                outline:        'none',
                fontFamily:     fonts.sans,
                fontSize:       '32px',
                fontWeight:     fontWeight.semibold,
                color:          colours.textPrimary,
                fontVariantNumeric: 'tabular-nums',
              }}
            />
          </div>
        </div>

        {/* Form fields */}
        <div>
          {/* Category */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Category</span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              {cats.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Date</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Tax Year */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Tax Year</span>
            <span style={{ fontFamily: fonts.sans, fontSize: '14px', color: colours.textPrimary }}>
              {client.tax_year}
            </span>
          </div>

          {/* Description */}
          <div style={fieldStyle}>
            <span style={labelStyle}>Description</span>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Invoice #023 — Acme Ltd"
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div style={{ ...fieldStyle, alignItems: 'flex-start' }}>
            <span style={{ ...labelStyle, paddingTop: '4px' }}>Notes</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional…"
              rows={3}
              style={{
                ...inputStyle,
                resize:   'vertical' as const,
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        {/* Live tax calculation (income only) */}
        {type === 'income' && (
          <div style={{
            marginTop:    '20px',
            padding:      '16px',
            background:   colours.cardBg,
            borderRadius: radius.lg,
            border:       `1px solid ${colours.cardBorder}`,
          }}>
            {[
              { label: 'Gross',        value: `£${(calc.gross / 100).toFixed(2)}`,   colour: colours.textPrimary },
              { label: 'Tax (est.)',   value: `–£${(calc.tax  / 100).toFixed(2)}`,   colour: colours.expense },
            ].map(r => (
              <div key={r.label} style={{
                display:      'flex',
                justifyContent: 'space-between',
                padding:      '6px 0',
                borderBottom: `1px solid ${colours.borderHairline}`,
              }}>
                <span style={{ fontFamily: fonts.sans, fontSize: '13px', color: colours.textMuted }}>{r.label}</span>
                <span style={{ fontFamily: fonts.sans, fontSize: '13px', fontWeight: fontWeight.medium, color: r.colour }}>{r.value}</span>
              </div>
            ))}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              padding:        '8px 0 0',
            }}>
              <span style={{
                fontFamily:  fonts.sans,
                fontSize:    '13px',
                fontWeight:  fontWeight.semibold,
                color:       colours.textPrimary,
              }}>
                Yours
              </span>
              <span style={{
                fontFamily:  fonts.sans,
                fontSize:    '16px',
                fontWeight:  fontWeight.semibold,
                color:       colours.income,
                fontVariantNumeric: 'tabular-nums',
              }}>
                £{(calc.net / 100).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* CTA save button */}
        <div style={{ position: 'relative', marginTop: '24px', marginBottom: '16px' }}>
          <button
            ref={btnRef}
            onClick={handleSave}
            disabled={!isValid || saving}
            className={!saved ? 'cta-btn' : undefined}
            style={{
              width:        '100%',
              height:       '52px',
              borderRadius: radius.md,
              border:       'none',
              background:   btnColour ?? colours.cta,
              color:        saved ? colours.white : colours.ctaText,
              fontFamily:   fonts.sans,
              fontSize:     '15px',
              fontWeight:   fontWeight.semibold,
              cursor:       isValid && !saving ? 'pointer' : 'default',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              transition:   'background 0.2s ease',
              position:     'relative',
              overflow:     'visible',
            }}
          >
            {saved ? (
              /* Checkmark */
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <polyline
                  points="4,12 10,18 20,6"
                  stroke={colours.white}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray:  40,
                    strokeDashoffset: 0,
                    animation: 'draw-check 350ms ease forwards',
                  }}
                />
              </svg>
            ) : (
              saving ? 'Saving…' : `Save ${type === 'income' ? 'Income' : 'Expense'}`
            )}

            {/* Particle burst origin */}
            {particles.map(p => (
              <span
                key={p.id}
                style={{
                  position:          'absolute',
                  left:              '50%',
                  top:               '50%',
                  width:             `${p.size}px`,
                  height:            `${p.size}px`,
                  borderRadius:      '50%',
                  background:        p.colour,
                  pointerEvents:     'none',
                  transformOrigin:   'center',
                  animationName:     'particle-burst',
                  animationDuration: '500ms',
                  animationDelay:    p.delay,
                  animationFillMode: 'both',
                  animationTimingFunction: 'ease-out',
                  // @ts-expect-error CSS custom properties
                  '--tx': p.tx,
                  '--ty': p.ty,
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  )
}
