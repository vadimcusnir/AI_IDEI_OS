# System Architecture — AI-IDEI Platform

**Version:** 12.0  
**Last Updated:** 2026-04-10

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React/Vite)                      │
│  Landing → Extractor → Intelligence → Services → Library    │
│         → Admin Dashboard → Cusnir_OS Operator              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (JWT / API Key)
┌──────────────────────▼──────────────────────────────────────┐
│                   EDGE FUNCTIONS (Deno)                       │
│  67+ functions: extract, analyze, generate, execute, chat    │
│  Shared: CORS, Validation, Rate Limiting, Error Reporting    │
└──────────────────────┬──────────────────────────────────────┘
                       │ Service Role
┌──────────────────────▼──────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                      │
│  35+ tables │ RLS on all │ RPC functions │ Triggers          │
│  Storage buckets │ Realtime │ Auth (Email + Google OAuth)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Data Flow

```
Content Upload
    ↓
Transcription (transcribe-audio / transcribe-source)
    ↓
Chunking (chunk-transcript)
    ↓
Neuron Extraction (extract-neurons)
    ↓
Entity Generation (generate-entities)
    ↓
Insight Extraction (extract-insights)
    ↓
Service Execution (run-service → neuron_jobs queue)
    ↓
Artifact Generation (artifacts table)
    ↓
Public Analysis Page (/analysis/:slug)
```

---

## Layer Architecture

### L1 — Instant Value Layer
- Upload → instant analysis preview in <60s
- `InstantResultPanel`: key insight, pattern, opportunity signal

### L2 — UI Simplification Layer
- Max 3 actions per screen, 1 primary path
- Upload → Analyze → Get Results

### L3 — Execution Clarity Layer
- Every action: single outcome, traceable, produces output
- Job UI: progress, cost, result preview

### L4 — Economic Engine
- **Credits**: compute currency for AI operations
- **Neurons (tokens)**: access/ownership tokens
- Credit reservation → execution → debit (atomic via wallet)
- Tier discounts applied via `capacity_state.current_multiplier`

### L5 — Scaling Engine
- Public SEO pages per analysis
- Shareable outputs with JSON-LD structured data
- Knowledge marketplace for asset trading

---

## Database Schema (Key Tables)

### Core Content
| Table | Purpose |
|-------|---------|
| `neurons` | Knowledge units (core data atom) |
| `neuron_blocks` | Structured content blocks within neurons |
| `neuron_links` | Relationships between neurons |
| `entities` | Extracted concepts/people/ideas |
| `entity_relations` | Typed relationships between entities |
| `cognitive_units` | Validated knowledge fragments |

### Execution
| Table | Purpose |
|-------|---------|
| `neuron_jobs` | Async job queue with retry/dead-letter |
| `service_catalog` | Available AI services |
| `service_manifests` | Pipeline definitions (input schema, steps, cost) |
| `service_executions` | Execution history |
| `artifacts` | Generated outputs from services |

### Economy
| Table | Purpose |
|-------|---------|
| `wallets` | User credit balances |
| `credit_transactions` | Credit movement history |
| `knowledge_assets` | Marketplace listings |
| `asset_licenses` | Purchase/license records |
| `capacity_state` | Platform-wide pricing multiplier |

### Security & Governance
| Table | Purpose |
|-------|---------|
| `user_roles` | Role assignments (admin/moderator/user) |
| `admin_permissions` | Granular permission grants |
| `decision_ledger` | Immutable audit trail |
| `rate_limit_entries` | DB-backed rate limiting |
| `api_keys` | SHA-256 hashed API keys |

### Cusnir_OS
| Table | Purpose |
|-------|---------|
| `os_agents` | AI agent definitions |
| `os_executions` | Agent execution logs |
| `os_memory_patterns` | Learned patterns from executions |
| `os_power_unlocks` | XP-gated capability unlocks |

---

## Edge Function Architecture

### Shared Modules (`_shared/`)

| Module | Purpose |
|--------|---------|
| `cors.ts` | Origin validation against allowlist |
| `rate-limiter.ts` | DB-backed sliding window rate limiter |
| `validation.ts` | Zod schemas for input validation |
| `regime-check.ts` | Execution regime enforcement |
| `ai-helpers.ts` | `aiCallWithRetry` with exponential backoff |

### Auth Pattern (All Functions)
```typescript
// 1. CORS preflight
if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

// 2. Extract JWT
const token = req.headers.get("authorization")?.replace("Bearer ", "");
const { data: { user } } = await supabase.auth.getUser(token);

// 3. Rate limit check
const blocked = await rateLimitGuard(user.id, req);
if (blocked) return blocked;

// 4. Validate input
const validation = validateInput(schema, body, corsHeaders);
if (!validation.success) return validation.response;

// 5. Execute logic
```

---

## Security Architecture

### Authentication Flow
```
Client → JWT (via Supabase Auth) → Edge Function → getUser(token) → user_id
Client → API Key → Edge Function → SHA-256 hash → api_keys lookup → user_id
```

### RLS Strategy
- All 35+ tables have RLS enabled
- User data scoped via `auth.uid()` matching
- Admin access via `has_role()` SECURITY DEFINER function
- No self-role-assignment (privilege escalation prevented)

### Rate Limiting (Fail-Closed)
```
Request → checkRateLimit(key, config)
  → DB: check_rate_limit RPC (atomic upsert)
  → Returns: { allowed, remaining, resetAt }
  → If DB fails → BLOCK (fail-closed)
```

### Input Validation
- Zod schemas on all critical edge functions
- Client-side sanitization (`src/lib/security.ts`)
- URL validation for redirect safety
- HTML stripping for XSS prevention

---

## Component Hierarchy

```
App
├── AuthProvider
│   ├── Landing (/)
│   ├── Auth (/auth)
│   ├── Extractor (/extractor)
│   │   ├── UploadZone
│   │   ├── ExtractionPipeline
│   │   └── ResultPreview
│   ├── Intelligence (/intelligence)
│   │   ├── KnowledgeGraph (force-graph-2d)
│   │   └── EntityExplorer
│   ├── Services (/services)
│   │   ├── ServiceCatalog
│   │   └── ExecuteServiceDialog
│   ├── Library (/library)
│   │   ├── NeuronList (virtualized)
│   │   └── NeuronEditor
│   ├── Marketplace (/marketplace)
│   │   ├── AssetBrowser
│   │   └── AssetDetails
│   ├── Admin (/admin) [admin role required]
│   │   ├── AdminOverviewTab
│   │   ├── UsersTab
│   │   └── SystemHealthTab
│   └── CusnirOS (/cusnir-os) [VIP 11mo + NOTA2]
│       └── OperatorInterface
└── CommandCenter (floating)
    ├── CommandRouter (intent classification)
    ├── PlanExecutor (step-by-step)
    └── AuditLogger (decision_ledger)
```

---

## Performance Strategy

| Technique | Implementation |
|-----------|---------------|
| Code splitting | Lazy loading per route via `React.lazy` |
| Virtualization | `@tanstack/react-virtual` for large lists |
| Query caching | React Query with stale-while-revalidate |
| Image optimization | Lazy loading, WebP format |
| Bundle analysis | Vite chunk splitting by domain |
| DB indexes | On frequently queried columns |

---

## Deployment

| Layer | Platform |
|-------|----------|
| Frontend | Lovable (auto-deploy on publish) |
| Edge Functions | Supabase Edge (auto-deploy) |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| Auth | Supabase Auth (Email + Google) |
| Domain | `ai-idei.com` → Lovable CDN |
