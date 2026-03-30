/**
 * app/portal/components/tabs/useDocuments.ts
 *
 * Data hook for the Documents tab.
 *
 * Responsibilities:
 * - Fetch all documents for this client + tax year
 * - Handle file upload to Supabase Storage
 * - Insert document metadata row after successful upload
 * - Expose deleteDocument() as soft delete (marks reviewed = false, flags for removal)
 *
 * Storage bucket: 'documents'
 * Storage path:   {client_id}/{tax_year}/{filename}
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import type { Document as FoundryDocument, DocumentCategory } from '@/types'
import type { AppError } from '@/lib/errors'

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseDocumentsResult {
  documents:      FoundryDocument[]
  loading:        boolean
  uploading:      boolean
  error:          AppError | null
  uploadDocument: (file: File, category: DocumentCategory) => Promise<void>
  deleteDocument: (id: string, storagePath: string) => Promise<void>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDocuments(
  clientId: string,
  taxYear:  string,
  userId:   string,
): UseDocumentsResult {
  const supabase = createClient()

  const [documents, setDocuments] = useState<FoundryDocument[]>([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState<AppError | null>(null)

  // ── Fetch ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .order('created_at', { ascending: false })
    if (err) {
      console.error('DOC_001', err)
      setError(APP_ERRORS.DOC_001)
    } else {
      setDocuments(data ?? [])
    }
    setLoading(false)
  }, [clientId, taxYear])

  useEffect(() => { load() }, [load])

  // ── Upload ──────────────────────────────────────────────────────
  const uploadDocument = useCallback(async (
    file:     File,
    category: DocumentCategory,
  ) => {
    setUploading(true)
    setError(null)

    // Sanitise filename — no spaces, no special characters
    const safeName    = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${clientId}/${taxYear}/${Date.now()}_${safeName}`

    // 1. Upload to Storage
    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, { upsert: false })

    if (uploadErr) {
      console.error('DOC_002', uploadErr)
      setError(APP_ERRORS.DOC_002)
      setUploading(false)
      return
    }

    // 2. Insert metadata row
    const { error: insertErr } = await supabase
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

    if (insertErr) {
      console.error('DOC_003', insertErr)
      setError(APP_ERRORS.DOC_003)
      setUploading(false)
      return
    }

    await load()
    setUploading(false)
  }, [clientId, taxYear, userId, load])

  // ── Delete ──────────────────────────────────────────────────────
  const deleteDocument = useCallback(async (id: string, storagePath: string) => {
    setError(null)

    // Remove from Storage
    await supabase.storage.from('documents').remove([storagePath])

    // Remove metadata row
    const { error: err } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId)

    if (err) {
      console.error('DOC_004', err)
      setError(APP_ERRORS.DOC_004)
    } else {
      setDocuments(prev => prev.filter(d => d.id !== id))
    }
  }, [clientId])

  return {
    documents,
    loading,
    uploading,
    error,
    uploadDocument,
    deleteDocument,
  }
}