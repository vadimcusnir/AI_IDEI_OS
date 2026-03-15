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

### 1.1 🔴 SEC-001: Edge Functions acceptă user_id din client
**Status:** PARȚIAL REZOLVAT — Multe funcții deja extrag din JWT, dar `extract-neurons`, `chunk-transcript`, `extract-guests`, `deep-extract` încă primesc `user_id` din body.

**Sarcini:**
- [ ] **S1.1** Audit toate edge functions — identifică cele care acceptă `user_id` din payload
- [ ] **S1.2** Modifică `extract-neurons` să extragă user_id din JWT via `supabase.auth.getUser(token)`
- [ ] **S1.3** Modifică `chunk-transcript` — elimină user_id din body, extrage din JWT
- [ ] **S1.4** Modifică `extract-guests` — elimină user_id din body
- [ ] **S1.5** Modifică `deep-extract` — elimină user_id din body
- [ ] **S1.6** Modifică `extract-insights` — elimină user_id din body
- [ ] **S1.7** Actualizează `Extractor.tsx` — trimite `session.access_token` în loc de anon key
- [ ] **S1.8** Actualizează `config.toml` — setează `verify_jwt = true` pentru funcțiile user-facing (nu pentru cele interne/webhook)
- [ ] **S1.9** Testează fiecare funcție cu credențiale valide și invalide

**Efort:** ~6-8 sesiuni | **Impact:** CRITIC

### 1.2 🟠 SEC-004: Leaked Password Protection
- [ ] **S1.10** Activează protecția parolelor compromise în setările de autentificare

**Efort:** 1 sesiune | **Impact:** MEDIU

### 1.3 🟡 SEC-006: CORS Wildcard
- [ ] **S1.11** Restricționează CORS la originile cunoscute (`ai-idei-os.lovable.app`, `ai-idei.com`)

**Efort:** 1 sesiune | **Impact:** SCĂZUT (defense-in-depth)

### 1.4 🟡 SEC-005: push_config fără RLS policies
- [ ] **S1.12** Documentează sau adaugă policies explicite pe `push_config`

**Efort:** 0.5 sesiuni | **Impact:** SCĂZUT

---

## FAZA 2: PERFORMANȚĂ & OPTIMIZARE

### 2.1 🟠 DB-001: Indexuri lipsă
**Sarcini:**
- [ ] **P2.1** Crează index `idx_neurons_author_updated ON neurons(author_id, updated_at DESC)`
- [ ] **P2.2** Crează index `idx_episodes_author_created ON episodes(author_id, created_at DESC)`
- [ ] **P2.3** Crează index `idx_entities_neuron_published ON entities(neuron_id) WHERE is_published = true`
- [ ] **P2.4** Crează index `idx_credit_tx_user_created ON credit_transactions(user_id, created_at DESC)`
- [ ] **P2.5** Crează index `idx_neuron_jobs_author_created ON neuron_jobs(author_id, created_at DESC)`
- [ ] **P2.6** Crează index `idx_neuron_jobs_status_active ON neuron_jobs(status) WHERE status NOT IN ('completed', 'failed')`

**Efort:** 1 sesiune (o singură migrație SQL) | **Impact:** MARE

### 2.2 🟠 BE-001: Procesare secvențială în pipeline AI
- [ ] **P2.7** Modifică `extract-neurons` să proceseze chunk-uri în paralel cu `Promise.all` (batch de 3-5)
- [ ] **P2.8** Modifică `generate-entities` să folosească batch queries în loc de N+1

**Efort:** 2-3 sesiuni | **Impact:** MARE

### 2.3 🟡 FE-001: Optimizare bundle
- [ ] **P2.9** Adaugă lazy loading pentru toate paginile cu `React.lazy` + `Suspense`
- [ ] **P2.10** Dynamic import pentru `react-force-graph-2d` (doar pe `/intelligence`)
- [ ] **P2.11** Dynamic import pentru `recharts` (doar pe paginile cu grafice)
- [ ] **P2.12** Verifică tree shaking și elimină importuri neutilizate

**Efort:** 2 sesiuni | **Impact:** MEDIU

### 2.4 🟡 FE-002: Memory leak KnowledgeGraph
- [ ] **P2.13** Adaugă cleanup în `useEffect` pentru `react-force-graph-2d` (destroy on unmount)
- [ ] **P2.14** Limitează numărul de noduri afișate (max 500) cu paginare

**Efort:** 1 sesiune | **Impact:** MEDIU

### 2.5 🟢 Caching TanStack Query
- [ ] **P2.15** Configurează `staleTime` global: 2 min pentru liste, 5 min pentru detalii
- [ ] **P2.16** Adaugă `gcTime` (garbage collection) pentru a reduce memoria

