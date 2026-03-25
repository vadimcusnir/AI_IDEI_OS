# TASK LIST & ROADMAP: AI-IDEI Platform
## Prioritizare si Planificare Dezvoltare

**Data:** 25 Martie 2026
**Bazat pe:** Audit Tehnic Complet
**Metodologie:** Impact/Effort Matrix + Risk Assessment

---

## SCHEMA DE PRIORITIZARE

### Clasificare Impact
- **HIGH (H):** Afecteaza revenue, securitate, sau >50% utilizatori
- **MEDIUM (M):** Imbunatateste experienta, afecteaza 20-50% utilizatori
- **LOW (L):** Nice-to-have, <20% utilizatori afectati

### Clasificare Effort
- **LOW (L):** <1 zi dezvoltare, schimbari minore
- **MEDIUM (M):** 1-3 zile dezvoltare, integrare moderata
- **HIGH (H):** >3 zile, arhitectura complexa sau dependencies multiple

---

## PHASE 0: CRITICAL - Blockers de Securitate
**Timeline:** IMEDIAT (24-48 ore)
**Owner:** Security + DevOps

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P0-001** | Fix CORS Wildcard in Edge Functions | SECURITY | HIGH | LOW | Inlocuieste toate utilizarile `corsHeaders` cu `getCorsHeaders(req)` in cele 65 Edge Functions | Toate request-urile validate contra whitelist |
| **P0-002** | Audit .env Exposure | SECURITY | HIGH | LOW | Verifica ca `.env` este in `.gitignore`, roteste cheile daca au fost expuse | Zero secrets in repository |
| **P0-003** | Rate Limiting Persistent | BACKEND | HIGH | MEDIUM | Migra rate limiting de la in-memory la Redis sau tabel Supabase pentru persistenta cross-instance | Rate limits aplicate consistent la scale |

### P0 Checklist
```
[ ] P0-001: Grep toate fisierele pentru `corsHeaders` import
[ ] P0-001: Inlocuieste cu getCorsHeaders(req)
[ ] P0-001: Test manual OPTIONS requests
[ ] P0-002: Verifica git history pentru .env
[ ] P0-002: Roteste SUPABASE keys daca necesar
[ ] P0-003: Creaza tabel `rate_limits` in Supabase
[ ] P0-003: Update extract-neurons sa foloseasca DB rate limiting
[ ] P0-003: Aplica pattern la alte functii sensibile
```

---

## PHASE 1: STABILIZATION - Calitate si Robustete
**Timeline:** Sprint 1-2 (2 saptamani)
**Owner:** Engineering Team

### 1.1 Backend Stabilization

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P1-001** | Optimize User Resolution in Stripe Webhook | BACKEND | MEDIUM | LOW | Inlocuieste `listUsers().find()` cu lookup direct sau cache | Webhook processing <100ms |
| **P1-002** | Add Error Tracking Coverage | BACKEND | MEDIUM | MEDIUM | Verifica integrarea Sentry in toate Edge Functions, adauga breadcrumbs | 100% error capture rate |
| **P1-003** | Implement Retry Logic for AI Calls | BACKEND | HIGH | MEDIUM | Adauga exponential backoff pentru Lovable AI Gateway | Zero pierderi din transient failures |
| **P1-004** | Database Connection Pooling Audit | DATA | MEDIUM | LOW | Verifica configurarea pool-ului Supabase, optimizeaza | Reducere connection errors |

### 1.2 Frontend Stabilization

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P1-005** | Split Large Components | FRONTEND | MEDIUM | MEDIUM | Descompune AdminDashboard.tsx (37KB), Home.tsx (40KB), MasterAgent.tsx (38KB) in sub-componente | Files <15KB, mai usor de mentinut |
| **P1-006** | Add Loading Skeletons Consistency | FRONTEND | LOW | LOW | Asigura toate paginile au skeleton loading states | UX consistent la load |
| **P1-007** | Error Boundary Testing | FRONTEND | MEDIUM | LOW | Verifica ErrorBoundary catches toate erorile, adauga recovery actions | Zero white screens of death |
| **P1-008** | Accessibility Audit - Contrast | UIUX | MEDIUM | LOW | Verifica contrast ratios pentru gold-oxide theme, fix violations | WCAG AA compliance |

### 1.3 Testing Infrastructure

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P1-009** | Unit Tests for Critical Hooks | FRONTEND | HIGH | HIGH | Adauga tests pentru useExecution, useCreditBalance, useAuth | >80% coverage pe hooks critice |
| **P1-010** | E2E Test Suite Expansion | FRONTEND | MEDIUM | HIGH | Extinde Playwright tests pentru flows: signup, extraction, payment | Regression detection automatizata |
| **P1-011** | API Integration Tests | BACKEND | MEDIUM | MEDIUM | Teste pentru Edge Functions: stripe-webhook, extract-neurons | Contract testing |

---

## PHASE 2: SCALING - Crestere si Optimizare
**Timeline:** Sprint 3-6 (4 saptamani)
**Owner:** Full Team

