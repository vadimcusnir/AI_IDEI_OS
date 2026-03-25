# PRD: AI-IDEI Knowledge Extraction Operating System
## Product Requirements Document

**Versiune:** 2.0
**Data:** 25 Martie 2026
**Status:** Production - Active Development
**Owner:** Product Architecture Team

---

## 1. VIZIUNEA PRODUSULUI

### 1.1 Declaratie de Viziune

**AI-IDEI transforma expertiza bruta in active de cunoastere comercializabile.**

Platforma rezolva problema fundamentala a creatorilor de continut si expertilor: au idei valoroase captate in formate diverse (podcast-uri, interviuri, note, drafturi), dar le lipseste capacitatea de a le transforma sistematic in livrabile de marketing profesionale.

### 1.2 Propunere de Valoare Unica

> "Un podcast -> 50+ livrabile profesionale"

AI-IDEI nu este inca un tool de scriere AI. Este un **Operating System pentru Cunoastere** care:
1. **Extrage** cunostinte atomice (neuroni) din continut brut
2. **Structureaza** intr-un Knowledge Graph cu relatii semantice
3. **Multiplica** prin servicii AI specializate
4. **Monetizeaza** prin marketplace si livrabile comerciale

### 1.3 Pozitionare in Piata

| Competitor | Focus | AI-IDEI Diferentiator |
|------------|-------|----------------------|
| ChatGPT | Chat general | Pipeline structurat, output specializat |
| Notion AI | Note-taking | Extraction engine, Knowledge Graph |
| Jasper | Marketing copy | Multi-format output, reusability |
| Otter.ai | Transcription | Post-transcription intelligence layer |

---

## 2. ARHITECTURA SISTEMULUI

### 2.1 Diagrama Arhitecturala

```
+------------------------------------------------------------------+
|                         CLIENT LAYER                              |
|  +------------------------------------------------------------+  |
|  |  Landing   |  Auth   |  Command Center  |  Admin Dashboard  |  |
|  +------------------------------------------------------------+  |
|  |         React 19 + TypeScript + Vite 8 + Tailwind          |  |
|  |         shadcn/ui + Radix + Framer Motion                  |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                                |
                    [TanStack Query + Realtime]
                                |
+------------------------------------------------------------------+
|                         API LAYER                                 |
|  +------------------------------------------------------------+  |
|  |  65 Edge Functions (Deno Runtime)                          |  |
|  |  +----------------+  +----------------+  +---------------+ |  |
|  |  | AI Pipeline    |  | Payment Flow   |  | Communication | |  |
|  |  | - extract      |  | - stripe       |  | - email       | |  |
|  |  | - generate     |  | - subscription |  | - push        | |  |
|  |  | - analyze      |  | - credits      |  | - webhooks    | |  |
|  |  +----------------+  +----------------+  +---------------+ |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                                |
                     [Supabase Client SDK]
                                |
+------------------------------------------------------------------+
|                         DATA LAYER                                |
|  +------------------------------------------------------------+  |
|  |  PostgreSQL 15 + RLS (135+ tables)                         |  |
|  |  +----------------+  +----------------+  +---------------+ |  |
|  |  | Content        |  | Knowledge      |  | Economy       | |  |
|  |  | - episodes     |  | - entities     |  | - balances    | |  |
|  |  | - neurons      |  | - relations    |  | - transactions| |  |
|  |  | - blocks       |  | - idea_metrics |  | - subscriptions| |  |
|  |  +----------------+  +----------------+  +---------------+ |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                                |
+------------------------------------------------------------------+
|                     EXTERNAL SERVICES                             |
|  +-------------+  +-------------+  +-------------+  +---------+  |
|  | Lovable AI  |  | Stripe      |  | Storage     |  | Sentry  |  |
|  | Gateway     |  | Payments    |  | (Supabase)  |  | Errors  |  |
|  +-------------+  +-------------+  +-------------+  +---------+  |
+------------------------------------------------------------------+
```

### 2.2 Module Principale

