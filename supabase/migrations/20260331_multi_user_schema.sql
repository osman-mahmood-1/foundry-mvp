-- ─── PHASE 1: Multi-User Access — Database Foundation ───────────────────────
-- Applied: 2026-03-31
-- Supabase project: yoxytsroecodqkblefmp
--
-- SECURITY MANDATE: See CLAUDE.md before modifying any policies here.
-- After applying, run: node scripts/pentest-rls.js — must pass before Phase 2.
--
-- Tables created:
--   platform_editors, accountant_notes, expense_reviews, invite_tokens
--
-- Tables modified:
--   clients          → add assigned_accountant_id
--   audit_log        → add reversed_by, reversed_at (before/after already present)
--   accountants      → add invited_by, deactivated_at
--   accountant_clients → add assigned_by reference to platform_editors
--
-- JWT claim patterns used throughout:
--   Platform editor:  (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor'
--   Accountant role:  (auth.jwt() -> 'app_metadata' ->> 'role') = 'accountant'
--   Accountant id:    NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
--
-- These claims are set server-side only via Admin SDK — clients cannot forge them.
-- See lib/roles.ts (Phase 2) for the application-layer enforcement.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. platform_editors ─────────────────────────────────────────────────────
-- Tracks who holds platform editor access. Separate from auth.users.
-- First editor must be manually provisioned (see Plan § 10, step 37).
-- Subsequent editors are invited through /admin/team.

CREATE TABLE IF NOT EXISTS platform_editors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       text NOT NULL,
  email           text NOT NULL,
  invited_by      uuid REFERENCES platform_editors(id),  -- null for the bootstrapped first editor
  created_at      timestamptz NOT NULL DEFAULT now(),
  deactivated_at  timestamptz,                            -- soft delete, preserves audit trail
  UNIQUE(user_id)
);

ALTER TABLE platform_editors ENABLE ROW LEVEL SECURITY;

-- Only authenticated platform editors can read this table.
-- Anon and client users get nothing.
CREATE POLICY "platform_editors_select" ON platform_editors
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor'
);

-- Only platform editors can add new editors.
-- The server action that calls this must also use service_role for the JWT claim provisioning.
CREATE POLICY "platform_editors_insert" ON platform_editors
FOR INSERT TO authenticated
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor'
);

-- Only platform editors can update records (e.g. deactivate, rename).
CREATE POLICY "platform_editors_update" ON platform_editors
FOR UPDATE TO authenticated
USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor');

-- No DELETE policy. Deactivation is a soft delete via deactivated_at.
-- Hard deletes done via service_role only, never via client-side requests.


-- ─── 2. accountant_notes ─────────────────────────────────────────────────────
-- Private working notes per client. The client NEVER sees these.
-- Visible only to the accountant who wrote them and platform editors.

CREATE TABLE IF NOT EXISTS accountant_notes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  accountant_id  uuid NOT NULL REFERENCES accountants(id),
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE accountant_notes ENABLE ROW LEVEL SECURITY;

-- The owning accountant or a platform editor can read notes.
-- Clients: zero access — not even a hint these notes exist.
CREATE POLICY "accountant_notes_select" ON accountant_notes
FOR SELECT TO authenticated
USING (
  accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor'
);

-- Only the owning accountant can write notes.
CREATE POLICY "accountant_notes_insert" ON accountant_notes
FOR INSERT TO authenticated
WITH CHECK (
  accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
);

-- Only the owning accountant can edit their own notes.
CREATE POLICY "accountant_notes_update" ON accountant_notes
FOR UPDATE TO authenticated
USING  (accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid)
WITH CHECK (accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid);

-- Only the owning accountant can delete their notes.
CREATE POLICY "accountant_notes_delete" ON accountant_notes
FOR DELETE TO authenticated
USING (
  accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
);


-- ─── 3. expense_reviews ──────────────────────────────────────────────────────
-- Records the accountant's allowability decision on each expense.
-- The client CAN see this (to understand why an expense was flagged).
-- UNIQUE(expense_id) enforces one authoritative decision per expense.

CREATE TABLE IF NOT EXISTS expense_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id      uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  accountant_id   uuid NOT NULL REFERENCES accountants(id),
  allowable       boolean NOT NULL,
  reason          text,                 -- shown to client in plain English
  hmrc_treatment  text,                 -- 'wholly_and_exclusively' | 'partial' | 'capital' | 'not_business'
  reviewed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(expense_id)
);

ALTER TABLE expense_reviews ENABLE ROW LEVEL SECURITY;

