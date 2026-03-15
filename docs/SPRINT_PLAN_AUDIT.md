# AI-IDEI OS — Plan de Implementare Post-Audit

> Generat: 2026-03-15 | Surse: 5 rapoarte de audit (inventar, arhitectură frontend, decalaje, graf cunoștințe, navigație)
> Cross-referențiat cu codebase-ul actual

---

## Rezumat Executiv

Auditul extern a identificat un **Scor General de Sănătate de 67/100** și **18 bug-uri** (2 critice, 5 high, 7 medium, 4 low). După cross-referențiere cu implementarea actuală, **multe probleme semnalate sunt deja rezolvate** (sistemul de credite, marketplace, RLS, pipeline AI). Rămân sarcini reale în 4 zone principale: **securitate edge functions**, **optimizare performanță**, **redesign navigație**, și **polish/testing**.

---

## Legendă

| Simbol | Semnificație |
|--------|-------------|
| ✅ | Deja implementat (auditul nu a detectat) |
| 🔴 | Critic — necesită remediere imediată |
| 🟠 | Important — sprint curent |
| 🟡 | Mediu — sprint următor |
| 🟢 | Minor — backlog |
| ⬜ | Nice-to-have / termen lung |

---

## FAZA 1: SECURITATE (Prioritate Maximă)

### 1.1 ✅ SEC-001: Edge Functions acceptă user_id din client
**Status:** COMPLET REZOLVAT — Audit confirmat 2026-03-15: TOATE funcțiile (extract-neurons, chunk-transcript, extract-guests, deep-extract, extract-insights) derivă user_id din JWT via `supabase.auth.getUser(token)`. Nicio funcție nu acceptă user_id din body.

**Sarcini:**
- [x] **S1.1** Audit toate edge functions — TOATE extrag user_id din JWT ✅
- [x] **S1.2-S1.6** Toate funcțiile deja securizate ✅
- [x] **S1.7** Extractor.tsx trimite session.access_token corect ✅
- [x] **S1.8** config.toml — verify_jwt=false este corect (necesar pentru CORS preflight OPTIONS) ✅
- [x] **S1.9** Verificat — toate funcțiile returnează 401 fără JWT valid ✅

**Efort:** 0 (deja implementat) | **Impact:** N/A

### 1.2 🟡 SEC-004: Leaked Password Protection
- [ ] **S1.10** ⚠️ MANUAL: Necesită activare din dashboard-ul Lovable Cloud (Pro Plan). Nu poate fi automatizat.

**Efort:** Manual | **Impact:** MEDIU

### 1.3 ✅ SEC-006: CORS Wildcard — COMPLETAT 2026-03-15
- [x] **S1.11** ✅ Creat `_shared/cors.ts` cu `getCorsHeaders(req)` — origin validat contra allowlist. Aplicat în 9 funcții critice: generate-entities, run-service, extract-neurons, chunk-transcript, transcribe-audio, extract-guests, neuron-chat, extract-insights, verify-topup.

**Efort:** 0 (completat) | **Impact:** SCĂZUT (defense-in-depth)

### 1.4 ✅ SEC-005: push_config RLS — COMPLETAT 2026-03-15
- [x] **S1.12** ✅ RLS activat pe `push_config` — policy `USING(false)` blochează acces public. Doar service role (triggeruri) poate citi.

**Efort:** 0 (completat) | **Impact:** SCĂZUT

---

## FAZA 2: PERFORMANȚĂ & OPTIMIZARE

### 2.1 ✅ DB-001: Indexuri lipsă
**Status:** COMPLET — Toate 6 indexuri create pe 2026-03-15.

**Sarcini:**
- [x] **P2.1** `idx_neurons_author_updated ON neurons(author_id, updated_at DESC)` ✅
- [x] **P2.2** `idx_episodes_author_created ON episodes(author_id, created_at DESC)` ✅
- [x] **P2.3** `idx_entities_neuron_published ON entities(neuron_id) WHERE is_published = true` ✅
- [x] **P2.4** `idx_credit_tx_user_created ON credit_transactions(user_id, created_at DESC)` ✅
- [x] **P2.5** `idx_neuron_jobs_author_created ON neuron_jobs(author_id, created_at DESC)` ✅
- [x] **P2.6** `idx_neuron_jobs_status_active ON neuron_jobs(status) WHERE status NOT IN ('completed', 'failed')` ✅

**Efort:** 0 (completat) | **Impact:** MARE

### 2.2 ✅ BE-001: Procesare secvențială în pipeline AI — COMPLETAT 2026-03-15
- [x] **P2.7** ✅ `extract-neurons` procesează chunk-uri în paralel (batch de 3, Promise.all)
- [x] **P2.8** ✅ `generate-entities` refactorizat: batch fetch blocks + existing entities (eliminat N+1), batch insert entities, batch upsert relations

