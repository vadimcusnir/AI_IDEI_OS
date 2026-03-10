# Task Registry — AI-IDEI v1.0

## Security Tasks

### TASK-S01: Fix Edge Function Authentication
- **Priority:** Critical
- **Category:** Security
- **Description:** Enable JWT verification for all user-facing edge functions and extract user_id from token instead of request body.
- **Affected:** extract-neurons, chunk-transcript, extract-guests, generate-entities, extract-insights
- **Solution:** 
  1. Update `supabase/config.toml` to set `verify_jwt = true`
  2. Update each function to extract user from JWT: `const { data: { user } } = await supabase.auth.getUser(token)`
  3. Update frontend calls to send `session.access_token` instead of anon key

### TASK-S02: Fix Frontend Auth Headers
- **Priority:** Critical
- **Category:** Security
- **Description:** Replace all instances of `VITE_SUPABASE_PUBLISHABLE_KEY` used as Authorization header with the user's session access token.
- **Affected files:** Extractor.tsx (lines 427, 459), useAIExtraction.ts (line 62)

### TASK-S03: Enable Leaked Password Protection
- **Priority:** High
- **Category:** Security
- **Description:** Enable leaked password protection in auth configuration to check against known breach databases.

### TASK-S04: Add Rate Limiting
- **Priority:** Medium
- **Category:** Security
- **Description:** Implement rate limiting for AI extraction endpoints and auth endpoints to prevent abuse.

### TASK-S05: Add Input Validation to Edge Functions
- **Priority:** Medium
- **Category:** Security
- **Description:** Add zod schemas to validate all edge function inputs (episode_id format, neuron_id ranges, service_key values).

## Performance Tasks

### TASK-P01: Add Database Indexes
- **Priority:** High
- **Category:** Performance
- **Description:** Create indexes for frequently queried columns:
  - `neurons(author_id, updated_at DESC)`
  - `entities(entity_type, is_published)` 
  - `entities(slug) WHERE is_published = true`
  - `entity_relations(source_entity_id)` and `(target_entity_id)`
  - `credit_transactions(user_id, created_at DESC)`
  - `neuron_jobs(author_id, created_at DESC)`

### TASK-P02: Implement Entity Pagination
- **Priority:** Medium
- **Category:** Performance
- **Description:** Replace `limit(200)` in EntityListing with cursor-based pagination for scalability.

### TASK-P03: Add Episode Author Filter
- **Priority:** Low
- **Category:** Performance
- **Description:** Add `author_id` filter to episode fetch query to reduce unnecessary data transfer.

## Architecture Tasks

### TASK-A01: Remove Duplicate Navigation
- **Priority:** Medium
- **Category:** Refactor
- **Description:** Audit `SiteHeader.tsx` usage. If no longer needed (replaced by `AppSidebar`), remove it. If needed for specific pages, document the usage.

### TASK-A02: Add React Error Boundaries
- **Priority:** Medium
- **Category:** Feature
- **Description:** Wrap major route components in Error Boundaries with fallback UI to prevent full-app crashes.

### TASK-A03: Extract Shared Components
- **Priority:** Low
- **Category:** Refactor
- **Description:** Extract reusable components: `StatCard`, `StatusBadge`, `EmptyState`, `PageHeader` from page-level definitions to shared components.

### TASK-A04: Standardize Data Fetching
- **Priority:** Medium
- **Category:** Refactor
- **Description:** Many pages use `useState` + `useEffect` for data fetching instead of TanStack Query. Migrate to `useQuery` for automatic caching, refetching, and error handling. Priority pages: Home, Services, Credits, Intelligence.

## Feature Tasks

### TASK-F01: Enable Realtime Notifications
- **Priority:** Medium
- **Category:** Feature
- **Description:** Add realtime subscription for `notifications` table to enable real-time notification bell updates.

### TASK-F02: Implement IdeaRank UI Layer (Phase 2)
- **Priority:** High
- **Category:** Feature
- **Description:** Build trending ideas widget, ranked entity listings, topic discovery pages using existing IdeaRank data.

### TASK-F03: Knowledge Asset Schema (Phase 3)
- **Priority:** High
- **Category:** Feature
- **Description:** Create `knowledge_assets`, `asset_transactions`, `asset_licenses` tables and dual-currency pricing engine.

### TASK-F04: Complete i18n Coverage
- **Priority:** Low
- **Category:** Feature
- **Description:** Move all hardcoded strings to locale files. Standardize language (English canonical).

### TASK-F05: Add SEO Meta Tags to All Pages
- **Priority:** Medium
- **Category:** SEO
- **Description:** Entity pages have JSON-LD. Add proper `<title>`, `<meta description>`, Open Graph tags to all pages via react-helmet or equivalent.

### TASK-F06: Implement Topup Success Handling
- **Priority:** Medium
- **Category:** Feature
- **Description:** Credits page imports `useSearchParams` but doesn't handle `?topup=success&session_id=...` URL parameters. Implement verification flow.

## DevOps Tasks

### TASK-D01: Add Playwright E2E Tests
- **Priority:** Medium
- **Category:** Testing
- **Description:** The project has Playwright config but no test files. Add critical path tests: auth flow, neuron creation, service execution.

### TASK-D02: Add Vitest Unit Tests
- **Priority:** Medium
- **Category:** Testing
- **Description:** Only one example test exists. Add unit tests for: `useCreditBalance`, `useAdminCheck`, `useNeuronList`, chunking utilities.
