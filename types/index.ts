/**
 * types/index.ts
 *
 * Single source of truth for every TypeScript type in Foundry.
 * These mirror the database schema exactly.
 *
 * Rules:
 * - No `any` anywhere in the codebase. Use these types.
 * - If a type is missing, add it here — not inline in a component.
 * - Nullable DB columns are typed as `T | null`.
 * - Pence fields are always `number` (integer) — never `string` or `float`.
 */

// ─── Primitives ───────────────────────────────────────────────────────────────

/** HMRC tax year string. Format enforced by DB constraint. e.g. "2024-25" */
export type TaxYear = string

/** Pence integer. Never use float for money. £10.50 = 1050 */
export type Pence = number

/** ISO 8601 datetime string as returned by Supabase */
export type ISODatetime = string

/** ISO date string (no time). e.g. "2025-01-31" */
export type ISODate = string


// ─── Enums ────────────────────────────────────────────────────────────────────

export type ClientType =
  | 'sole_trader'
  | 'landlord'
  | 'content_creator'
  | 'cis_contractor'
  | 'tradesperson'
  | 'hairdresser'
  | 'consultant'
  | 'retailer'
  | 'other'

export type Plan = 'foundation' | 'momentum' | 'accelerate' | 'command'

export type PlanStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'

export type VatScheme = 'standard' | 'flat_rate' | 'cash'

export type IncomeCategory =
  | 'rental'
  | 'trading'
  | 'day_rate'
  | 'fixed_price'
  | 'retainer'
  | 'platform'
  | 'brand_deal'
  | 'construction'
  | 'employment'
  | 'dividends'
  | 'interest'
  | 'cgt'
  | 'grant'
  | 'other'

export type ExpenseCategory =
  | 'repairs'
  | 'mortgage_interest'
  | 'agent_fees'
  | 'ground_rent'
  | 'service_charge'
  | 'insurance'
  | 'travel'
  | 'vehicle'
  | 'fuel'
  | 'parking'
  | 'accommodation'
  | 'tools'
  | 'equipment'
  | 'materials'
  | 'protective_clothing'
  | 'stock'
  | 'software'
  | 'hardware'
  | 'phone'
  | 'broadband'
  | 'home_office'
  | 'office_rent'
  | 'stationery'
  | 'professional_fees'
  | 'training'
  | 'subscriptions'
  | 'marketing'
  | 'website'
  | 'subcontractor'
  | 'production'
  | 'props_and_wardrobe'
  | 'other'

export type DocumentCategory =
  | 'bank_statement'
  | 'mortgage_statement'
  | 'tenancy_agreement'
  | 'insurance'
  | 'invoice'
  | 'receipt'
  | 'p60'
  | 'p45'
  | 'p11d'
  | 'sa302'
  | 'tax_calculation'
  | 'cis_statement'
  | 'letting_agent_statement'
  | 'contracts'
  | 'id_document'
  | 'other'

export type TransactionSource = 'manual' | 'bank_feed' | 'ai_extracted' | 'imported'

export type TransactionStatus = 'draft' | 'confirmed' | 'queried' | 'excluded'

export type CategorySource = 'manual' | 'rule' | 'ai_suggested' | 'ai_confirmed'

export type CategoryScope =
  | 'this_only'
  | 'all_future_counterparty'
  | 'all_past_counterparty'
  | 'all_counterparty'
  | 'all_future_pattern'
  | 'all_counterparty_pattern'

export type SenderRole = 'client' | 'accountant' | 'ai_agent' | 'system'

export type ServiceType =
  | 'sa_return'
  | 'sa105'
  | 'sa103'
  | 'vat_return'
  | 'cis_return'
  | 'company_accounts'
  | 'ct600'
  | 'cgt_computation'
  | 'bookkeeping'
  | 'payroll'
  | 'other'

export type ServiceStatus =
  | 'not_started'
  | 'in_progress'
  | 'awaiting_client'
  | 'under_review'
  | 'completed'
  | 'filed'

export type DeadlineStatus = 'upcoming' | 'overdue' | 'completed' | 'waived'

export type PropertyType = 'btl' | 'fhl' | 'rent_a_room' | 'commercial' | 'hmo'

