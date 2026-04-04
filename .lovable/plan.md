

# AI-IDEI Full System Fix — User Journey & Audit Remediation Plan

## Diagnosis Summary

Two comprehensive audits identified 25+ issues across the Command Center, navigation, execution engine, and UX. Combined with the user journey analysis, the core problems are:

1. **Execution failures** — "Failed to create job" due to schema mismatches (partially fixed, needs validation)
2. **Server-side abort missing** — Stop button only stops client; server continues burning credits
3. **EconomicGate unclear** — No refund info, hard-coded 50N threshold, no time estimate
4. **Error feedback generic** — Rate limit (429), insufficient credits show as "Agent error"
5. **useCommandCenter monolithic** — 536 lines, 15+ states, 20+ handlers in one hook
6. **Session persistence incomplete** — Outputs lost on refresh, no session manager
7. **Double-submit possible** — Partially fixed (isSubmitting flag added), needs Enter key guard
8. **Slash commands incomplete** — /generate, /analyze modes exist but underlying services may fail
9. **Offline indicator missing** — OfflineBanner imported but has no connectivity logic
10. **Landing page disconnected** — No link to public knowledge pages (/insights, /patterns, /formulas)

## Implementation Plan (8 Steps)

### Step 1: Fix Execution Engine Reliability
**Files**: `src/hooks/useExecution.ts`, `src/components/command-center/CommandRouter.ts`

- Validate that `neuron_id` from placeholder neuron is correctly typed (the `neurons` table uses `bigint` → ensure `Number()` cast)
- Add fallback when `service_catalog` lookup returns null — show user-friendly "Service not available" instead of crashing
- Add `try/catch` around neuron creation with explicit error messaging
- Ensure `workspace_id` is passed correctly (null-safe)

### Step 2: Server-Side Abort Support
**Files**: `supabase/functions/run-service/index.ts`, `src/hooks/useExecution.ts`

- Add `cancel` endpoint logic to `run-service`: accept a `cancel` action that updates job status to `cancelled` and releases reserved credits via `release_neurons` RPC
- In `useExecution.stop()`, after aborting the client-side controller, call the cancel endpoint with the active `job_id`
- Track active `jobId` in a ref so stop() can reference it

### Step 3: Improve Error Feedback (Rate Limit, Credits, Network)
**Files**: `src/components/command-center/ErrorRecoveryHandler.tsx`, `src/hooks/useCommandCenter.ts`, `src/hooks/useExecution.ts`

- In `streamAgentResponse` and `executeService`, intercept HTTP 429 and show specific countdown message ("Rate limit reached. Try again in X seconds") using `Retry-After` header
- For 402 errors, show "Insufficient credits" with direct "Top Up" button
- For network errors (`TypeError: Failed to fetch`), show offline banner
- Update `classifyError()` to parse HTTP status codes from edge function responses

### Step 4: EconomicGate UX Improvements
**Files**: `src/components/command-center/EconomicGate.tsx`

- Add explanatory text: "Credits are only charged upon successful completion. Cancellation returns your credits."
- Add estimated execution time (based on service type: quick=5s, standard=15s, deep=30s)
- Make the 50N quick-exec threshold configurable per tier (free=0, pro=100, vip=200)
- Show balance-after-execution preview more prominently

### Step 5: Offline Indicator & Input Persistence
**Files**: `src/components/command-center/OfflineBanner.tsx`, `src/hooks/useOnlineStatus.ts` (new), `src/hooks/useCommandCenter.ts`

- Create `useOnlineStatus` hook using `navigator.onLine` + `online`/`offline` events
- Wire into `OfflineBanner` to show persistent banner when offline
- Block submit when offline with clear message
- Input draft is already persisted via `saveDraft()` — verify it survives refresh

### Step 6: Landing Page → Knowledge Bridge
**Files**: `src/pages/Landing.tsx`, `src/components/landing/LandingKnowledgeShowcase.tsx` (new)

- Add a new section between LandingWhatYouGet and LandingFinalCTA showing 3-6 curated public insights/patterns
- Each card links to `/insights/:slug`, `/patterns/:slug` etc.
- Add "Explore Knowledge Base" CTA linking to `/library`
- This addresses the "marketing vs application divide" — visitors see real value before signup

### Step 7: Session Manager (Basic)
**Files**: `src/hooks/useChatHistory.ts`, `src/components/command-center/SessionList.tsx` (new), `src/pages/Home.tsx`

- Add `listSessions()` to `useChatHistory` that queries `chat_messages` grouped by session
- Create a `SessionList` sidebar/dropdown showing past sessions with timestamps
- Allow switching between sessions and deleting old ones
- Add rename capability for sessions

### Step 8: useCommandCenter Refactor (Sub-hooks)
**Files**: `src/hooks/usePermissionGate.ts` (new), `src/hooks/useEconomicGate.ts` (new), `src/hooks/useSlashCommands.ts` (new)

- Extract permission checking logic into `usePermissionGate`
- Extract economic gate state management into `useEconomicGate`
- Extract slash command matching into `useSlashCommands`
- Keep `useCommandCenter` as orchestrator importing sub-hooks
- Target: reduce from 536 lines to ~250 lines

### Database Migration
- Add `cancelled` as valid job status
- Add `cancel_reason` column to `neuron_jobs`

### Files Modified (Summary)
- `src/hooks/useExecution.ts` — abort support, error handling
- `src/hooks/useCommandCenter.ts` — orchestrator cleanup, offline guard
- `src/components/command-center/ErrorRecoveryHandler.tsx` — rate limit, credits, network errors
- `src/components/command-center/EconomicGate.tsx` — UX improvements
- `src/components/command-center/OfflineBanner.tsx` — real connectivity detection
- `src/components/command-center/CommandRouter.ts` — validation improvements
- `supabase/functions/run-service/index.ts` — cancel support
- `src/pages/Landing.tsx` — knowledge showcase section
- `src/pages/Home.tsx` — session manager integration
- New files: `useOnlineStatus.ts`, `usePermissionGate.ts`, `useEconomicGate.ts`, `useSlashCommands.ts`, `SessionList.tsx`, `LandingKnowledgeShowcase.tsx`

