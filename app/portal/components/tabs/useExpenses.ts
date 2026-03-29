/**
 * app/portal/components/tabs/useExpenses.ts
 *
 * Data hook for the Expenses tab.
 * Mirrors useIncome exactly — same pattern, same structure.
 *
 * Key difference from income:
 * - Expenses have an `allowable` flag (boolean | null)
 * - null = pending review, true = allowable, false = not allowable
 * - This drives the Badge colour on each row
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { Expense, ExpenseFormState, ExpenseCategory } from '@/types'

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseExpensesResult {
  expenses:      Expense[]
  totalPence:    number
  entryCount:    number
  loading:       boolean
  saving:        boolean
  error:         string | null
  form:          ExpenseFormState
  setForm:       (updater: (prev: ExpenseFormState) => ExpenseFormState) => void
  isFormValid:   boolean
  addExpense:    () => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  resetForm:     () => void
}

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM: ExpenseFormState = {
  description: '',
  amount:      '',
  date:        new Date().toISOString().split('T')[0],
  category:    'other',
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useExpenses(
  clientId: string,
  taxYear:  string,
): UseExpensesResult {
  const supabase = createClient()

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [form,     setForm]     = useState<ExpenseFormState>(DEFAULT_FORM)

  // ── Fetch ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('expenses')
      .select('*')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .neq('status', 'excluded')
      .order('date', { ascending: false })
    if (err) {
      setError('Failed to load expenses. Please refresh.')
    } else {
      setExpenses(data ?? [])
    }
    setLoading(false)
  }, [clientId, taxYear])

  useEffect(() => { load() }, [load])

  // ── Add ─────────────────────────────────────────────────────────
  const addExpense = useCallback(async () => {
    if (!isFormValid(form)) return
    setSaving(true)
    setError(null)

    const amountPence = Math.round(parseFloat(form.amount) * 100)

    const { error: err } = await supabase
      .from('expenses')
      .insert({
        client_id:       clientId,
        description:     form.description.trim(),
        amount_pence:    amountPence,
        date:            form.date,
        category:        form.category as ExpenseCategory,
        category_source: 'manual',
        tax_year:        taxYear,
        source:          'manual',
        status:          'confirmed',
        allowable:       null,     // pending accountant review
        is_pending:      false,
      })

    if (err) {
      setError('Failed to save. Please try again.')
    } else {
      setForm(() => DEFAULT_FORM)
      await load()
    }
    setSaving(false)
  }, [form, clientId, taxYear, load])

  // ── Delete (soft) ───────────────────────────────────────────────
  const deleteExpense = useCallback(async (id: string) => {
    setError(null)
    const { error: err } = await supabase
      .from('expenses')
      .update({ status: 'excluded' })
      .eq('id', id)
      .eq('client_id', clientId)

    if (err) {
      setError('Failed to remove entry. Please try again.')
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id))
    }
  }, [clientId])

  // ── Derived ─────────────────────────────────────────────────────
  const totalPence = expenses.reduce((sum, e) => sum + e.amount_pence, 0)
  const entryCount = expenses.length

  const resetForm = useCallback(() => {
    setForm(() => DEFAULT_FORM)
  }, [])

  return {
    expenses,
    totalPence,
    entryCount,
    loading,
    saving,
    error,
    form,
    setForm,
    isFormValid: isFormValid(form),
    addExpense,
    deleteExpense,
    resetForm,
  }
}

// ─── Validation ──────────────────────────────────────────────────────────────

function isFormValid(form: ExpenseFormState): boolean {
  if (!form.description.trim()) return false
  const amount = parseFloat(form.amount)
  if (isNaN(amount) || amount <= 0) return false
  if (!form.date) return false
  return true
}