# AI-IDEI OS — Plan Master de Implementare

> Generat: 2026-03-14 | Bazat pe: PRD, TASK files, GitHub Issues, UX Spec, Psycho Profile Methodology
> Cross-referențiat cu codebase-ul actual pentru a identifica ce ESTE și ce NU ESTE implementat.

---

## Legendă Status

| Simbol | Semnificație |
|--------|-------------|
| ✅ | Implementat complet |
| 🟡 | Parțial implementat |
| ❌ | Neimplementat |
| 🔒 | Blocat de dependențe externe (blockchain, API-uri terțe) |

---

## OVERVIEW: Ce ESTE implementat

### Infrastructură & Core (✅ ~95%)
- ✅ Autentificare (Supabase Auth, email confirmation)
- ✅ Sistem de roluri (user_roles table + has_role function)
- ✅ Profiles table + auto-creation trigger
- ✅ RLS policies pe toate tabelele principale
- ✅ i18n trilingv (EN/RO/RU) pe toate paginile
- ✅ Theme toggle (light/dark) persistent
- ✅ Error Boundary global
- ✅ SEO (JSON-LD, meta tags, canonical, sitemap)
- ✅ PWA (manifest, service worker)
- ✅ Analytics intern (analytics_events table)
- ✅ Cookie Consent GDPR

### Pipeline de Extracție (✅ ~85%)
- ✅ Upload content (URL, text, audio, video, PDF, DOCX)
- ✅ Transcription engine (Edge Function)
- ✅ Chunk transcript (Edge Function)
- ✅ Extract neurons (Edge Function)
- ✅ Extract guests (Edge Function)
- ✅ Extract insights (Edge Function)
- ✅ Generate entities (Edge Function)
- ✅ Deep extract (Edge Function)
- ✅ Embed neurons (Edge Function)
- ✅ Dedup neurons (Edge Function)

### Knowledge Graph (✅ ~80%)
- ✅ Entities table + entity_relations + entity_topics
- ✅ Entity labels (multilingual)
- ✅ Entity content (multilingual)
- ✅ Topics + topic_labels + hierarchy
- ✅ Neuron links (source ↔ target)
- ✅ Neuron addresses (hierarchical paths)
- ✅ Knowledge Graph vizualizare (Intelligence page)

### Neuron System (✅ ~90%)
- ✅ Neuron CRUD + block editor
- ✅ Neuron versioning (neuron_versions)
- ✅ Neuron templates
- ✅ Neuron cloning
- ✅ Neuron duplicates detection
- ✅ Block type registry
- ✅ Neuron lifecycle (draft → active → published)
- ✅ Insight scores (composite scoring)
- ✅ Folder navigation (sidebar)

### Economic Layer (✅ ~85%)
- ✅ Credits system (user_credits + credit_transactions)
- ✅ Token balances (NOTA2 tracking)
- ✅ Token transactions
- ✅ Stripe top-up checkout
- ✅ Subscription plans table
- ✅ Service catalog cu pricing
- ✅ Entropy monitoring (Admin tab)

### Job Execution (✅ ~80%)
- ✅ Job queue (neuron_jobs table)
- ✅ Job states (pending/running/completed/failed)
- ✅ Dead letter queue
- ✅ Retry logic (max_retries, retry_count)
- ✅ Process queue (Edge Function)
- ✅ Run pipeline (Edge Function)
- ✅ Run service (Edge Function)

### Admin System (✅ ~85%)
- ✅ Admin dashboard cu tabs
- ✅ Decision ledger (table + viewer)
- ✅ Abuse detection (table + tab)
- ✅ Access simulator
- ✅ Wallet management
- ✅ Incident management
- ✅ Reconciliation tab
- ✅ Admin analytics
- ✅ Admin changelog

### UI/UX Pages (✅ ~90%)
- ✅ Landing page (animații, SEO)
- ✅ Home/Cockpit (stats, quick actions)
- ✅ Dashboard (KPIs, charts)
- ✅ Extractor (multi-mode upload)
- ✅ Neuron Editor (block editor, AI panel)
- ✅ Neurons list (preview pane, toolbar)
- ✅ Library/Artifacts
- ✅ Guest profiles + public pages
- ✅ Services catalog
- ✅ Jobs monitor
- ✅ Credits page
- ✅ Intelligence/Knowledge Graph
- ✅ Topics + Discovery
- ✅ Entity listing + detail
- ✅ Chat page
- ✅ Notifications (bell + page)
- ✅ Onboarding checklist
- ✅ Feedback system
- ✅ Public profile
- ✅ Docs hub
- ✅ Links page

---

## CE NU ESTE IMPLEMENTAT — Sarcini Rămase

### TIER 1 — UX Critical (Impact Direct pe Utilizator)

