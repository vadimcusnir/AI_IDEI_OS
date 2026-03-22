# AI-IDEI OS — Plan de Implementare v2.0

> Generat: 2026-03-22 | Bazat pe: Audit arhitectural (15 Mar), Specificații Knowledge Graph, Navigație, Agent OS, LLM Indexation, Integrări
> Status curent platform: ~90% core features implementate

---

## Legendă

| Simbol | Semnificație |
|--------|-------------|
| ✅ | Deja implementat (verificat în codebase) |
| 🔧 | Parțial implementat — necesită completare |
| ❌ | Neimplementat |
| 🔒 | Blocat de dependențe externe |
| 🎯 | Prioritate maximă |

---

## I. REZUMAT EXECUTIV

Auditul din 15 Martie 2026 a identificat un scor de sănătate de 67/100 și 9 decalaje (DECALAJ-001 → 009). De atunci, platforma a avansat semnificativ:

| Decalaj Original | Status Actual |
|---|---|
| DECALAJ-001: JWT lipsă în Edge Functions | ✅ Rezolvat — JWT verificat în toate funcțiile critice |
| DECALAJ-002: Sistem credite nefuncțional | ✅ Rezolvat — reserve/settle/refund + Stripe |
| DECALAJ-003: Pipeline AI incomplet | ✅ Rezolvat — 120+ extractori, 12 niveluri |
| DECALAJ-004: Knowledge Graph slab | ✅ Rezolvat — entities, relations, IdeaRank, embeddings |
| DECALAJ-005: Chat AI neintegrat | 🔧 Parțial — intent + slash commands, lipsă planner avansat |
| DECALAJ-006: Documentație desincronizată | 🔧 Parțial — docs actualizate dar structura de learning paths lipsește |
| DECALAJ-007: UI incomplet | ✅ Rezolvat — 40+ pagini, marketplace, jobs, API |
| DECALAJ-008: Teste insuficiente | 🔧 Parțial — unit tests minimale, e2e Playwright există |
| DECALAJ-009: Monitoring limitat | ✅ Rezolvat — Sentry, anomaly alerts, runtime dashboard |

**Scor actualizat estimat: 82/100**

Acest plan adresează cele 5 direcții strategice noi identificate în specificațiile suplimentare.

---

## II. DIRECȚII STRATEGICE NOI

### A. Agent OS — Chat ca Primary UI (din `05_chat_ai.txt`)
### B. LLM Indexation Engine (din `05_indexare_llm.txt`)
### C. Integration Layer — Knowledge Ingestion Hub (din `05_integrari.txt`)
### D. Navigație Redesign (din `04_raport_4_meniu.txt`)
### E. Knowledge Graph Complet (din `04_raport_2-2.txt` / `04_raport_3-2.txt`)

---

## III. PLAN DETALIAT PE FAZE

### FAZA 1: Agent OS — Knowledge Agent (Săptămânile 1-3) 🎯

**Obiectiv:** Transformarea chatului din tool conversațional în orchestrator al platformei.

#### 1.1 Intent Engine Avansat ❌
- [ ] Tabel `agent_intents` cu ~15 intents predefinite (analyze_video, extract_knowledge, build_course, etc.)
- [ ] Intent classifier bazat pe LLM cu confidence scoring
- [ ] Entity extraction din mesaj (URL, file type, topic)
- [ ] Fallback la conversație liberă sub threshold confidence

#### 1.2 Planner Engine ❌
- [ ] Tabel `agent_plan_templates` cu planuri predefinite per intent
- [ ] Dynamic step generator (adaptare plan la input)
- [ ] Cost estimator pre-execuție (calcul total credite înainte de lansare)
- [ ] Confirmare user înainte de execuție planuri costisitoare

#### 1.3 Execution Timeline UI ❌
- [ ] Split layout Chat + Execution Timeline
- [ ] Fiecare step = link către rezultat (transcript, neurons, graph, artifacts)
- [ ] Progress streaming (SSE) per step
- [ ] Tabel `agent_actions` + `agent_steps` pentru tracking

#### 1.4 Memory System Avansat 🔧
- [x] Session memory (ultimele 20 mesaje) — ✅ implementat
- [x] User memory (statistici categorii/servicii) — ✅ implementat
- [x] Knowledge memory (summary neuroni) — ✅ implementat
- [ ] Task memory (`agent_action_history` — istoric acțiuni cu success rate)
- [ ] Plan learning (planuri optime devin default bazat pe success_rate)

