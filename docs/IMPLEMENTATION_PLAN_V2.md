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

### FAZA 1: Agent OS — Knowledge Agent (Săptămânile 1-3) 🎯 ✅

**Obiectiv:** Transformarea chatului din tool conversațional în orchestrator al platformei.

#### 1.1 Intent Engine Avansat ✅
- [x] Tabel `agent_intents` cu ~13 intents predefinite
- [x] Hybrid intent classifier (keyword + LLM) cu confidence scoring
- [x] Entity extraction din mesaj (URL, file type, topic)
- [x] Fallback la conversație liberă sub threshold confidence

#### 1.2 Planner Engine ✅
- [x] Tabel `agent_plan_templates` cu planuri predefinite per intent
- [x] Dynamic step generator (adaptare plan la input)
- [x] Cost estimator pre-execuție (calcul total credite înainte de lansare)
- [x] Confirmare user înainte de execuție planuri costisitoare

#### 1.3 Execution Timeline UI ✅
- [x] Split layout Chat + Execution Timeline (panel dreapta)
- [x] Fiecare step = status + progres + cost
- [x] Progress streaming (Supabase Realtime) per step
- [x] Tabel `agent_actions` + `agent_steps` pentru tracking

#### 1.4 Memory System Avansat ✅
- [x] Session memory (ultimele 20 mesaje) — ✅ implementat
- [x] User memory (statistici categorii/servicii) — ✅ implementat
- [x] Knowledge memory (summary neuroni) — ✅ implementat
- [x] Task memory (`agent_action_history` — istoric acțiuni cu success rate)
- [x] Plan learning (planuri optime bazat pe success_rate via trigger)

#### 1.5 Tool Registry ✅
- [x] Tabel `agent_tools` cu input/output schema per serviciu (19 tools)
- [x] Cost estimate și latență medie per tool
- [x] Agent poate interoga tool registry pentru a construi planuri

**Efort estimat:** 8-10 sesiuni — **IMPLEMENTAT**

---

### FAZA 2: LLM Indexation Engine (Săptămânile 3-5) ✅

**Obiectiv:** Platformă vizibilă și citabilă de LLM-uri (ChatGPT, Gemini, Perplexity).

#### 2.1 Discovery Layer ✅
- [x] Sitemap static — ✅ implementat
- [x] Sitemap dinamic (edge function) — ✅ implementat
- [x] Internal link crawler (detect orphan pages) — ✅ llm-audit scan
- [x] Canonical URL resolver automatizat — ✅ SEOHead canonical logic
- [x] llms.txt file — ✅ /llms.txt public

#### 2.2 Structured Data Engine ✅
- [x] JSON-LD pe pagini principale (Organization, WebApplication, FAQ, Service, Breadcrumb) — ✅ implementat
- [x] JSON-LD pe entity pages — ✅ implementat
- [x] JSON-LD pe marketplace assets — ✅ implementat
- [x] Auto-generate schema.org/Dataset pentru knowledge graph export — ✅ DatasetJsonLd component
- [x] schema.org/Person pentru guest profiles — ✅ PersonJsonLd component
- [x] OpenGraph + Twitter cards pe toate paginile publice — ✅ SEOHead

#### 2.3 Knowledge Graph Export ✅
- [x] Endpoint `GET /api/knowledge-graph-export` — JSON-LD graph export
- [x] Format: `@graph` cu Person, Organization, CreativeWork, DefinedTerm, Dataset
- [x] Cache layer (regenerare zilnică, 24h TTL, knowledge_graph_cache table)

#### 2.4 Embedding Optimization ✅
- [x] Embedding score per pagină (topic_clarity + entity_count + semantic_links)
- [x] Entity density analyzer — ✅ llm_page_index.entity_density_score
- [x] Overall score composite — ✅ llm_page_index.overall_score

