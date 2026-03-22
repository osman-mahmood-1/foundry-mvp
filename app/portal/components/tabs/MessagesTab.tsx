'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '../../../../lib/supabase'
import { Panel, Label, EmptyState, Spinner, formatDate } from '../ui'

export default function MessagesTab({ client, navy, teal, muted, secondary }: any) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!client?.id) return
    loadMessages()

    // Realtime subscription
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `client_id=eq.${client.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [client])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    setLoading(false)
  }

  async function sendMessage() {
    if (!body.trim()) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('messages').insert({
      client_id: client.id,
      sender_id: user.id,
      sender_role: 'client',
      body: body.trim(),
      read: false,
    })
    setBody('')
    setSending(false)
  }

  if (loading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: 'calc(100vh - 160px)' }}>
      <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} padding="0">

        {/* Thread header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(5,28,44,0.06)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: navy, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: '600',
          }}>F</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: navy }}>Your accountant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: teal }} />
              <span style={{ fontSize: '10px', color: '#00856A', fontFamily: "'JetBrains Mono', monospace" }}>Available</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <EmptyState
              icon="◈"
              headline="Your accountant is ready."
              sub="Ask anything — expenses, deadlines, HMRC questions. Every message is read and responded to personally."
            />
          ) : (
            messages.map((msg) => {
              const isClient = msg.sender_role === 'client'
              const isAI = msg.sender_role === 'ai_agent'
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: isClient ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '72%',
                    padding: '10px 14px',
                    borderRadius: isClient ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                    background: isClient ? navy : isAI ? 'rgba(0,212,170,0.08)' : 'rgba(5,28,44,0.05)',
                    border: isAI ? '1px solid rgba(0,212,170,0.2)' : 'none',
                  }}>
                    {!isClient && (
                      <div style={{
                        fontSize: '9px', color: isAI ? '#00856A' : muted,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        marginBottom: '4px',
                      }}>
                        {isAI ? 'AI Agent' : 'Accountant'}
                      </div>
                    )}
                    <p style={{
                      fontSize: '13px', lineHeight: 1.55,
                      color: isClient ? 'white' : navy,
                    }}>
                      {msg.body}
                    </p>
                    <div style={{
                      fontSize: '9px', marginTop: '5px',
                      color: isClient ? 'rgba(255,255,255,0.4)' : muted,
                      fontFamily: "'JetBrains Mono', monospace",
                      textAlign: isClient ? 'right' : 'left',
                    }}>
                      {formatDate(msg.created_at)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(5,28,44,0.06)',
          display: 'flex', gap: '8px', alignItems: 'flex-end',
        }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask your accountant anything..."
            rows={1}
            style={{
              flex: 1, padding: '10px 14px',
              border: '1px solid rgba(5,28,44,0.12)',
              borderRadius: '12px', fontSize: '13px', color: navy,
              outline: 'none', resize: 'none', fontFamily: "'DM Sans', sans-serif",
              background: 'rgba(255,255,255,0.8)',
              lineHeight: 1.5,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !body.trim()}
            style={{
              padding: '10px 18px', background: navy, color: 'white',
              border: 'none', borderRadius: '100px', fontSize: '12px',
              fontWeight: '500', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              opacity: sending || !body.trim() ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            Send
          </button>
        </div>
      </Panel>
    </div>
  )
}