### 2.1 Performance Optimization

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P2-001** | Implement Virtual Scrolling | FRONTEND | MEDIUM | MEDIUM | Adauga virtualizare pentru liste lungi (neurons, library) cu @tanstack/react-virtual | Smooth scroll 1000+ items |
| **P2-002** | Image Optimization Pipeline | FRONTEND | LOW | MEDIUM | Implementeaza lazy loading + WebP conversion pentru imagini | LCP improvement |
| **P2-003** | Query Prefetching Strategy | FRONTEND | MEDIUM | LOW | Prefetch date probabile la hover/focus (neuron details, service info) | Perceived speed increase |
| **P2-004** | Edge Function Cold Start Optimization | BACKEND | MEDIUM | MEDIUM | Minimize dependencies, use pre-warming pentru functii critice | <500ms cold starts |

### 2.2 UX Improvements

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P2-005** | Onboarding Flow Enforcement | UIUX | HIGH | MEDIUM | Forteaza completarea onboarding pentru useri noi, track progress | +20% activation rate |
| **P2-006** | Guided Tour Implementation | UIUX | HIGH | HIGH | Adauga interactive tour pentru Command Center si Neuron Editor | Reducere support tickets |
| **P2-007** | Service Selection Wizard | UIUX | MEDIUM | MEDIUM | Inlocuieste catalog flat cu wizard pas-cu-pas bazat pe content type | +15% service usage |
| **P2-008** | Smart Defaults Engine | UIUX | MEDIUM | HIGH | Pre-selecteaza servicii/optiuni bazat pe comportament anterior | Reducere friction |
| **P2-009** | Keyboard Navigation Completeness | UIUX | LOW | MEDIUM | Asigura toate actiunile accesibile via keyboard | WCAG 2.1 compliance |

### 2.3 Feature Completion

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P2-010** | Offline Mode Basic Support | FRONTEND | LOW | HIGH | Cache neuroni local, sync la reconnect | Usage in low connectivity |
| **P2-011** | Export Functionality Expansion | FRONTEND | MEDIUM | MEDIUM | Adauga export PDF, DOCX, Markdown pentru artifacts | User convenience |
| **P2-012** | Notification Preferences Granular | FRONTEND | LOW | LOW | Permite control fin over email/push per event type | Reducere unsubscribes |

### 2.4 Backend Scaling

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P2-013** | Queue System for Heavy Operations | BACKEND | HIGH | HIGH | Implementeaza job queue pentru extractions, batch services | Reliability la load |
| **P2-014** | Database Query Optimization | DATA | MEDIUM | MEDIUM | Analizeaza slow queries, adauga indexes, optimizeaza RLS policies | P95 query time <100ms |
| **P2-015** | Caching Layer Implementation | BACKEND | MEDIUM | HIGH | Redis/Upstash pentru session data, rate limits, common queries | Reducere DB load 40% |

---

## PHASE 3: EXPANSION - Functionalitati Noi
**Timeline:** Sprint 7-12 (6 saptamani)
**Owner:** Product + Engineering

### 3.1 Knowledge Graph Enhancement

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P3-001** | Vector Embeddings Integration | BACKEND | HIGH | HIGH | Adauga pgvector, generare embeddings pentru neurons | Semantic search functional |
| **P3-002** | Semantic Search UI | FRONTEND | HIGH | MEDIUM | Interfata pentru search "similar to this neuron" | Discovery imbunatatita |
| **P3-003** | Graph Clustering Algorithms | BACKEND | MEDIUM | HIGH | Implementeaza community detection pentru topic clusters | Auto-organization |
| **P3-004** | Cross-Episode Connections | BACKEND | MEDIUM | MEDIUM | Detecteaza si vizualizeaza conexiuni intre episodes diferite | Knowledge synthesis |

### 3.2 Collaboration Features

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P3-005** | Team Workspaces | BACKEND | HIGH | HIGH | Multi-user access la workspace, role permissions | B2B enablement |
| **P3-006** | Real-time Collaboration | FRONTEND | MEDIUM | HIGH | Presence indicators, concurrent editing awareness | Team productivity |
| **P3-007** | Commenting System | FRONTEND | MEDIUM | MEDIUM | Comments pe neurons, artifacts pentru feedback | Review workflows |
| **P3-008** | Activity Feed | FRONTEND | LOW | MEDIUM | Timeline activitati workspace pentru team awareness | Engagement |

### 3.3 API & Integrations

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P3-009** | Public API v2 with OAuth | BACKEND | HIGH | HIGH | OAuth 2.0 pentru third-party apps, extended endpoints | Developer ecosystem |
| **P3-010** | Zapier/Make Templates | BACKEND | MEDIUM | MEDIUM | Pre-built automation templates pentru common workflows | No-code integration |
| **P3-011** | Webhook Reliability Upgrade | BACKEND | MEDIUM | MEDIUM | Retry logic, dead-letter queue, delivery monitoring | Enterprise reliability |
| **P3-012** | Chrome Extension | FRONTEND | MEDIUM | HIGH | Capture content direct din browser | Acquisition channel |

