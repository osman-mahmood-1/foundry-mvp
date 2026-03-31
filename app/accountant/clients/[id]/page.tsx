/**
 * app/accountant/clients/[id]/page.tsx
 *
 * Server component — split-panel client record for the accountant portal.
 *
 * Responsibilities:
 *   1. Verify user is authenticated and has accountant (or platform_editor) role
 *   2. Verify the client is actually assigned to this accountant
 *      (platform editors bypass this check — they see all clients)
 *   3. Load the client record + all SplitPanelInitialData server-side via admin
 *      client (bypasses client-table RLS gaps while accountant RLS is not in
 *      place on those tables)
 *   4. Render the split-panel view (SplitPanel client component)
 *
 * Security: assignment verification uses admin client so it cannot be
 * circumvented by RLS gaps. The JWT claim is the identity gate.
 *
 * force-dynamic: always server-rendered.
 */

import { redirect }          from 'next/navigation'
import { notFound }          from 'next/navigation'
import { createClient }      from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAccountantId, getUserRole } from '@/lib/roles'
import SplitPanel            from '../../components/SplitPanel'
import type { Client, SplitPanelInitialData, Expense, Document as FoundryDocument, IncomeCategory } from '@/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

// ─── SA deadline helper ───────────────────────────────────────────────────────

/** Returns the SA deadline date string for a given tax year, e.g. '2026-01-31'. */
function saDeadlineForYear(taxYear: string): string {
  const endYear = Number('20' + taxYear.split('-')[1])
  return `${endYear}-01-31`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccountantClientPage({ params }: Props) {
  const { id: clientId } = await params

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role         = getUserRole(user)
  const accountantId = getAccountantId(user)

  // Must be accountant or platform_editor
  if (role !== 'accountant' && role !== 'platform_editor') redirect('/login')

  const admin = createAdminClient()

  // ── Assignment check ───────────────────────────────────────────────────────
  // Platform editors see all clients. Accountants only see their assigned ones.
  if (role === 'accountant') {
    if (!accountantId) redirect('/login')

    const { data: assignment } = await admin
      .from('accountant_clients')
      .select('id')
      .eq('accountant_id', accountantId)
      .eq('client_id', clientId)
      .limit(1)

    if (!assignment || assignment.length === 0) {
      // Client exists but is not assigned to this accountant — 404, not 403,
      // to avoid leaking the existence of client IDs.
      notFound()
    }
  }

  // ── Client record ─────────────────────────────────────────────────────────
  const { data: clientRows } = await admin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .is('deleted_at', null)
    .limit(1)

  const client = (clientRows?.[0] ?? null) as Client | null
  if (!client) notFound()

  // ── SplitPanelInitialData ──────────────────────────────────────────────────
  const taxYear = client.tax_year

  const [
    expensesResult,
    incomeResult,
    documentsResult,
    messagesResult,
    reviewsResult,
  ] = await Promise.all([
    // All expenses for this client this tax year
    admin
      .from('expenses')
      .select('*')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .neq('status', 'excluded')
      .order('date', { ascending: false }),

    // All income for this client this tax year
    admin
      .from('income')
      .select('id, description, amount_pence, date, category, tax_year, status')
      .eq('client_id', clientId)
      .eq('tax_year', taxYear)
      .neq('status', 'excluded')
      .order('date', { ascending: false }),

    // All documents
    admin
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false }),

    // Unread messages count (sender != accountant, read_at is null)
    admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('sender', 'client')
      .is('read_at', null),

    // Expense reviews for this client (to compute pendingReviewCount)
    admin
      .from('expense_reviews')
      .select('expense_id')
      .eq('client_id', clientId),
  ])

  const expenses  = (expensesResult.data  ?? []) as Expense[]
  const incomeRows = (incomeResult.data    ?? [])
  const documents = (documentsResult.data ?? []) as FoundryDocument[]

  // ── Derive totals ──────────────────────────────────────────────────────────

  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount_pence, 0)
  const incomeTotal  = incomeRows.reduce((sum, i) => sum + (i.amount_pence as number), 0)

  // Income grouped by category
  const categoryMap: Record<string, number> = {}
  for (const row of incomeRows) {
    const cat = row.category as string
    categoryMap[cat] = (categoryMap[cat] ?? 0) + (row.amount_pence as number)
  }
  const incomeSources = Object.entries(categoryMap).map(([category, totalPence]) => ({
    category: category as IncomeCategory,
    totalPence,
  }))

  // Recent income / expenses (3 most recent each, for Messages panel)
  const recentIncome = incomeRows.slice(0, 3).map(i => ({
    id:           i.id           as string,
    description:  i.description  as string,
    amount_pence: i.amount_pence as number,
    date:         i.date         as string,
  }))

  const recentExpenses = expenses.slice(0, 3).map(e => ({
    id:           e.id,
    description:  e.description,
    amount_pence: e.amount_pence,
    date:         e.date,
  }))

  // ── SA deadline ───────────────────────────────────────────────────────────
  const deadlineStr      = saDeadlineForYear(taxYear)
  const deadlineDate     = new Date(deadlineStr)
  const today            = new Date()
  today.setHours(0, 0, 0, 0)
  const msPerDay         = 1000 * 60 * 60 * 24
  const saDaysRemaining  = deadlineDate >= today
    ? Math.ceil((deadlineDate.getTime() - today.getTime()) / msPerDay)
    : null

  // ── Counts ────────────────────────────────────────────────────────────────
  const unreadMessages = (messagesResult.count ?? 0) as number

  const reviewedExpenseIds = new Set(
    (reviewsResult.data ?? []).map((r: { expense_id: string }) => r.expense_id)
  )
  const pendingReviewCount = expenses.filter(e => !reviewedExpenseIds.has(e.id)).length
  const unreviewedDocCount = documents.filter(d => !d.reviewed).length

  const initialData: SplitPanelInitialData = {
    expenses,
    expenseTotal,
    incomeTotal,
    incomeSources,
    documents,
    recentIncome,
    recentExpenses,
    saDaysRemaining,
    unreadMessages,
    pendingReviewCount,
    unreviewedDocCount,
  }

  return (
    <SplitPanel
      client={client}
      accountantId={accountantId}
      accountantUserId={user.id}
      initialData={initialData}
    />
  )
}
