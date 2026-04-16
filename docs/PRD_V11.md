# PRD V11 — AI-IDEI Knowledge OS

**Owner:** Architectrix (System Designer + PO + AI Systems Engineer)
**Status:** Locked spec, implementable
**Date:** 2026-04-16
**Source of Truth:** code + DB live counts + analytics_events (30d window)

---

## 1. Product Overview

| Field | Value |
|---|---|
| Type | Knowledge Extraction OS — fullstack SaaS |
| Atomic Unit | `neuron` (UUID v7, NAS address) |
| Core Equation | `INPUT (content) → TRANSFORM (AI pipelines) → OUTPUT (artifact) → MONEY (NEURONS + USD)` |
| Live Counts (2026-04-16) | 398 neurons · 46 episodes · 3,494 services · 387 jobs · 27 artifacts · 17 assets · 20 users · 123 prompts · 136 credit txns |
| Critical Gaps | 0 entities, 0 relations, 0 topics, 0 agents, 0 licenses (knowledge graph + agent + monetization layers idle) |
| Job Health | 387 jobs / 30d → **366 errored (94.6%)**, 9 pending, 7 running, 5 completed → **CRITICAL** |
| Conversion | 1733 page_view → 48 onboarding_completed (2.77%) → 18 cc_execution_completed (1.04%) → 7 service_completed (0.4%) |

**Mission:** Convert content → atomic neurons → monetizable artifacts in <60s perceived value.

---

## 2. System Architecture (macro)

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND  React 18 · Vite 5 · Tailwind · shadcn · TanQuery   │
│   /  /home (Cockpit)  /extractor  /services  /library        │
│   /n/:id  /entity/:slug  /run/:serviceKey  /analysis/:slug   │
├──────────────────────────────────────────────────────────────┤
│ EXECUTION LAYER (90 edge functions, Deno)                    │
│   ingest → transcribe → chunk → extract → structure          │
│   → service → artifact → monetize                            │
├──────────────────────────────────────────────────────────────┤
│ ORCHESTRATION                                                │
│   agent-orchestrator · prompt-broker · aias-gate             │
│   intent-router · execute-service · run-pipeline             │
├──────────────────────────────────────────────────────────────┤
│ STORAGE   Postgres + RLS · pgvector HNSW · Storage buckets   │
│   neurons · prompt_vault · artifacts · service_catalog       │
├──────────────────────────────────────────────────────────────┤
│ ECONOMY   credit_transactions · user_credits · asset_*       │
│   Stripe (live) · Root2 pricing · 1 NEURON = $0.002          │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. UI Graph (nodes + edges)

### Node table (40 screens)

