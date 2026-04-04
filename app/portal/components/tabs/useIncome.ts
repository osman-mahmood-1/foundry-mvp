/**
 * app/portal/components/tabs/useIncome.ts
 *
 * Data hook for the Income tab.
 *
 * Responsibilities:
 * - Fetch income rows month-by-month (most recent month on init)
 * - Maintain accurate totals for the full tax year via a separate lightweight query
 * - Expose loadMonth() to progressively load earlier months
 * - Expose addIncome() and deleteIncome()
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
  // Displayed rows (loaded months only)
  income:          Income[]
  // Accurate totals for the full tax year (from aggregate query)
  totalPence:      number
  entryCount:      number
  // Month pagination
  availableMonths: string[]   // all months with data, sorted desc
  loadedMonths:    string[]   // months whose full row sets are loaded
  hasMore:         boolean
  loadingMore:     boolean
  loadMonth:       () => Promise<void>
  // Standard states
  loading:         boolean
  saving:          boolean
  error:           AppError | null
  // Form
  form:            IncomeFormState
  setForm:         (updater: (prev: IncomeFormState) => IncomeFormState) => void
  isFormValid:     boolean
  // Actions
  addIncome:           () => Promise<void>
  addIncomeWithData:   (data: IncomeFormState) => Promise<void>
  deleteIncome:        (id: string, amountPence: number) => Promise<void>
  resetForm:           () => void
}

// ─── Default form ─────────────────────────────────────────────────────────────

const DEFAULT_FORM: IncomeFormState = {
  description: '',
  amount:      '',
  date:        new Date().toISOString().split('T')[0],
  category:    'trading',
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

export function useIncome(
  clientId: string,
  taxYear:  string,
  userId:   string,
): UseIncomeResult {
  const supabase = createClient()

  const [income,          setIncome]          = useState<Income[]>([])
  const [totalPence,      setTotalPence]      = useState(0)
  const [entryCount,      setEntryCount]      = useState(0)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [loadedMonths,    setLoadedMonths]    = useState<string[]>([])
  const [loading,         setLoading]         = useState(true)
  const [loadingMore,     setLoadingMore]     = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [error,           setError]           = useState<AppError | null>(null)
  const [form,            setForm]            = useState<IncomeFormState>(DEFAULT_FORM)

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      setLoading(true)
      setError(null)

      // Query 1: lightweight — amounts + dates for totals and month index
      const { data: meta, error: metaErr } = await supabase
        .from('income')
        .select('amount_pence, date')
        .eq('client_id', clientId)
        .eq('tax_year', taxYear)
        .neq('status', 'excluded')

      if (metaErr) {
        console.error('INCOME_001', metaErr)
        setError(APP_ERRORS.INCOME_001)
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

      // Query 2: full rows for the most recent month
      const first = months[0]
      const { data: rows, error: rowErr } = await supabase
        .from('income')
        .select('*')
        .eq('client_id', clientId)
        .eq('tax_year', taxYear)
        .gte('date', `${first}-01`)
        .lte('date', lastDayOfMonth(first))
        .neq('status', 'excluded')
        .order('date', { ascending: false })

      if (rowErr) {
        console.error('INCOME_001', rowErr)
        setError(APP_ERRORS.INCOME_001)
      } else {
        setIncome(rows ?? [])
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
      .from('income')
      .select('*')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .gte('date', `${nextMonth}-01`)
      .lte('date', lastDayOfMonth(nextMonth))
      .neq('status', 'excluded')
      .order('date', { ascending: false })

    if (err) {
      console.error('INCOME_001', err)
      setError(APP_ERRORS.INCOME_001)
    } else {
      setIncome(prev => {
        // Replace any manually-added rows for this month with the full set
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
  const addIncome = useCallback(async () => {
    if (!isFormValid(form)) return
    setSaving(true)
    setError(null)

    const amountPence = Math.round(parseFloat(form.amount) * 100)
    const newMonth    = form.date.slice(0, 7)

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
      .select('*')
      .single()

    if (err) {
      console.error('INCOME_002', err)
      setError(APP_ERRORS.INCOME_002)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'income.created', targetType: 'income', targetId: inserted.id })

      setTotalPence(prev => prev + amountPence)
      setEntryCount(prev => prev + 1)

      // Add to month index if this is a brand-new month
      setAvailableMonths(prev => {
        if (prev.includes(newMonth)) return prev
        return [...prev, newMonth].sort((a, b) => b.localeCompare(a))
      })

      // Prepend to displayed rows, sorted by date desc
      setIncome(prev =>
        [inserted, ...prev].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      )

      // Mark brand-new month as loaded (it only has this one row)
      setLoadedMonths(prev => {
        if (availableMonths.includes(newMonth) || prev.includes(newMonth)) return prev
        return [...prev, newMonth]
      })

      setForm(() => DEFAULT_FORM)
    }
    setSaving(false)
  }, [form, clientId, taxYear, userId, availableMonths])

  /**
   * addIncomeWithData — accepts form values directly.
   * Use this from components that manage their own local state (e.g. MobileFormSheet)
   * to avoid the async state race where setForm + addIncome() fires before state settles.
   */
  const addIncomeWithData = useCallback(async (data: IncomeFormState) => {
    if (!isFormValid(data)) return
    setSaving(true)
    setError(null)

    const amountPence = Math.round(parseFloat(data.amount) * 100)
    const newMonth    = data.date.slice(0, 7)

    const { data: inserted, error: err } = await supabase
      .from('income')
      .insert({
        client_id:       clientId,
        description:     data.description.trim(),
        amount_pence:    amountPence,
        date:            data.date,
        category:        data.category as IncomeCategory,
        category_source: 'manual',
        tax_year:        taxYear,
        source:          'manual',
        status:          'confirmed',
      })
      .select('*')
      .single()

    if (err) {
      console.error('INCOME_002', err)
      setError(APP_ERRORS.INCOME_002)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'income.created', targetType: 'income', targetId: inserted.id })
      setTotalPence(prev => prev + amountPence)
      setEntryCount(prev => prev + 1)
      setAvailableMonths(prev => {
        if (prev.includes(newMonth)) return prev
        return [...prev, newMonth].sort((a, b) => b.localeCompare(a))
      })
      setIncome(prev =>
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

  // ── Delete (soft) ───────────────────────────────────────────────
  const deleteIncome = useCallback(async (id: string, amountPence: number) => {
    setError(null)
    const { error: err } = await supabase
      .from('income')
      .update({ status: 'excluded' })
      .eq('id', id)
      .eq('client_id', clientId)

    if (err) {
      console.error('INCOME_003', err)
      setError(APP_ERRORS.INCOME_003)
    } else {
      void logAudit({ actorId: userId, clientId, action: 'income.deleted', targetType: 'income', targetId: id })
      setIncome(prev => prev.filter(i => i.id !== id))
      setTotalPence(prev => prev - amountPence)
      setEntryCount(prev => prev - 1)
    }
  }, [clientId, userId])

  const resetForm = useCallback(() => setForm(() => DEFAULT_FORM), [])

  const hasMore = availableMonths.some(m => !loadedMonths.includes(m))

  return {
    income,
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
    addIncome,
    addIncomeWithData,
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