| Modul | Responsabilitate | Componente Cheie |
|-------|------------------|------------------|
| **Command Center** | Interfata principala de executie | Home.tsx, CommandInputZone, OutputPanel, ContextDrawer |
| **Neuron Editor** | Editor block-based pentru neuroni | NeuronEditor.tsx, neuron_blocks, slash commands |
| **Extraction Pipeline** | Procesare continut -> neuroni | extract-neurons, chunk-transcript, dedup |
| **Service Engine** | Executie servicii AI | run-service, execute-service, 25+ service definitions |
| **Knowledge Graph** | Vizualizare relatii | Intelligence.tsx, force-graph-2d, IdeaRank |
| **Economy** | Credite si subscriptii | NEURONS system, Stripe integration, tiers |
| **Marketplace** | Tranzactionare cunostinte | listings, purchases, licensing |
| **Admin Console** | Operare platforma | 23 admin tabs, audit, compliance |

---

## 3. FLUXURI UTILIZATOR

### 3.1 Flux Principal: Content -> Deliverables

```
[START] Utilizator nou
    |
    v
+-------------------+
| 1. SIGNUP/LOGIN   |
| - Email/password  |
| - OAuth optional  |
+-------------------+
    |
    v
+-------------------+
| 2. ONBOARDING     |
| - Profile setup   |
| - First workspace |
| - 500 FREE NEURONS|
+-------------------+
    |
    v
+-------------------+     +-------------------+
| 3. UPLOAD CONTENT | --> | 4. TRANSCRIPTION  |
| - Audio/Video     |     | - Automatic       |
| - Text/URL        |     | - Multi-language  |
| - Drag & drop     |     | - Speaker diarize |
+-------------------+     +-------------------+
    |
    v
+-------------------+
| 5. EXTRACTION     |
| - 100 NEURONS cost|
| - 2-pass AI       |
| - 50 units target |
+-------------------+
    |
    v
+-------------------+
| 6. NEURON LIBRARY |
| - Block editor    |
| - Tags/categories |
| - Search/filter   |
+-------------------+
    |
    v
+-------------------+     +-------------------+
| 7. SERVICE SELECT | --> | 8. EXECUTION      |
| - 25+ AI services |     | - Credit deduct   |
| - Class A/B/C/S   |     | - Progress stream |
| - Batch possible  |     | - Real-time steps |
+-------------------+     +-------------------+
    |
    v
+-------------------+
| 9. DELIVERABLES   |
| - Articles        |
| - Scripts         |
| - Frameworks      |
| - Social posts    |
+-------------------+
    |
    v
+-------------------+
| 10. CAPITALIZE    |
| - Library save    |
| - Marketplace     |
| - Export/share    |
+-------------------+
    |
   [END]
```

### 3.2 Flux Secundar: Knowledge Graph Exploration

```
[Neurons existenti]
    |
    v
+-------------------+
| Entity Projection |
| - Auto-extract    |
| - Categorize      |
+-------------------+
    |
    v
+-------------------+
| Knowledge Graph   |
| - Force-directed  |
| - IdeaRank scores |
| - Cluster viz     |
+-------------------+
    |
    v
+-------------------+
| Discovery         |
| - Related content |
| - Contradictions  |
| - Emerging themes |
+-------------------+
```

### 3.3 Flux Economic: Free -> Paid

```
[Free User: 500 NEURONS]
    |
    v
+-------------------+
| Content Creation  |
| - Extract: -100   |
| - Services: -var  |
+-------------------+
    |
    v
Balance approaching 0
    |
    v
+-------------------+     +-------------------+
| Low Balance Gate  | --> | Top-up Options    |
| - Modal warning   |     | - One-time packs  |
| - Usage summary   |     | - Subscription    |
+-------------------+     +-------------------+
    |
    v
+-------------------+
| Subscription Tier |
| - Core: 2000/mo   |
| - Pro: 10000/mo   |
| - VIP: 30000/mo   |
+-------------------+
    |
    v
[Recurring NEURONS + Features]
```

---

## 4. DEFINITII FUNCTIONALITATI

### 4.1 Tier 0: Core Platform

| Feature | Descriere | Status | Priority |
|---------|-----------|--------|----------|
| **Auth System** | Email/password + session management | LIVE | P0 |
| **Workspace** | Multi-workspace per user | LIVE | P0 |
| **File Upload** | Audio/video/text ingestion | LIVE | P0 |
| **Transcription** | AI-powered speech-to-text | LIVE | P0 |
| **Extraction** | 2-pass neuron extraction | LIVE | P0 |
| **Credit System** | NEURONS economy | LIVE | P0 |
| **Stripe Integration** | Payments + subscriptions | LIVE | P0 |

