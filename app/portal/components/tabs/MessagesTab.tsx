'use client'

/**
 * app/portal/components/tabs/MessagesTab.tsx
 *
 * Messages tab — threaded conversation between client and accountant.
 *
 * Layout:
 *   - Scrollable message thread (oldest at top, newest at bottom)
 *   - Each bubble is aligned left (accountant/system) or right (client)
 *   - Compose area pinned to the bottom
 *   - Real-time: new messages from accountant appear without refresh
 *
 * Phase 1 scope:
 *   - Client can read and send messages
 *   - Accountant replies via the accountant portal (not built yet)
 *   - AI agent messages surface here when connected (Phase 2)
 */

import { useEffect, useRef } from 'react'
import type { Client } from '@/types'
import { useMessages } from './useMessages'
import { Spinner, EmptyState } from '../ui'
import { light as colours } from '@/styles/tokens/colours'
import { fonts, fontSize, fontWeight } from '@/styles/tokens/typography'
import { radius, transition, spacing } from '@/styles/tokens'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  client: Client
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessagesTab({ client }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    loading,
    sending,
    error,
    draft,
    setDraft,
    sendMessage,
  } = useMessages(client.id, client.user_id)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (loading) return <Spinner />

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        'calc(100vh - 120px)',
      gap:           spacing.tab.gap,
    }}>

      {/* ── Thread ── */}
      <div
        ref={scrollRef}
        style={{
          flex:       1,
          overflowY:  'auto',
          background: colours.panelBg,
          backdropFilter: 'blur(48px)',
          WebkitBackdropFilter: 'blur(48px)',
          border:     `1px solid ${colours.borderHairline}`,
          borderRadius: radius.panel,
          padding:    spacing.panel.padding,
          display:    'flex',
          flexDirection: 'column',
          gap:        '12px',
          minHeight:  '300px',
        }}
      >
        {messages.length === 0 ? (
          <EmptyState
            icon="◇"
            headline="No messages yet."
            sub="Your accountant will reach out here with questions, updates, and confirmations. You can also send them a message below."
          />
        ) : (
          messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              isClient={message.sender_role === 'client'}
            />
          ))
        )}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          padding:      '10px 14px',
          background:   colours.dangerLight,
          border:       `1px solid ${colours.danger}`,
          borderRadius: radius.md,
          fontSize:     fontSize.sm,
          color:        colours.danger,
        }}>
          {error}
        </div>
      )}

      {/* ── Compose area ── */}
      <div style={{
        background:   colours.panelBg,
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border:       `1px solid ${colours.borderHairline}`,
        borderRadius: radius.panel,
        padding:      spacing.panel.paddingTight,
        display:      'flex',
        gap:          '10px',
        alignItems:   'flex-end',
      }}>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            // Send on Enter, new line on Shift+Enter
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Message your accountant…"
          rows={2}
          style={{
            flex:       1,
            padding:    '10px 12px',
            border:     `1px solid ${colours.borderMedium}`,
            borderRadius: radius.md,
            fontSize:   fontSize.base,
            color:      colours.textPrimary,
            fontFamily: fonts.sans,
            background: colours.inputBg,
            resize:     'none' as const,
            outline:    'none',
            lineHeight: 1.5,
            transition: transition.snap,
          }}
          onFocus={e  => { e.target.style.borderColor = colours.accent }}
          onBlur={e   => { e.target.style.borderColor = colours.borderMedium }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !draft.trim()}
          style={{
            padding:      '10px 20px',
            background:   colours.accent,
            color:        colours.textInverse,
            border:       'none',
            borderRadius: radius.pill,
            fontSize:     fontSize.sm,
            fontWeight:   fontWeight.medium,
            fontFamily:   fonts.sans,
            cursor:       sending || !draft.trim() ? 'not-allowed' : 'pointer',
            opacity:      sending || !draft.trim() ? 0.5 : 1,
            transition:   transition.snap,
            flexShrink:   0,
            whiteSpace:   'nowrap' as const,
          }}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>

      {/* Send hint */}
      <div style={{
        fontSize:   fontSize.xs,
        color:      colours.textMuted,
        fontFamily: fonts.mono,
        textAlign:  'center' as const,
        marginTop:  '-8px',
      }}>
        Enter to send · Shift+Enter for new line
      </div>

    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message:  import('@/types').Message
  isClient: boolean
}

function MessageBubble({ message, isClient }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  const senderLabel = () => {
    switch (message.sender_role) {
      case 'accountant': return 'Your accountant'
      case 'ai_agent':   return 'Foundry Intelligence'
      case 'system':     return 'Foundry'
      default:           return 'You'
    }
  }

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      alignItems:    isClient ? 'flex-end' : 'flex-start',
      gap:           '4px',
    }}>
      {/* Sender label */}
      <div style={{
        fontSize:   fontSize.xs,
        color:      colours.textMuted,
        fontFamily: fonts.mono,
        padding:    '0 4px',
      }}>
        {senderLabel()} · {time}
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth:     '72%',
        padding:      '10px 14px',
        borderRadius: isClient
          ? `${radius.panel} ${radius.panel} ${radius.xs} ${radius.panel}`
          : `${radius.panel} ${radius.panel} ${radius.panel} ${radius.xs}`,
        background:   isClient ? colours.accent : colours.panelBgSolid,
        border:       isClient ? 'none' : `1px solid ${colours.borderHairline}`,
        color:        isClient ? colours.textInverse : colours.textPrimary,
        fontSize:     fontSize.base,
        lineHeight:   1.6,
        fontFamily:   fonts.sans,
        boxShadow:    isClient
          ? '0 2px 8px rgba(0,122,255,0.20)'
          : '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        {message.body}
      </div>
    </div>
  )
}