**Efort:** 0 (completat) | **Impact:** MARE

### 2.3 ✅ FE-001: Optimizare bundle — COMPLETAT 2026-03-15
- [x] **P2.9** ✅ Lazy loading pentru TOATE 46 paginile cu `React.lazy` + `Suspense` + loading spinner
- [x] **P2.10** ✅ Dynamic import pentru `react-force-graph-2d` (lazy loaded în KnowledgeGraph)
- [x] **P2.11** ✅ Dynamic import pentru `recharts` (lazy loaded ConsumptionChart în Credits page)
- [x] **P2.12** ✅ Tree shaking — verificat, importuri curate

**Efort:** 0 (completat) | **Impact:** MEDIU

### 2.4 ✅ FE-002: Memory leak KnowledgeGraph — COMPLETAT 2026-03-15
- [x] **P2.13** ✅ Cleanup în `useEffect` — `pauseAnimation()` + `_destructor()` on unmount
- [x] **P2.14** ✅ Limitare la MAX_NODES=500, sortate descrescător după score

**Efort:** 0 (completat) | **Impact:** MEDIU

### 2.5 ✅ Caching TanStack Query — COMPLETAT 2026-03-15
- [x] **P2.15** ✅ `staleTime: 2min` global configurat în QueryClient
- [x] **P2.16** ✅ `gcTime: 10min` + `refetchOnWindowFocus: false` + `retry: 1`

**Efort:** 0 (completat) | **Impact:** MEDIU

---

## FAZA 3: REDESIGN NAVIGAȚIE (Raport Meniu)

### 3.1 ✅ Restructurare Sidebar — COMPLETAT 2026-03-15
**Implementat:** 6 secțiuni (Dashboard, Create, Explore, Operate, Account, Learn) cu ~20 items. Labels actualizate (Cockpit→Dashboard, Extractor→Extract, Intelligence→Insights, Services→Generate). Tooltips pe fiecare item. Collapsed state cu iconuri. i18n EN/RO/RU.

**Sarcini:**
- [x] **N3.1** Redesign `AppSidebar.tsx` cu 6 secțiuni ✅
- [x] **N3.2** Tooltips pe fiecare item sidebar ✅
- [x] **N3.3** Collapsed state cu iconuri ✅
- [x] **N3.4** Preferință collapsed gestionată de SidebarProvider ✅
- [x] **N3.5** Label-uri actualizate ✅

**Efort:** 0 (completat) | **Impact:** MARE (UX)

### 3.2 ✅ Simplificare Top Navigation — COMPLETAT 2026-03-15
- [x] **N3.6** ✅ "Knowledge OS" label nu există în header/nav (doar în footer/branding — corect)
- [x] **N3.7** ✅ Breadcrumb dinamic bazat pe rută curentă (AppBreadcrumbs.tsx)
- [x] **N3.8** ✅ Global Search deja în header

**Efort:** 0 (completat) | **Impact:** MEDIU

### 3.3 ✅ Mobile Navigation Improvements — COMPLETAT 2026-03-15
- [x] **N3.9** ✅ Bottom nav optimizat: Home → Extract → Neurons → Services → Library (flow-ul principal al utilizatorului)
- [x] **N3.10** ✅ Hamburger menu cu Sheet sidebar pe mobile — 5 secțiuni (Core, Explore, Operate, Account, Learn) + sign out

**Efort:** 0 (completat parțial) | **Impact:** MEDIU

---

## FAZA 4: VALIDARE & TESTING

### 4.1 🟡 BE-003: Input Validation cu Zod
- [x] **T4.1** ✅ Zod schemas în `extract-neurons` (episode_id UUID validation)
- [x] **T4.2** ✅ Zod schemas în `chunk-transcript` (episode_id, min_tokens, max_tokens)
- [x] **T4.3** ✅ Zod schemas în `run-service` (job_id, service_key, neuron_id, inputs max 50k)
- [x] **T4.4** ✅ Zod schemas în `neuron-chat` (messages array with role enum, neuron_context object)

**Efort:** 0 (completat) | **Impact:** MEDIU

### 4.2 ✅ FE-003: Validare formulare frontend — COMPLETAT 2026-03-15
- [x] **T4.5** ✅ Validare email + password pe Auth.tsx (regex email, min length, signup 8+ chars)
- [x] **T4.6** ✅ Mesaje de eroare standardizate i18n — toate 25 chei sincronizate EN/RO/RU

**Efort:** 0 (completat) | **Impact:** MEDIU

### 4.3 ✅ FE-004: Error handling consistent — COMPLETAT 2026-03-15
- [x] **T4.7** ✅ Empty states pe toate paginile cu liste (Neurons, Library, Jobs — toate au empty states dedicate)
- [x] **T4.8** ✅ Loading skeletons pe Dashboard, Library, Neurons, Jobs, Home (DashboardSkeleton, HomeSkeleton, ListPageSkeleton)

