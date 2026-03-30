# Foundry MVP — Claude Code Directives

## ⚠️ SECURITY MANDATE — READ BEFORE ANY CODE CHANGE

This is a UK financial platform handling real taxpayer data, HMRC submissions,
and PII. Every code change must treat security as a first-class constraint,
not an afterthought.

### Before writing any code involving data access:

1. **Security design first.** Ask: who can call this? What data does it touch?
   Can an unauthenticated user reach this path? Does RLS cover it?

2. **Penetration test your own changes.** After any DB schema or RLS change,
   run the anon-key probe script to verify no data is exposed:
   ```
   node scripts/pentest-rls.js
   ```

3. **Default-deny always.** New tables must have RLS enabled immediately.
   No exceptions. An unprotected table is a data breach.

4. **Never write `USING (true)`.** This grants access to all rows for any
   caller. Write scoped policies: `user_id = auth.uid()` or
   `client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())`.

5. **`WITH CHECK` is mandatory on INSERT/UPDATE.** Without it, a user can
   insert a row owned by someone else by manipulating the `client_id` or
   `user_id` field.

6. **service_role is nuclear.** It bypasses all RLS. Use it only in
   server-side admin contexts (`lib/supabase-admin.ts`). Never expose it to
   the client bundle. It must never appear in `NEXT_PUBLIC_` variables.

7. **Validate at the boundary.** TypeScript types are compile-time only.
   Use Zod schemas at every API route, Server Action, and webhook handler.

---

## RLS Audit Trail

| Date       | Auditor      | Finding                                      | Status  |
|------------|--------------|----------------------------------------------|---------|
| 2026-03-30 | Claude Code  | waitlist SELECT exposed 14 PII rows to anon  | Fixed   |
| 2026-03-30 | Claude Code  | All core portal tables: anon blocked ✓       | Verified |
| 2026-03-30 | Claude Code  | documents storage bucket: anon accessible    | Migrated |

Migration: `supabase/migrations/20260330_rls_hardening.sql`

---

## Key Security Rules Per Domain

### Authentication
- Use `jwt.verify()` — never `jwt.decode()` alone (no signature check)
- Next.js middleware can be bypassed via spoofed headers. Always re-verify
  auth inside Server Actions and Route Handlers independently
- Store tokens in `HttpOnly + Secure + SameSite=Lax` cookies — never localStorage
- Every Server Action needs: (1) Zod input validation, (2) auth check,
  (3) authorization — confirm the resource belongs to this user

### Database
- RLS disabled by default on new tables in Supabase SQL Editor — enable immediately
- Subcollections / child tables are NOT covered by parent RLS — each needs its own policy
- Never pass `req.body` directly to a Prisma/Supabase query — validate first
- Never use `$queryRawUnsafe` with user-supplied input

### Secrets
- `NEXT_PUBLIC_` prefix = baked into the client bundle = visible to everyone
- Safe client-side: Supabase anon key, Stripe publishable key
- Must NEVER be client-side: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  any database connection string, JWT signing secrets
- If a secret is ever committed to Git history — rotate it immediately

### Rate Limiting (NOT YET IMPLEMENTED — Fix 6 pending)
- Auth endpoints (login, magic link, OTP) need per-IP + per-email limits
- Waitlist signup needs per-IP rate limiting (spam relay risk)
- Any future AI API call endpoint needs hard per-user spend caps

### Payments (future)
- Never trust client-submitted prices — look up server-side from DB/Stripe
- Verify webhook signatures using raw body (not parsed JSON)
- Check subscription status server-side on every protected request

### Deployment Checklist (before every production deploy)
- [ ] `gitleaks detect` — scan for leaked secrets
- [ ] No `NEXT_PUBLIC_` wrapping any secret key
- [ ] Source maps disabled in production build
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)
- [ ] CORS allows only `taxfoundry.co.uk` — never `*`
- [ ] Preview deployments use test credentials only
- [ ] Run `node scripts/pentest-rls.js` and confirm all green

---

## Project Structure Reminders

- All portal data access goes through hooks in `app/portal/components/tabs/`
- Errors use `AppError` type from `lib/errors.ts` — never raw strings
- `lib/supabase-admin.ts` (service_role) — server-side admin only
- `lib/supabase-server.ts` (anon + cookies) — authenticated server actions
- `lib/supabase.ts` (anon) — client components only
