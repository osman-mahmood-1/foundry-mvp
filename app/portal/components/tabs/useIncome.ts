/**
 * app/portal/components/tabs/useIncome.ts
 *
 * Data hook for the Income tab.
 *
 * Responsibilities:
 * - Fetch all income rows for this client + tax year
 * - Expose addIncome() to insert a new row
 * - Expose deleteIncome() to soft-delete (sets status = 'excluded')
 * - Derive summary totals from fetched data
 *
 * Rules:
 * - No UI. No JSX. No style objects.
 * - All Supabase access lives here — never in the component.
 * - Returns typed data only — no `any`.
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import { logAudit } from '@/lib/audit'
import type { Income, IncomeFormState, IncomeCategory } from '@/types'
import type { AppError } from '@/lib/errors'

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseIncomeResult {
  // Data
  income:        Income[]
  totalPence:    number
  entryCount:    number
  // Loading states
  loading:       boolean
  saving:        boolean
  error:         AppError | null
  // Form state
  form:          IncomeFormState
  setForm:       (updater: (prev: IncomeFormState) => IncomeFormState) => void
  isFormValid:   boolean
  // Actions
  addIncome:     () => Promise<void>
  deleteIncome:  (id: string) => Promise<void>
  resetForm:     () => void
}

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM: IncomeFormState = {
  description: '',
  amount:      '',
  date:        new Date().toISOString().split('T')[0], // today
  category:    'trading',
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useIncome(
  clientId: string,
  taxYear:  string,
  userId:   string,
): UseIncomeResult {
  const supabase = createClient()

  const [income,  setIncome]  = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<AppError | null>(null)
  const [form,    setForm]    = useState<IncomeFormState>(DEFAULT_FORM)

  // ── Fetch ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('income')
      .select('*')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .neq('status', 'excluded')           // excluded = soft-deleted
      .order('date', { ascending: false })
    if (err) {
      console.error('INCOME_001', err)
      setError(APP_ERRORS.INCOME_001)
    } else {
      setIncome(data ?? [])
    }
    setLoading(false)
  }, [clientId, taxYear])

  useEffect(() => { load() }, [load])

  // ── Add ─────────────────────────────────────────────────────────
  const addIncome = useCallback(async () => {
    if (!isFormValid(form)) return
    setSaving(true)
    setError(null)

    const amountPence = Math.round(parseFloat(form.amount) * 100)

    const { data: inserted, error: err } = await supabase
      .from('income')
      .insert({
        client_id:       clientId,
        description:     form.description.trim(),
        amount_pence:    amountPence,
        date:            form.date,
        category:        form.category as IncomeCategory,
        category_source: 'manual',
        tax_year:        taxYear,
        source:          'manual',
        status:          'confirmed',
      })
      .select('id')
      .single()

    if (err) {
      console.error('INCOME_002', err)
      setError(APP_ERRORS.INCOME_002)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'income.created', targetType: 'income', targetId: inserted.id })
      setForm(() => DEFAULT_FORM)
      await load()
    }
    setSaving(false)
  }, [form, clientId, taxYear, load])

  // ── Delete (soft) ───────────────────────────────────────────────
  const deleteIncome = useCallback(async (id: string) => {
    setError(null)
    const { error: err } = await supabase
      .from('income')
      .update({ status: 'excluded' })
      .eq('id', id)
      .eq('client_id', clientId)      // RLS belt-and-braces

    if (err) {
      console.error('INCOME_003', err)
      setError(APP_ERRORS.INCOME_003)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'income.deleted', targetType: 'income', targetId: id })
      setIncome(prev => prev.filter(i => i.id !== id))
    }
  }, [clientId, userId])

  // ── Derived ─────────────────────────────────────────────────────
  const totalPence = income.reduce((sum, i) => sum + i.amount_pence, 0)
  const entryCount = income.length

  const resetForm = useCallback(() => {
    setForm(() => DEFAULT_FORM)
  }, [])

  return {
    income,
    totalPence,
    entryCount,
    loading,
    saving,
    error,
    form,
    setForm,
    isFormValid: isFormValid(form),
    addIncome,
    deleteIncome,
    resetForm,
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

function isFormValid(form: IncomeFormState): boolean {
  if (!form.description.trim()) return false
  const amount = parseFloat(form.amount)
  if (isNaN(amount) || amount <= 0) return false
  if (!form.date) return false
  return true
}