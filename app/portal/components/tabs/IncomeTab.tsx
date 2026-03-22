'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../lib/supabase'
import { Panel, Label, EmptyState, Spinner, formatGBP, formatDate } from '../ui'

const CATEGORIES = [
  { value: 'trading',      label: 'Trading income' },
  { value: 'rental',       label: 'Rental income' },
  { value: 'day_rate',     label: 'Day rate' },
  { value: 'fixed_price',  label: 'Fixed price project' },
  { value: 'retainer',     label: 'Retainer' },
  { value: 'platform',     label: 'Platform income' },
  { value: 'brand_deal',   label: 'Brand deal' },
  { value: 'construction', label: 'Construction / CIS' },
  { value: 'employment',   label: 'Employment (PAYE)' },
  { value: 'dividends',    label: 'Dividends' },
  { value: 'interest',     label: 'Bank interest' },
  { value: 'grant',        label: 'Grant' },
  { value: 'other',        label: 'Other' },
]

export default function IncomeTab({ client, navy, teal, muted, secondary }: any) {
  const [income, setIncome] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'trading',
  })

  const supabase = createClient()

  useEffect(() => {
    if (!client?.id) return
    loadIncome()
  }, [client])

  async function loadIncome() {
    setLoading(true)
    const { data } = await supabase
      .from('income')
      .select('*')
      .eq('client_id', client.id)
      .eq('tax_year', client.tax_year)
      .order('date', { ascending: false })
    setIncome(data ?? [])
    setLoading(false)
  }

  async function addIncome() {
    if (!form.description || !form.amount) return
    setSaving(true)
    await supabase.from('income').insert({
      client_id: client.id,
      description: form.description,
      amount_pence: Math.round(parseFloat(form.amount) * 100),
      date: form.date,
      category: form.category,
      tax_year: client.tax_year,
      source: 'manual',
    })
    setForm({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'trading' })
    setAdding(false)
    setSaving(false)
    loadIncome()
  }

  const total = income.reduce((sum, i) => sum + i.amount_pence, 0)

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '9px', color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '2px' }}>
            {client.tax_year}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '500', color: navy }}>
            {total > 0 ? formatGBP(total) : '—'}
            {total > 0 && <span style={{ fontSize: '13px', color: muted, fontFamily: "'DM Sans', sans-serif", fontWeight: '400', marginLeft: '8px' }}>total income</span>}
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '9px 18px',
            background: navy, color: 'white',
            border: 'none', borderRadius: '100px',
            fontSize: '12px', fontWeight: '500',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + Add income
        </button>
      </div>

      {/* Add income modal */}
      {adding && (
        <Panel padding="24px">
          <Label>New income entry</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: secondary, display: 'block', marginBottom: '5px' }}>Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Invoice #023 — Acme Ltd"
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
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                onClick={addIncome}
                disabled={saving || !form.description || !form.amount}
                style={{
                  padding: '9px 20px', background: navy, color: 'white',
                  border: 'none', borderRadius: '100px', fontSize: '12px',
                  fontWeight: '500', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: saving || !form.description || !form.amount ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save entry'}
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

      {/* Income list */}
      <Panel padding="0">
        {income.length === 0 ? (
          <EmptyState
            icon="↑"
            headline="No income logged yet."
            sub="When money moves, it shows here. Start with your first entry and we'll handle the rest."
            action="Log first income"
            onAction={() => setAdding(true)}
          />
        ) : (
          <div>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px',
              padding: '12px 20px', borderBottom: '1px solid rgba(5,28,44,0.06)',
            }}>
              {['Description', 'Category', 'Date', 'Amount'].map(h => (
                <div key={h} style={{ fontSize: '10px', color: muted, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {h}
                </div>
              ))}
            </div>
            {income.map((item, idx) => (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 120px 100px',
                padding: '13px 20px',
                borderBottom: idx < income.length - 1 ? '1px solid rgba(5,28,44,0.05)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(5,28,44,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontSize: '13px', color: navy, fontWeight: '500' }}>{item.description}</div>
                <div>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px',
                    background: 'rgba(0,212,170,0.08)',
                    color: '#00856A', borderRadius: '100px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatDate(item.date)}
                </div>
                <div style={{
                  fontSize: '13px', fontWeight: '600',
                  color: '#00856A', fontFamily: "'JetBrains Mono', monospace",
                }}>
                  +{formatGBP(item.amount_pence)}
                </div>
              </div>
            ))}
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