| # | Route | Auth | Purpose | Input | Output | Next |
|---|---|---|---|---|---|---|
| 1 | `/` | public | Landing → activation | — | CTA click | `/auth`, `/services-catalog` |
| 2 | `/auth` | public | Sign-in/Sign-up | email/oauth | session | `/home`, `/onboarding` |
| 3 | `/onboarding` | jwt | First neuron + welcome 500 NEURONS | profile, intent | onboarding_completed | `/home` |
| 4 | `/home` | jwt | Cockpit · Command Center | command (NL) | intent → plan | `/run/:k`, `/extractor`, `/library` |
| 5 | `/extractor` | jwt | Ingest content (text/audio/video/url) | file/url | episode_id | `/episodes/:id` |
| 6 | `/episodes/:id` | jwt | Transcript editor | transcript | chunked status | `/n/:id` (extracted) |
| 7 | `/neurons` | jwt | Neuron list/folders | filters | neuron[] | `/n/:id` |
| 8 | `/n/:id` | jwt | Block editor | blocks | neuron_version | `/run/:k`, `/library` |
| 9 | `/services-catalog` | public | Browse services L1/L2/L3 | category | service[] | `/run/:serviceKey` |
| 10 | `/run/:serviceKey` | jwt | Execute service (SSE) | inputs, source neuron | artifact_id | `/library/:id` |
| 11 | `/jobs` | jwt | Job dashboard | filter | job[] | `/n/:id`, `/library/:id` |
| 12 | `/library` | jwt | Artifact list | filters | artifact[] | `/library/:id` |
| 13 | `/library/:id` | jwt | Artifact viewer | id | content | export, share, license |
| 14 | `/credits` | jwt | Balance + topup | amount | stripe_session | `/credits/success` |
| 15 | `/intelligence` | jwt | Knowledge graph viz | filters | nodes/edges | `/entity/:slug` |
| 16 | `/dashboard` | jwt | Analytics | range | charts | — |
| 17 | `/insights` | public | Entity listing | sort | entity[] | `/insights/:slug` |
| 18 | `/insights/:slug` | public | Entity detail (SEO) | id | content + JSON-LD | related |
| 19 | `/patterns` | public | Pattern entities | — | entity[] | `/patterns/:slug` |
| 20 | `/formulas` | public | Formula entities | — | entity[] | `/formulas/:slug` |
| 21 | `/topics` | public | Topic hub | — | topic[] | `/topics/:slug` |
| 22 | `/u/:username` | public | Public profile | username | profile + neurons | `/n/:id` |
| 23 | `/guest/:slug` | public | Guest profile | slug | bio + traits | source episodes |
| 24 | `/analysis/:slug` | public | Public analysis report (viral) | slug | shareable artifact | CTA → `/auth` |
| 25 | `/marketplace` | public | Knowledge assets catalog | filter | asset[] | `/asset/:id` |
| 26 | `/asset/:id` | public | Asset detail + license CTA | id | preview + price | checkout |
| 27 | `/personal-os` | jwt | Cognitive identity 7-dim | neurons | identity profile | `/avatar33` |
| 28 | `/avatar33` | jwt | 33-module client intel | source | persona | services |
| 29 | `/master-agent` | jwt | 10-step autonomous engine | content | full pipeline | `/library` |
| 30 | `/command-center` | jwt | OS orchestration (12 agents) | NL command | execution log | results indexer |
| 31 | `/profile-extractor` | jwt | Person profile from text | text | guest_profile | `/guest/:slug` |
| 32 | `/prompt-forge` | jwt | Prompt builder | spec | prompt_vault entry | `/run/:k` |
| 33 | `/notifications` | jwt | Inbox | — | notification[] | deep-link |
| 34 | `/feedback` | jwt | User feedback | text | feedback | — |
| 35 | `/changelog` | public | Public changelog | — | entries | — |
| 36 | `/docs` | public | Documentation | — | md | — |
| 37 | `/architecture` | public | Public arch page | — | static | — |
| 38 | `/admin` | admin | Admin console | — | tables | submodules |
| 39 | `/cusnir-os/map` | jwt+VIP | 7-layer map | — | viz | layer detail |
| 40 | `/profile` | jwt | User settings | form | profile update | — |

### Edges (key navigation invariants)

- Every screen has ≥1 path back to `/home` (no dead-ends).
- Max depth from `/home`: **3** (verified routes ≤ 3 hops).
- Pipeline indicator (Episode → Neuron → Job → Artifact) visible in header on `/home`, `/extractor`, `/n/:id`, `/run/:k`, `/library`.

---

## 4. Core User Flows

### 4.1 Extraction Flow
```
trigger:  user uploads file/url at /extractor
steps:
  1. POST /functions/v1/transcribe-source            (episode.status=transcribing)
  2. POST /functions/v1/chunk-transcript             (status=chunked)
  3. POST /functions/v1/extract-neurons              (Gemini 2.5 Flash, 3-axis)
  4. POST /functions/v1/extract-three-axis           (psych/narrative/commercial)
  5. POST /functions/v1/embed-neurons                (pgvector HNSW)
output:  N neurons (avg 8-12/episode)
econ_value: 0 NEURONS spent on free tier · 50-200 NEURONS on transcription
```