### 4.2 Tier 1: Intelligence Layer

| Feature | Descriere | Status | Priority |
|---------|-----------|--------|----------|
| **Neuron Editor** | Block-based editing | LIVE | P1 |
| **Service Catalog** | 25+ AI services | LIVE | P1 |
| **Knowledge Graph** | Entity visualization | LIVE | P1 |
| **IdeaRank** | Scoring algorithm | LIVE | P1 |
| **Library** | Artifact management | LIVE | P1 |
| **Batch Runner** | Multi-service execution | LIVE | P1 |

### 4.3 Tier 2: Engagement Layer

| Feature | Descriere | Status | Priority |
|---------|-----------|--------|----------|
| **Gamification** | XP, streaks, achievements | LIVE | P2 |
| **Notifications** | In-app + email + push | LIVE | P2 |
| **Community Forum** | Discussion threads | LIVE | P2 |
| **Guest Pages** | Auto-generated profiles | LIVE | P2 |
| **VIP System** | Progressive unlock | LIVE | P2 |

### 4.4 Tier 3: Monetization Layer

| Feature | Descriere | Status | Priority |
|---------|-----------|--------|----------|
| **Marketplace** | Knowledge trading | LIVE | P2 |
| **API Access** | Public API + keys | LIVE | P2 |
| **Webhooks** | External integrations | LIVE | P2 |
| **Root2 Pricing** | Dynamic pricing algo | LIVE | P3 |

### 4.5 Planificate (Roadmap)

| Feature | Descriere | Status | Target |
|---------|-----------|--------|--------|
| **Vector Embeddings** | Semantic search | PLANNED | Q2 2026 |
| **Team Workspaces** | Collaboration | PLANNED | Q3 2026 |
| **OAuth API** | Third-party auth | PLANNED | Q3 2026 |
| **Mobile App** | React Native | PLANNED | Q4 2026 |
| **Multi-lang Entities** | RU, FR, DE content | PLANNED | Q4 2026 |

---

## 5. CONSTRANGERI TEHNICE

### 5.1 Constrangeri de Securitate

| Constrangere | Implementare | Verificare |
|--------------|--------------|------------|
| RLS obligatoriu | Toate tabelele | Audit periodic |
| Auth pe Edge Functions | Bearer token | Per request |
| CORS restrictiv | Whitelist origins | getCorsHeaders() |
| Rate limiting | 10 req/h extraction | In-memory (de migrat) |
| Input validation | Zod schemas | Per endpoint |

### 5.2 Constrangeri de Performanta

| Constrangere | Limit | Implementare |
|--------------|-------|--------------|
| Bundle size | <600KB per chunk | Manual chunks |
| Initial load | <3s | Lazy loading |
| API response | <10s | Timeouts |
| DB queries | Indexed | RLS-aware |
| AI calls | Rate limited | Queue system |

### 5.3 Constrangeri de Business

| Constrangere | Valoare | Ratiune |
|--------------|---------|---------|
| Free tier NEURONS | 500 | Trial suficient |
| Extraction cost | 100 NEURONS | Previne abuse |
| Max neurons/extract | 50 | Quality > quantity |
| API rate limit | 1000/day | Fair use |

---

## 6. DEPENDENTE

### 6.1 Dependente Externe

| Serviciu | Utilizare | SLA Required | Fallback |
|----------|-----------|--------------|----------|
| **Supabase** | DB, Auth, Storage, Functions | 99.9% | N/A (core) |
| **Lovable AI Gateway** | AI model access | 99% | Queue retry |
| **Stripe** | Payments | 99.99% | Offline queue |
| **Sentry** | Error tracking | 99% | Local logs |

### 6.2 Dependente Interne

```
Command Center
    |-- depends on --> Auth Context
    |-- depends on --> Workspace Context
    |-- depends on --> Credit Balance Hook
    |-- depends on --> Execution Engine

Execution Engine
    |-- depends on --> Edge Functions
    |-- depends on --> Realtime Steps
    |-- depends on --> Credit System

Knowledge Graph
    |-- depends on --> Neurons Data
    |-- depends on --> Entity Projection
    |-- depends on --> IdeaRank Metrics
```

