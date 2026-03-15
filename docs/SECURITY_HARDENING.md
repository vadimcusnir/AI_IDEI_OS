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

### BUG-SEC-005: Credit operations bypass SECURITY DEFINER functions (CRITICAL)
**Before:** `extract-neurons`, `run-service`, `verify-topup` directly updated `user_credits` table, creating race conditions and bypassing atomic credit operations.
**Fix:** All credit operations now use `spend_credits()` and `add_credits()` SECURITY DEFINER functions exclusively. Direct `user_credits` table updates eliminated.
**Files:** `supabase/functions/extract-neurons/index.ts`, `supabase/functions/run-service/index.ts`, `supabase/functions/verify-topup/index.ts`

### BUG-SEC-006: RLS allowed direct credit manipulation (CRITICAL)
**Before:** `user_credits` had INSERT and UPDATE RLS policies allowing users to modify their own balance directly.
**Fix:** Dropped `Users can update own credits` and `Users can insert own credits` policies. Only SECURITY DEFINER functions can modify balances.
**Migration:** `20260311005109_secure_credits_rls.sql`

### BUG-SEC-007: neuron_links RLS used OR logic (MEDIUM)
**Before:** A link was visible if the user could access EITHER the source or target neuron, exposing private neuron IDs.
**Fix:** Changed to AND logic — both neurons must be accessible.
**Migration:** `20260310235404_neuron_links_and_logic.sql`

### BUG-SEC-008: Missing rate limiting on multiple functions (MEDIUM)
**Before:** `gdpr`, `chunk-transcript`, `extract-guests`, `extract-insights` had no rate limiting.
**Fix:** Added per-user in-memory rate limiting to all functions.

### BUG-SEC-009: Missing input validation (MEDIUM)
**Before:** Multiple functions lacked input type checking, length limits, and enum validation.
**Fix:** Added comprehensive input validation: type checking, string length limits, enum validation for actions/roles, array size limits, parameter bounds checking.
**Files:** All edge functions updated.

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| `extract-neurons` | 10 requests | 1 hour |
| `run-service` | 20 requests | 1 hour |
| `transcribe-audio` | 5 requests | 1 hour |
| `extract-guests` | 10 requests | 1 hour |
| `extract-insights` | 30 requests | 1 hour |
| `chunk-transcript` | 20 requests | 1 hour |
| `gdpr` | 3 requests | 1 hour |

Implementation: In-memory token bucket per user_id. Resets after window expires.

## Input Validation

All edge functions validate:
- Required fields presence and type
- String length limits (content: 50K, messages: 30K, titles: 200)
- Type checking for parameters (typeof checks)
- Enum validation for impact_level, action types, roles
- Array size limits (changelog-ingest: max 100 events, blocks: max 100, guests: max 20)
- Numeric parameter bounds (min_tokens: 50-2000, max_tokens: clamped)
- UUID format validation for entity IDs

## Authentication Matrix

| Function | Auth Method | Ownership Check | Rate Limit |
|---|---|---|---|
| extract-neurons | JWT + getUser | episode.author_id = user | 10/hr |
| run-service | JWT + getUser | — (credits scoped to user) | 20/hr |
| transcribe-audio | JWT + getUser | episode.author_id = user | 5/hr |
| chunk-transcript | JWT + getUser | episode.author_id = user | 20/hr |
| extract-guests | JWT + getUser | episode.author_id = user | 10/hr |
| extract-insights | JWT + getUser | — | 30/hr |
| neuron-chat | JWT + getUser | — | gateway |
| neuron-api | JWT + getUser | via RLS | — |
| generate-entities | JWT + Admin role | — | — |
| changelog-generate | JWT + Admin role | — | — |
| changelog-ingest | JWT + Admin role | — | — |
| create-topup-checkout | JWT + getUser | — | — |
| verify-topup | JWT + getUser | metadata.user_id match | — |
| gdpr | JWT + getUser | self only | 3/hr |
| sitemap | Public | — | — |

## Credit System Security