#### T1.1 ❌ Extractor — Stabilizare & Polish
**Prioritate:** P0 | **Efort:** 2-3 sesiuni
- [ ] Stabilizare container input — dimensiune fixă la switch între moduri (URL/Text/Audio/Video)
- [ ] Drag-and-drop direct pentru .txt/.pdf fără clic suplimentar
- [ ] Butoane vizibile (Edit, Copy, Download TXT/SRT) în header-ul episodului, nu în meniu ascuns
- [ ] Tooltipuri explicative pe Extract, Preview Segment, Extract Neurons, Guests
- [ ] Notificări de finalizare cu detalii („S-au creat X neuroni → pagina Neurons")
- [ ] Vizualizare transcript îmbunătățită (scroll, structură pe speaker)

#### T1.2 ❌ Guest Profile Premium Design
**Prioritate:** P0 | **Efort:** 2-3 sesiuni
- [ ] Redesign pagina `/guest/:slug` — layout premium, responsive
- [ ] Expertiză în procente (bară vizuală din 100%)
- [ ] Listă extinsă de competențe/expertize
- [ ] Citate extinse (zeci, nu 2-3)
- [ ] Stil de comunicare (formal/empatic/analitic)
- [ ] Explicații sub fiecare framework (exemplu practic)
- [ ] Recomandări de utilizare bazate pe expertiză
- [ ] Versiune gratuită vs. plătită (gating pe profil extins)

#### T1.3 ❌ Neuron Editor — Funcționalitate Completă
**Prioritate:** P0 | **Efort:** 2 sesiuni
- [ ] Verificare: toate butoanele din toolbar/sidebar/footer funcționează
- [ ] Tooltipuri pe fiecare buton (ex: „Run", „Extract Insights", „Save Version")
- [ ] Stabilitate UI — fără layout shift la activare panouri AI/istoric
- [ ] Slash commands funcționale complet

#### T1.4 🟡 Jobs Page — Educație & Claritate
**Prioritate:** P1 | **Efort:** 1 sesiune
- [ ] Legendă statusuri (pending/running/completed/failed) cu explicații
- [ ] Ghid în pagină: scopul jobs, de ce sunt necesare, cum se lansează
- [ ] Opțiune de a ascunde secțiunea Jobs pentru utilizatori non-avansați

#### T1.5 🟡 Library vs Neurons — Clarificare
**Prioritate:** P1 | **Efort:** 1 sesiune
- [ ] Explicație vizuală diferența Library (artifacts/livrabile) vs Neurons (cunoștințe)
- [ ] Niveluri de acces per artifact (privat/workspace/public)
- [ ] Butoane de partajare vizibile

---

### TIER 2 — Funcționalități Business (Revenue & Growth)

#### T2.1 ❌ Marketplace Intern
**Prioritate:** P1 | **Efort:** 4-5 sesiuni
- [ ] Knowledge assets catalog public
- [ ] Pricing dual (USD + NEURONS)
- [ ] Mini-landing page per artifact (titlu, descriere, public țintă, preț)
- [ ] Flow de achiziție (Stripe USD / NEURONS deducere)
- [ ] Distribuție venituri 70/30 (creator/platformă)
- [ ] Recenzii & rating-uri cu moderare admin
- [ ] Profil public creator (portofoliu + performanță)

#### T2.2 ❌ Service Manifest Registry
**Prioritate:** P1 | **Efort:** 2 sesiuni
- [ ] Schema manifest per serviciu (pipeline, clasă, access requirements, pricing, output)
- [ ] Registry table + admin UI
- [ ] Manifest validator
- [ ] Service loader canonical

#### T2.3 ❌ Pre-Run Protocol Complet
**Prioritate:** P1 | **Efort:** 2 sesiuni
- [ ] checkAccess → estimate cost → reserve credits → execute → QA → finalize
- [ ] Credit reservation (freeze înainte de execuție)
- [ ] Cost settlement post-execuție
- [ ] Refund logic la eșec

#### T2.4 ❌ checkAccess Canonical Function
**Prioritate:** P1 | **Efort:** 2 sesiuni
- [ ] Edge Function: `checkAccess(user, resource, context)` → ALLOW | PAYWALL | DENY
- [ ] Policy rules configurabile
- [ ] Entitlement resolver (credit balance + token + subscription)
- [ ] Reason codes (INSUFFICIENT_CREDITS, NO_TOKEN, TIER_LOCKED, etc.)
- [ ] UI verdict system (paywall modal, upgrade prompt)

#### T2.5 ❌ Root2 Pricing Engine
**Prioritate:** P2 | **Efort:** 1-2 sesiuni
- [ ] Funcție de calcul Root2 (digital root = 2)
- [ ] Aplicare pe toate prețurile vizibile
- [ ] Configurare admin (on/off per categorie)
- [ ] Pachete top-up Root2 variabile

---

### TIER 3 — Intelligence Engine Expansion

#### T3.1 🟡 Extractors Suplimentari (~100 rămași)
**Prioritate:** P1 | **Efort:** 10+ sesiuni
- [ ] **Core Knowledge:** claims, principles, lessons, examples, definitions, analogies, rules, beliefs, hypotheses, assumptions, takeaways
- [ ] **Insights:** strategic, counterintuitive, hidden assumptions, contradictions, patterns, predictions (long/short), future scenarios, implications, philosophical, industry, societal, technology, economic, trend signals
- [ ] **Psychology:** personality traits, thinking style, cognitive biases, decision patterns, motivations, values, belief system, communication style, persuasion methods, rhetorical techniques, confidence/uncertainty signals, dominant emotions, psychological archetype, worldview model
- [ ] **Entity:** person, organization, company, book, tool, product, technology, concept, topic, location, event, theory, method, brand, media
- [ ] **Relationship:** person_said_quote, person_supports/criticizes_idea, idea_related/contradicts/supports, entity_related, topic_cluster, concept_dependency, argument_structure, cause_effect, problem_solution, belief_conflict, influence_network
- [ ] **Media:** viral clips, highlights, soundbites, memorable lines, emotion peaks, story segments, controversial moments, debate segments, dramatic turns, audience hooks
- [ ] **Content Gen:** tweet threads, LinkedIn posts, blog articles, YouTube scripts, newsletter summaries, viral hooks, headlines, content calendar
- [ ] **SEO:** keywords, search intent, topic clusters, SEO titles, meta descriptions
- [ ] **Strategic:** threats, opportunities, systemic risks, disruption signals, black swan signals

#### T3.2 ❌ Psychological Profile Engine
**Prioritate:** P1 | **Efort:** 3-4 sesiuni
- [ ] Implementare model din `psycho_profile_methodology.txt`
- [ ] LIWC-style lexical analysis (funcție Edge)
- [ ] Big Five mapping din transcript
- [ ] Psychological feature vector generation
- [ ] Vizualizare profil psihologic (radar chart, bars)
- [ ] Integrare în Guest Profile pages

#### T3.3 ❌ Semantic Search (Vector Embeddings)
**Prioritate:** P2 | **Efort:** 2-3 sesiuni
- [ ] Motor de căutare vectorial (pgvector deja în schema)
- [ ] Auto-indexare neuroni noi la creare
- [ ] UI căutare semantică (rezultate ordonate după similaritate + IdeaRank)
- [ ] Integrare în GlobalSearch component

#### T3.4 🟡 IdeaRank Algorithm Enhancement
**Prioritate:** P2 | **Efort:** 2 sesiuni
- [ ] Widget „Idei în trend" pe homepage (novelty × acceleration × connectivity)
- [ ] Sortare entități după IdeaRank/freshness în listing pages
- [ ] Caching layer pentru calcule costisitoare
- [ ] Topic clustering interactiv (grafic force-directed)

---

### TIER 4 — Platform Governance & Security

#### T4.1 🟡 Decision Ledger — Completare
**Prioritate:** P1 | **Efort:** 1 sesiune
- [ ] Append-only constraint (trigger SQL)
- [ ] Hash criptografic pe fiecare entry
- [ ] Logging hooks automatice (access deny, abuse, economic actions)
- [ ] Export CSV/JSON pentru audit extern

#### T4.2 🟡 Abuse Detection — Completare
**Prioritate:** P1 | **Efort:** 1-2 sesiuni
- [ ] Prompt probing detection
- [ ] Export farming detection
- [ ] Downgrade ladder (export cooldown → access downgrade → account suspension)
- [ ] Alertă automată la anomalii (consum brusc NEURONS)

#### T4.3 ❌ Edge Functions Security Hardening
**Prioritate:** P0 | **Efort:** 1-2 sesiuni
- [ ] `extract-neurons`: verify_jwt=true, user_id din token (nu din payload)
- [ ] `chunk-transcript`: verify_jwt=true
- [ ] `extract-guests`: verify_jwt=true
- [ ] `generate-entities`: verify_jwt=true
- [ ] Audit toate Edge Functions pentru user_id injection

#### T4.4 ❌ Workspace/Multi-Tenant System
**Prioritate:** P2 | **Efort:** 3-4 sesiuni
- [ ] Workspaces table + workspace_members
- [ ] Roluri per workspace (owner, admin, member, viewer)
- [ ] RLS pe workspace_id
- [ ] UI workspace switcher
- [ ] Membership API

---

### TIER 5 — NOTA2 Token & Blockchain

#### T5.1 🔒 Smart Contract NOTA2
**Prioritate:** P3 | **Efort:** Extern
- [ ] Solana smart contract (100M supply fix)
- [ ] Time-lock pe rezerve
- [ ] Listare pe DEX (Raydium/Jupiter)

#### T5.2 🔒 Wallet Connect Integration
**Prioritate:** P3 | **Efort:** 3-4 sesiuni (după T5.1)
- [ ] Phantom/Solflare wallet connect UI
- [ ] Legare wallet ↔ cont Supabase
- [ ] Verificare read-only sold token
- [ ] Afișare status token în dashboard

#### T5.3 🔒 Token-Gated Access
**Prioritate:** P3 | **Efort:** 2-3 sesiuni (după T5.2)
- [ ] Verificare periodică sold token (cron Edge Function)
- [ ] Ciclul de 11 luni (token_acquired_at, cycle_expires_at)
- [ ] Notificări expirare (30/7/1 zile)
- [ ] Cusnir_OS access tier

#### T5.4 🔒 Governance On-Chain
**Prioritate:** P3 | **Efort:** Extern
- [ ] Contracte de vot (proposals, quorum)
- [ ] Pagina governance UI
- [ ] Sincronizare rezultate blockchain ↔ app

---

### TIER 6 — Scaling & Infrastructure

#### T6.1 ❌ API Public (REST/GraphQL)
**Prioritate:** P2 | **Efort:** 3-4 sesiuni
- [ ] Endpoint-uri: neurons, entities, jobs, IdeaRank
- [ ] Auth token JWT + rate limiting
- [ ] Documentație OpenAPI
- [ ] Exemple integrare

#### T6.2 ❌ Subscription Plans Integration
**Prioritate:** P2 | **Efort:** 2-3 sesiuni
- [ ] Stripe Subscriptions flow
- [ ] Verificare limite înainte de execuție servicii
- [ ] Upgrade/downgrade fără pierdere date
- [ ] Gating features pe plan (marketplace publish limits, etc.)

#### T6.3 ❌ Mobile Optimization
**Prioritate:** P2 | **Efort:** 2-3 sesiuni
- [ ] Bottom navigation bar pe mobile
- [ ] Responsive refinements (Neuron Editor, Dashboard)
- [ ] Offline caching (Service Worker enhanced)

#### T6.4 🔒 100M Neuron Architecture
**Prioritate:** P3 | **Efort:** Extern
- [ ] Distributed storage
- [ ] Graph indexing optimization
- [ ] Partitioning strategy

---

## ORDINEA DE EXECUȚIE RECOMANDATĂ

```
Sprint 1 (Next):     T4.3 (Security), T1.1 (Extractor Polish)
Sprint 2:            T1.2 (Guest Profile), T1.3 (Neuron Editor)
Sprint 3:            T2.4 (checkAccess), T2.3 (Pre-Run Protocol)
Sprint 4:            T1.4 (Jobs), T1.5 (Library), T4.1 (Ledger)
Sprint 5:            T2.1 (Marketplace) — Part 1
Sprint 6:            T2.1 (Marketplace) — Part 2, T2.2 (Service Manifest)
Sprint 7:            T3.2 (Psycho Profile Engine)
Sprint 8:            T3.1 (Extractors) — batch 1 (~20 extractors)
Sprint 9:            T3.3 (Semantic Search), T3.4 (IdeaRank)
Sprint 10:           T2.5 (Root2), T6.2 (Subscriptions)
Sprint 11-12:        T3.1 (Extractors) — remaining batches
Sprint 13+:          T5.x (Token), T6.x (Scaling)
```

---

## METRICI DE COMPLETARE

| Categorie | Implementat | Total | % |
|-----------|------------|-------|---|
| UI/UX Pages | 22/22 | 22 | 100% |
| Edge Functions | 18/18 | 18 | 100% |
| DB Tables | 45/45 | 45 | 100% |
| Core Features | ~35/50 | 50 | 70% |
| Extractors | ~15/120 | 120 | 12% |
| Services | ~5/25 | 25 | 20% |
| Marketplace | 0/8 | 8 | 0% |
| Token System | 0/4 | 4 | 0% |
| **TOTAL** | **~140/292** | **292** | **~48%** |

> **Notă:** Procentul de 48% reflectă totalul *inclusiv* cele 120 de extractori planificați și token system. Fără acestea, platforma este la **~85% completare** pentru funcționalitatea core.

---

## REFERINȚE

- `docs/reference/github_tasks.yml` — GitHub Issues format
- `docs/reference/tasks_base.txt` — Sarcini de bază
- `docs/reference/tasks_advanced.txt` — Sarcini avansate
- `docs/reference/psycho_profile_methodology.txt` — Metodologie profil psihologic
- `docs/reference/user_experience_spec.txt` — Specificații UX