---

## 7. METRICI DE SUCCES

### 7.1 North Star Metric

**Neurons Utilizati per User per Luna (NUPM)**

Formula: `Total NEURONS consumed / Monthly Active Users`

Target: 500+ NUPM indica engagement sanatos.

### 7.2 Metrici Secundare

| Categorie | Metric | Target | Actual |
|-----------|--------|--------|--------|
| **Acquisition** | Signup rate | 5% visitors | TBD |
| **Activation** | First extraction | 60% in Day 1 | TBD |
| **Retention** | D7 return rate | 40% | TBD |
| **Revenue** | Conversion to paid | 8% | TBD |
| **Referral** | Viral coefficient | 0.3 | TBD |

### 7.3 Metrici Tehnice

| Metric | Target | Monitoring |
|--------|--------|------------|
| Uptime | 99.9% | Supabase dashboard |
| Error rate | <0.1% | Sentry |
| P95 latency | <2s | Edge function logs |
| Build success | 100% | CI/CD |

---

## 8. RISCURI SI MITIGARI

### 8.1 Riscuri de Produs

| Risc | Probabilitate | Impact | Mitigare |
|------|---------------|--------|----------|
| User confusion (complexity) | MARE | MARE | Onboarding improvement, guided tours |
| AI quality degradation | MEDIE | MARE | Multi-model fallback, quality monitoring |
| Feature bloat | MARE | MEDIE | Feature flags, gradual rollout |

### 8.2 Riscuri Tehnice

| Risc | Probabilitate | Impact | Mitigare |
|------|---------------|--------|----------|
| Supabase outage | MICA | CRITICA | Monitoring, communication plan |
| AI API cost spike | MEDIE | MARE | Budget alerts, rate limiting |
| Security breach | MICA | CRITICA | RLS audit, penetration testing |

### 8.3 Riscuri de Business

| Risc | Probabilitate | Impact | Mitigare |
|------|---------------|--------|----------|
| Low conversion | MEDIE | MARE | A/B testing pricing, value demonstration |
| Churn after trial | MEDIE | MARE | Engagement features, email sequences |
| Competition | MARE | MEDIE | Feature velocity, niche focus |

---

## 9. APPENDIX

### A. Glossar

| Termen | Definitie |
|--------|-----------|
| **Neuron** | Unitate atomica de cunoastere extrasa din continut |
| **Episode** | Continut sursa (audio/video/text) incarcat |
| **NEURONS** | Moneda interna (1000 NEURONS = $10) |
| **IdeaRank** | Scor de importanta pentru entitati (0-100) |
| **Service** | Pipeline AI pentru generare output specific |
| **Artifact** | Output generat de un serviciu |
| **Block** | Element editor in Neuron (text, quote, idea, etc.) |
| **Entity** | Concept semantic proiectat in Knowledge Graph |

### B. Service Catalog Summary

| Class | Servicii | Cost Range | Output |
|-------|----------|------------|--------|
| **S (Strategic)** | 2 | 200+ NEURONS | Full strategies |
| **A (Premium)** | 5 | 100-200 NEURONS | Long-form content |
| **B (Standard)** | 10 | 50-100 NEURONS | Medium content |
| **C (Quick)** | 8 | 20-50 NEURONS | Short outputs |

### C. Database Schema Highlights

```sql
-- Core content tables
episodes (id, author_id, title, transcript, status, workspace_id)
neurons (id, author_id, title, status, lifecycle, content_category, episode_id)
neuron_blocks (id, neuron_id, type, content, position, execution_mode)

-- Knowledge graph
entities (id, canonical_name, entity_type)
entity_labels (entity_id, language, name)
entity_relations (source_id, target_id, relation_type, weight)
idea_metrics (entity_id, pvs_score, emergence_score, ...)

-- Economy
token_balances (user_id, balance, access_tier, tier_expires_at)
credit_transactions (id, user_id, amount, type, description)
subscriptions (id, user_id, stripe_subscription_id, status)
```

---

**Document Version History:**
- v2.0 (2026-03-25): Comprehensive rewrite based on codebase audit
- v1.0 (2026-01-01): Initial PRD

**Approvals:**
- Product: Pending
- Engineering: Pending
- Design: Pending
