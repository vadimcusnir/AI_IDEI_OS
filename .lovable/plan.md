
# AI-IDEI OS — Plan Master de Implementare v2.0

> Generat: 2026-04-08 | Surse: 09_Update_Site.txt (4641 linii), 09_service_backend_logic.txt (1142 linii), 10_admin.txt (191 linii)
> Cross-referențiat cu codebase-ul actual (258 tabele, 701 politici, 88 triggere, 90+ rute)

---

## REZUMAT EXECUTIV

Specificațiile definesc transformarea platformei dintr-un „site de prompts" într-un **Knowledge Extraction OS** cu 3 motoare paralele:

1. **Service Engine** — monetizează lipsurile (L3→L2→L1)
2. **Asset Engine** — monetizează ce deține userul (Library→Marketplace)
3. **Identity/OS Engine** — extrage profil cognitiv → Personal OS → AI Double

Arhitectura actuală acoperă **~40%** din viziune. Există deja: neurons, pipeline AI, credite, marketplace basic, chat, extractor. Lipsesc: ierarhia L3/L2/L1, service catalog structurat, deliverable library, execution prompts secrete, gap detection, progressive upsell, Personal OS, AI Twin.

---

## FAZE DE IMPLEMENTARE

### FAZA 0: STABILIZARE & SECURITATE (P0 — Imediat)
**Obiectiv:** Remediază problemele critice din auditul admin (10_admin.txt)

| # | Task | Prioritate | Status Actual |
|---|------|-----------|---------------|
| 0.1 | Fix RLS: credit_transactions INSERT — adaugă WITH CHECK admin-only | P0 | ✅ REZOLVAT |
| 0.2 | Fix RLS: neuron_jobs INSERT — schimbă din public în authenticated | P0 | ✅ REZOLVAT |
| 0.3 | Fix RLS: admin_alerts INSERT — adaugă WITH CHECK admin-only | P0 | ⚠️ DE VERIFICAT |
| 0.4 | Fix RLS: dynamic_pricing_log DELETE — restricționează | P1 | ⚠️ DE VERIFICAT |
| 0.5 | Investigare job queue blocat (355 pending, 0 completed) | P0 | 🔴 NEREZOLVAT |
| 0.6 | Fix agent_plan_templates ALL policy WITH CHECK | P0 | ✅ REZOLVAT |

**Fișiere:** Migrații SQL

---

### FAZA 1: SERVICE CATALOG DATABASE (Fundament)
**Obiectiv:** Creează cele 3 tabele de servicii + tabele secrete de execuție

#### 1.1 Tabele noi de servicii
```
services_level_3 — servicii atomice (one-time execution)
  - service_id (UUID PK)
  - service_name, service_slug, category, subcategory
  - description_public, description_internal
  - price_usd, internal_credit_cost, production_cost_usd
  - deliverable_name, deliverable_type
  - estimated_delivery_time
  - execution_prompt_id (FK → execution_prompts)
  - formation_framework_id (FK → formation_frameworks)
  - status, visibility
  - created_at, updated_at

services_level_2 — clustere compuse
  - Toate câmpurile L3 +
  - component_level_3_service_ids (UUID[])
  - component_selection_logic (JSONB)
  - component_execution_order (JSONB)

services_level_1 — servicii master premium
  - Toate câmpurile L2 +
  - component_level_2_service_ids (UUID[])
  - component_level_3_service_ids_optional (UUID[])
  - final_delivery_assembly_logic (JSONB)
  - master_deliverables (JSONB)
  - output_types (TEXT[])
```

#### 1.2 Tabele secrete de execuție
```
execution_prompts
  - execution_prompt_id (UUID PK)
  - internal_name
  - prompt_text_encrypted (TEXT) — conținut secret
  - prompt_version
  - linked_service_id, linked_service_level
  - execution_type
  - quality_rules (JSONB)
  - created_at, updated_at

formation_frameworks
  - formation_framework_id (UUID PK)
  - internal_name
  - framework_logic_encrypted (TEXT)
  - linked_service_id, linked_service_level
  - assembly_rules (JSONB)
  - adaptation_rules (JSONB)
  - created_at, updated_at
```