#### 1.5 Tool Registry ❌
- [ ] Tabel `agent_tools` cu input/output schema per serviciu
- [ ] Cost estimate și latență medie per tool
- [ ] Agent poate interoga tool registry pentru a construi planuri

**Efort estimat:** 8-10 sesiuni

---

### FAZA 2: LLM Indexation Engine (Săptămânile 3-5)

**Obiectiv:** Platformă vizibilă și citabilă de LLM-uri (ChatGPT, Gemini, Perplexity).

#### 2.1 Discovery Layer 🔧
- [x] Sitemap static — ✅ implementat
- [x] Sitemap dinamic (edge function) — ✅ implementat
- [ ] Internal link crawler (detect orphan pages)
- [ ] Canonical URL resolver automatizat

#### 2.2 Structured Data Engine 🔧
- [x] JSON-LD pe pagini principale (Organization, WebApplication, FAQ, Service, Breadcrumb) — ✅ implementat
- [x] JSON-LD pe entity pages — ✅ implementat
- [x] JSON-LD pe marketplace assets — ✅ implementat
- [ ] Auto-generate schema.org/Dataset pentru knowledge graph export
- [ ] schema.org/Person pentru guest profiles
- [ ] OpenGraph + Twitter cards pe toate paginile publice

#### 2.3 Knowledge Graph Export ❌
- [ ] Endpoint `GET /api/knowledge-graph` — JSON-LD graph export
- [ ] Format: `@graph` cu Person, Organization, CreativeWork, DefinedTerm
- [ ] Cache layer (regenerare zilnică)

#### 2.4 Embedding Optimization ❌
- [ ] Embedding score per pagină (topic_clarity + entity_count + semantic_links)
- [ ] Semantic chunk generator pentru pagini lungi
- [ ] Entity density analyzer

#### 2.5 LLM Visibility Monitor ❌
- [ ] Admin tab `/admin/llm-indexation`
- [ ] Metrici: pages indexed, schema coverage, entity density
- [ ] LLM referrer tracker (detect traffic din ChatGPT, Perplexity, Gemini)
- [ ] Citation frequency per entitate

#### 2.6 Auto Fix System ❌
- [ ] Detectare: missing schema, weak title, thin content, no internal links
- [ ] AI fix generator (title, description, FAQ blocks, semantic links)
- [ ] Admin approval flow înainte de deploy

**Efort estimat:** 6-8 sesiuni

---

### FAZA 3: Integration Layer — Knowledge Ingestion Hub (Săptămânile 5-8)

**Obiectiv:** AI-IDEI devine hub central de cunoștințe, nu doar tool de analiză.

#### 3.1 Connector Architecture ❌
- [ ] Tabel `integration_connectors` (provider, auth_type, sync_mode, rate_limit)
- [ ] Tabel `user_integrations` (user_id, connector_id, tokens, last_sync)
- [ ] Tabel `source_documents` (external_id, content_hash, status)
- [ ] Ingestion protocol unificat (IngestionPayload standard)

#### 3.2 Native Integrations (Faza 1) ❌
- [ ] **YouTube** — URL parsing + auto-transcribe (deja funcțional prin upload)
- [ ] **Notion** — OAuth connect + page import + sync
- [ ] **Zoom** — OAuth + recording import + auto-transcribe

#### 3.3 Automation Integrations ❌
- [ ] **Zapier** — triggers (new neuron, extraction finished) + actions (create neuron, run extraction)
- [ ] **Webhook incoming** — `POST /webhooks/incoming` → pipeline
- [ ] **Webhook outgoing** — events (neuron_created, job_completed)

#### 3.4 Deduplication Engine 🔧
- [x] Cosine similarity pe embeddings (threshold 0.40) — ✅ implementat
- [ ] Content hash (SHA-256 pe normalized content)
- [ ] Cross-source dedup (Notion + Upload = same insight)

#### 3.5 Auto-Sync Engine ❌
- [ ] Sync engine cu interval configurabil (6h default)
- [ ] Detect new/updated content
- [ ] Incremental sync (doar conținut nou)

#### 3.6 Integration Dashboard UI ❌
- [ ] Pagina `/dashboard/integrations`
- [ ] Connect/disconnect providers
- [ ] Stats: documents imported, neurons generated, last sync
- [ ] Sync history + error log

