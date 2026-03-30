-- =============================================================================
-- SECURITY MIGRATION: RLS Hardening
-- Date: 2026-03-30
-- Auditor: Claude Code (automated penetration test)
-- =============================================================================
--
-- SECURITY MANDATE FOR ALL FUTURE AI CODING SESSIONS:
--   1. Security-first. Every DB change must consider RLS before writing code.
--   2. Default-deny. New tables must have RLS enabled immediately on creation.
--   3. No USING (true). Never write a policy that grants access to all rows.
--   4. Penetration test every table. Verify anon key returns 0 rows for
--      sensitive data after any schema or policy change.
--   5. WITH CHECK required. Every INSERT/UPDATE policy needs a WITH CHECK
--      clause to prevent ownership field tampering.
--   6. service_role is nuclear. Never expose it client-side. It bypasses RLS.
--
-- PENETRATION TEST PROTOCOL (run after every migration):
--   node -e "require('./scripts/pentest-rls.js')"
--   Expected: all sensitive tables return 0 rows and block writes for anon.
-- =============================================================================


-- ─── 1. WAITLIST — Fix PII Exposure ─────────────────────────────────────────
--
-- FINDING (2026-03-30): Anon key could SELECT all 14 waitlist rows, exposing
-- real user names and email addresses with no authentication required.
-- SEVERITY: CRITICAL — PII breach. Any person with the published anon key
-- (which is in the client bundle) could extract the full waitlist.
-- FIX: Enable RLS, grant INSERT-only to anon, restrict SELECT to service_role.

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly-permissive policies
DROP POLICY IF EXISTS "allow_all"       ON waitlist;
DROP POLICY IF EXISTS "anon_read"       ON waitlist;
DROP POLICY IF EXISTS "public_read"     ON waitlist;
DROP POLICY IF EXISTS "Enable read access for all users" ON waitlist;

-- Allow public INSERT (signup form — server action runs as anon role)
DROP POLICY IF EXISTS "waitlist_insert_anon" ON waitlist;
CREATE POLICY "waitlist_insert_anon"
  ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Block all SELECT for anon and authenticated roles.
-- Only service_role (admin queries) can read the waitlist.
-- No SELECT policy = no access for non-service_role callers.


-- ─── 2. CLIENTS — Verify and Harden ─────────────────────────────────────────
--
-- FINDING (2026-03-30): Anon INSERT blocked (42501 ✓). 0 rows returned for
-- anon SELECT (✓). Core RLS appears functional.
-- HARDENING: Ensure policies scope strictly to the authenticated user's client.

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_own" ON clients;
CREATE POLICY "clients_select_own"
  ON clients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "clients_insert_own" ON clients;
CREATE POLICY "clients_insert_own"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "clients_update_own" ON clients;
CREATE POLICY "clients_update_own"
  ON clients
  FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ─── 3. INCOME — Scope to client ownership ───────────────────────────────────
--
-- FINDING: Anon blocked ✓. Hardening: verify authenticated users cannot read
-- another client's income by guessing a client_id UUID.

ALTER TABLE income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "income_select_own" ON income;
CREATE POLICY "income_select_own"
  ON income
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "income_insert_own" ON income;
CREATE POLICY "income_insert_own"
  ON income
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "income_update_own" ON income;
CREATE POLICY "income_update_own"
  ON income
  FOR UPDATE
  TO authenticated
  USING  (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "income_delete_own" ON income;
CREATE POLICY "income_delete_own"
  ON income
  FOR DELETE
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));


-- ─── 4. EXPENSES — Same ownership pattern as income ──────────────────────────

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select_own" ON expenses;
CREATE POLICY "expenses_select_own"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "expenses_insert_own" ON expenses;
CREATE POLICY "expenses_insert_own"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "expenses_update_own" ON expenses;
CREATE POLICY "expenses_update_own"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING  (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "expenses_delete_own" ON expenses;
CREATE POLICY "expenses_delete_own"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));


-- ─── 5. DOCUMENTS — Metadata table ───────────────────────────────────────────

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_own" ON documents;
CREATE POLICY "documents_select_own"
  ON documents
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "documents_insert_own" ON documents;
CREATE POLICY "documents_insert_own"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "documents_delete_own" ON documents;
CREATE POLICY "documents_delete_own"
  ON documents
  FOR DELETE
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));


-- ─── 6. MESSAGES — Client can read/send; accountant side handled by service_role

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_own" ON messages;
CREATE POLICY "messages_select_own"
  ON messages
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    AND sender_role = 'client'
  );


-- ─── 7. TASKS — Client read-only; creation is service_role ───────────────────
--
-- FINDING: PGRST204 on anon INSERT suggests PostgREST-level block.
-- Explicit RLS ensures this holds even if PostgREST config changes.

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_own" ON tasks;
CREATE POLICY "tasks_select_own"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- No INSERT/UPDATE/DELETE for authenticated role — tasks created by service_role only.


-- ─── 8. AUDIT LOG — Append-only via service_role; no client access ───────────
--
-- FINDING: PGRST204 on anon INSERT — appears blocked. Hardening with explicit RLS.
-- Clients must never read or write audit logs directly.

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- No policies for anon or authenticated roles.
-- service_role bypasses RLS and is the only writer.
-- If a future "my activity" feature is needed, add a scoped SELECT policy then.


-- ─── 9. STORAGE BUCKET — documents ───────────────────────────────────────────
--
-- FINDING: Bucket 'documents' is listed as accessible to anon (currently empty).
-- Policies below restrict to authenticated users scoped to their client folder.
-- Folder structure expected: documents/{client_id}/{filename}

-- Objects: authenticated users can only access their own client_id prefix
DROP POLICY IF EXISTS "documents_storage_select" ON storage.objects;
CREATE POLICY "documents_storage_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM clients WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "documents_storage_insert" ON storage.objects;
CREATE POLICY "documents_storage_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM clients WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "documents_storage_delete" ON storage.objects;
CREATE POLICY "documents_storage_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM clients WHERE user_id = auth.uid()
    )
  );


-- =============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- Run these in the Supabase SQL Editor after applying this migration.
-- All should return 0 or show correct policy counts.
-- =============================================================================

-- 1. Confirm RLS is enabled on all tables
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' ORDER BY tablename;
-- Expected: rowsecurity = true for all rows.

-- 2. List all policies
-- SELECT tablename, policyname, cmd, roles FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename;

-- 3. Manual penetration test (run from a Node.js script with anon key):
-- All tables except waitlist INSERT should return 0 rows and block writes.
-- Waitlist INSERT should succeed; SELECT should return 0 rows.
