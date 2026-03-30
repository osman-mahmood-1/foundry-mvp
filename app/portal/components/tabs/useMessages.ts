/**
 * app/portal/components/tabs/useMessages.ts
 *
 * Data hook for the Messages tab.
 *
 * Responsibilities:
 * - Fetch all messages for this client, ordered chronologically
 * - Expose sendMessage() for client replies
 * - Real-time subscription via Supabase channel so new messages
 *   from the accountant appear without a page refresh
 *
 * SenderRole breakdown:
 *   'client'     — message from the client (this user)
 *   'accountant' — message from the assigned accountant
 *   'ai_agent'   — Foundry Intelligence response
 *   'system'     — automated system message
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
  clientId: string,
  userId:   string,
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
  // New messages from the accountant appear instantly without refresh.
  // Think of this like a live phone line — once opened, new messages
  // arrive automatically rather than requiring you to call again.
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
            // Avoid duplicates if we already have this message
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

    const { error: err } = await supabase
      .from('messages')
      .insert({
        client_id:   clientId,
        sender_id:   userId,
        sender_role: 'client' as SenderRole,
        body,
        read:        false,
      })

    if (err) {
      console.error('MSG_002', err)
      setError(APP_ERRORS.MSG_002)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'message.sent', targetType: 'messages', targetId: clientId })
      setDraft('')
    }
    setSending(false)
  }, [draft, clientId, userId])

  return {
    messages,
    loading,
    sending,
    error,
    draft,
    setDraft,
    sendMessage,
  }
}