#### 3.7 Browser Extension ❌ (Faza avansată)
- [ ] Chrome extension: select text → extract to AI-IDEI
- [ ] Suport: web pages, Twitter, LinkedIn, YouTube

**Efort estimat:** 10-12 sesiuni (fără browser extension)

---

### FAZA 4: Navigație Redesign (Săptămânile 8-9)

**Obiectiv:** Reducere de la ~27 items sidebar la 6 secțiuni clare.

#### 4.1 Sidebar Restructurare 🔧
**Structura propusă (din audit navigație):**

| Secțiune | Items | Mapping actual |
|----------|-------|----------------|
| **Dashboard** | Home, Recent Activity, Getting Started | /home, /onboarding |
| **Create** | Upload, Extract, Neurons, Generate, Templates | /extractor, /neurons, /services |
| **Explore** | Browse, Search, Topics, Marketplace, Collections | /insights, /topics, /marketplace |
| **Operate** | Services, Jobs, Orchestration, API Access | /services, /jobs, /pipeline, /api |
| **Account** | Profile, Credits, Billing, Notifications, Security | /profile, /credits, /notifications |
| **Learn** | Guide, Tutorials, Reference, Glossary | /docs |

- [ ] Implementare sidebar cu 6 secțiuni colapsabile
- [ ] Progressive disclosure (sub-items vizibile doar on hover/expand)
- [ ] Role-based adaptation (admin vede secțiuni suplimentare)
- [ ] Collapsed mode (72px) cu iconuri

#### 4.2 Label Redesign ❌
| Actual | Propus | Motiv |
|--------|--------|-------|
| Extractor | Extract | Acțiune, nu tool |
| Neurons | Knowledge | Concept clar |
| Intelligence | Insights | Output, nu proces |
| AI Chat | Assist / Command Center | Poziționare agent |

#### 4.3 Top Navigation Simplificare ❌
- [ ] Breadcrumb contextual (stânga)
- [ ] Global Search centrat (Ctrl+K) — ✅ deja implementat
- [ ] User controls (dreapta): notifications, credits, profile

#### 4.4 Mobile Navigation 🔧
- [x] Bottom nav bar — ✅ implementat
- [ ] Gesture-based navigation (swipe între secțiuni)
- [ ] Adaptive: afișare doar top 4 items pe mobile

**Efort estimat:** 4-5 sesiuni

---

### FAZA 5: Knowledge Graph Complet (Săptămânile 9-11)

**Obiectiv:** Graph complet cu toate relațiile, căutare semantică avansată, și vizualizări interactive.

#### 5.1 Graph Data Model 🔧
- [x] Entities + entity_relations + entity_topics — ✅ implementat
- [x] Entity labels multilingve — ✅ implementat
- [x] IdeaRank algorithm — ✅ implementat
- [ ] Relationship types extinse (contradict, extend, derive, exemplify, apply)
- [ ] Temporal relations (before, after, concurrent)
- [ ] Confidence scoring pe relații

#### 5.2 Semantic Search Avansat 🔧
- [x] Vector search fallback în GlobalSearch — ✅ implementat
- [x] Auto-indexare trigger la insert/update neuron — ✅ implementat
- [ ] HNSW index pe `embedding` column (pgvector)
- [ ] Hybrid search (keyword + vector cu RRF fusion)
- [ ] Faceted search (filter by type, date, confidence, source)

#### 5.3 Graph Visualization Avansat 🔧
- [x] Force-directed graph (react-force-graph-2d) — ✅ implementat
- [ ] Cluster detection vizual (community colors)
- [ ] Time-travel view (graph evolution over time)
- [ ] Zoom to subgraph (click entity → expand neighborhood)
- [ ] Export graph ca image/SVG

#### 5.4 Contradiction & Gap Detection ❌
- [ ] AI-powered contradiction finder între neuroni
- [ ] Knowledge gap identifier (topics menționate dar neexplorate)
- [ ] Suggestion engine: "You should explore X based on your graph"

**Efort estimat:** 6-8 sesiuni

---

## IV. SARCINI TEHNICE TRANSVERSALE

