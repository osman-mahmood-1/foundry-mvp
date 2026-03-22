'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../lib/supabase'
import { Panel, Label, StatCard, EmptyState, Spinner, formatGBP, formatDate } from '../ui'

export default function OverviewTab({ client, navy, teal, muted, secondary }: any) {
  const [income, setIncome] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client?.id) return
    const supabase = createClient()

    async function load() {
      const [inc, exp, tsk, msg] = await Promise.all([
        supabase.from('income').select('*').eq('client_id', client.id).eq('tax_year', client.tax_year).order('date', { ascending: false }).limit(5),
        supabase.from('expenses').select('*').eq('client_id', client.id).eq('tax_year', client.tax_year).order('date', { ascending: false }).limit(5),
        supabase.from('tasks').select('*').eq('client_id', client.id).eq('tax_year', client.tax_year).order('sort_order'),
        supabase.from('messages').select('*').eq('client_id', client.id).order('created_at', { ascending: false }).limit(3),
      ])
      setIncome(inc.data ?? [])
      setExpenses(exp.data ?? [])
      setTasks(tsk.data ?? [])
      setMessages(msg.data ?? [])
      setLoading(false)
    }

    load()
  }, [client])

  if (loading) return <Spinner />

  const totalIncome = income.reduce((sum, i) => sum + i.amount_pence, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_pence, 0)
  const netProfit = totalIncome - totalExpenses
  const doneTasks = tasks.filter(t => t.done).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard
          label="Total Income"
          value={totalIncome > 0 ? formatGBP(totalIncome) : '—'}
          sub={totalIncome > 0 ? `${income.length} entries · ${client.tax_year}` : 'Nothing logged yet'}
          color="#00856A"
        />
        <StatCard
          label="Total Expenses"
          value={totalExpenses > 0 ? formatGBP(totalExpenses) : '—'}
          sub={totalExpenses > 0 ? `${expenses.length} entries logged` : 'Nothing categorised yet'}
          color="#2563EB"
        />
        <StatCard
          label="Net Position"
          value={totalIncome > 0 || totalExpenses > 0 ? formatGBP(netProfit) : '—'}
          sub="Before tax · indicative only"
          color={netProfit >= 0 ? navy : '#EF4444'}
        />
      </div>

      {/* Lower grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

        {/* Recent activity */}
        <Panel>
          <Label>Recent activity</Label>
          {income.length === 0 && expenses.length === 0 ? (
            <EmptyState
              icon="◈"
              headline="Your ledger is clear."
              sub="Every transaction you log or we import will surface here in real time."
            />
          ) : (
            <div>
              {[...income.map(i => ({ ...i, _type: 'income' })), ...expenses.map(e => ({ ...e, _type: 'expense' }))]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 6)
                .map((item, idx) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: idx < 5 ? '1px solid rgba(5,28,44,0.05)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                        background: item._type === 'income' ? 'rgba(0,212,170,0.08)' : 'rgba(37,99,235,0.07)',
                        border: `1px solid ${item._type === 'income' ? 'rgba(0,212,170,0.2)' : 'rgba(37,99,235,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: item._type === 'income' ? '#00856A' : '#2563EB',
                      }}>
                        {item._type === 'income' ? '↑' : '↓'}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: navy, fontWeight: '500' }}>{item.description}</div>
                        <div style={{ fontSize: '10px', color: muted, fontFamily: "'JetBrains Mono', monospace", marginTop: '1px' }}>
                          {formatDate(item.date)}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px', fontWeight: '600',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: item._type === 'income' ? '#00856A' : '#2563EB',
                    }}>
                      {item._type === 'income' ? '+' : '−'}{formatGBP(item.amount_pence)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Panel>

        {/* Tasks + Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Tasks */}
          <Panel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <Label>Submission checklist</Label>
              {tasks.length > 0 && (
                <span style={{
                  fontSize: '10px', color: '#00856A',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {doneTasks}/{tasks.length}
                </span>
              )}
            </div>
            {tasks.length === 0 ? (
              <EmptyState
                icon="◎"
                headline="Nothing outstanding."
                sub="Your accountant will add checklist items as your return progresses."
              />
            ) : (
              <div>
                {tasks.map((task, idx) => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 0',
                    borderBottom: idx < tasks.length - 1 ? '1px solid rgba(5,28,44,0.05)' : 'none',
                  }}>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                      background: task.done ? 'rgba(0,212,170,0.1)' : 'transparent',
                      border: `1.5px solid ${task.done ? '#00D4AA' : 'rgba(5,28,44,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {task.done && <span style={{ fontSize: '8px', color: '#00D4AA' }}>✓</span>}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: task.done ? muted : navy,
                      textDecoration: task.done ? 'line-through' : 'none',
                    }}>
                      {task.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Latest message */}
          <Panel>
            <Label>Messages</Label>
            {messages.length === 0 ? (
              <EmptyState
                icon="◈"
                headline="Your accountant is ready."
                sub="Questions, documents, anything — send your first message."
              />
            ) : (
              <div>
                {messages.slice(0, 2).map((msg, idx) => (
                  <div key={msg.id} style={{
                    padding: '10px 0',
                    borderBottom: idx < 1 ? '1px solid rgba(5,28,44,0.05)' : 'none',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: '500',
                        color: msg.sender_role === 'accountant' ? teal : navy,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {msg.sender_role === 'accountant' ? 'Accountant' : msg.sender_role === 'ai_agent' ? 'AI Agent' : 'You'}
                      </span>
                      <span style={{ fontSize: '10px', color: muted, fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: secondary, lineHeight: 1.5 }}>
                      {msg.body.length > 80 ? msg.body.substring(0, 80) + '...' : msg.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