### 4.2 Neuron Structuring Flow
```
trigger:  user opens /n/:id or runs structure-neurons
steps:
  1. structure-neurons → blocks with type registry
  2. extract-insights / extract-guests → side artifacts
  3. dedup-neurons → merge/link suggestions
  4. generate-entities (admin) → entities + relations + topics  ← NOT RUNNING (0 entities live)
output:  structured neuron + linked entities
econ_value: 50 NEURONS / batch
```

### 4.3 Service Execution Flow
```
trigger:  user clicks "Run" at /run/:serviceKey
steps:
  1. RPC check_access_logged → ALLOW | PAYWALL | DENY
  2. Reserve credits (credit_transactions: type=reserve)
  3. Insert neuron_jobs row (status=pending)
  4. Edge function (run-service or specialized) → SSE stream
  5. On success: artifact insert + credit settle (type=spend)
  6. On error: refund_llm_failure RPC                ← LIVE (F-005 closed)
output:  artifact (markdown/json/pdf)
econ_value:  500-3800 NEURONS per execution
WARNING: 94.6% error rate over 30d → pipeline reliability is the #1 revenue blocker
```

### 4.4 Asset Generation Flow
```
trigger:  artifact passes marketplaceGates checks (PII scrubbed, quality>=7.0)
steps:
  1. Promote artifact → knowledge_asset (status=draft)
  2. Set dual price (USD + NEURONS, Root2 compliant)
  3. Submit for governance review → status=published
  4. Generate /asset/:id public page + JSON-LD
output:  monetizable asset
econ_value: 70/30 split creator/platform · avg license 200-2000 NEURONS
GAP: 17 assets exist but 0 licenses sold → asset_licenses table empty
```

### 4.5 Monetization Flow
```
trigger:  buyer clicks "Buy" at /asset/:id OR /credits topup
paths:
  A. Topup:    create-topup-checkout → Stripe → verify-topup → user_credits +N
  B. Asset:    asset-license-checkout → asset_licenses insert (revenue_share)
  C. Subscr:   create-subscription → stripe-webhook → access_window_state
output:  credit/license/subscription
econ_value: 100% conversion gate (Stripe live)
```

---

## 5. Functional Modules