-- Client sees decisions on their own expenses.
-- The reviewing accountant sees their own reviews.
-- Platform editors see everything.
CREATE POLICY "expense_reviews_select" ON expense_reviews
FOR SELECT TO authenticated
USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  OR accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor'
);

-- An accountant can only review expenses for clients they are assigned to.
CREATE POLICY "expense_reviews_insert" ON expense_reviews
FOR INSERT TO authenticated
WITH CHECK (
  accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
  AND client_id IN (
    SELECT ac.client_id FROM accountant_clients ac
    WHERE ac.accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
  )
);

-- Accountant can revise their own decisions. Platform editors can correct any decision.
CREATE POLICY "expense_reviews_update" ON expense_reviews
FOR UPDATE TO authenticated
USING (
  accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor'
)
WITH CHECK (
  accountant_id = NULLIF((auth.jwt() -> 'app_metadata' ->> 'accountant_id'), '')::uuid
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor'
);

-- Only platform editors can delete reviews. Preserves audit trail.
CREATE POLICY "expense_reviews_delete" ON expense_reviews
FOR DELETE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor');


-- ─── 4. invite_tokens ────────────────────────────────────────────────────────
-- One-time secure tokens for accountant and editor invite links.
-- 32-byte random hex. Single-use. 48h expiry.
-- Used tokens are retained (not deleted) for audit purposes.

CREATE TABLE IF NOT EXISTS invite_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role        text NOT NULL CHECK (role IN ('accountant', 'platform_editor')),
  email       text NOT NULL,
  invited_by  uuid NOT NULL REFERENCES platform_editors(id),
  used_at     timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Only platform editors can view, create, or update tokens.
-- Anon users cannot read tokens — the invite page validates via service_role.
CREATE POLICY "invite_tokens_select" ON invite_tokens
FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor');

CREATE POLICY "invite_tokens_insert" ON invite_tokens
FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor');

-- Marking a token as used is done server-side via service_role.
-- This policy is belt-and-suspenders only.
CREATE POLICY "invite_tokens_update" ON invite_tokens
FOR UPDATE TO authenticated
USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_editor');


-- ─── 5. clients — add assigned_accountant_id ─────────────────────────────────
-- Denormalised for fast filtering. Source of truth is accountant_clients join table.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS assigned_accountant_id uuid REFERENCES accountants(id);


-- ─── 6. audit_log — add reversal tracking columns ────────────────────────────
-- before_state and after_state may already exist — IF NOT EXISTS guards are safe.

ALTER TABLE audit_log
  ADD COLUMN IF NOT EXISTS before_state  jsonb,
  ADD COLUMN IF NOT EXISTS after_state   jsonb,
  ADD COLUMN IF NOT EXISTS reversed_by   uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reversed_at   timestamptz;


-- ─── 7. accountants — add invited_by, deactivated_at ─────────────────────────

ALTER TABLE accountants
  ADD COLUMN IF NOT EXISTS invited_by      uuid REFERENCES platform_editors(id),
  ADD COLUMN IF NOT EXISTS deactivated_at  timestamptz;


-- ─── 8. accountant_clients — update assigned_by to reference platform_editors ─
-- assigned_by and assigned_at likely already exist. IF NOT EXISTS is safe.
-- Note: We cannot retroactively add the FK to platform_editors if the column
-- already has data referencing auth.users — add as nullable, migrate data separately.

ALTER TABLE accountant_clients
  ADD COLUMN IF NOT EXISTS assigned_at  timestamptz DEFAULT now();

-- assigned_by may already exist as uuid without FK — add new column for platform editor ref
ALTER TABLE accountant_clients
  ADD COLUMN IF NOT EXISTS assigned_by_editor  uuid REFERENCES platform_editors(id);


-- ─── VERIFICATION QUERIES (run after applying) ───────────────────────────────
-- 1. Confirm all 4 new tables have RLS enabled:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public'
--    AND tablename IN ('platform_editors','accountant_notes','expense_reviews','invite_tokens');
--    → All 4 rows must show rowsecurity = true
--
-- 2. Confirm all policies are present:
--    SELECT tablename, policyname, cmd FROM pg_policies
--    WHERE schemaname = 'public'
--    AND tablename IN ('platform_editors','accountant_notes','expense_reviews','invite_tokens')
--    ORDER BY tablename, cmd;
--
-- 3. Run the pentest:
--    node scripts/pentest-rls.js
--    → Must show 18/18 passed before proceeding to Phase 2
