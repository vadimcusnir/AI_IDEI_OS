# Security Audit — AI-IDEI v1.0

**Audit Date:** 2026-03-10
**Auditor:** Platform Architect Agent
**Scope:** Full stack (frontend, backend, database, edge functions)

## Executive Summary

The platform has a solid security foundation with RLS on all tables, role-based access via `has_role()`, and proper auth context. However, several edge functions bypass JWT verification and trust client-provided `user_id`, creating impersonation risks. Two platform-level findings were detected by automated scanning.

## Risk Matrix

| ID | Severity | Category | Finding |
|----|----------|----------|---------|
| SEC-001 | **HIGH** | Auth | Edge functions trust client-provided `user_id` |
| SEC-002 | **HIGH** | Auth | `extract-neurons` uses anon key instead of user JWT |
| SEC-003 | **MEDIUM** | Auth | `chunk-transcript` uses anon key for auth header |
| SEC-004 | **MEDIUM** | Config | Leaked password protection disabled |
| SEC-005 | **LOW** | RLS | `push_config` table has no RLS policies |
| SEC-006 | **LOW** | CORS | All edge functions use `Access-Control-Allow-Origin: *` |
| SEC-007 | **INFO** | Auth | No rate limiting on auth endpoints |
| SEC-008 | **INFO** | Input | Limited input validation on edge function payloads |

## Detailed Findings

### SEC-001: Edge Functions Trust Client-Provided `user_id` (HIGH)

**Affected functions:** `extract-neurons`, `chunk-transcript`, `extract-guests`, `generate-entities`

**Issue:** These functions accept `user_id` in the request body and use it for database operations. Combined with `verify_jwt = false` in config.toml, any caller can impersonate any user.

**Evidence (Extractor.tsx lines 452-461):**
```typescript
body: JSON.stringify({ episode_id: episode.id, user_id: user.id }),
// Uses anon key as Authorization header
Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
```

**Remediation:**
1. Enable `verify_jwt = true` for all user-facing functions
2. Extract `user_id` from JWT token inside functions via `supabase.auth.getUser(token)`
3. Remove `user_id` from request payloads

### SEC-002: `extract-neurons` Uses Anon Key (HIGH)

**Issue:** The Extractor page sends the anon key as the Authorization header when calling `extract-neurons`, not the user's session token. This means the function cannot identify the real caller.

**Evidence (Extractor.tsx line 459):**
```typescript
Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
```

**Impact:** Combined with SEC-001, any unauthenticated client could call this endpoint and attribute neuron extraction to any user.

**Remediation:** Use `session.data.session?.access_token` (like `triggerTranscription` already does correctly on line 309).

### SEC-003: `chunk-transcript` Uses Anon Key (MEDIUM)

**Issue:** Same pattern as SEC-002.

**Evidence (Extractor.tsx line 427):**
```typescript
Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
```

### SEC-004: Leaked Password Protection Disabled (MEDIUM)

**Source:** Automated security scan

**Issue:** The auth system does not check passwords against known breach databases (e.g., HaveIBeenPwned).

**Remediation:** Enable leaked password protection in auth settings.

### SEC-005: `push_config` No RLS (LOW)

**Issue:** The `push_config` table has RLS enabled but no policies defined. This means no one can read/write it through the API (secure by default), but the intent is unclear.

**Impact:** Low — the table is only accessed by `trigger_send_push()` function which uses SECURITY DEFINER.

### SEC-006: Wildcard CORS (LOW)

**Issue:** All edge functions use `Access-Control-Allow-Origin: *`. This is acceptable for a SPA with token-based auth, but restricting to known origins would add defense-in-depth.

### SEC-007: No Rate Limiting (INFO)

**Issue:** No rate limiting on auth endpoints, AI extraction calls, or service execution. A malicious actor could exhaust compute credits rapidly.

**Remediation:** Implement rate limiting via edge function middleware or Supabase rate limiting features.

### SEC-008: Limited Input Validation (INFO)

**Issue:** Edge functions perform minimal input validation. For example, `extract-neurons` doesn't validate `episode_id` format before querying.

**Remediation:** Add zod validation schemas to all edge function inputs.

## Positive Security Findings

1. ✅ All 28+ tables have RLS enabled
2. ✅ Admin role check uses `SECURITY DEFINER` function to prevent RLS recursion
3. ✅ Roles stored in separate `user_roles` table (not in profiles)
4. ✅ Auth state managed server-side via Supabase Auth
5. ✅ No sensitive keys in client-side code
6. ✅ Stripe secret key only in edge functions
7. ✅ Password minimum length enforced (6 chars)
8. ✅ Email verification required (no auto-confirm)
9. ✅ Google OAuth properly configured via `@lovable.dev/cloud-auth-js`
10. ✅ File uploads go to private storage bucket
11. ✅ `handle_new_user()` trigger creates profile server-side
12. ✅ Credit deduction happens server-side in edge functions
13. ✅ No `dangerouslySetInnerHTML` with user content (except JSON-LD with server data)