### 3.4 Mobile Experience

| ID | Titlu | Layer | Impact | Effort | Descriere | Rezultat Asteptat |
|----|-------|-------|--------|--------|-----------|-------------------|
| **P3-013** | PWA Implementation | FRONTEND | MEDIUM | MEDIUM | Service worker, offline, install prompt | Mobile engagement |
| **P3-014** | React Native MVP | FRONTEND | HIGH | HIGH | Native app cu core flows: view, quick capture | Market expansion |
| **P3-015** | Voice Input Integration | FRONTEND | LOW | MEDIUM | Capture audio direct pentru transcription | Mobile convenience |

---

## DEPENDENCY MAP

```
P0-003 (Rate Limit Persistent)
    |
    +---> P2-015 (Caching Layer)
              |
              +---> P2-013 (Queue System)

P1-009 (Unit Tests)
    |
    +---> P1-010 (E2E Tests)
              |
              +---> CI/CD Confidence

P2-005 (Onboarding) + P2-006 (Guided Tour)
    |
    +---> Activation Rate Improvement
              |
              +---> P2-007 (Service Wizard)

P3-001 (Vector Embeddings)
    |
    +---> P3-002 (Semantic Search)
              |
              +---> P3-003 (Graph Clustering)
                        |
                        +---> P3-004 (Cross-Episode)

P3-005 (Team Workspaces)
    |
    +---> P3-006 (Real-time Collab)
              |
              +---> P3-007 (Comments)
```

---

## RESOURCE ALLOCATION

### Echipa Recomandata per Faza

| Faza | Frontend | Backend | DevOps | Design | QA |
|------|----------|---------|--------|--------|-----|
| **P0** | 0 | 1 | 1 | 0 | 0 |
| **P1** | 2 | 1 | 0.5 | 0.5 | 1 |
| **P2** | 2 | 2 | 0.5 | 1 | 1 |
| **P3** | 3 | 3 | 1 | 1 | 2 |

### Timeline Overview

```
Mar 2026  |===P0===|
          |========P1========|
Apr 2026            |================P2================|
May 2026                      |
Jun 2026                      |============================P3============================|
Jul 2026                                                                                  |
```

---

## METRICI DE TRACKING

### Per Faza Completion Criteria

**Phase 0 Complete When:**
- [ ] Zero CORS wildcards in production
- [ ] Secrets audit passed
- [ ] Rate limiting functional la scale

**Phase 1 Complete When:**
- [ ] All components <20KB
- [ ] Test coverage >60% pe critical paths
- [ ] Error rate <0.1%

**Phase 2 Complete When:**
- [ ] Activation rate +20%
- [ ] P95 latency <1s
- [ ] NPS score tracked

**Phase 3 Complete When:**
- [ ] Semantic search live
- [ ] Team workspaces beta
- [ ] API v2 documented

---

## RISK REGISTER

| Task ID | Risk | Mitigation |
|---------|------|------------|
| P0-001 | Breaking changes in API responses | Test all frontends post-deploy |
| P1-009 | Test writing slower than expected | Prioritize critical paths only |
| P2-013 | Queue complexity underestimated | Start with simple FIFO, iterate |
| P3-001 | pgvector performance at scale | Benchmark with realistic data first |
| P3-005 | Permission model complexity | Design doc before implementation |
| P3-014 | Mobile dev skills gap | Consider contractor/agency |

---

## DECISION LOG

| Data | Decizie | Ratiune | Alternativa Respinsa |
|------|---------|---------|----------------------|
| 2026-03-25 | P0 CORS fix prioritar | Security > features | Waiting for next sprint |
| 2026-03-25 | Rate limit in DB not Redis | Reduce infrastructure | Managed Redis |
| 2026-03-25 | Onboarding before new features | Activation > acquisition | Feature parity |
| 2026-03-25 | Team workspaces in P3 | Technical debt first | Earlier release |

---

## APPENDIX: Quick Reference

### High Impact / Low Effort (DO FIRST)
- P0-001: CORS Fix
- P0-002: .env Audit
- P1-001: User Resolution Optimize
- P1-008: Contrast Audit
- P2-003: Query Prefetching

### High Impact / High Effort (PLAN CAREFULLY)
- P1-009: Unit Tests
- P2-005: Onboarding Flow
- P2-006: Guided Tour
- P3-001: Vector Embeddings
- P3-005: Team Workspaces
- P3-014: Mobile App

### Low Impact / Low Effort (FILL GAPS)
- P1-006: Loading Skeletons
- P2-012: Notification Preferences

### Low Impact / High Effort (AVOID/DEFER)
- P2-010: Offline Mode (defer to P3)
- P3-015: Voice Input (defer to post-P3)

---

**Document generat:** 25 Martie 2026
**Urmatoarea revizie:** Dupa completarea Phase 0
**Contact:** engineering@ai-idei.com
