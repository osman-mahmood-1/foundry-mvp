'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../../lib/supabase'
import { Panel, Label, EmptyState, Spinner, formatDate } from '../ui'

export default function TasksTab({ client, navy, teal, muted, secondary }: any) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!client?.id) return
    loadTasks()
  }, [client])

  async function loadTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', client.id)
      .eq('tax_year', client.tax_year)
      .order('sort_order', { ascending: true })
    setTasks(data ?? [])
    setLoading(false)
  }

  const done = tasks.filter(t => t.done).length
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {tasks.length > 0 && (
        <Panel padding="20px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '9px', color: muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '2px' }}>
                Submission progress
              </div>
              <div style={{ fontSize: '22px', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", color: navy }}>
                {pct}%
                <span style={{ fontSize: '13px', color: muted, fontFamily: "'DM Sans', sans-serif", fontWeight: '400', marginLeft: '8px' }}>
                  {done} of {tasks.length} complete
                </span>
              </div>
            </div>
          </div>
          <div style={{ height: '4px', background: 'rgba(5,28,44,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: `linear-gradient(90deg, ${teal}, #00F5C4)`,
              borderRadius: '2px',
              transition: 'width 0.6s ease',
              boxShadow: '0 0 8px rgba(0,212,170,0.4)',
            }} />
          </div>
        </Panel>
      )}

      <Panel padding="0">
        {tasks.length === 0 ? (
          <EmptyState
            icon="◎"
            headline="Nothing outstanding."
            sub="Your accountant will add checklist items here as your return progresses. You'll be notified when action is needed."
          />
        ) : (
          <div>
            {tasks.map((task, idx) => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: idx < tasks.length - 1 ? '1px solid rgba(5,28,44,0.05)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                    background: task.done ? 'rgba(0,212,170,0.1)' : 'transparent',
                    border: `1.5px solid ${task.done ? teal : 'rgba(5,28,44,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {task.done && <span style={{ fontSize: '9px', color: teal }}>✓</span>}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '13px', fontWeight: '500',
                      color: task.done ? muted : navy,
                      textDecoration: task.done ? 'line-through' : 'none',
                    }}>
                      {task.label}
                    </div>
                    {task.due_date && !task.done && (
                      <div style={{
                        fontSize: '10px', color: muted,
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: '2px',
                      }}>
                        Due {formatDate(task.due_date)}
                      </div>
                    )}
                  </div>
                </div>
                {task.done ? (
                  <span style={{
                    fontSize: '10px', padding: '2px 10px',
                    background: 'rgba(0,212,170,0.08)', color: '#00856A',
                    borderRadius: '100px', fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    Complete
                  </span>
                ) : (
                  <span style={{
                    fontSize: '10px', padding: '2px 10px',
                    background: 'rgba(5,28,44,0.05)', color: secondary,
                    borderRadius: '100px', fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