#### 1.3 RLS Policies
- `services_level_*`: SELECT public pentru `visibility = 'public'`, CRUD admin-only
- `execution_prompts` & `formation_frameworks`: **ZERO acces public** — doar admin + service role
- Coloana `prompt_text_encrypted` REVOKE SELECT de la authenticated

#### 1.4 Seed Data
- Populare cu exemple din spec: Titlu 4U ($9), Articol SEO ($39), Email ($14)
- L2: Pre-Webinar Email Sequence ($79), Telegram Event Posts ($69)
- L1: Webinar Cap-Coadă ($399), Curs ($990), Market Research ($590)

**Fișiere noi:** Migrație SQL, `src/types/services.ts`
**Efort estimat:** 2-3 sesiuni

---

### FAZA 2: SERVICE CATALOG UI
**Obiectiv:** Pagini frontend pentru vizualizarea și achiziția serviciilor

#### 2.1 Pagina Service Catalog (`/services` — redesign)
- Afișare ierarhică: L1 ca „Master Systems", L2 ca „Service Packs", L3 ca „Quick Services"
- Card design: nume, descriere, preț USD, cost neuroni, deliverable, CTA
- Filtrare pe category, level, preț
- Tab-uri sau secțiuni separate per nivel

#### 2.2 Service Detail Page (`/services/:slug`)
- Descriere completă, deliverables, preț, cost estimat
- Compoziție vizibilă: ce L3 conține un L2, ce L2 conține un L1
- CTA „Cumpără cu X Neuroni" sau „Cumpără cu $"
- Preview deliverable type

#### 2.3 Purchase Flow
- Integrare cu `user_credits` / wallet existent
- Deducere neuroni → creare purchase record → trigger execution
- UI de confirmare cu preț, cost, balance before/after

#### 2.4 Service Recommendation Engine (Chat-first)
- În Command Center: detectează intenția userului
- Recomandă L3 pentru cereri singulare, L2 pentru clustere, L1 pentru cap-coadă
- Integrare cu `intent-router` edge function existent

**Fișiere noi:** `src/pages/ServiceCatalog.tsx`, `src/pages/ServiceDetail.tsx`, `src/components/services/ServiceCard.tsx`, `src/components/services/ServiceHierarchy.tsx`, `src/components/services/PurchaseFlow.tsx`, `src/hooks/useServiceCatalog.ts`
**Fișiere modificate:** `src/routes/publicRoutes.tsx`, `src/routes/protectedRoutes.tsx`
**Efort estimat:** 3-4 sesiuni

---

### FAZA 3: EXECUTION ENGINE & DELIVERABLES
**Obiectiv:** Pipeline-ul ascuns de execuție a serviciilor

#### 3.1 Tabele noi
```
service_purchases
  - purchase_id, user_id, service_id, service_level
  - price_usd_snapshot, neuroni_cost_snapshot
  - payment_status, execution_status
  - purchased_at, completed_at

service_deliverables
  - deliverable_id, linked_purchase_id, linked_service_id
  - deliverable_name, deliverable_type
  - file_path_or_storage_key
  - generated_at, update_type, status
  - classification_tags (TEXT[])
  - user_id
```

#### 3.2 Edge Function: `execute-service`
- Primește `purchase_id` + `service_id`
- Lookup `execution_prompts` + `formation_frameworks` (server-side only)
- Execuție via Lovable AI (model selectat per complexity)
- Generare deliverable → Storage upload → Update status
- Pentru L2/L1: orchestrare secvențială a componentelor L3

#### 3.3 User Library Enhancement (`/library` — redesign)
- Livrabilele generate se adaugă automat
- Clasificare pe: file_type, service originar, dată, update_type
- Preview, download, reuse
- Vizibilitate: private (default), public profile, marketplace

**Fișiere noi:** `supabase/functions/execute-service/index.ts`, `src/hooks/useServicePurchase.ts`, `src/hooks/useDeliverables.ts`
**Fișiere modificate:** Library page existentă
**Efort estimat:** 4-5 sesiuni

