# Security Audit — AI-IDEI v1.1

**Audit Date:** 2026-03-10
**Last Updated:** 2026-03-26
**Auditor:** Platform Architect Agent
**Scope:** Full stack (frontend, backend, database, edge functions)

## Executive Summary

The platform has a strong security posture. All critical and high findings from the initial audit (2026-03-10) have been remediated. Edge functions now derive `user_id` from JWT tokens, CORS is restricted to allowed origins, and all tables have proper RLS policies.

## Risk Matrix

| ID | Severity | Category | Finding | Status |
|----|----------|----------|---------|--------|
| SEC-001 | **HIGH** | Auth | Edge functions trust client-provided `user_id` | ✅ FIXED |
| SEC-002 | **HIGH** | Auth | `extract-neurons` uses anon key instead of user JWT | ✅ FIXED |
| SEC-003 | **MEDIUM** | Auth | `chunk-transcript` uses anon key for auth header | ✅ FIXED |
| SEC-004 | **MEDIUM** | Config | Leaked password protection disabled | ⚠️ MANUAL (requires Pro Plan) |
| SEC-005 | **LOW** | RLS | `push_config` table has no RLS policies | ✅ FIXED |
| SEC-006 | **LOW** | CORS | All edge functions use `Access-Control-Allow-Origin: *` | ✅ FIXED (v2) |
| SEC-007 | **INFO** | Auth | No rate limiting on auth endpoints | ⚠️ OPEN |
| SEC-008 | **INFO** | Input | Limited input validation on edge function payloads | ✅ FIXED |

## Remediation Log

### SEC-001 & SEC-002 & SEC-003: JWT Auth — FIXED 2026-03-15

**Resolution:** ALL edge functions (`extract-neurons`, `chunk-transcript`, `extract-guests`, `deep-extract`, `extract-insights`, `generate-entities`, `run-service`, `neuron-chat`) now derive `user_id` from JWT via `supabase.auth.getUser(token)`. No function accepts `user_id` from request body. Frontend (`Extractor.tsx`) sends `session.access_token` as Authorization header.

### SEC-005: push_config RLS — FIXED 2026-03-15

**Resolution:** RLS enabled on `push_config` with `USING(false)` policy. Only service role (triggers) can access.

### SEC-006: CORS Wildcard — FIXED 2026-03-15

**Resolution:** Created `_shared/cors.ts` with `getCorsHeaders(req)`. Origin validated against allowlist (`ai-idei.com`, `*.lovable.app`, `localhost`). Applied to 9 critical edge functions: `generate-entities`, `run-service`, `extract-neurons`, `chunk-transcript`, `transcribe-audio`, `extract-guests`, `neuron-chat`, `extract-insights`, `verify-topup`.

### SEC-008: Input Validation — FIXED 2026-03-15

**Resolution:** Zod validation schemas added to `extract-neurons` (episode_id UUID), `chunk-transcript` (episode_id, min/max tokens), `run-service` (job_id, service_key, neuron_id, inputs max 50k), `neuron-chat` (messages array with role enum, neuron_context object). Frontend form validation added for email + password on Auth.tsx.

### SEC-006 v2: CORS Legacy Wildcard Cleanup — FIXED 2026-03-25

**Resolution:** Removed ALL local `const corsHeaders = { Allow-Origin: * }` definitions from 57+ edge functions. Every function now uses `getCorsHeaders(req)` from `_shared/cors.ts`. Legacy `corsHeaders` export removed from shared module.

### SEC-007: Rate Limiting — FIXED 2026-03-25

**Resolution:** Migrated from volatile in-memory `Map` to database-backed `rate_limit_entries` table with atomic `check_rate_limit()` RPC function. Rate limiting now persists across edge function restarts and works in multi-instance deployments. **Fail-closed** design blocks requests if DB is unreachable (security over availability). Shared `_shared/rate-limiter.ts` provides `checkRateLimit()` and `rateLimitGuard()` middleware.

### SEC-004: Leaked Password Protection — ✅ FIXED 2026-03-25

**Resolution:** Activated Password HIBP Check in Lovable Cloud → Auth Settings → Email settings.

## Remaining Items

None — all findings remediated.

## Additional Hardening (2026-03-26)

1. ✅ **Zod Validation Schemas** — Centralized in `_shared/validation.ts` for `execute-os-agent`, `execute-service`, `webhook-ingest`
2. ✅ **Client Security Library** — `src/lib/security.ts` with XSS strip, redirect validation, nonce generation
3. ✅ **Privilege Escalation Fix** — Removed `user_roles_insert_own`, `admin_permissions_insert_own/update/delete` RLS policies
4. ✅ **Rate Limiter Hardened** — Changed from fail-open to fail-closed design

## Positive Security Findings

1. ✅ All 35+ tables have RLS enabled
2. ✅ Admin role check uses `SECURITY DEFINER` function to prevent RLS recursion
3. ✅ Roles stored in separate `user_roles` table (not in profiles)
4. ✅ Auth state managed server-side via Supabase Auth
5. ✅ No sensitive keys in client-side code
6. ✅ Stripe secret key only in edge functions
7. ✅ Password minimum length enforced (6 chars login, 8 chars signup)
8. ✅ Email verification required (no auto-confirm)
9. ✅ Google OAuth properly configured
10. ✅ File uploads go to private storage bucket
11. ✅ `handle_new_user()` trigger creates profile server-side
12. ✅ Credit deduction happens server-side in edge functions
13. ✅ No `dangerouslySetInnerHTML` with user content (except JSON-LD with server data)
14. ✅ CORS restricted to known origins (67+ functions audited)
15. ✅ All edge functions validate JWT before processing
16. ✅ Zod input validation on critical edge functions
17. ✅ i18n error messages standardized across EN/RO/RU
18. ✅ DB-backed rate limiting with fail-closed design
19. ✅ No self-role-assignment possible (privilege escalation blocked)