export type NotificationType =
  | 'magic_link'
  | 'document_ready'
  | 'deadline_reminder'
  | 'message_received'
  | 'upgrade_prompt'
  | 'welcome'
  | 'payment_failed'
  | 'service_completed'

export type IntelligenceCardSeverity = 'urgent' | 'attention' | 'info'

export type IntelligenceCardType =
  | 'overdue_invoice'
  | 'upcoming_tax_bill'
  | 'cashflow_warning'
  | 'unreviewed_expenses'
  | 'missing_documents'
  | 'deadline_approaching'
  | 'categorisation_needed'
  | 'health_improvement'
  | 'hmrc_rule_relevant'
  | 'payment_on_account'
  | 'mtd_filing_due'
  | 'expense_allowability'


// ─── Portal config ─────────────────────────────────────────────────────────

/** Stored as JSONB on the client record. Drives portal personalisation. */
export interface PortalConfig {
  income_label: string       // e.g. "Rental income" or "Trading income"
  expense_label: string      // e.g. "Property costs" or "Business costs"
  nav_items: string[]        // which tabs are enabled for this client
  sa_form: string            // e.g. "SA103" or "SA105"
}


// ─── Database entities ────────────────────────────────────────────────────────

export interface Client {
  id: string
  user_id: string
  email: string
  full_name: string | null
  phone: string | null
  date_of_birth: ISODate | null
  client_type: ClientType
  trade_label: string | null
  plan: Plan
  plan_status: PlanStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  onboarding_complete: boolean
  utr: string | null
  ni_number: string | null
  vat_number: string | null
  vat_scheme: VatScheme | null
  cis_number: string | null
  tax_year: TaxYear
  portal_config: PortalConfig | null
  ai_risk_score: number | null
  accounting_year_end_day: number
  accounting_year_end_month: number
  accounting_period_label: string      // generated column, read-only
  current_period_start: ISODate | null
  current_period_end: ISODate | null
  assigned_accountant_id: string | null
  created_at: ISODatetime
  updated_at: ISODatetime
  deleted_at: ISODatetime | null
}

export interface Accountant {
  id: string
  user_id: string
  full_name: string
  email: string
  qualification: string | null
  firm_name: string | null
  is_foundry_admin: boolean
  is_active: boolean
  invited_by: string | null   // references platform_editors(id)
  deactivated_at: ISODatetime | null
  created_at: ISODatetime
  updated_at: ISODatetime
}

export interface AccountantClient {
  id: string
  accountant_id: string
  client_id: string
  assigned_at: ISODatetime
  assigned_by: string | null
  is_primary: boolean
}

export interface Income {
  id: string
  client_id: string
  property_id: string | null
  counterparty_id: string | null
  category_rule_id: string | null
  description: string
  amount_pence: Pence
  date: ISODate
  category: IncomeCategory
  category_source: CategorySource
  category_scope: CategoryScope | null
  counterparty_raw: string | null
  tax_year: TaxYear
  hmrc_sa_box: string | null
  source: TransactionSource
  ai_confidence: number | null
  ai_reasoning: string | null
  raw_text: string | null
  status: TransactionStatus
  created_at: ISODatetime
  updated_at: ISODatetime
}

export interface Expense {
  id: string
  client_id: string
  property_id: string | null
  document_id: string | null
  counterparty_id: string | null
  category_rule_id: string | null
  description: string
  amount_pence: Pence
  date: ISODate
  category: ExpenseCategory
  category_source: CategorySource
  category_scope: CategoryScope | null
  counterparty_raw: string | null
  allowable: boolean | null
  allowable_confidence: number | null
  allowable_reason: string | null
  is_pending: boolean
  tax_year: TaxYear
  hmrc_sa_box: string | null
  source: TransactionSource
  ai_confidence: number | null
  ai_reasoning: string | null
  raw_text: string | null
  status: TransactionStatus
  created_at: ISODatetime
  updated_at: ISODatetime
}

/** Unified view of income and expenses for the Transactions tab */
export interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount_pence: Pence
  date: ISODate
  category: IncomeCategory | ExpenseCategory
  category_source: CategorySource
  counterparty_raw: string | null
  status: TransactionStatus
  /** Only on expenses */
  allowable?: boolean | null
  created_at: ISODatetime
}

