# Bug Registry — AI-IDEI v1.0

## Critical

### BUG-001: User Impersonation via Edge Functions
- **Priority:** Critical
- **Category:** Security
- **Description:** `extract-neurons`, `chunk-transcript`, `extract-guests`, `generate-entities` accept `user_id` from request body with `verify_jwt = false`, allowing any caller to impersonate any user.
- **Impact:** Unauthorized neuron extraction, credit consumption, data access
- **Solution:** Enable JWT verification, extract user_id from token server-side

### BUG-002: Anon Key Used as Auth Token
- **Priority:** Critical
- **Category:** Security
- **Description:** Extractor page sends `VITE_SUPABASE_PUBLISHABLE_KEY` as Authorization header to `extract-neurons` and `chunk-transcript` instead of user's session token.
- **Impact:** Functions cannot authenticate the real caller
- **Solution:** Use `session.data.session?.access_token` consistently (pattern already exists in `triggerTranscription`)

## High

### BUG-003: Duplicate Navigation Systems
- **Priority:** High
- **Category:** Architecture
- **Description:** Both `SiteHeader.tsx` and `AppSidebar.tsx` exist with overlapping navigation. `SiteHeader` appears unused since `AppLayout` uses `AppSidebar`, but it's still imported/available.
- **Impact:** Maintenance burden, potential confusion
- **Solution:** Remove `SiteHeader` if confirmed unused, or designate clear usage boundaries

### BUG-004: No Database Indexes on Frequently Queried Columns
- **Priority:** High
- **Category:** Performance
- **Description:** No custom indexes on `neurons(author_id, updated_at)`, `entities(slug, is_published)`, `entity_relations(source/target)`, `credit_transactions(user_id)`.
- **Impact:** Query performance degrades at scale (>10K rows per table)
- **Solution:** Add composite indexes for primary query patterns

### BUG-005: Leaked Password Protection Disabled
- **Priority:** High
- **Category:** Security
- **Description:** Auth system does not check passwords against known breach databases.
- **Solution:** Enable via auth configuration

## Medium

### BUG-006: `useAIExtraction` Uses Anon Key
- **Priority:** Medium
- **Category:** Security
- **Description:** `useAIExtraction.ts` line 62 sends anon key for `extract-insights` calls.
- **Solution:** Use user's session token

### BUG-007: Missing Error Boundaries
- **Priority:** Medium
- **Category:** Frontend
- **Description:** No React Error Boundaries wrap major page components. An unhandled error in any page crashes the entire app.
- **Solution:** Add ErrorBoundary wrapper around route content

### BUG-008: Realtime Not Enabled for Notifications
- **Priority:** Medium
- **Category:** Feature
- **Description:** `useCreditBalance` uses realtime for `user_credits`, but `useNotifications` likely polls or fetches on mount only. New notifications don't appear in real-time.
- **Solution:** Add realtime subscription for `notifications` table

### BUG-009: Console Warnings in AuthContext
- **Priority:** Medium
- **Category:** Code Quality
- **Description:** `getSession()` and `onAuthStateChange` can race, potentially calling `setLoading(false)` twice. Not a bug but creates unnecessary re-renders.
- **Solution:** Use a ref to track initialization state

### BUG-010: Episode Query Missing `author_id` Filter
- **Priority:** Medium
- **Category:** Data
- **Description:** In `Extractor.tsx` line 105, `fetchEpisodes()` fetches all episodes without filtering by `author_id`. RLS handles security, but the query fetches unnecessarily.
- **Solution:** Add `.eq("author_id", user.id)` filter

## Low

### BUG-011: Hardcoded Strings in Components
- **Priority:** Low
- **Category:** i18n
- **Description:** Many components use hardcoded English/Romanian strings instead of i18n keys. Examples: Landing page, Extractor, Services, Credits, Intelligence pages.
- **Solution:** Move all user-facing strings to locale files

### BUG-012: Mixed Language in UI
- **Priority:** Low
- **Category:** i18n
- **Description:** Some UI elements are in Romanian ("Neuroni", "Servicii AI", "Artefact generat"), while most are English. Creates inconsistent user experience.
- **Solution:** Standardize to English with i18n system

### BUG-013: `StatCard` Component Not Exported
- **Priority:** Low
- **Category:** Code Quality
- **Description:** `StatCard` in `Home.tsx` is defined locally. Could be reused across Dashboard, Intelligence, Credits pages.
- **Solution:** Extract to shared component

### BUG-014: No Pagination on Entity Listings
- **Priority:** Low
- **Category:** Performance
- **Description:** `EntityListing` fetches up to 200 entities at once. With thousands of entities, this will cause performance issues.
- **Solution:** Implement cursor-based pagination

### BUG-015: Unused `useSearchParams` Import
- **Priority:** Low
- **Category:** Code Quality
- **Description:** `Credits.tsx` imports `useSearchParams` but doesn't use it (line 3).
- **Solution:** Remove unused import or implement topup success handling