---

### FAZA 4: GAP DETECTION & PROGRESSIVE UPSELL
**Obiectiv:** Motorul de detectare lipsuri și ofertă progresivă

#### 4.1 Gap Detection Engine
- Analizează neuronii extrași din materialele userului
- Detectează:
  - Prompturi parțiale (3 din 18 estimat)
  - Instrucțiuni fragmentare (2 din 180 estimat)
  - Framework-uri disparate fără taxonomie
- Output: scor completitudine, cluster existent vs. estimat, propunere completare

#### 4.2 Completion Offer System
- Notificări in-app: „Ai 3 din 18 prompturi. Completează procesul."
- 5 niveluri de ofertă:
  1. Fragment Completion
  2. Structured System Delivery
  3. Automation Conversion
  4. Expert Agent Conversion
  5. Monitoring & Operationalization
- Fiecare ofertă ancorată în fragment detectat real

#### 4.3 Cross-Sell / Upsell Engine
- Propuneri automate bazate pe gap-uri:
  - Completion → Unification → Automation → Agent → OS → Marketplace
- UI: card de recomandare în dashboard și library
- Dismiss / Snooze / Save for later

**Fișiere noi:** `src/hooks/useGapDetection.ts`, `src/components/upsell/CompletionOfferCard.tsx`, `src/components/upsell/UpsellNotifications.tsx`, Edge function `gap-analysis`
**Efort estimat:** 3-4 sesiuni

---

### FAZA 5: ASSET MONETIZATION ENGINE
**Obiectiv:** Userul poate monetiza asseturile proprii

#### 5.1 Rights & Licensing Layer
- Stări de licență per asset:
  - private_use_only
  - commercial_use
  - public_display
  - resell_on_marketplace
  - white_label_allowed
- Separare strictă: service ≠ asset ≠ resale_license

#### 5.2 Commercialization Check
- Verificare drepturi, structură, conflict
- Conflict Detection Engine: scoring overlap cu servicii platformă
  - no_conflict → allow
  - moderate_overlap → allow_with_limits
  - high_overlap → restrict
  - forbidden_substitution → block

#### 5.3 Distribution Channels
- Private Workspace (default)
- Public Profile Display
- Paid Pages / Subscription Vault
- Marketplace Listing
- Commission Engine: % per tranzacție, seller payout

#### 5.4 Anti-Conflict Architecture
- Marketplace nu substituie serviciile premium
- Asset-uri personalizate rămân private sau restricted
- Upsell links de la marketplace către servicii

**Fișiere noi:** `src/components/library/LicensingControls.tsx`, `src/components/library/CommercializationCheck.tsx`, `src/hooks/useAssetMonetization.ts`
**Fișiere modificate:** Marketplace pages existente
**Efort estimat:** 3-4 sesiuni

---

### FAZA 6: USER MODEL & PERSONAL OS
**Obiectiv:** Extragere identitate cognitivă → OS Personal

#### 6.1 User Model Extraction Engine
- Extrage din materialele userului (paralel cu service extraction):
  - Portret psihologic operațional
  - Logică cognitivă
  - Model de rezolvare probleme
  - Limbaj și expresie (tone of voice)
  - Semnătură de knowledge
  - Dark patterns & limite
  - Identitate operațională
- Output: Identity Neurons normalizate

#### 6.2 Profile Gap Engine
- Detectează dimensiuni lipsă din profil
- Propune completări contra cost
- Ex: „Există semnale despre ton, dar lipsește cartografierea completă"

#### 6.3 Personal OS Builder
- Unifică: identity + knowledge + execution + adaptation + monetization
- Componente OS:
  - Identity Layer (psihologic, cognitiv, ton, valori)
  - Knowledge Layer (frameworks, formule, metode)
  - Execution Layer (workflows, decision rules)
  - Adaptation Layer (memory, learning, preferences)
  - Monetization Layer (offer logic, asset logic)
- Output: OS Map, Operating Manual, Prompt Core, Decision System

