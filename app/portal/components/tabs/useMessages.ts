/**
 * app/portal/components/tabs/useMessages.ts
 *
 * Data hook for the Messages tab — used by both client and accountant portals.
 *
 * Responsibilities:
 * - Fetch all messages for a client thread, ordered chronologically
 * - Expose sendMessage() for the current user
 * - Real-time subscription via Supabase Realtime so messages from either
 *   party appear instantly without a page refresh
 *
 * Optimistic updates:
 *   When the current user sends a message, it is appended to local state
 *   immediately on insert success — before the realtime echo arrives.
 *   The realtime handler deduplicates by id so it won't double-add.
 *
 * senderRole:
 *   Callers pass the role that should be stamped on sent messages.
 *   'client'     — client portal (default)
 *   'accountant' — accountant portal compose area
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import { logAudit } from '@/lib/audit'
import type { Message, SenderRole } from '@/types'
import type { AppError } from '@/lib/errors'

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseMessagesResult {
  messages:    Message[]
  loading:     boolean
  sending:     boolean
  error:       AppError | null
  draft:       string
  setDraft:    (value: string) => void
  sendMessage: () => Promise<void>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMessages(
  clientId:   string,
  userId:     string,
  senderRole: SenderRole = 'client',
): UseMessagesResult {
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState<AppError | null>(null)
  const [draft,    setDraft]    = useState('')

  // ── Fetch ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
    if (err) {
      console.error('MSG_001', err)
      setError(APP_ERRORS.MSG_001)
    } else {
      setMessages(data ?? [])
    }
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  // ── Real-time subscription ──────────────────────────────────────
  // Both client and accountant subscribe to the same channel.
  // Supabase Realtime applies RLS — each party only receives messages
  // their SELECT policy permits, which covers all messages for this client.
  // The deduplication guard prevents double-adding optimistically sent messages.
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${clientId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `client_id=eq.${clientId}`,
        },
        payload => {
          setMessages(prev => {
            const exists = prev.some(m => m.id === payload.new.id)
            if (exists) return prev
            return [...prev, payload.new as Message]
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clientId])

  // ── Send ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setError(null)

    const { data: inserted, error: err } = await supabase
      .from('messages')
      .insert({
        client_id:   clientId,
        sender_id:   userId,
        sender_role: senderRole,
        body,
        read:        false,
      })
      .select('*')
      .single()

    if (err) {
      console.error('MSG_002', err)
      setError(APP_ERRORS.MSG_002)
    } else {
      // Optimistically append immediately — the realtime echo will be
      // deduplicated by id and won't double-add.
      setMessages(prev => {
        const exists = prev.some(m => m.id === inserted.id)
        if (exists) return prev
        return [...prev, inserted]
      })
      setDraft('')

      void logAudit({
        actorId:    userId,
        clientId,
        action:     'message.sent',
        targetType: 'messages',
        targetId:   clientId,
      })

      // Notify the other party via email (fire-and-forget — must not block UX)
      if (senderRole === 'client') {
        void fetch('/api/email/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, preview: body.slice(0, 200) }),
        }).catch(e => console.error('MSG_EMAIL_001', e))
      }
    }
    setSending(false)
  }, [draft, clientId, userId, senderRole])

  return { messages, loading, sending, error, draft, setDraft, sendMessage }
}