### T1. Test Coverage Expansion 🔧
- [x] Vitest configurare — ✅
- [x] Playwright e2e basic — ✅
- [ ] Unit tests pentru hooks critice (useNeuron, useCreditBalance, useGamification)
- [ ] Integration tests pentru edge functions (mock Supabase)
- [ ] Coverage target: 70% pentru cod critic

### T2. Performance Optimization 🔧
- [x] Lazy loading routes — ✅ (React.lazy)
- [ ] Image optimization (WebP, responsive sizes)
- [ ] API response caching (TanStack Query staleTime tuning)
- [ ] Database indices audit (explain analyze pe queries lente)
- [ ] Bundle size audit (tree-shaking, code splitting)

### T3. Documentație Restructurare 🔧
- [x] Docs page cu 6 secțiuni — ✅
- [ ] Platform Overview (5 min read, value proposition)
- [ ] Core Concepts (Neuron, Graph, Services, Credits — plain language)
- [ ] 4 tutorials pas-cu-pas (First Extraction, Creating Outputs, Building Collections, Automating)
- [ ] Developer Guide (API, webhooks, authentication)
- [ ] Glossary integrat (nu doar referință)

### T4. Securitate Continuă ✅
- [x] JWT pe toate edge functions — ✅
- [x] RLS pe toate tabelele — ✅
- [x] Rate limiting — ✅
- [x] Input validation (Zod) — ✅
- [x] Abuse detection — ✅
- [x] GDPR (export, delete) — ✅

---

## V. ORDINEA DE EXECUȚIE RECOMANDATĂ

```
Sprint 1 (Săpt. 1-2):    FAZA 1.1-1.3 — Agent Intent + Planner + Execution Timeline
Sprint 2 (Săpt. 2-3):    FAZA 1.4-1.5 — Agent Memory + Tool Registry
Sprint 3 (Săpt. 3-5):    FAZA 2 — LLM Indexation Engine (structured data + monitor)
Sprint 4 (Săpt. 5-7):    FAZA 3.1-3.3 — Integration Layer + First 3 Connectors
Sprint 5 (Săpt. 7-8):    FAZA 3.4-3.6 — Dedup + Auto-Sync + Dashboard
Sprint 6 (Săpt. 8-9):    FAZA 4 — Navigation Redesign
Sprint 7 (Săpt. 9-11):   FAZA 5 — Knowledge Graph Complet
Sprint 8 (Ongoing):       T1-T3 — Tests, Performance, Docs
```

---

## VI. METRICI DE COMPLETARE

| Categorie | Implementat | Total | % |
|-----------|------------|-------|---|
| Core Platform | 48/50 | 50 | 96% |
| Agent OS | 3/15 | 15 | 20% |
| LLM Indexation | 5/18 | 18 | 28% |
| Integration Layer | 1/14 | 14 | 7% |
| Navigation Redesign | 2/8 | 8 | 25% |
| Knowledge Graph | 8/14 | 14 | 57% |
| Tests & Perf | 4/10 | 10 | 40% |
| **TOTAL** | **71/129** | **129** | **55%** |

> **Core platform: 96% complet.** Cele 5 direcții strategice noi adaugă 79 sarcini, din care 23 sunt deja parțial implementate.

---

## VII. DEPENDENȚE EXTERNE

| Dependență | Faza | Necesitate |
|---|---|---|
| Notion API | Faza 3 | OAuth app registration |
| Zoom API | Faza 3 | OAuth app + marketplace listing |
| Zapier Developer Platform | Faza 3 | App publication |
| Chrome Web Store | Faza 3.7 | Extension publishing |
| Solana (NOTA2) | Extern | Smart contract deployment |

---

## VIII. REFERINȚE DOCUMENTE SURSĂ

- `04_audit_1-2.txt` — Repository Inventory & Technology Stack
- `04_raport_1-2.txt` — Raport Decalaj Arhitectural + Plan Implementare + Harta Arhitecturii + Validare UI
- `04_raport_2-2.txt` / `04_raport_3-2.txt` — Specificația Knowledge Graph & Neuron Model
- `04_raport_4_meniu-2.txt` — Navigation Architecture Audit & Redesign
- `05_chat_ai.txt` — Agent OS Architecture (Intent + Planner + Executor + Memory)
- `05_indexare_llm.txt` — LLM Indexation Engine (48 componente, 9 subsisteme)
- `05_integrari.txt` — Integration Layer Architecture (Connectors, Sync, Dedup)