#### 6.4 AI Twin Engine (Flagship Premium)
- Transformă Personal OS în agent AI care:
  - Răspunde ca userul
  - Decide în limitele definite
  - Generează cu framework-urile userului
  - Menține tonul userului
  - Aplică formulele userului
- Safeguards: bounded autonomy, confirmation gates, override

**Fișiere noi:** Edge functions `extract-identity`, `build-personal-os`, `ai-twin-engine`; `src/pages/PersonalOS.tsx`, `src/pages/AITwin.tsx`, `src/hooks/usePersonalOS.ts`, `src/hooks/useAITwin.ts`
**Efort estimat:** 5-6 sesiuni

---

### FAZA 7: STANDARD AUGMENTATION MODULES
**Obiectiv:** Module de augmentare care reduc fricțiunea

#### 7.1 Memory Module
- Salvează: preferences, goals recurente, active, process states
- Recall automat la următoarea interacțiune

#### 7.2 Auto-Learning Module
- Detectează schimbări repetate, evoluție preferințe
- Rafinează pattern-uri de răspuns

#### 7.3 Adaptation Module
- Adaptare ton, structură, complexitate, format per user

#### 7.4 Personalization Module
- Defaults preferate, templates preselectate
- Predicted next needs, context-aware suggestions

#### 7.5 Friction Reduction Engine
- Obiectiv: comprimă interacțiunea la 1 întrebare + 1 click
- Context prefill, inferred intent, one-click confirmations
- Auto-attached relevant assets

**Fișiere noi:** `src/hooks/useMemory.ts`, `src/hooks/useAdaptation.ts`, `src/hooks/usePersonalization.ts`
**Efort estimat:** 3-4 sesiuni

---

### FAZA 8: ADMIN COMMAND CENTER UPGRADE
**Obiectiv:** Transformă /admin din consolă decorativă în centru executiv

#### 8.1 Service Management
- Admin CRUD pe services_level_1/2/3
- Vizualizare și editare compoziție ierarhică
- Gestionare execution_prompts și formation_frameworks
- Preview pricing & cost

#### 8.2 Job Queue Fix
- Investigare de ce 355 job-uri sunt blocate în pending
- Implementare re-run, cancel, retry din admin
- Status monitoring real-time

#### 8.3 Revenue Dashboard Real
- Conectare la Stripe real (nu estimări din credite)
- MRR, ARPU, revenue by service level
- Cost tracking (LLM API costs)

#### 8.4 Operational Monitoring
- Telegram bot pentru alerte (opțional, P2)
- Feedback collection pipeline funcțional
- Incident management cu date reale

#### 8.5 Content Management
- Editare landing/pricing/docs din admin (nu hardcoded TSX)
- SEO fields editabile
- Notification templates editabile

**Fișiere modificate:** `src/pages/admin/*`, tab-uri admin existente
**Efort estimat:** 4-5 sesiuni

---

### FAZA 9: WORKSPACE & VISIBILITY
**Obiectiv:** Governance complet pentru workspace privat și suprafață publică

#### 9.1 Private Hidden Workspace
- Conține tot: raw, neuroni, drafturi, portret psihologic, assets private
- Default = privat, vizibil doar userului

#### 9.2 Public Surface Controls
- Userul aprobă explicit ce devine public
- Flow: selecție → licențiere → ambalare → pricing → tagging comercial

#### 9.3 Public Profile Integration
- Afișare: assets publice, bundles, marketplace listings, subscription offers
- Funcții: credibility display, seller identity, lead generation

**Fișiere noi:** `src/pages/Workspace.tsx`, `src/components/workspace/VisibilityControls.tsx`
**Efort estimat:** 2-3 sesiuni

---

## ORDINE DE EXECUȚIE RECOMANDATĂ

