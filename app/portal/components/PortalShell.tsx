'use client'

import { useState } from 'react'
import OverviewTab from './tabs/OverviewTab'
import IncomeTab from './tabs/IncomeTab'
import ExpensesTab from './tabs/ExpensesTab'
import DocumentsTab from './tabs/DocumentsTab'
import MessagesTab from './tabs/MessagesTab'
import TasksTab from './tabs/TasksTab'

const NAV = [
  { id: 'overview',   label: 'Overview',   icon: '▦' },
  { id: 'income',     label: 'Income',      icon: '↑' },
  { id: 'expenses',   label: 'Expenses',    icon: '↓' },
  { id: 'documents',  label: 'Documents',   icon: '□' },
  { id: 'messages',   label: 'Messages',    icon: '◈' },
  { id: 'tasks',      label: 'Tasks',       icon: '◎' },
]

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F0F4FA; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(5,28,44,0.1); border-radius: 2px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg) } }
`

export default function PortalShell({ client }: { client: any }) {
  const [active, setActive] = useState('overview')

  const firstName = client?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const navy = '#051C2C'
  const teal = '#00D4AA'
  const bg = '#F0F4FA'
  const panelBg = 'rgba(255,255,255,0.72)'
  const border = 'rgba(255,255,255,0.95)'
  const shadow = '0 4px 32px rgba(5,28,44,0.07), inset 0 1px 0 rgba(255,255,255,1)'
  const muted = '#94A3B8'
  const secondary = '#475569'

  const renderTab = () => {
    const props = { client, navy, teal, panelBg, border, shadow, muted, secondary }
    switch (active) {
      case 'overview':  return <OverviewTab  {...props} />
      case 'income':    return <IncomeTab    {...props} />
      case 'expenses':  return <ExpensesTab  {...props} />
      case 'documents': return <DocumentsTab {...props} />
      case 'messages':  return <MessagesTab  {...props} />
      case 'tasks':     return <TasksTab     {...props} />
      default:          return <OverviewTab  {...props} />
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: bg,
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
    }}>
      <style>{FONTS}</style>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '20%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5,28,44,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </div>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        margin: '12px 0 12px 12px',
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border: '1px solid rgba(255,255,255,0.98)',
        borderRadius: '18px',
        boxShadow: '0 8px 40px rgba(5,28,44,0.08), inset 0 1px 0 rgba(255,255,255,1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        overflow: 'hidden',
      }}>

        {/* User identity */}
        <div style={{ padding: '24px 18px 18px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '50%',
            background: navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', color: 'white', fontWeight: '600',
            marginBottom: '12px',
          }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '16px', fontWeight: '500',
            color: navy, lineHeight: 1.2,
          }}>
            {firstName}
          </div>
          <div style={{
            fontSize: '10px', color: muted,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.1em', marginTop: '3px',
          }}>
            {client?.tax_year ?? '2024-25'} · {(client?.plan ?? 'starter').toUpperCase()}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(5,28,44,0.06)', margin: '0 18px' }} />

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.map((item) => {
            const on = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  background: on ? navy : 'transparent',
                  border: 'none',
                  color: on ? 'white' : secondary,
                  fontSize: '13px', fontWeight: on ? '500' : '400',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ fontSize: '11px', opacity: on ? 1 : 0.4 }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(5,28,44,0.06)', margin: '0 18px' }} />

        {/* Sign out */}
        <div style={{ padding: '14px 10px' }}>
          <button
            onClick={async () => {
              const { createClient } = await import('../../../lib/supabase')
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            style={{
              width: '100%', padding: '7px 10px',
              background: 'transparent', border: 'none',
              color: muted, fontSize: '12px',
              cursor: 'pointer', textAlign: 'left',
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: '8px',
              transition: 'color 0.15s',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 12px 12px 10px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top bar */}
        <div style={{ marginBottom: '20px', padding: '4px 4px' }}>
          <div style={{
            fontSize: '10px', color: muted,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.15em', textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            {greeting}
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '26px', fontWeight: '500',
            color: navy, lineHeight: 1.2,
          }}>
            {firstName}.
          </h1>
        </div>

        {/* Tab content */}
        <div style={{ animation: 'fadeUp 0.4s ease' }} key={active}>
          {renderTab()}
        </div>
      </main>
    </div>
  )
}
