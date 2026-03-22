'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../lib/supabase'
import { Panel, Label, EmptyState, Spinner, formatGBP, formatDate } from '../ui'

const CATEGORIES = [
  { value: 'repairs',            label: 'Repairs & maintenance' },
  { value: 'mortgage_interest',  label: 'Mortgage interest' },
  { value: 'agent_fees',         label: 'Agent fees' },
  { value: 'insurance',          label: 'Insurance' },
  { value: 'travel',             label: 'Travel' },
  { value: 'vehicle',            label: 'Vehicle' },
  { value: 'tools',              label: 'Tools & equipment' },
  { value: 'equipment',          label: 'Equipment' },
  { value: 'software',           label: 'Software & subscriptions' },
  { value: 'home_office',        label: 'Home office' },
  { value: 'professional_fees',  label: 'Professional fees' },
  { value: 'marketing',          label: 'Marketing' },
  { value: 'training',           label: 'Training' },
  { value: 'subcontractor',      label: 'Subcontractor' },
  { value: 'materials',          label: 'Materials' },
  { value: 'other',              label: 'Other' },
]

const ALLOWABLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  'true':  { label: 'Allowable',    bg: 'rgba(0,212,170,0.08)',   color: '#00856A' },
  'false': { label: 'Not allowable', bg: 'rgba(239,68,68,0.08)',  color: '#DC2626' },
  'null':  { label: 'Under review', bg: 'rgba(245,158,11,0.08)',  color: '#D97706' },
}

export default function ExpensesTab({ client, navy, teal, muted, secondary }: any) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'other',
  })

  const supabase = createClient()

  useEffect(() => {
    if (!client?.id) return
    loadExpenses()
  }, [client])

  async function loadExpenses() {
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('client_id', client.id)
      .eq('tax_year', client.tax_year)
      .order('date', { ascending: false })
    setExpenses(data ?? [])
    setLoading(false)
  }

  async function addExpense() {
    if (!form.description || !form.amount) return
    setSaving(true)
    await supabase.from('expenses').insert({
      client_id: client.id,
      description: form.description,
      amount_pence: Math.round(parseFloat(form.amount) * 100),
      date: form.date,
      category: form.category,
      tax_year: client.tax_year,
      source: 'manual',
    })
    setForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'other' })
    setAdding(false)
    setSaving(false)
    loadExpenses()
  }

  const total = expenses.reduce((sum, e) => sum + e.amount_pence, 0)
  const allowableTotal = expenses.filter(e => e.allowable === true).reduce((sum, e) => sum + e.amount_pence, 0)

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '9px', color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '2px' }}>
            {client.tax_year}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '500', color: navy }}>
            {total > 0 ? formatGBP(total) : '—'}
            {total > 0 && <span style={{ fontSize: '13px', color: muted, fontFamily: "'DM Sans', sans-serif", fontWeight: '400', marginLeft: '8px' }}>
              {allowableTotal > 0 ? `${formatGBP(allowableTotal)} confirmed allowable` : 'awaiting review'}
            </span>}
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '9px 18px', background: navy, color: 'white',
            border: 'none', borderRadius: '100px', fontSize: '12px',
            fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + Add expense
        </button>
      </div>

      {/* Add expense form */}
      {adding && (
        <Panel padding="24px">
          <Label>New expense entry</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: secondary, display: 'block', marginBottom: '5px' }}>Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Boiler replacement — 14 Ashford Rd"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: secondary, display: 'block', marginBottom: '5px' }}>Amount (£)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: secondary, display: 'block', marginBottom: '5px' }}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: secondary, display: 'block', marginBottom: '5px' }}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={inputStyle}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <p style={{ fontSize: '11px', color: '#92400E', lineHeight: 1.5 }}>
                Your accountant will confirm whether this expense is allowable. Add it now and we'll review it.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addExpense}
                disabled={saving || !form.description || !form.amount}
                style={{
                  padding: '9px 20px', background: navy, color: 'white',
                  border: 'none', borderRadius: '100px', fontSize: '12px',
                  fontWeight: '500', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  opacity: saving || !form.description || !form.amount ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save expense'}
              </button>
              <button
                onClick={() => setAdding(false)}
                style={{
                  padding: '9px 20px', background: 'transparent',
                  border: '1px solid rgba(5,28,44,0.12)', borderRadius: '100px',
                  fontSize: '12px', color: secondary, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* Expenses list */}
      <Panel padding="0">
        {expenses.length === 0 ? (
          <EmptyState
            icon="↓"
            headline="Nothing categorised yet."
            sub="Every business cost you log gets reviewed for allowability. Your accountant handles the HMRC rules."
            action="Log first expense"
            onAction={() => setAdding(true)}
          />
        ) : (
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 100px 120px 100px',
              padding: '12px 20px', borderBottom: '1px solid rgba(5,28,44,0.06)',
            }}>
              {['Description', 'Category', 'Date', 'Status', 'Amount'].map(h => (
                <div key={h} style={{ fontSize: '10px', color: muted, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {h}
                </div>
              ))}
            </div>
            {expenses.map((item, idx) => {
              const badge = ALLOWABLE_BADGE[String(item.allowable)] ?? ALLOWABLE_BADGE['null']
              return (
                <div key={item.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 100px 120px 100px',
                  padding: '13px 20px',
                  borderBottom: idx < expenses.length - 1 ? '1px solid rgba(5,28,44,0.05)' : 'none',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(5,28,44,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: '13px', color: navy, fontWeight: '500' }}>{item.description}</div>
                  <div>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px',
                      background: 'rgba(37,99,235,0.07)', color: '#2563EB',
                      borderRadius: '100px', fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatDate(item.date)}
                  </div>
                  <div>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px',
                      background: badge.bg, color: badge.color,
                      borderRadius: '100px', fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {badge.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px', fontWeight: '600',
                    color: '#2563EB', fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    −{formatGBP(item.amount_pence)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid rgba(5,28,44,0.12)',
  borderRadius: '10px', fontSize: '13px',
  color: '#051C2C', outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  background: 'rgba(255,255,255,0.8)',
  boxSizing: 'border-box',
}