```
SPRINT 1 (Urgent):     Faza 0 (Stabilizare) + Faza 1.1-1.3 (DB Services)
SPRINT 2:              Faza 1.4 (Seed) + Faza 2.1-2.2 (Catalog UI)
SPRINT 3:              Faza 2.3-2.4 (Purchase + Recommendation) + Faza 3.1 (DB)
SPRINT 4:              Faza 3.2-3.3 (Execution Engine + Library)
SPRINT 5:              Faza 4 (Gap Detection + Upsell)
SPRINT 6:              Faza 5 (Asset Monetization)
SPRINT 7:              Faza 8.1-8.2 (Admin Services + Job Fix)
SPRINT 8:              Faza 6.1-6.2 (User Model + Gap)
SPRINT 9:              Faza 6.3-6.4 (Personal OS + AI Twin)
SPRINT 10:             Faza 7 (Augmentation Modules)
SPRINT 11:             Faza 8.3-8.5 (Admin Revenue + Content)
SPRINT 12:             Faza 9 (Workspace + Visibility)
```

---

## MAPPING SPECIFICAȚIE → CODEBASE EXISTENT

| Concept din Spec | Implementare Actuală | Gap |
|---|---|---|
| Neuron | ✅ `neurons` table (390 rows) | Lipsesc tipuri extinse (cognitive, psychological) |
| Service L3/L2/L1 | ❌ `service_catalog` flat | Trebuie 3 tabele ierarhice |
| Execution Prompts | ❌ Nu există | Trebuie tabel secret |
| Formation Frameworks | ❌ Nu există | Trebuie tabel secret |
| Deliverables | ⚠️ `artifacts` partial | Trebuie `service_deliverables` dedicat |
| User Library | ⚠️ `/library` basic | Trebuie clasificare pe service/type/date |
| Purchases | ⚠️ `credit_transactions` generic | Trebuie `service_purchases` dedicat |
| Wallet/Credits | ✅ `user_credits` + spend/add RPCs | Funcțional |
| Marketplace | ✅ `knowledge_assets` + reviews | Lipsește anti-conflict + licensing |
| Chat-first | ✅ Command Center | Lipsește service recommendation |
| User Profile | ⚠️ `profiles` basic | Lipsește portret psihologic extins |
| Personal OS | ❌ Nu există | Trebuie complet |
| AI Twin | ❌ Nu există | Trebuie complet |
| Gap Detection | ❌ Nu există | Trebuie complet |
| Upsell Engine | ❌ Nu există | Trebuie complet |
| Memory Module | ❌ Nu există | Trebuie complet |
| Admin Job Control | ⚠️ Citire-only | Trebuie re-run/cancel |

---

## METRICI DE SUCCES

| Metric | Actual | Țintă Post-Implementare |
|---|---|---|
| Service Catalog Levels | 1 (flat) | 3 (L3/L2/L1) |
| Admin Maturity | 2/5 | 4/5 |
| Admin Reality Score | 30/100 | 70/100 |
| Security Score | 52/100 | 85/100 |
| Revenue Tracking | Estimat din credite | Stripe real |
| Job Completion Rate | 0% | >90% |
| Gap Detection | 0 | Activ pe toate materialele |
| Personal OS Users | 0 | Disponibil |
| Time to First Value | >5 min | <60 sec |

---

## TOTAL ESTIMARE

| Fază | Sesiuni Estimate |
|---|---|
| Faza 0: Stabilizare | 1-2 |
| Faza 1: Service DB | 2-3 |
| Faza 2: Catalog UI | 3-4 |
| Faza 3: Execution Engine | 4-5 |
| Faza 4: Gap Detection | 3-4 |
| Faza 5: Asset Monetization | 3-4 |
| Faza 6: Personal OS + AI Twin | 5-6 |
| Faza 7: Augmentation | 3-4 |
| Faza 8: Admin Upgrade | 4-5 |
| Faza 9: Workspace | 2-3 |
| **TOTAL** | **~30-40 sesiuni** |

---

## PRINCIPII ARHITECTURALE CHEIE

1. **service ≠ asset ≠ resale_license** — separare strictă
2. **User vede deliverable, nu prompt** — execution core secret
3. **Default = privat** — nimic public fără acțiune explicită
4. **Chat-first, output-first** — fricțiune minimă
5. **3 motoare paralele** pe aceeași unitate atomică (neuronul)
6. **Progressive upsell** — fiecare ofertă ancorată în gap real detectat
7. **Anti-conflict** — marketplace nu substituie serviciile premium