#### 2.5 LLM Visibility Monitor ✅
- [x] Admin tab `/admin` → LLM Index tab
- [x] Metrici: pages indexed, schema coverage, entity density, avg score
- [x] LLM referrer tracker (detect traffic din ChatGPT, Perplexity, Gemini, Claude)
- [x] Citation frequency per entitate — ✅ referrer_log per page_path

#### 2.6 Auto Fix System ✅
- [x] Detectare: missing schema, weak title, thin content, no internal links
- [x] AI fix generator (title, description, FAQ blocks, semantic links) — ✅ llm-audit fix action
- [x] Admin approval flow înainte de deploy — ✅ approve/reject UI in LLMIndexationTab

**Efort estimat:** 6-8 sesiuni — **IMPLEMENTAT**

---

### FAZA 3: Integration Layer — Knowledge Ingestion Hub (Săptămânile 5-8)

**Obiectiv:** AI-IDEI devine hub central de cunoștințe, nu doar tool de analiză.

#### 3.1 Connector Architecture ✅
- [x] Tabel `integration_connectors` (provider, auth_type, sync_mode, rate_limit)
- [x] Tabel `user_integrations` (user_id, connector_id, tokens, last_sync)
- [x] Tabel `source_documents` (external_id, content_hash, status)
- [x] Tabel `sync_history` (sync runs tracking)
- [x] Tabel `incoming_webhooks` (webhook key, auto-extract)
- [x] Ingestion protocol unificat (IngestionPayload standard)
- [x] 8 connectors seeded (YouTube, Notion, Zoom, Google Docs, Zapier, Webhook, RSS, Upload)

#### 3.2 Native Integrations (Faza 1) 🔧
- [x] **YouTube** — URL parsing + auto-transcribe (funcțional prin upload + sync)
- [ ] **Notion** — OAuth connect + page import + sync (necesită OAuth setup extern)
- [ ] **Zoom** — OAuth + recording import + auto-transcribe (necesită OAuth setup extern)

#### 3.3 Automation Integrations ✅
- [x] **Zapier** — triggers (new_neuron, extraction_finished, new_artifact) + actions (create_neuron, run_extraction, ingest_document)
- [x] **Webhook incoming** — `POST /webhook-ingest?key=KEY` → pipeline cu auto-extract
- [x] **Webhook outgoing** — events (neuron_created, job_completed) — via deliver-webhooks existent

#### 3.4 Deduplication Engine ✅
- [x] Cosine similarity pe embeddings (threshold 0.40)
- [x] Content hash (SHA-256 pe normalized content) — `compute_content_hash()` + trigger automat
- [x] Cross-source dedup (trigger `auto_content_hash` detectează duplicatele automat)

#### 3.5 Auto-Sync Engine ✅
- [x] Sync engine cu interval configurabil (6h default) — `integration-sync` edge function
- [x] Detect new/updated content (YouTube URL tracking, RSS feed parsing)
- [x] Incremental sync (doar conținut nou, skip existing by URL/hash)

#### 3.6 Integration Dashboard UI ✅
- [x] Pagina `/integrations` cu tabs (Connectors, Webhooks, Sync History)
- [x] Connect/disconnect providers
- [x] Stats: documents imported, neurons generated, last sync
- [x] Sync history + error log
- [x] Incoming webhook management (create, copy URL, delete)
- [x] Payload documentation inline

#### 3.7 Browser Extension ❌ (Faza avansată)
- [ ] Chrome extension: select text → extract to AI-IDEI
- [ ] Suport: web pages, Twitter, LinkedIn, YouTube

**Efort estimat:** 10-12 sesiuni (fără browser extension) — ✅ Completat în 1 sesiune

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
| Agent OS | 15/15 | 15 | 100% |
| LLM Indexation | 5/18 | 18 | 28% |
| Integration Layer | 1/14 | 14 | 7% |
| Navigation Redesign | 2/8 | 8 | 25% |
| Knowledge Graph | 8/14 | 14 | 57% |
| Tests & Perf | 4/10 | 10 | 40% |
| **TOTAL** | **83/129** | **129** | **64%** |

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
