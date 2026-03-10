# Execution Prompts — AI-IDEI v1.0

Pre-built prompts for implementing each task from the registry.

---

## TASK-S01: Fix Edge Function Authentication

```
Fix the authentication for these edge functions: extract-neurons, chunk-transcript, 
extract-guests, generate-entities.

For each function:
1. Remove user_id from the request body parsing
2. Extract user from JWT: get the Authorization header, extract the Bearer token, 
   call supabase.auth.getUser(token), use the returned user.id
3. Return 401 if no valid user

Update supabase/config.toml to remove verify_jwt = false for these functions.

Do NOT modify functions that genuinely need public access (sitemap, changelog-ingest).
```

---

## TASK-S02: Fix Frontend Auth Headers

```
In these files, replace the anon key Authorization header with the user's session token:

1. src/pages/Extractor.tsx — handleChunkPreview (line ~427) and handleExtractNeurons (line ~459):
   Replace: Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
   With: Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`

2. src/hooks/useAIExtraction.ts — extract function (line ~62):
   Same replacement pattern.

Also remove user_id from the request body in these calls since the server will 
extract it from the JWT.
```

---

## TASK-P01: Add Database Indexes

```
Create a database migration that adds performance indexes:

CREATE INDEX IF NOT EXISTS idx_neurons_author_updated 
  ON neurons(author_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_entities_type_published 
  ON entities(entity_type) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_entities_slug_published 
  ON entities(slug) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_entity_relations_source 
  ON entity_relations(source_entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_relations_target 
  ON entity_relations(target_entity_id);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created 
  ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_neuron_jobs_author_created 
  ON neuron_jobs(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_episodes_author_created 
  ON episodes(author_id, created_at DESC);
```

---

## TASK-A02: Add React Error Boundaries

```
Create a reusable ErrorBoundary component at src/components/ErrorBoundary.tsx.

It should:
- Catch render errors in children
- Show a fallback UI with the error message and a "Reload" button
- Use the design system tokens (bg-destructive/10, text-destructive, etc.)
- Log errors to console

Then wrap each route's page component in App.tsx with this ErrorBoundary,
or wrap the main content area in AppLayout.
```

---

## TASK-A04: Standardize Data Fetching

```
Migrate these pages from useState+useEffect to TanStack Query (useQuery):

1. Home.tsx — loadData() → useQuery('home-stats', loadData)
2. Services.tsx — fetch services → useQuery('services', fetchServices)
3. Credits.tsx — loadData() → useQuery('credits', loadCredits)  
4. Intelligence.tsx — loadStats() → useQuery('intelligence-stats', loadStats)

Benefits: automatic caching, background refetch, loading/error states built-in,
no stale closures, deduplication of concurrent requests.
```

---

## TASK-F02: IdeaRank UI Layer

```
Build the IdeaRank UI layer using existing data from entities and idea_metrics tables.

1. Create a TrendingIdeasWidget component that:
   - Queries entities joined with idea_metrics
   - Shows top 10 entities by propagation_value_score
   - Displays emergence badge for is_emerging = true entities
   - Links to entity detail pages

2. Update EntityListing to support sorting by:
   - importance_score (default, current behavior)
   - idea_rank (IdeaRank score)
   - created_at (freshness)
   - evidence_count (evidence depth)

3. Add the TrendingIdeasWidget to the Home page cockpit.

Use existing design tokens. No new dependencies needed.
```

---

## TASK-F03: Knowledge Asset Schema

```
Create database tables for the Knowledge Asset marketplace:

1. knowledge_assets table:
   - id, entity_id (FK→entities), asset_type, title, description
   - idearank_score, demand_score, scarcity_factor
   - price_usd, price_neurons, licensing_model
   - creator_id, is_listed, created_at, updated_at

2. asset_transactions table:
   - id, asset_id (FK→knowledge_assets), buyer_id, seller_id
   - transaction_type (purchase/license), price_paid_usd, price_paid_neurons
   - created_at

3. asset_licenses table:
   - id, asset_id (FK→knowledge_assets), user_id
   - license_type (personal/commercial/enterprise)
   - expires_at, created_at

Add RLS policies:
- Listed assets readable by all authenticated users
- Creators can manage their own assets
- Buyers can read their own transactions and licenses
- Admins can manage all

Price formula: price = base_value × IdeaRank × demand × scarcity
```

---

## TASK-F05: Add SEO Meta Tags

```
Add a reusable SEO component using document.title and meta tag manipulation.

Create src/components/SEOHead.tsx that accepts:
- title (appended with " — AI-IDEI")
- description
- canonical URL
- og:image (optional)

Use it in:
- Landing: "AI-IDEI — Knowledge Extraction Operating System"
- EntityListing: "{Type} — AI-IDEI Intelligence Assets"
- EntityDetail: "{entity.title} — AI-IDEI {type}"
- TopicDetail: "{topic.title} — AI-IDEI Topics"

Since this is a SPA without SSR, use useEffect to set document.title 
and create/update meta tags dynamically.
```

---

## TASK-F06: Implement Topup Success Handling

```
In Credits.tsx:
1. Read URL params: topup, neurons, session_id using useSearchParams
2. On mount, if topup=success and session_id exists:
   - Call verify-topup edge function with session_id
   - Show success toast with neurons count
   - Reload credit data
   - Clear URL params
3. If topup=cancelled:
   - Show info toast
   - Clear URL params
```
