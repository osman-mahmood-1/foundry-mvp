'use client'

/**
 * app/portal/components/mobile/tabs/MobileMessagesTab.tsx
 *
 * Thread-style message view. Stays within mobile scroll container.
 * Auto-scrolls to the latest message on load and whenever messages update.
 */

import { useEffect, useRef } from 'react'
import type { Client }   from '@/types'
import { useMessages }   from '@/app/portal/components/tabs/useMessages'
import { useColours }    from '@/styles/ThemeContext'
import { fonts, fontWeight, fontSize } from '@/styles/tokens/typography'
import { radius }        from '@/styles/tokens'

interface Props { client: Client }

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function MobileMessagesTab({ client }: Props) {
  const colours  = useColours()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, loading, sendMessage, sending, draft, setDraft } = useMessages(client.id, client.user_id)

  // Scroll to bottom whenever messages change — covers initial load,
  // incoming realtime events, and optimistic sends.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!draft.trim() || sending) return
    await sendMessage()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 52px)', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        padding:      '16px 16px 12px',
        borderBottom: `1px solid ${colours.borderHairline}`,
        flexShrink:   0,
      }}>
        <h2 style={{ fontFamily: fonts.sans, fontSize: '22px', fontWeight: fontWeight.semibold, color: colours.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
          Messages
        </h2>
      </div>

      {/* Message list */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center' as const, padding: '48px 0', color: colours.textMuted, fontFamily: fonts.sans }}>Loading…</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '48px 0' }}>
            <div style={{ fontSize: '28px', opacity: 0.25, marginBottom: '8px' }}>◇</div>
            <div style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: colours.textMuted }}>No messages yet. Say hello!</div>
          </div>
        ) : (
          messages.map(msg => {
            const isClient = msg.sender_role === 'client'
            return (
              <div key={msg.id} style={{
                display:   'flex',
                flexDirection: 'column',
                alignItems: isClient ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth:     '80%',
                  padding:      '10px 14px',
                  borderRadius: isClient
                    ? `${radius.lg} ${radius.lg} 4px ${radius.lg}`
                    : `${radius.lg} ${radius.lg} ${radius.lg} 4px`,
                  background: isClient ? colours.cta : colours.cardBg,
                  border:     isClient ? 'none' : `1px solid ${colours.cardBorder}`,
                }}>
                  <p style={{
                    fontFamily:  fonts.sans,
                    fontSize:    '14px',
                    color:       isClient ? colours.ctaText : colours.textPrimary,
                    margin:      0,
                    lineHeight:  1.5,
                  }}>
                    {msg.body}
                  </p>
                </div>
                <div style={{
                  fontFamily:  fonts.sans,
                  fontSize:    '11px',
                  color:       colours.textMuted,
                  marginTop:   '4px',
                  fontWeight:  300,
                }}>
                  {formatDay(msg.created_at)} · {formatTime(msg.created_at)}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div style={{
        padding:        '12px 16px',
        paddingBottom:  'calc(12px + env(safe-area-inset-bottom, 0px))',
        borderTop:      `1px solid ${colours.borderHairline}`,
        display:        'flex',
        gap:            '10px',
        alignItems:     'flex-end',
        background:     colours.panelBg,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink:     0,
      }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Message your accountant…"
          rows={1}
          style={{
            flex:         1,
            background:   colours.inputBg,
            border:       `1px solid ${colours.inputBorder}`,
            borderRadius: radius.md,
            padding:      '10px 12px',
            fontFamily:   fonts.sans,
            fontSize:     '14px',
            color:        colours.textPrimary,
            resize:       'none' as const,
            outline:      'none',
            lineHeight:   1.5,
            maxHeight:    '96px',
            overflowY:    'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          style={{
            height:       '44px',
            minWidth:     '44px',
            borderRadius: radius.md,
            border:       'none',
            background:   draft.trim() ? colours.accent : colours.hoverBg,
            color:        draft.trim() ? colours.white : colours.textMuted,
            fontFamily:   fonts.sans,
            fontSize:     '16px',
            cursor:       draft.trim() ? 'pointer' : 'default',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            transition:   'all 0.15s ease',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