All credit operations are routed through PostgreSQL SECURITY DEFINER functions:
- `spend_credits(_user_id, _amount, _description, _job_id)` — atomic balance check + deduction + transaction log
- `add_credits(_user_id, _amount, _description, _type)` — atomic upsert + transaction log

No edge function directly modifies the `user_credits` table. RLS policies restrict users to read-only access on their own balance.

## Supply Chain Security

- Dependabot: weekly scans (npm + GitHub Actions)
- CodeQL: JavaScript/TypeScript analysis on every PR
- Dependency Review: blocks PR merge on HIGH severity
- CI Security job: `npm audit --audit-level=high` blocks build
- Secret scanning: enabled via GitHub Advanced Security

## Job Queue Security (2026-03-11)

### Retry & Dead Letter System
- Jobs automatically retry up to `max_retries` (default: 3) with exponential backoff
- Stale running jobs (>10 min) are auto-recovered by `process-queue`
- Failed jobs exceeding max retries are moved to dead letter queue
- `retry_failed_job()` is a SECURITY DEFINER function — users cannot manipulate retry counts
- `process-queue` edge function requires internal secret or admin JWT

### IMF Pipeline Security
- Pipeline execution validates total credit cost upfront before starting
- Each step executes via authenticated `run-service` call (not bypassing auth)
- Pipeline runs are logged with full step-by-step audit trail
- Only admins can create/modify pipeline definitions

## Database Schema Additions (2026-03-11)

### New Tables with RLS
| Table | RLS | Access |
|-------|-----|--------|
| `token_balances` | ✅ | Users read own only |
| `token_transactions` | ✅ | Users read own only |
| `subscription_plans` | ✅ | Public read active plans, admin manage |
| `analytics_events` | ✅ | Users insert own, admins read all |
| `imf_pipelines` | ✅ | Admins manage, users read active |
| `imf_pipeline_runs` | ✅ | Users read own, admins read all |
| `neuron_embeddings` | ✅ | Follow neuron visibility |
| `forum_flags` | ✅ | Users create own, admins manage |
| `team_challenges` | ✅ | Admins manage, users read active |
| `team_challenge_contributions` | ✅ | Users read own, system inserts |

### Semantic Search Security
- `search_neurons_semantic()` respects neuron visibility (public OR owner)
- Requires `_user_id` parameter to filter private neurons
- Uses `extensions.vector` type — no raw SQL exposed to clients

## RLS Hardening (2026-03-15)

### Privilege Escalation Prevention
- `workspace_members` INSERT restricted to workspace owners only
- `wallet_state` and `user_karma` UPDATE policies removed — mutations via SECURITY DEFINER only
- `system_config`, `runtime_health`, `feature_flags`, `training_samples` restricted to admin read-only
- `challenge_progress`, `vip_milestone_progress`, `team_challenge_contributions` restricted to SELECT-only for users
- `content_contributions` restricted to INSERT + SELECT (no self-approval or deletion)

## Performance Indexes (2026-03-15)

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_forum_threads_last_activity` | forum_threads | Thread listing by activity |
| `idx_forum_flags_status` | forum_flags | Admin moderation queue |
| `idx_forum_posts_thread_created` | forum_posts | Thread view pagination |
| `idx_challenge_progress_user` | challenge_progress | User challenge lookup |
| `idx_team_contrib_challenge` | team_challenge_contributions | Team progress aggregation |
| `idx_notifications_user_read` | notifications | Bell count query |
| `idx_knowledge_assets_published` | knowledge_assets | Marketplace browsing |
| `idx_asset_tx_buyer/seller` | asset_transactions | Transaction history |
| `idx_user_karma_karma` | user_karma | Leaderboard sorting |
| `idx_user_xp_level` | user_xp | XP leaderboard |
| `idx_entities_type_published` | entities | Entity listing pages |
| `idx_entity_relations_target` | entity_relations | Graph traversal |
| `idx_artifacts_job` | artifacts | Pipeline job lookup |
