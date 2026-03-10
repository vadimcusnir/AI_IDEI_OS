# SYSTEM_MAP.md — AI-IDEI Knowledge OS

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│  Routes → Components → Hooks → Supabase Client          │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Public      │  Protected (JWT Required)                │
│  ─────────   │  ──────────────────────                  │
│  /           │  /home (Cockpit)                          │
│  /auth       │  /neurons, /n/:number                    │
│  /links      │  /extractor, /services                   │
│  /architecture│ /run/:serviceKey, /jobs                  │
│  /docs       │  /credits, /library, /library/:id        │
│  /changelog  │  /intelligence, /dashboard               │
│  /insights/* │  /prompt-forge, /profile-extractor       │
│  /patterns/* │  /profile, /notifications, /feedback     │
│  /formulas/* │  /guests, /onboarding, /batch/:neuronId  │
│  /topics/*   │                                          │
│  /u/:username│  Admin Only                              │
│  /guest/:slug│  ──────────                              │
│  /media/...  │  /admin                                  │
└──────────────┴──────────────────────────────────────────┘
```

## Edge Functions (14 total)

| Function | Auth | Rate Limit | Purpose |
|---|---|---|---|
| `extract-neurons` | JWT (getUser) | 10/hr | Episode → AI → Neurons |
| `run-service` | JWT (getUser) | 20/hr | Service execution + credits |
| `transcribe-audio` | JWT (getUser) | 5/hr | ElevenLabs STT |
| `chunk-transcript` | JWT (getUser) | — | Semantic chunking |
| `extract-guests` | JWT (getUser) | — | Guest profile detection |
| `extract-insights` | JWT (getUser) | — | AI analysis tools |
| `neuron-chat` | JWT (getUser) | — | Contextual AI chat |
| `neuron-api` | JWT (getUser) | — | REST CRUD API |
| `generate-entities` | JWT + Admin | — | Knowledge graph projection |
| `changelog-generate` | JWT + Admin | — | AI changelog writer |
| `changelog-ingest` | JWT + Admin | — | Raw change ingestion |
| `create-topup-checkout` | JWT | — | Stripe checkout |
| `verify-topup` | JWT | — | Stripe verification |
| `sitemap` | Public | — | Dynamic XML sitemaps |

## Database Tables (30+)

### Core Domain
- `episodes` — Raw content (audio/video/text)
- `neurons` — Atomic knowledge units
- `neuron_blocks` — Block content within neurons
- `neuron_links` — Inter-neuron relations
- `neuron_versions` — Version snapshots
- `neuron_jobs` — AI processing jobs
- `neuron_clones` — Fork/clone lineage
- `neuron_addresses` — Hierarchical addressing
- `neuron_templates` — Reusable templates

### Knowledge Graph
- `entities` — Published knowledge entities
- `entity_relations` — Graph edges with weights
- `entity_content` — Multilingual content
- `entity_labels` — Multilingual labels
- `entity_topics` — Topic associations
- `topics` / `topic_labels` — Topic hierarchy
- `idea_metrics` — IdeaRank scores
- `idea_rank_experiments` / `predictions`

### Products & Services
- `artifacts` / `artifact_neurons` — Generated deliverables
- `service_catalog` — Available AI services
- `block_type_registry` — Block type definitions

### Economy
- `user_credits` — Balance tracking
- `credit_transactions` — Audit log

### Users
- `profiles` — User profiles
- `user_roles` — RBAC (admin/moderator/user)
- `guest_profiles` — Extracted guest profiles
- `user_links` — Public link pages

### Platform
- `notifications` / `notification_preferences`
- `push_subscriptions` / `push_config`
- `feedback` — User feedback
- `changelog_entries` / `changes_raw`

## AI Pipelines

### Pipeline 1: Content Ingestion
```
Upload → Episode → Transcribe (ElevenLabs) → Chunk (200-800 tokens) → Extract Neurons (Gemini) → Store
```

### Pipeline 2: Service Execution
```
Select Service → Create Job → Reserve Credits → AI Generate (SSE) → Audit → Create Artifact → Debit Credits
```

### Pipeline 3: Knowledge Graph
```
Neurons → Generate Entities → Detect Families → Build Relations → Compute IdeaRank → Serve SEO Pages
```

## Security Model
- JWT auth on all edge functions (except sitemap)
- Admin role check via `has_role()` security definer function
- RLS policies on all tables
- Rate limiting on compute-intensive operations
- Input validation with length limits
- user_id always derived from JWT, never from request body