**Efort:** 0 (completat) | **Impact:** MEDIU

### 4.4 ✅ Teste automate — PARȚIAL COMPLETAT 2026-03-15
- [x] **T4.9** ✅ 23 teste Vitest: cn utility (4), docsContent structure (4), neuron sort/group (8), breadcrumb logic (6), example (1)
- [x] **T4.10** ✅ 5 fișiere Playwright E2E: landing (4 teste), auth (5 teste), navigation (6 teste), SEO (5 teste), responsive (3 teste) = 23 teste E2E

**Efort:** 0 (completat) | **Impact:** MARE (long-term)

---

## FAZA 5: DOCUMENTAȚIE

### 5.1 ✅ Documentație utilizator — COMPLETAT
Documentația user-facing este deja completă în `docsContent.ts`:
- [x] **D5.1** ✅ Platform Overview (introduction + how-it-works)
- [x] **D5.2** ✅ Core Concepts (neuron-model, intelligence-assets, knowledge-as-infrastructure)
- [x] **D5.3** ✅ Tutorial "First Extraction" (your-first-neuron)
- [x] **D5.4** ✅ Glossary complet cu toți termenii platformei

**Efort:** 0 (completat) | **Impact:** MEDIU (onboarding)

### 5.2 ✅ Sincronizare documentație tehnică — COMPLETAT 2026-03-15
- [x] **D5.5** ✅ `DATABASE_SCHEMA.md` actualizat — adăugate 15+ tabele noi, indexuri create, marketplace relations
- [x] **D5.6** ✅ `SECURITY_AUDIT.md` actualizat — toate remedierile (SEC-001→008) documentate cu date și rezoluții

**Efort:** 0 (completat) | **Impact:** SCĂZUT

---

## DECALAJE RAPORTATE DAR DEJA IMPLEMENTATE

Următoarele probleme din audit **NU necesită acțiune** — sunt deja rezolvate:

| Decalaj Raportat | Status Real |
|---|---|
| DECALAJ-002: Sistem credite nefuncțional | ✅ Implementat complet (spend_credits, add_credits, reserve_credits, settle_credits, refund_credits) |
| DECALAJ-003: Pipeline AI incomplet | ✅ 8-level deep extraction, 30+ edge functions |
| DECALAJ-004: Knowledge Graph slab | ✅ Entities, relations, topics, IdeaRank PVS+Emergence |
| DECALAJ-005: Chat AI neintegrat | ✅ neuron-chat edge function + PlatformChat.tsx |
| DECALAJ-007: UI Incomplet (Jobs, Marketplace, API) | ✅ Toate 22+ pagini implementate |
| "Marketplace de Neuroni lipsă" | ✅ Marketplace cu reviews, featured, purchase flow |
| "API Public lipsă" | ✅ neuron-api edge function cu dual auth (JWT + API Key) |
| "Sistem abonamente lipsă" | ✅ Stripe subscriptions + customer portal |

---

## ORDINE DE EXECUȚIE RECOMANDATĂ

```
Sprint 1 (Urgent):    S1.1-S1.9 (Security JWT Fix) + P2.1-P2.6 (DB Indexes)
Sprint 2:             P2.7-P2.8 (Parallel Processing) + N3.1-N3.5 (Sidebar Redesign)
Sprint 3:             T4.1-T4.4 (Zod Validation) + P2.9-P2.12 (Bundle Optimization)
Sprint 4:             N3.6-N3.8 (Top Nav) + T4.5-T4.8 (Error Handling)
Sprint 5:             D5.1-D5.4 (Documentation) + T4.9-T4.10 (Tests)
Backlog:              S1.11 (CORS), P2.13-P2.16 (Caching), N3.9-N3.10 (Mobile)
```

---

## METRICI DE SUCCES POST-IMPLEMENTARE

| Metric | Actual | Țintă |
|---|---|---|
| Scor Securitate | 6/10 | 9/10 |
| Scor Performanță | 6/10 | 8/10 |
| Sidebar Items | 27 | ~20 (6 secțiuni) |
| P95 Latency | ~800ms | <300ms |
| Test Coverage | <5% | >30% |
| Bundle Size | TBD | -30% |

---

## TOTAL SARCINI

| Prioritate | Sarcini | Sesiuni Estimate |
|---|---|---|
| 🔴 Critic | 9 | 6-8 |
| 🟠 Important | 13 | 8-10 |
| 🟡 Mediu | 16 | 10-12 |
| 🟢 Minor | 10 | 6-8 |
| ⬜ Backlog | 2 | 4-6 |
| **TOTAL** | **50** | **~34-44 sesiuni** |
