-- =============================================================================
-- SECURITY MIGRATION: RLS Policy Cleanup
-- Date: 2026-03-30
-- Auditor: Claude Code (pg_policies audit)
-- =============================================================================
--
-- CONTEXT: After the initial RLS hardening migration, a pg_policies audit
-- revealed that:
--   1. Old waitlist policies used different names than assumed — DROP POLICY
--      IF EXISTS silently did nothing. PII was still exposed.
--   2. audit_log had an INSERT policy for {public} — anyone could inject
--      fake compliance entries via the anon key.
--   3. Many tables had redundant ALL {public} policies alongside the new
--      scoped {authenticated} policies.
--
-- LESSON: Always query pg_policies after a migration to verify policy names.
-- Never assume DROP POLICY IF EXISTS succeeded. Confirm with a SELECT.
--
-- PENTEST RESULT (post-cleanup): 14/14 passed.
-- =============================================================================


-- ─── WAITLIST: drop all stale public-access policies ─────────────────────────
--
-- These policies used USING (true) for {public} role, meaning any caller
-- with the anon key (which is in the client bundle) could read all 14
-- waitlist rows including real names and email addresses.
--
DROP POLICY IF EXISTS "public read by uid only" ON waitlist;
DROP POLICY IF EXISTS "count only"              ON waitlist;
DROP POLICY IF EXISTS "service can delete"      ON waitlist;
DROP POLICY IF EXISTS "service can update"      ON waitlist;
DROP POLICY IF EXISTS "service update uid"      ON waitlist;
DROP POLICY IF EXISTS "insert only"             ON waitlist;
-- Retained: "waitlist_insert_anon" (anon INSERT only — correct for signup form)


-- ─── AUDIT LOG: drop open INSERT policy ──────────────────────────────────────
--
-- "audit_log_insert" granted INSERT to {public} with no WITH CHECK clause.
-- This allowed anyone to inject arbitrary entries into the compliance trail.
-- logAudit() in lib/audit.ts uses service_role which bypasses RLS — no
-- client-facing INSERT policy is needed.
--
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;


-- ─── Remove redundant ALL {public} policies ───────────────────────────────────
--
-- These were the original broad policies. They were not exploitable (USING
-- clause scoped to auth.uid()) but created confusion alongside the new
-- scoped {authenticated} policies from the hardening migration.
-- Removing them leaves a single, clearly-named policy per operation per table.
--
DROP POLICY IF EXISTS "client_own_profile"              ON clients;
DROP POLICY IF EXISTS "accountant_assigned_clients"     ON clients;
DROP POLICY IF EXISTS "admin_all_clients"               ON clients;

DROP POLICY IF EXISTS "client_own_income"               ON income;
DROP POLICY IF EXISTS "accountant_assigned_income"      ON income;
DROP POLICY IF EXISTS "admin_all_income"                ON income;

DROP POLICY IF EXISTS "client_own_expenses"             ON expenses;
DROP POLICY IF EXISTS "accountant_assigned_expenses"    ON expenses;
DROP POLICY IF EXISTS "admin_all_expenses"              ON expenses;

DROP POLICY IF EXISTS "client_own_documents"            ON documents;
DROP POLICY IF EXISTS "accountant_assigned_documents"   ON documents;
DROP POLICY IF EXISTS "admin_all_documents"             ON documents;

DROP POLICY IF EXISTS "client_own_messages"             ON messages;
DROP POLICY IF EXISTS "accountant_assigned_messages"    ON messages;
DROP POLICY IF EXISTS "admin_all_messages"              ON messages;

DROP POLICY IF EXISTS "client_own_tasks"                ON tasks;
DROP POLICY IF EXISTS "admin_all_tasks"                 ON tasks;


-- =============================================================================
-- VERIFICATION (run after applying)
-- =============================================================================
-- SELECT tablename, policyname, cmd, roles FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename, cmd;
--
-- Expected: no {public} policies with USING (true) on any sensitive table.
-- Waitlist should have only "waitlist_insert_anon" for anon INSERT.
-- audit_log should have no INSERT policy (service_role writes bypass RLS).
--
-- Then run: node scripts/pentest-rls.js
-- Expected: 14/14 PASS
