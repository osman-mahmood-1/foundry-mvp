/**
 * app/portal/components/tabs/useDocuments.ts
 *
 * Data hook for the Documents tab.
 * Month-grouped pagination using created_at for the month index.
 *
 * Storage bucket: 'documents'
 * Storage path:   {client_id}/{tax_year}/{filename}
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import { logAudit } from '@/lib/audit'
import type { Document as FoundryDocument, DocumentCategory } from '@/types'
import type { AppError } from '@/lib/errors'

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseDocumentsResult {
  documents:       FoundryDocument[]
  totalCount:      number              // total docs for this tax year
  availableMonths: string[]
  loadedMonths:    string[]
  hasMore:         boolean
  loadingMore:     boolean
  loadMonth:       () => Promise<void>
  loading:         boolean
  uploading:       boolean
  error:           AppError | null
  uploadDocument:  (file: File, category: DocumentCategory) => Promise<void>
  deleteDocument:  (id: string, storagePath: string) => Promise<void>
}

// ─── Month helpers ────────────────────────────────────────────────────────────

function uniqueMonths(timestamps: string[]): string[] {
  const set = new Set(timestamps.map(t => t.slice(0, 7)))
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}

// For created_at (ISO timestamp), use exclusive upper bound on next month start
function nextMonthStart(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const next   = new Date(y, m, 1) // m (not m-1) because JS months are 0-indexed
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDocuments(
  clientId: string,
  taxYear:  string,
  userId:   string,
): UseDocumentsResult {
  const supabase = createClient()

  const [documents,       setDocuments]       = useState<FoundryDocument[]>([])
  const [totalCount,      setTotalCount]      = useState(0)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [loadedMonths,    setLoadedMonths]    = useState<string[]>([])
  const [loading,         setLoading]         = useState(true)
  const [loadingMore,     setLoadingMore]     = useState(false)
  const [uploading,       setUploading]       = useState(false)
  const [error,           setError]           = useState<AppError | null>(null)

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true)
      setError(null)

      // Query 1: lightweight — timestamps for count and month index
      const { data: meta, error: metaErr } = await supabase
        .from('documents')
        .select('created_at')
        .eq('client_id', clientId)
        .eq('tax_year', taxYear)

      if (metaErr) {
        console.error('DOC_001', metaErr)
        setError(APP_ERRORS.DOC_001)
        setLoading(false)
        return
      }

      const allMeta = meta ?? []
      setTotalCount(allMeta.length)

      const months = uniqueMonths(allMeta.map(r => r.created_at))
      setAvailableMonths(months)

      if (months.length === 0) {
        setLoading(false)
        return
      }

      // Query 2: full rows for the most recent month
      const first = months[0]
      const { data: rows, error: rowErr } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientId)
        .eq('tax_year', taxYear)
        .gte('created_at', `${first}-01`)
        .lt('created_at', nextMonthStart(first))
        .order('created_at', { ascending: false })

      if (rowErr) {
        console.error('DOC_001', rowErr)
        setError(APP_ERRORS.DOC_001)
      } else {
        setDocuments(rows ?? [])
        setLoadedMonths([first])
      }
      setLoading(false)
    }

    init()
  }, [clientId, taxYear])

  // ── Load next month ───────────────────────────────────────────────
  const loadMonth = useCallback(async () => {
    const nextMonth = availableMonths.find(m => !loadedMonths.includes(m))
    if (!nextMonth) return
    setLoadingMore(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .gte('created_at', `${nextMonth}-01`)
      .lt('created_at', nextMonthStart(nextMonth))
      .order('created_at', { ascending: false })

    if (err) {
      console.error('DOC_001', err)
      setError(APP_ERRORS.DOC_001)
    } else {
      setDocuments(prev => {
        const without = prev.filter(d => d.created_at.slice(0, 7) !== nextMonth)
        return [...without, ...(data ?? [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      })
      setLoadedMonths(prev => [...prev, nextMonth])
    }
    setLoadingMore(false)
  }, [clientId, taxYear, availableMonths, loadedMonths])

  // ── Upload ──────────────────────────────────────────────────────
  const uploadDocument = useCallback(async (
    file:     File,
    category: DocumentCategory,
  ) => {
    setUploading(true)
    setError(null)

    const safeName    = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${clientId}/${taxYear}/${Date.now()}_${safeName}`

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, { upsert: false })

    if (uploadErr) {
      console.error('DOC_002', uploadErr)
      setError(APP_ERRORS.DOC_002)
      setUploading(false)
      return
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('documents')
      .insert({
        client_id:         clientId,
        storage_path:      storagePath,
        original_filename: file.name,
        mime_type:         file.type,
        size_bytes:        file.size,
        category,
        tax_year:          taxYear,
        uploaded_by:       userId,
        reviewed:          false,
        ocr_status:        'pending',
      })
      .select('*')
      .single()

    if (insertErr || !inserted) {
      console.error('DOC_003', insertErr)
      setError(APP_ERRORS.DOC_003)
      setUploading(false)
      return
    }

    void logAudit({ actorId: userId, clientId, action: 'document.uploaded', targetType: 'documents', targetId: storagePath })

    const newMonth = inserted.created_at.slice(0, 7)
    setTotalCount(prev => prev + 1)

    setAvailableMonths(prev => {
      if (prev.includes(newMonth)) return prev
      return [...prev, newMonth].sort((a, b) => b.localeCompare(a))
    })

    setDocuments(prev =>
      [inserted, ...prev].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    )

    setLoadedMonths(prev => {
      if (availableMonths.includes(newMonth) || prev.includes(newMonth)) return prev
      return [...prev, newMonth]
    })

    setUploading(false)
  }, [clientId, taxYear, userId, availableMonths])

  // ── Delete ──────────────────────────────────────────────────────
  const deleteDocument = useCallback(async (id: string, storagePath: string) => {
    setError(null)

    await supabase.storage.from('documents').remove([storagePath])

    const { error: err } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId)

    if (err) {
      console.error('DOC_004', err)
      setError(APP_ERRORS.DOC_004)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'document.deleted', targetType: 'documents', targetId: id })
      setDocuments(prev => prev.filter(d => d.id !== id))
      setTotalCount(prev => prev - 1)
    }
  }, [clientId, userId])

  const hasMore = availableMonths.some(m => !loadedMonths.includes(m))

  return {
    documents,
    totalCount,
    availableMonths,
    loadedMonths,
    hasMore,
    loadingMore,
    loadMonth,
    loading,
    uploading,
    error,
    uploadDocument,
    deleteDocument,
  }
}
