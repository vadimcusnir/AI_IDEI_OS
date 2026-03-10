# SECURITY_HARDENING.md — AI-IDEI Knowledge OS

## Vulnerabilities Remediated

### BUG-SEC-001: run-service trusted client user_id (CRITICAL)
**Before:** `user_id` was accepted from request body, allowing impersonation.
**Fix:** Added JWT authentication. `user_id` is now always derived from `getUser()`.
**Files:** `supabase/functions/run-service/index.ts`, `src/pages/RunService.tsx`, `BatchRunner.tsx`, `PromptForge.tsx`, `ProfileExtractor.tsx`

### BUG-SEC-002: neuron-chat had no authentication (HIGH)
**Before:** Anyone could call the endpoint without auth.
**Fix:** Added JWT validation via `getUser()`. Messages validated for length.
**File:** `supabase/functions/neuron-chat/index.ts`

### BUG-SEC-003: changelog-ingest had no authentication (HIGH)
**Before:** Anyone could inject arbitrary raw changes.
**Fix:** Added JWT + admin role check. Input sanitized with length limits.
**File:** `supabase/functions/changelog-ingest/index.ts`

### BUG-SEC-004: transcribe-audio weak authentication (MEDIUM)
**Before:** Accepted anon key as valid token (bypass auth).
**Fix:** Strict JWT validation + ownership check (episode.author_id = caller.id).
**File:** `supabase/functions/transcribe-audio/index.ts`

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| `extract-neurons` | 10 requests | 1 hour |
| `run-service` | 20 requests | 1 hour |
| `transcribe-audio` | 5 requests | 1 hour |

Implementation: In-memory token bucket per user_id. Resets after window expires.

## Input Validation

All edge functions validate:
- Required fields presence
- String length limits (content: 50K, messages: 30K)
- Type checking for parameters
- Enum validation for impact_level, action types
- Array size limits (changelog-ingest: max 100 events)

## Authentication Matrix

| Function | Auth Method | Ownership Check |
|---|---|---|
| extract-neurons | JWT + getUser | episode.author_id = user |
| run-service | JWT + getUser | — (credits scoped to user) |
| transcribe-audio | JWT + getUser | episode.author_id = user |
| chunk-transcript | JWT + getUser | episode.author_id = user |
| extract-guests | JWT + getUser | episode.author_id = user |
| extract-insights | JWT + getUser | — |
| neuron-chat | JWT + getUser | — |
| neuron-api | JWT + getUser | via RLS |
| generate-entities | JWT + Admin role | — |
| changelog-generate | JWT + Admin role | — |
| changelog-ingest | JWT + Admin role | — |
| create-topup-checkout | JWT + getUser | — |
| verify-topup | JWT + getUser | metadata.user_id match |
| sitemap | Public | — |

## Supply Chain Security

- Dependabot: weekly scans (npm + GitHub Actions)
- CodeQL: JavaScript/TypeScript analysis on every PR
- Dependency Review: blocks PR merge on HIGH severity
- CI Security job: `npm audit --audit-level=high` blocks build
- Secret scanning: enabled via GitHub Advanced Security
