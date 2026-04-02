'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

const QUEUE_KEY = 'foundry_offline_queue'

export interface OfflineEntry {
  id:        string
  type:      'income' | 'expense'
  clientId:  string
  taxYear:   string
  data:      Record<string, unknown>
  createdAt: string
}

interface UseOfflineQueueReturn {
  isOnline:        boolean
  queueLength:     number
  syncToast:       string | null
  dismissToast:    () => void
  addToQueue:      (entry: Omit<OfflineEntry, 'id' | 'createdAt'>) => void
  shouldQueue:     () => boolean
}

function loadQueue(): OfflineEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as OfflineEntry[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: OfflineEntry[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline]       = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  const [syncToast, setSyncToast]     = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync queue length on mount
  useEffect(() => {
    setIsOnline(navigator.onLine)
    setQueueLength(loadQueue().length)
  }, [])

  const showToast = useCallback((msg: string) => {
    setSyncToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setSyncToast(null), 3000)
  }, [])

  const flushQueue = useCallback(async () => {
    const queue = loadQueue()
    if (queue.length === 0) return
    const supabase = createClient()
    const synced: string[] = []

    for (const entry of queue) {
      try {
        const table = entry.type === 'income' ? 'income' : 'expenses'
        const { error } = await supabase.from(table).insert({
          ...entry.data,
          client_id: entry.clientId,
          tax_year:  entry.taxYear,
        })
        if (!error) synced.push(entry.id)
      } catch {
        // leave in queue on error — will retry next online event
      }
    }

    if (synced.length > 0) {
      const remaining = queue.filter(e => !synced.includes(e.id))
      saveQueue(remaining)
      setQueueLength(remaining.length)
      showToast(`${synced.length} entr${synced.length === 1 ? 'y' : 'ies'} synced`)
    }
  }, [showToast])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [flushQueue])

  const addToQueue = useCallback((entry: Omit<OfflineEntry, 'id' | 'createdAt'>) => {
    const full: OfflineEntry = {
      ...entry,
      id:        `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    }
    const queue = [...loadQueue(), full]
    saveQueue(queue)
    setQueueLength(queue.length)
  }, [])

  const shouldQueue = useCallback(() => !navigator.onLine, [])

  const dismissToast = useCallback(() => {
    setSyncToast(null)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  return { isOnline, queueLength, syncToast, dismissToast, addToQueue, shouldQueue }
}
