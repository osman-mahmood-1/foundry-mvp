'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { APP_ERRORS } from '@/lib/errors'
import type { AppError } from '@/lib/errors'
import { estimateTax } from '@/lib/tax'

export interface OverviewStats {
  incomePence:       number
  expensesPence:     number
  estTaxPence:       number
  docsNeedingReview: number
  openTasks:         number
}

export interface RecentTransaction {
  id:          string
  type:        'income' | 'expense'
  description: string
  amountPence: number
  date:        string
  category:    string
  status:      string
}

export interface OverviewData {
  stats:      OverviewStats
  recent:     RecentTransaction[]
  taxYear:    string
  clientName: string | null
  loading:    boolean
  error:      AppError | null
}


export function useOverview(clientId: string | null): OverviewData {
  const [data, setData] = useState<OverviewData>({
    stats: { incomePence: 0, expensesPence: 0, estTaxPence: 0, docsNeedingReview: 0, openTasks: 0 },
    recent: [], taxYear: '2024-25', clientName: null, loading: true, error: null,
  })

  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()

    async function load() {
      try {
        const { data: client, error: clientErr } = await supabase
          .from('clients').select('full_name, tax_year')
          .eq('id', clientId).single()
        if (clientErr) throw clientErr
        const taxYear = client.tax_year ?? '2024-25'

        const { data: incomeRows, error: incErr } = await supabase
          .from('income')
          .select('amount_pence, id, description, date, category, status')
          .eq('client_id', clientId).eq('tax_year', taxYear)
          .neq('status', 'excluded').order('date', { ascending: false })
        if (incErr) throw incErr

        const { data: expenseRows, error: expErr } = await supabase
          .from('expenses')
          .select('amount_pence, id, description, date, category, status')
          .eq('client_id', clientId).eq('tax_year', taxYear)
          .neq('status', 'excluded').order('date', { ascending: false })
        if (expErr) throw expErr

        const { count: docsCount } = await supabase
          .from('documents').select('id', { count: 'exact', head: true })
          .eq('client_id', clientId).eq('reviewed', false)

        const { count: tasksCount } = await supabase
          .from('tasks').select('id', { count: 'exact', head: true })
          .eq('client_id', clientId).eq('done', false).eq('tax_year', taxYear)

        const incomePence   = (incomeRows  ?? []).reduce((s, r) => s + r.amount_pence, 0)
        const expensesPence = (expenseRows ?? []).reduce((s, r) => s + r.amount_pence, 0)

        const incTx = (incomeRows ?? []).slice(0, 5).map(r => ({
          id: r.id, type: 'income' as const, description: r.description,
          amountPence: r.amount_pence, date: r.date, category: r.category, status: r.status,
        }))
        const expTx = (expenseRows ?? []).slice(0, 5).map(r => ({
          id: r.id, type: 'expense' as const, description: r.description,
          amountPence: r.amount_pence, date: r.date, category: r.category, status: r.status,
        }))
        const recent = [...incTx, ...expTx]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)

        setData({
          stats: {
            incomePence, expensesPence,
            estTaxPence: estimateTax(incomePence, expensesPence, taxYear),
            docsNeedingReview: docsCount ?? 0,
            openTasks: tasksCount ?? 0,
          },
          recent, taxYear, clientName: client.full_name, loading: false, error: null,
        })
      } catch (err: unknown) {
        console.error('OVR_001', err)
        setData(prev => ({
          ...prev, loading: false,
          error: APP_ERRORS.OVR_001,
        }))
      }
    }
    load()
  }, [clientId])

  return data
}