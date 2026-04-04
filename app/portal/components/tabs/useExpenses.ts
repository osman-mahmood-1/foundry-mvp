/**
 * app/portal/components/tabs/useExpenses.ts
 *
 * Data hook for the Expenses tab.
 * Mirrors useIncome — month-grouped pagination with accurate full-year totals.
 *
 * Key difference from income:
 * - Expenses have an `allowable` flag (boolean | null)
 * - null = pending review, true = allowable, false = not allowable
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import { logAudit } from '@/lib/audit'
import type { Expense, ExpenseFormState, ExpenseCategory } from '@/types'
import type { AppError } from '@/lib/errors'

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseExpensesResult {
  expenses:        Expense[]
  totalPence:      number
  entryCount:      number
  availableMonths: string[]
  loadedMonths:    string[]
  hasMore:         boolean
  loadingMore:     boolean
  loadMonth:       () => Promise<void>
  loading:         boolean
  saving:          boolean
  error:           AppError | null
  form:            ExpenseFormState
  setForm:         (updater: (prev: ExpenseFormState) => ExpenseFormState) => void
  isFormValid:     boolean
  addExpense:          () => Promise<void>
  addExpenseWithData:  (data: ExpenseFormState) => Promise<void>
  deleteExpense:       (id: string, amountPence: number) => Promise<void>
  resetForm:           () => void
}

// ─── Default form ─────────────────────────────────────────────────────────────

const DEFAULT_FORM: ExpenseFormState = {
  description: '',
  amount:      '',
  date:        new Date().toISOString().split('T')[0],
  category:    'other',
}

// ─── Month helpers ────────────────────────────────────────────────────────────

function uniqueMonths(dates: string[]): string[] {
  const set = new Set(dates.map(d => d.slice(0, 7)))
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}

function lastDayOfMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useExpenses(
  clientId: string,
  taxYear:  string,
  userId:   string,
): UseExpensesResult {
  const supabase = createClient()

  const [expenses,        setExpenses]        = useState<Expense[]>([])
  const [totalPence,      setTotalPence]      = useState(0)
  const [entryCount,      setEntryCount]      = useState(0)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [loadedMonths,    setLoadedMonths]    = useState<string[]>([])
  const [loading,         setLoading]         = useState(true)
  const [loadingMore,     setLoadingMore]     = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState<AppError | null>(null)
  const [form,            setForm]            = useState<ExpenseFormState>(DEFAULT_FORM)

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true)
      setError(null)

      const { data: meta, error: metaErr } = await supabase
        .from('expenses')
        .select('amount_pence, date')
        .eq('client_id', clientId)
        .eq('tax_year', taxYear)
        .neq('status', 'excluded')

      if (metaErr) {
        console.error('EXPENSE_001', metaErr)
        setError(APP_ERRORS.EXPENSE_001)
        setLoading(false)
        return
      }

      const allMeta = meta ?? []
      setTotalPence(allMeta.reduce((s, r) => s + r.amount_pence, 0))
      setEntryCount(allMeta.length)

      const months = uniqueMonths(allMeta.map(r => r.date))
      setAvailableMonths(months)

      if (months.length === 0) {
        setLoading(false)
        return
      }

      const first = months[0]
      const { data: rows, error: rowErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('client_id', clientId)
        .eq('tax_year', taxYear)
        .gte('date', `${first}-01`)
        .lte('date', lastDayOfMonth(first))
        .neq('status', 'excluded')
        .order('date', { ascending: false })

      if (rowErr) {
        console.error('EXPENSE_001', rowErr)
        setError(APP_ERRORS.EXPENSE_001)
      } else {
        setExpenses(rows ?? [])
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
      .from('expenses')
      .select('*')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .gte('date', `${nextMonth}-01`)
      .lte('date', lastDayOfMonth(nextMonth))
      .neq('status', 'excluded')
      .order('date', { ascending: false })

    if (err) {
      console.error('EXPENSE_001', err)
      setError(APP_ERRORS.EXPENSE_001)
    } else {
      setExpenses(prev => {
        const without = prev.filter(r => r.date.slice(0, 7) !== nextMonth)
        return [...without, ...(data ?? [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
      })
      setLoadedMonths(prev => [...prev, nextMonth])
    }
    setLoadingMore(false)
  }, [clientId, taxYear, availableMonths, loadedMonths])

  // ── Add ──────────────────────────────────────────────────────────
  const addExpense = useCallback(async () => {
    if (!isFormValid(form)) return
    setSaving(true)
    setError(null)

    const amountPence = Math.round(parseFloat(form.amount) * 100)
    const newMonth    = form.date.slice(0, 7)

    const { data: inserted, error: err } = await supabase
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
        allowable:       null,
        is_pending:      false,
      })
      .select('*')
      .single()

    if (err) {
      console.error('EXPENSE_002', err)
      setError(APP_ERRORS.EXPENSE_002)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'expense.created', targetType: 'expenses', targetId: inserted.id })

      setTotalPence(prev => prev + amountPence)
      setEntryCount(prev => prev + 1)

      setAvailableMonths(prev => {
        if (prev.includes(newMonth)) return prev
        return [...prev, newMonth].sort((a, b) => b.localeCompare(a))
      })

      setExpenses(prev =>
        [inserted, ...prev].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      )

      setLoadedMonths(prev => {
        if (availableMonths.includes(newMonth) || prev.includes(newMonth)) return prev
        return [...prev, newMonth]
      })

      setForm(() => DEFAULT_FORM)
    }
    setSaving(false)
  }, [form, clientId, taxYear, userId, availableMonths])

  /**
   * addExpenseWithData — accepts form values directly.
   * Use from components managing their own local state to avoid the async
   * state race where setForm + addExpense() fires before state settles.
   */
  const addExpenseWithData = useCallback(async (data: ExpenseFormState) => {
    if (!isFormValid(data)) return
    setSaving(true)
    setError(null)

    const amountPence = Math.round(parseFloat(data.amount) * 100)
    const newMonth    = data.date.slice(0, 7)

    const { data: inserted, error: err } = await supabase
      .from('expenses')
      .insert({
        client_id:       clientId,
        description:     data.description.trim(),
        amount_pence:    amountPence,
        date:            data.date,
        category:        data.category as ExpenseCategory,
        category_source: 'manual',
        tax_year:        taxYear,
        source:          'manual',
        status:          'confirmed',
        allowable:       null,
        is_pending:      false,
      })
      .select('*')
      .single()

    if (err) {
      console.error('EXPENSE_002', err)
      setError(APP_ERRORS.EXPENSE_002)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'expense.created', targetType: 'expenses', targetId: inserted.id })
      setTotalPence(prev => prev + amountPence)
      setEntryCount(prev => prev + 1)
      setAvailableMonths(prev => {
        if (prev.includes(newMonth)) return prev
        return [...prev, newMonth].sort((a, b) => b.localeCompare(a))
      })
      setExpenses(prev =>
        [inserted, ...prev].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      )
      setLoadedMonths(prev => {
        if (availableMonths.includes(newMonth) || prev.includes(newMonth)) return prev
        return [...prev, newMonth]
      })
    }
    setSaving(false)
  }, [clientId, taxYear, userId, availableMonths])
  const deleteExpense = useCallback(async (id: string, amountPence: number) => {
    setError(null)
    const { error: err } = await supabase
      .from('expenses')
      .update({ status: 'excluded' })
      .eq('id', id)
      .eq('client_id', clientId)

    if (err) {
      console.error('EXPENSE_003', err)
      setError(APP_ERRORS.EXPENSE_003)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'expense.deleted', targetType: 'expenses', targetId: id })
      setExpenses(prev => prev.filter(e => e.id !== id))
      setTotalPence(prev => prev - amountPence)
      setEntryCount(prev => prev - 1)
    }
  }, [clientId, userId])

  const resetForm = useCallback(() => setForm(() => DEFAULT_FORM), [])

  const hasMore = availableMonths.some(m => !loadedMonths.includes(m))

  return {
    expenses,
    totalPence,
    entryCount,
    availableMonths,
    loadedMonths,
    hasMore,
    loadingMore,
    loadMonth,
    loading,
    saving,
    error,
    form,
    setForm,
    isFormValid: isFormValid(form),
    addExpense,
    addExpenseWithData,
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