export interface Document {
  id: string
  client_id: string
  service_id: string | null
  storage_path: string
  original_filename: string
  mime_type: string
  size_bytes: number
  category: DocumentCategory
  tax_year: TaxYear
  uploaded_by: string
  reviewed: boolean
  reviewed_by: string | null
  reviewed_at: ISODatetime | null
  review_notes: string | null
  ocr_status: 'pending' | 'processing' | 'complete' | 'failed' | 'not_needed'
  ocr_confidence: number | null
  extracted_data: Record<string, unknown> | null
  quality_flag: 'blurry' | 'incomplete' | 'wrong_document' | 'duplicate' | 'unreadable' | 'low_resolution' | null
  created_at: ISODatetime
}

export interface Message {
  id: string
  client_id: string
  sender_id: string
  sender_role: SenderRole
  body: string
  read: boolean
  ai_model: string | null
  ai_confidence: number | null
  ai_sources: Record<string, unknown> | null
  created_at: ISODatetime
}

export interface Task {
  id: string
  client_id: string
  service_id: string | null
  label: string
  done: boolean
  due_date: ISODate | null
  sort_order: number
  tax_year: TaxYear
  created_at: ISODatetime
  updated_at: ISODatetime
}

export interface Service {
  id: string
  client_id: string
  accountant_id: string | null
  service_type: ServiceType
  tax_year: TaxYear | null
  period: string | null
  status: ServiceStatus
  price_pence: Pence | null
  notes: string | null
  ai_draft: Record<string, unknown> | null
  ai_draft_confidence: number | null
  started_at: ISODatetime | null
  completed_at: ISODatetime | null
  filed_at: ISODatetime | null
  created_at: ISODatetime
  updated_at: ISODatetime
}

export interface Deadline {
  id: string
  client_id: string
  service_id: string | null
  label: string
  deadline_date: ISODate
  status: DeadlineStatus
  notified_at: ISODatetime | null
  created_at: ISODatetime
}

export interface Property {
  id: string
  client_id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
  country: string
  ownership_pct: number
  joint_owner_name: string | null
  has_declaration_of_trust: boolean
  property_type: PropertyType
  furnished: boolean
  letting_agent: string | null
  purchase_date: ISODate | null
  purchase_price_pence: Pence | null
  purchase_costs_pence: Pence | null
  sold_at: ISODate | null
  sale_price_pence: Pence | null
  sale_costs_pence: Pence | null
  mortgage_lender: string | null
  mortgage_account_ref: string | null
  is_active: boolean
  created_at: ISODatetime
  updated_at: ISODatetime
}

export interface Counterparty {
  id: string
  client_id: string
  name: string
  name_normalised: string    // generated column, read-only
  first_seen_type: TransactionSource
  website: string | null
  logo_url: string | null
  is_merchant: boolean
  is_client: boolean
  mcc_code: string | null
  mcc_label: string | null
  created_at: ISODatetime
  updated_at: ISODatetime
}

export interface CategoriationRule {
  id: string
  client_id: string
  counterparty_id: string | null
  description_pattern: string | null
  transaction_type: 'income' | 'expense' | 'both'
  category: string
  source: 'user' | 'ai_suggested' | 'ai_confirmed'
  confidence: number | null
  is_active: boolean
  created_at: ISODatetime
  updated_at: ISODatetime
}

export interface CategoryChange {
  id: string
  client_id: string
  transaction_type: 'income' | 'expense'
  transaction_id: string
  category_from: string | null
  category_to: string
  changed_by: string
  changed_by_role: SenderRole
  scope_applied: CategoryScope | null
  rows_affected: number
  rule_id: string | null
  created_at: ISODatetime
}


// ─── Foundry Intelligence ─────────────────────────────────────────────────────

export interface HealthScoreComponents {
  invoices:    { score: number; max: number; label: string }
  bookkeeping: { score: number; max: number; label: string }
  documents:   { score: number; max: number; label: string }
  deadlines:   { score: number; max: number; label: string }
}

export interface HealthScore {
  id: string
  client_id: string
  score: number
  components: HealthScoreComponents
  summary: string
  computed_at: ISODatetime
}

