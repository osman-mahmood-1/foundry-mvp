/**
 * app/accountant/hooks/useExpenseReviews.ts
 *
 * Hook for reading and saving accountant expense review decisions.
 *
 * Reads from / writes to the `expense_reviews` table.
 * RLS allows the accountant to read and write reviews for their assigned clients.
 * Clients can read reviews (to see their allowability decision) but cannot write.
 *
 * One review per expense (UNIQUE constraint on expense_id).
 * Upserts on conflict — accountants can revise a decision.
 *
 * Rules:
 * - No JSX. No style objects. Pure data logic.
 * - All Supabase access lives here.
 * - Returns typed data only.
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient }  from '@/lib/supabase'
import { APP_ERRORS }    from '@/lib/errors'
import { logAudit }      from '@/lib/audit'
import type { ExpenseReview, HmrcTreatment } from '@/types'
import type { AppError } from '@/lib/errors'

// ─── Return type ──────────────────────────────────────────────────────────────

export interface UseExpenseReviewsResult {
  /** Reviews indexed by expense_id for O(1) lookup */
  reviews:          Record<string, ExpenseReview>
  allowableCount:   number
  pendingCount:     number
  notAllowableCount: number
  loading:          boolean
  saving:           boolean
  error:            AppError | null
  saveReview: (params: {
    expenseId:     string
    allowable:     boolean
    hmrcTreatment: HmrcTreatment | null
    reason:        string
    actorId:       string
  }) => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExpenseReviews(
  clientId:     string,
  accountantId: string | null,
  totalExpenses: number,   // total expense count for pending calculation
): UseExpenseReviewsResult {
  const [reviews, setReviews] = useState<Record<string, ExpenseReview>>({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<AppError | null>(null)

  const supabase = createClient()

  // ── Fetch all reviews for this client ─────────────────────────────────────
  useEffect(() => {
    if (!accountantId) {
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('expense_reviews')
      .select('*')
      .eq('client_id', clientId)
      .eq('accountant_id', accountantId)
      .then(({ data, error: err }) => {
        setLoading(false)
        if (err) {
          setError(APP_ERRORS.REVIEW_001)
          return
        }
        const indexed: Record<string, ExpenseReview> = {}
        for (const row of data ?? []) {
          indexed[(row as ExpenseReview).expense_id] = row as ExpenseReview
        }
        setReviews(indexed)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, accountantId])

  // ── Computed counts ────────────────────────────────────────────────────────
  const reviewList      = Object.values(reviews)
  const allowableCount  = reviewList.filter(r => r.allowable === true).length
  const notAllowableCount = reviewList.filter(r => r.allowable === false).length
  const reviewedCount   = reviewList.length
  const pendingCount    = Math.max(0, totalExpenses - reviewedCount)

  // ── Save review ────────────────────────────────────────────────────────────
  const saveReview = useCallback(async ({
    expenseId,
    allowable,
    hmrcTreatment,
    reason,
    actorId,
  }: {
    expenseId:     string
    allowable:     boolean
    hmrcTreatment: HmrcTreatment | null
    reason:        string
    actorId:       string
  }) => {
    if (!accountantId) return
    setSaving(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('expense_reviews')
      .upsert(
        {
          expense_id:     expenseId,
          client_id:      clientId,
          accountant_id:  accountantId,
          allowable,
          reason:         reason || null,
          hmrc_treatment: hmrcTreatment,
          reviewed_at:    new Date().toISOString(),
        },
        { onConflict: 'expense_id' },
      )
      .select()
      .single()

    setSaving(false)

    if (err) {
      setError(APP_ERRORS.REVIEW_002)
      return
    }

    // Optimistic update
    setReviews(prev => ({
      ...prev,
      [expenseId]: data as ExpenseReview,
    }))

    // Audit — fire and forget
    void logAudit({
      actorId,
      actorRole:  'accountant',
      clientId,
      action:     'expense.reviewed',
      targetType: 'expense',
      targetId:   expenseId,
    })
  }, [clientId, accountantId, supabase])

  return {
    reviews,
    allowableCount,
    pendingCount,
    notAllowableCount,
    loading,
    saving,
    error,
    saveReview,
  }
}