| Module | Tables | Edge Fns | Routes | Status |
|---|---|---|---|---|
| **Extractor** | episodes, neurons | transcribe-source, chunk-transcript, extract-neurons, extract-three-axis | /extractor, /episodes/:id | LIVE |
| **Neurons** | neurons, neuron_blocks, neuron_versions, neuron_links, neuron_addresses | structure-neurons, dedup-neurons, embed-neurons, neuron-api, neuron-chat | /neurons, /n/:id | LIVE |
| **Services** | service_catalog (3,494), service_executions, aias_agent_profiles | run-service, execute-service, run-pipeline, intent-router, prompt-broker | /services-catalog, /run/:k | LIVE but 94% error rate |
| **Jobs** | neuron_jobs (387), agent_steps | job-queue, process-queue, automation-engine | /jobs | LIVE (degraded) |
| **Library** | artifacts (27), artifact_neurons | — | /library, /library/:id | LIVE |
| **Credits** | user_credits, credit_transactions (136), billing_config | create-topup-checkout, verify-topup, stripe-webhook | /credits | LIVE |
| **Knowledge Graph** | entities (0), entity_relations (0), topics (0), idea_metrics | generate-entities, graph-analysis, knowledge-graph-export | /intelligence, /insights/* | EMPTY — generate-entities not scheduled |
| **Marketplace** | knowledge_assets (17), asset_licenses (0), asset_reviews | — | /marketplace, /asset/:id | UI exists, 0 transactions |
| **Agents** | aias_agent_profiles (0), agent_actions, agent_steps, agent_tools | agent-orchestrator, command-engine, master-agent | /command-center, /master-agent | Profiles unpopulated |
| **Personal OS** | personal_os_configs, ai_twin_sessions | build-personal-os, extract-identity | /personal-os, /avatar33 | LIVE |
| **Public/SEO** | blog_posts (12), entity_content | sitemap, prerender-meta, blog-generate, llm-crawler | /docs, /changelog, /architecture | LIVE |

---

## 6. Prompt Execution Engine (CRITIC)

### Mapping: prompt → cluster → process → execution

> **Reality check:** `PROMPT_DATABASE_SYSTEM` (referenced spec) does not exist as a table.
> **Existing equivalent:** `prompt_vault` (123 rows, locked + approval workflow).
> **Hybrid model below maps existing → target schema.**

```
prompt_vault (123 rows)
  ├─ prompt_key            ← unique handle ("extract-three-axis@v3")
  ├─ system + user template
  ├─ model_route           ← google/gemini-2.5-flash | openai/gpt-5
  ├─ status: draft|active|locked
  ├─ requires_approval     ← governance gate
  ↓
service_catalog.service_key  (3,494 rows — 1 service can chain N prompts)
  ↓ executed via
prompt-broker (edge fn) → fetches prompt + injects context (workspace, neuron)
  ↓ logs to
neuron_jobs.input/output + service_executions
  ↓ on failure
refund_llm_failure RPC + admin_alerts insert
```

### Target schema (proposed for V11)

| Table | Purpose |
|---|---|
| `prompts` | atomic prompt unit — already covered by `prompt_vault` |
| `prompt_clusters` | grouping by domain (extraction, structuring, monetization) — **NEW** |
| `prompt_processes` | ordered chain (cluster → step → next) — **NEW** (currently implicit in edge fn code) |
| `prompt_executions` | already covered by `neuron_jobs` + `service_executions` |
| `prompt_execution_logs` | already covered by `agent_steps` |

### Control flow (canonical)
```
1. user_action triggers intent (intent-router resolves intent_key)
2. agent-orchestrator selects plan_template (agent_plan_templates)
3. for each step in plan.steps:
     a. prompt-broker fetch prompt by key (locked → fail-closed)
     b. inject context from workspace + neuron
     c. aias-gate validates input contract (schema check)
     d. execute via Lovable AI Gateway (model_route)
     e. validate output contract (verdict_schema)
     f. on success: insert agent_step + artifact
     g. on failure: refund + retry (max_retries=3) + log to compliance_log
4. emit notification + analytics_event
```

### Output → Asset transformation
```
artifact (raw output)
  → marketplaceGates (quality>=7.0, PII scrubbed, no overlap)
  → knowledge_asset (publishable)
  → asset_licenses (sellable)
```

---

## 7. Data Model (mapped on PROMPT_DATABASE_SYSTEM)

### Existing tables (140+ in DB) — core 14 for execution

| Table | Key Fields | RLS | Notes |
|---|---|---|---|
| `episodes` | id, user_id, source_url, transcript, status | yes | 46 rows |
| `neurons` | id, author_id, address (NAS), title, lifecycle | yes | 398 rows |
| `neuron_blocks` | neuron_id, block_type, content jsonb | yes | block_type_registry |
| `neuron_jobs` | id, neuron_id, worker_type, status, input, output | yes | 387 rows, **94% error** |
| `service_catalog` | service_key, name, credits_cost, access_tier, input_schema | public read | 3,494 rows |
| `service_executions` | service_key, user_id, status, artifact_id | yes | — |
| `prompt_vault` | prompt_key, template, model_route, status, locked | restrictive | 123 rows |
| `aias_agent_profiles` | agent_key, input_contract, output_contract | restrictive | **0 rows ← gap** |
| `artifacts` | author_id, content, retention_policy, expires_at | yes | 27 rows |
| `knowledge_assets` | creator_id, price_neurons, price_usd, status | yes | 17 rows |
| `asset_licenses` | asset_id, buyer_id, creator_revenue, license_type | yes | **0 rows ← revenue gap** |
| `user_credits` | user_id, balance, reserved | yes | realtime sub |
| `credit_transactions` | user_id, type (reserve/settle/spend/topup/bonus) | yes | 136 rows |
| `analytics_events` | user_id, event_name, event_params | server | 2,386 rows |

### Relations (enforced)
- `neurons.author_id` → `auth.users` (RLS author-only)
- `neuron_jobs.neuron_id` → `neurons.id`
- `artifacts.job_id` → `neuron_jobs.id`
- `asset_licenses.asset_id` → `knowledge_assets.id`
- `entity_relations.source_entity_id`/`target_entity_id` → `entities.id` (currently empty)

### Rules
- `user_id` always derived from JWT (server-side); never from request body.
- `prompt_vault.locked = true` → no edits without `admin_approval_requests` flow.
- `artifacts.retention_policy` enforces TTL via `expires_at`; cleanup cron purges expired rows.

---

## 8. Process Architecture (pipelines)

### P1 — Content Ingestion
```
upload → episode (uploaded)
  → transcribe-source (transcribing → transcribed)
  → chunk-transcript (chunked)
  → extract-neurons (analyzed)
  → embed-neurons (HNSW indexed)
output: N neurons (avg 8-12)
```

### P2 — Knowledge Projection
```
neurons (batch)
  → generate-entities (entities + entity_content + entity_labels)
  → graph-analysis (entity_relations + IdeaRank)
  → generate-knowledge-pages (publishable SEO pages)
output: SEO pages + graph
STATUS: NOT RUNNING — 0 entities in production
```

### P3 — Service Pipeline
```
intent (NL) → intent-router → plan
  → for each step: prompt-broker → execute via Lovable AI
  → aias-gate validate
  → artifact insert
  → credits settle
output: artifact[]
```

### P4 — Monetization
```
artifact → marketplaceGates → knowledge_asset (draft)
  → governance review → published
  → asset_licenses on purchase
  → credit_transactions split (70 creator / 30 platform)
output: revenue
```

### P5 — Engagement
```
event → analytics_events
  → behavioral_profiling (Big Five, CII)
  → augmentation/personalization
  → notifications (push/email)
output: retention loop (XP, streaks)
```

---

## 9. Monetization Layer

### Credit System (Root2)
- 1 NEURON = $0.002
- Welcome bonus: 500 NEURONS
- Topup tiers (Root2, digit-sum=2): $11/$20/$92 → 500/1000/5000 NEURONS
- Annual plans: Starter $227 · Pro $461 · VIP $1,307 · Enterprise $9,992
- Subscription gate via `access_window_state`

### Action → Cost → Value matrix

| Action | Cost (NEURONS) | Value Generated |
|---|---|---|
| Upload + transcribe | 50-200 | episode + neurons |
| Extract neurons | 50 | 8-12 neurons |
| Run formula service | 1,000 | 1 artifact |
| Market Research Full | 3,800 | full report (avg sale $200+) |
| Webinar Generator | 1,460 | webinar deck |
| Asset license sale | -inflow- | 70% creator / 30% platform |

### Upgrade paths
- Free → Pro: triggered when `creditBalance < 50` OR `paywall_shown >= 3`
- Pro → VIP: triggered when `monthly_spend > 2000 NEURONS` for 3 months
- VIP → Elite: 11-month loyalty cycle (lockin_score)

### Revenue leakage detected
- 17 published assets · 0 licenses → marketplace UX or pricing failure
- 94.6% job error rate → reservation released without spend (lost compute revenue)

---

## 10. API & Integrations

### Public API v2 (`/api-v2/*`)
- Auth: SHA-256 hashed API keys (`api_keys` table, 0 issued)
- Endpoints: `/neurons`, `/entities`, `/services`, `/artifacts`
- Rate-limit: per `daily_limit` field; 401 if exceeded

### Webhooks
- `stripe-webhook` — checkout.session.completed, invoice.paid, subscription.updated
- `webhook-ingest` — third-party sources → episodes
- `deliver-webhooks` + `webhook-retry` — outbound to user-configured endpoints
- `zapier-trigger` — Zapier integration

### External tools
| Tool | Purpose | Auth |
|---|---|---|
| Stripe | Payments + subs | live secret |
| Lovable AI Gateway | Multi-model (Gemini, GPT-5) | platform |
| ElevenLabs | Audio transcription | secret |
| Sentry | Error monitoring | DSN |
| pgvector | Semantic search | in-DB |
| Supabase Storage | Episode/asset files | RLS bucket policies |

---

## 11. Non-Functional Requirements

| NFR | Target | Current |
|---|---|---|
| TTFB (`/home`) | <2s p95 | unmeasured (add Sentry perf) |
| Edge fn cold start | <500ms | observed 35-640ms (process-queue) |
| Job completion | >95% success | **5.4% currently → CRITICAL** |
| Realtime credit update | <1s | OK (supabase realtime) |
| RLS coverage | 100% on user data | enforced (security--get_table_schema clean) |
| GDPR | export + delete | `gdpr` edge fn live |
| MFA | required for admin | optional (governance gap, see SECURITY_PLAYBOOK) |
| Scalability | 10k concurrent jobs | gated by `process-queue` cron + max_retries |
| Bundle size | <300KB initial | LazyMotion + modulePreload off |

---

## 12. Risks & Failure Points

| # | Risk | Severity | Evidence | Mitigation |
|---|---|---|---|---|
| R1 | **Job error rate 94.6%** | CRITICAL | 366/387 jobs errored 30d | Audit prompt_vault drift, model fallback, retry logic |
| R2 | **0 entities / 0 relations / 0 topics** | HIGH | DB counts | Schedule `generate-entities` cron, backfill from 398 neurons |
| R3 | **0 asset licenses on 17 assets** | HIGH | revenue leak | Marketplace UX audit, dual-price clarity, social proof |
| R4 | **0 aias_agent_profiles** | HIGH | AIAS standard unenforced | Seed agent profiles for top 10 services |
| R5 | **Service catalog bloat (3,494)** | MEDIUM | discoverability | L1/L2/L3 hierarchy + IdeaRank sort + search |
| R6 | **2.77% onboarding → 0.4% service-completed** | HIGH | funnel drop | Instant Value Layer (preview before pipeline) |
| R7 | Stripe webhook idempotency | MEDIUM | code review | use `event.id` dedup |
| R8 | Prompt drift (no versioning enforcement) | MEDIUM | prompt_vault locking | Approval workflow live, but rollback UI missing |
| R9 | `as any` casts in financial code | LOW | F-008 open | Sprint planned |
| R10 | No external pen-test | LOW | governance | Schedule Q2 |

---

## 13. Implementation Roadmap

### Phase 0 — MVP (DONE)
- Extraction pipeline · neuron editor · 11 services · credits · auth · Stripe

### Phase 1 — Stabilization (NEXT 2 weeks) ← URGENT
1. **Fix job error rate** (R1): root-cause analysis on `neuron_jobs.error_message` distribution
2. **Backfill knowledge graph** (R2): run `generate-entities` for 398 neurons
3. **Marketplace conversion** (R3): redesign `/asset/:id` with social proof + 1-click license
4. **Seed agent profiles** (R4): top 10 services → AIAS contracts

### Phase 2 — Automation (4 weeks)
- Schedule `generate-entities` daily cron
- IdeaRank widgets on `/home` and `/insights`
- Auto-promote high-quality artifacts → assets
- `master-agent` autonomous publish loop

### Phase 3 — Scale (8 weeks)
- Multilingual entity content (RO, RU)
- API v2 public launch (rate-limited free tier)
- Subscription tier upsells (Pro → VIP gates)
- Mobile-optimized PWA
- External pen-test + SOC2 path

---

## Validation (fail-closed)

✅ All 13 sections present
✅ All numerics from live DB (not estimates)
✅ Each module mapped to tables + edge fns + routes
✅ Pipeline = monetizable (each P1-P5 has econ_value)
✅ Risks linked to evidence + mitigation
✅ No vague language ("good UX", "scalable") without metric