export interface IntelligenceCard {
  id: string
  client_id: string
  severity: IntelligenceCardSeverity
  card_type: IntelligenceCardType
  title: string
  body: string
  impact_pence: Pence | null
  action_label: string | null
  action_tab: string | null
  action_params: Record<string, unknown> | null
  is_dismissed: boolean
  dismissed_at: ISODatetime | null
  expires_at: ISODatetime | null
  source_type: string | null
  source_id: string | null
  created_at: ISODatetime
}

export interface IntelligenceConversation {
  id: string
  client_id: string
  role: 'user' | 'assistant'
  content: string
  ai_model: string | null
  input_tokens: number | null
  output_tokens: number | null
  health_score_at_time: number | null
  created_at: ISODatetime
}

export interface Notification {
  id: string
  client_id: string
  notification_type: NotificationType
  channel: 'email' | 'sms' | 'push'
  sent_at: ISODatetime
  metadata: Record<string, unknown> | null
}

export interface AuditLogEntry {
  id: string
  actor_id: string
  actor_role: SenderRole
  client_id: string | null
  action: string
  target_id: string | null
  target_type: string | null
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  ip_address: string | null
  reversed_by: string | null   // auth.users(id) of the platform editor who reversed this
  reversed_at: ISODatetime | null
  created_at: ISODatetime
}

export interface WaitlistEntry {
  id: string
  member_number: number
  unique_id: string
  name: string
  email: string
  created_at: ISODatetime | null
}

// ─── Multi-user access types (Phase 1) ───────────────────────────────────────

/** Platform editor (internal Tax Foundry team). Has access to /admin/* */
export interface PlatformEditor {
  id: string
  user_id: string
  full_name: string
  email: string
  invited_by: string | null   // references platform_editors(id); null for bootstrapped first editor
  created_at: ISODatetime
  deactivated_at: ISODatetime | null
}

/** Private working notes written by an accountant about a client. Never visible to the client. */
export interface AccountantNote {
  id: string
  client_id: string
  accountant_id: string
  body: string
  created_at: ISODatetime
  updated_at: ISODatetime
}

export type HmrcTreatment =
  | 'wholly_and_exclusively'
  | 'partial'
  | 'capital'
  | 'not_business'

/** Accountant's formal allowability decision on a single expense. One per expense (UNIQUE). */
export interface ExpenseReview {
  id: string
  expense_id: string
  client_id: string
  accountant_id: string
  allowable: boolean
  reason: string | null           // plain-English explanation shown to the client
  hmrc_treatment: HmrcTreatment | null
  reviewed_at: ISODatetime
}

export type InviteRole = 'accountant' | 'platform_editor'

/** One-time invite token for accountant and platform editor provisioning. */
export interface InviteToken {
  id: string
  token: string                   // 32-byte hex, single-use
  role: InviteRole
  email: string
  invited_by: string              // references platform_editors(id)
  used_at: ISODatetime | null
  expires_at: ISODatetime
  created_at: ISODatetime
}


// ─── UI-only types ─────────────────────────────────────────────────────────

/** Which tab is currently active in the portal */
export type PortalTab =
  | 'overview'
  | 'income'
  | 'expenses'
  | 'transactions'
  | 'invoices'
  | 'clients'
  | 'documents'
  | 'messages'
  | 'intelligence'
  | 'submission'
  | 'prior-returns'
  | 'calendar'

/** Nav item definition for the sidebar */
export interface NavItem {
  id: PortalTab
  label: string
  icon: string
  comingSoon?: boolean
  group: 'overview' | 'money' | 'invoices' | 'workspace' | 'filing'
}

/** Form state for adding income — subset of Income */
export interface IncomeFormState {
  description: string
  amount: string          // string for controlled input, converted to pence on save
  date: ISODate
  category: IncomeCategory
}

/** Form state for adding an expense */
export interface ExpenseFormState {
  description: string
  amount: string
  date: ISODate
  category: ExpenseCategory
}

/** Summary stats shown on Overview and in Foundry Intelligence */
export interface BusinessSummary {
  totalIncomePence: Pence
  totalExpensesPence: Pence
  netPositionPence: Pence
  unreviewedExpenses: number
  overdueInvoices: number
  pendingTasks: number
  unreadMessages: number
  healthScore: number | null
}