**Efort:** 1 sesiune | **Impact:** MEDIU

---

## FAZA 3: REDESIGN NAVIGAȚIE (Raport Meniu)

### 3.1 🟠 Restructurare Sidebar (de la 27 la ~20 items grupate în 6 secțiuni)
**Structură propusă:**

```
Dashboard (Home)
  ├── Dashboard
  ├── Recent Activity  
  └── Getting Started

Create (Studio)
  ├── Upload / Extractor
  ├── Neurons
  ├── Services (Generate)
  └── Templates

Explore (Library)
  ├── Library
  ├── Topics
  ├── Marketplace
  └── Guest Pages

Operate (Admin)
  ├── Jobs
  ├── Pipeline
  ├── API Access
  └── Chat AI

Account (Settings)
  ├── Profile
  ├── Credits
  ├── Notifications
  └── Feedback

Learn (Docs)
  ├── Documentation
  ├── Changelog
  └── Architecture
```

**Sarcini:**
- [ ] **N3.1** Redesign `AppSidebar.tsx` cu 6 secțiuni colapsabile
- [ ] **N3.2** Adaugă tooltips pe fiecare item sidebar (explicație plain-language)
- [ ] **N3.3** Implementează collapsed state (72px) cu iconuri
- [ ] **N3.4** Salvează preferință expanded/collapsed în localStorage
- [ ] **N3.5** Actualizează label-uri: Cockpit→Dashboard, Extractor→Extract, Intelligence→Insights

**Efort:** 3-4 sesiuni | **Impact:** MARE (UX)

### 3.2 🟡 Simplificare Top Navigation
- [ ] **N3.6** Elimină "Knowledge OS" label non-funcțional
- [ ] **N3.7** Adaugă breadcrumb dinamic bazat pe rută curentă
- [ ] **N3.8** Mută Global Search (Ctrl+K) în centrul header-ului

**Efort:** 2 sesiuni | **Impact:** MEDIU

### 3.3 🟢 Mobile Navigation Improvements
- [ ] **N3.9** Optimizează bottom nav pentru flow-ul propus
- [ ] **N3.10** Adaugă hamburger menu cu sidebar pe mobile

**Efort:** 1-2 sesiuni | **Impact:** MEDIU

---

## FAZA 4: VALIDARE & TESTING

### 4.1 🟡 BE-003: Input Validation cu Zod
- [ ] **T4.1** Adaugă Zod schemas în `extract-neurons`
- [ ] **T4.2** Adaugă Zod schemas în `chunk-transcript`
- [ ] **T4.3** Adaugă Zod schemas în `run-service`
- [ ] **T4.4** Adaugă Zod schemas în `neuron-chat`

**Efort:** 2 sesiuni | **Impact:** MEDIU

### 4.2 🟡 FE-003: Validare formulare frontend
- [ ] **T4.5** Adaugă Zod + react-hook-form pe formularele principale
- [ ] **T4.6** Standardizează mesajele de eroare (i18n)

**Efort:** 2 sesiuni | **Impact:** MEDIU

### 4.3 🟢 FE-004: Error handling consistent
- [ ] **T4.7** Adaugă empty states pe toate paginile cu liste
- [ ] **T4.8** Adaugă loading skeletons pe Dashboard, Library, Neurons

**Efort:** 2 sesiuni | **Impact:** MEDIU

### 4.4 ⬜ Teste automate
- [ ] **T4.9** Adaugă 10+ teste Vitest pentru hooks critice (useNeuron, useCreditBalance)
- [ ] **T4.10** Adaugă 5+ teste Playwright E2E (auth, extractor, marketplace)

**Efort:** 4-6 sesiuni | **Impact:** MARE (long-term)

---

## FAZA 5: DOCUMENTAȚIE

### 5.1 🟢 Documentație utilizator
- [ ] **D5.1** Crează pagina "Platform Overview" în docs
- [ ] **D5.2** Crează pagina "Core Concepts" (ce sunt Neuronii, cum funcționează pipeline-ul)
- [ ] **D5.3** Crează tutorial "First Extraction" (ghid pas-cu-pas)
- [ ] **D5.4** Expandează Glossary cu toate termenii platformei

**Efort:** 3-4 sesiuni | **Impact:** MEDIU (onboarding)

### 5.2 🟢 Sincronizare documentație tehnică
- [ ] **D5.5** Actualizează `DATABASE_SCHEMA.md` cu tabelele noi
- [ ] **D5.6** Actualizează `SECURITY_AUDIT.md` cu remedierile aplicate

**Efort:** 1-2 sesiuni | **Impact:** SCĂZUT

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
