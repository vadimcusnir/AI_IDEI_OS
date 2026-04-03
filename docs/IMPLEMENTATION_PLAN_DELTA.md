# PLAN DE IMPLEMENTARE — DELTA AUDIT vs SITE ACTUAL

**Data**: 2026-04-03
**Surse auditate**: 8 fișiere (admin_audit, security_report, servicii×3, standard, cusnir_os, site_upgrade_global, lovable_notes)
**Metodă**: Comparare completă specs → cod/DB curent → delta → plan prioritizat

---

## EXECUTIVE SUMMARY

| Domeniu | Spec | Implementat | Gap |
|---------|------|-------------|-----|
| Service Catalog | 700+ OTOS atomice pe 40+ axe | 3157 intrări cu date corupte (JSON fragmente ca nume) | **CRITIC** |
| OTOS/MMS/LCSS Architecture | Tabele + indexare + scoring + gating | Tabele există, 0 date | **CRITIC** |
| Service Manifests | Schema input/output per serviciu | Tabel există, 0 date | **CRITIC** |
| Security (SSRF) | Auth + IP blocklist | ✅ IMPLEMENTAT | — |
| Security (Rate Limiter) | Fail-closed | ✅ IMPLEMENTAT | — |
| Admin Dashboard | Split God component, lazy-load per tab | 280 linii (redus de la 622), tab-uri grupate | ✅ PARȚIAL |
| Command Center | Chat-first, shell stabil | 36 componente, layout refactorizat | ✅ PARȚIAL |
| Step Back Engine | Compiler automat OTOS→MMS→LCSS | Neimplementat | **MAJOR** |
| AIAS Standard | 7 faze de integrare invizibilă | Neimplementat | **MAJOR** |
| Automation/Scheduling | Recurring jobs, scheduled pipelines | Nicio tabelă, niciun UI | **MAJOR** |
| Mail Ingest | Email→Extraction pipeline | Neimplementat | MEDIUM |
| Cusnir OS | Full governance layer cu module | Tabele + hooks exist, module registry parțial | PARȚIAL |
| Scoring Engine | 5-metric per OTOS, tiers S/A/B/C | Neimplementat pe OTOS | **MAJOR** |
| Service Indexing | [intent]-[domain]-[output]-[complexity]-[impact] | Neimplementat | **MAJOR** |
| Connectors Hub | 8+ integrări externe | Neimplementat | MEDIUM |
| Skills Registry | Workflow-uri atomice reutilizabile | Neimplementat | MEDIUM |
| Mode Panels | 6 moduri contextuale sub composer | InlineServiceSuggestions parțial | **MAJOR** |
| Control Plane Shell | Settings/Account/Usage ca modale fullscreen | Settings există ca pagini, nu ca modale | MEDIUM |
| MMS Evaluation Scoring | P/S/C scoring tri-axial | Neimplementat | MEDIUM |

---

## PROBLEME CRITICE DESCOPERITE

### 1. SERVICE CATALOG CORUPT (P0-BLOCKER)

**Stare actuală**: 3157 servicii cu nume care sunt fragmente JSON, bucăți de specificație, și text explicativ — NU servicii atomice.

Exemple de „servicii" actuale:
- `"Clarity" reduce efortul de procesare; processing fluency...`
- `"composition": {`
- `{"id":"MMS_101","name":"Cold Lead Activation System"...}`

**Cauza**: Textul specificațiilor OTOS/MMS a fost inserat direct ca `name` în `service_catalog` în loc de a fi procesat, parsat și distribuit în tabelele `os_otos`, `os_mms`, `os_lcss`.

**Impact**: Utilizatorii văd zgomot incomprehensibil în catalogul de servicii. Niciun serviciu nu poate fi executat corect.

### 2. OTOS/MMS/LCSS GOALE (P0-BLOCKER)

Tabelele `os_otos`, `os_mms`, `os_lcss` există dar au **0 înregistrări**. Toată arhitectura de servicii atomice descrisă în cele 3 fișiere de servicii (~7000+ linii) nu a fost populată.

### 3. SERVICE MANIFESTS GOALE (P0)

Tabela `service_manifests` (input schema, output schema, pipeline steps) are **0 înregistrări**. Fără manifeste, Edge Function `run-service` nu poate genera formulare de input sau valida output-uri.

---

## PLAN DE IMPLEMENTARE PRIORITIZAT

### FAZA 0 — CURĂȚARE CRITICĂ (Săptămâna 1)

#### T0.1 — Curățare service_catalog
- **Acțiune**: Ștergere completă a celor 3157 de intrări corupte
- **Migrație SQL**: `DELETE FROM service_catalog WHERE ...` (păstrează doar serviciile originale valide dacă există)
- **Risc**: Zero — datele curente sunt inutilizabile

#### T0.2 — Populare OTOS din specificație
- **Sursă**: Fișierele 01/02 SERVICII (40+ axe × 15 formule = ~700 OTOS)
- **Schema per OTOS**: `{name, mechanism, axa, output_type, intent, domain, complexity_level, impact_band, index_code}`
- **Scoring**: Aplicare model 5-metric (conversion_power, frequency, perceived_value, complexity, leverage)
- **Tier assignment**: S (9-10) / A (7.5-8.9) / B (6-7.4) / C (<6)
- **Cost neurons**: C=2-5, B=5-11, A=11-20, S=20-38 (Root2 validated)

#### T0.3 — Populare MMS din specificație
- **Schema**: `{name, intent, composition: otos_ids[], execution_order, scoring_PSC}`
- **Scoring**: P (psihologic) + S (social) + C (comercial), ponderi 0.45/0.25/0.30
- **Ordinea obligatorie**: Hook → Clarity → Value → Objection → Trust → CTA

#### T0.4 — Populare LCSS
- **Schema**: `{name, macro_intent, phases: mms_ids[], required_layers: [acquisition, conversion, monetization, retention]}`

#### T0.5 — Regenerare service_catalog din OTOS
- **Acțiune**: Fiecare OTOS devine o intrare validă în `service_catalog` cu:
  - `name` = denumirea formulei
  - `credits_cost` = Root2-valid
  - `service_class` = bazat pe tier
  - `description` = ce output produce
  - `service_key` = slug unic

### FAZA 1 — INFRASTRUCTURĂ SERVICII (Săptămâna 2-3)

#### T1.1 — Populare service_manifests
- **Per serviciu**: input_schema (JSON schema), output_schema, pipeline_steps, cost_base, cost_multiplier, preview_config
- **Generare**: Script care derivă manifest din OTOS metadata + prompt template

#### T1.2 — Service Indexing System
- **Implementare**: Dimensiuni de indexare pe `os_otos`:
  - `intent`: attract / convert / monetize / retain / scale
  - `domain`: copy / product / business / ai / system / data / perception
  - `output_type`: hook / headline / cta / decision / structure / mapping / validation
  - `complexity`: L1 / L2 / L3
  - `impact_band`: low / medium / high / critical
- **Format cod**: `[intent]-[domain]-[output]-[complexity]-[impact]`
- **UI**: Filtru multi-dimensional în Service Picker

#### T1.3 — Scoring Engine per OTOS
- **Metrici**: conversion_power (0.30), frequency_of_use (0.20), perceived_value (0.20), implementation_complexity (0.10), leverage_effect (0.20)
- **Formula**: `total_score = Σ(metric × weight)`
- **UI**: Badge S/A/B/C pe fiecare serviciu, sortare by score

#### T1.4 — Bundle Engine (MMS as Product)
- **Logică**: 1 MMS = 1 bundle de 3-6 OTOS
- **Pricing**: discount 15-25% vs sum OTOS individuale
- **UI**: „Pachete recomandate" în Service Picker

### FAZA 2 — COMMAND CENTER MODE PANELS (Săptămâna 3-4)

#### T2.1 — Mode Chip Bar sub Composer
- **6 moduri P0**: Extract, Generate, Structure, Monetize, Library, Research
- **4 moduri P1**: Publish, Compare, Automate, Marketplace
- **Comportament**: Selectare mod → afișare panel contextual specific

#### T2.2 — Extract Panel
- Drag & drop zone, source buttons (audio/video/text/URL)
- Estimated NEURONS, estimated units
- Recent raw sources

#### T2.3 — Generate Panel
- Output families, recent templates
- "Build from selected neurons"
- Multi-output bundle suggestions

#### T2.4 — Monetize Panel
- Package as asset, publish to marketplace
- Price recommendation (Root2), licensing mode
- Buyer view preview

#### T2.5 — Library/Structure/Research Panels
- Framework grouping, taxonomy, filters
- Source connectors, compare outputs

### FAZA 3 — ADMIN DASHBOARD COMPLETARE (Săptămâna 4-5)

#### T3.1 — Tab-uri inline rămase
- **Verificare**: Neurons tab, Jobs tab, Services tab, Logs tab — sunt extrase ca componente separate?
- **Acțiune**: Dacă nu, extrage în `AdminNeuronsTab.tsx`, `AdminJobsTab.tsx`, etc.

#### T3.2 — Paginare universală
- Neurons: paginare server-side (nu limit(50) hardcodat)
- Jobs: la fel
- Services: la fel

#### T3.3 — Logs reale
- **Interogare**: `compliance_log`, `decision_ledger`, `security_events` — nu `credit_transactions` + failed jobs
- **UI**: Tabel cu severity, actor, action, timestamp, filtre

#### T3.4 — Confirmare dialog pe acțiuni critice
- Delete neuron → AlertDialog
- Credit adjustment → AlertDialog cu audit trail în `compliance_log`
- Role change → AlertDialog

#### T3.5 — Email real în lista de utilizatori
- Join `profiles` pe `email` în loc de `user_id.substring(0,8)`

### FAZA 4 — AIAS STANDARD INFILTRATION (Săptămâna 5-8)

#### T4.1 — Phase 0: Agent Schema Canonical
- **Acțiune**: Definire schema YAML standard per agent
- **Wrapping**: Fiecare agent existent devine AIAS Level 1 compliant
- **Zero UI changes**

#### T4.2 — Phase 1: Structured Input/Output
- Agent cards: use case clar, expected output, credit cost
- Structured input forms (din schema) → replace free text
- Output structure enforce: Context → Execution → Verdict

#### T4.3 — Phase 2: Artifact Economy
- Orice output = artifact salvabil
- Export: PDF, JSON
- Library integration

#### T4.4 — Phase 3: Router Enforcement
- Agent router: intent detection → domain match → scoring → selected agent
- Block invalid agents (missing schema, low score)

### FAZA 5 — AUTOMATION & SCHEDULING (Săptămâna 8-10)

#### T5.1 — Tabele automation
```sql
automation_jobs (id, user_id, type, schedule, config, is_active)
automation_runs (id, job_id, status, started_at, completed_at, error)
automation_triggers (id, job_id, trigger_type, config)
```

#### T5.2 — Tipuri de automations
- Recurring extract
- Recurring content generation
- Send digest
- Publish asset
- Notify low balance
- Scheduled pipeline bundle

#### T5.3 — UI
- Route: /control/automations (sau în Context Drawer)
- Taburi: Scheduled / Completed / Failed
- CTA: "New Automation"

### FAZA 6 — CONTROL PLANE (Săptămâna 10-12)

#### T6.1 — Settings Shell redesign
- Modal fullscreen cu sidebar intern
- Secțiuni: Account, Usage, Settings, Connectors, Integrations
- Pattern: click pe nav item schimbă doar content pane

#### T6.2 — Connectors Hub
- P0: Stripe (existent), YouTube, Google Drive
- P1: Notion, Gmail, Telegram
- Schema: `connector_id, type, status, config, workspace_id`

#### T6.3 — Skills Registry
- Skills = workflow-uri atomice reutilizabile
- Exemple: "YouTube transcript extractor", "Podcast → 50 assets"
- Schema: `skill_id, name, steps[], trigger_type, credits_cost`

### FAZA 7 — CUSNIR OS COMPLETARE (Săptămâna 12-14)

#### T7.1 — Module Population
- Populare `os_modules` cu modulele din spec:
  - Identity Simulation Engine
  - Behavioral Leverage Scanner
  - Narrative Domination Engine
  - Influence Graph Engine
  - Offer Multiplication Engine
  - StepBack Compiler
  - Agent Swarm Orchestrator
  - Knowledge Arbitrage Engine

#### T7.2 — Memory Engine
- Trigger `trg_extract_execution_pattern`
- Update agent profiles cu eficacitate 80/20
- UI: Memory Feed în Operator

#### T7.3 — Power Unlocks
- XP-based feature gates
- Activate/revoke via `activate_power_unlock` / `revoke_power_unlock`
- Refund 50% la revocare

---

## SECURITY REMEDIATION STATUS

| Finding | Severitate | Status |
|---------|-----------|--------|
| SSRF scrape-url | CRITICAL | ✅ FIXAT (auth + IP blocklist) |
| Fail-open rate limiter | CRITICAL | ✅ FIXAT (fail-closed) |
| deliver-webhooks no auth | HIGH | ⚠️ DE VERIFICAT |
| Webhook timing attack | HIGH | ⚠️ DE VERIFICAT |
| CORS localhost in prod | MEDIUM | ⚠️ DE VERIFICAT |
| Error message leakage | MEDIUM | ⚠️ DE VERIFICAT |

---

## TERMINOLOGIE ENFORCEMENT

### De eliminat din UI
- ~~task~~ → Run / Job
- ~~project~~ → Workspace
- ~~assistant~~ → Engine / Service
- ~~files~~ → Sources / Artifacts
- ~~API key~~ → Execution Key
- ~~Model~~ → Service / Engine
- ~~Token usage~~ → NEURONS Execution
- ~~Insurance~~ → Execution Protection

### De verificat în codebase
```
grep -r "assistant" src/ --include="*.tsx" -l
grep -r "\"task\"" src/ --include="*.tsx" -l
grep -r "API key" src/ --include="*.tsx" -l
```

---

## KPIs DE SUCCES

| Metric | Target |
|--------|--------|
| Service catalog entries valid | 700+ OTOS atomice |
| OTOS cu scoring complet | 100% |
| MMS cu PSC scoring | 100% |
| Service manifests populated | = OTOS count |
| Automation jobs functional | ≥6 tipuri |
| Mode panels active | 6 P0 |
| Admin tabs cu paginare | 100% |
| Security findings remediated | 100% CRITICAL + HIGH |
| Terminologie curată | 0 forbidden terms în UI |

---

## DEPENDENȚE & ORDINE

```
T0 (Curățare) ──────→ T1 (Infrastructură) ──────→ T2 (Mode Panels)
                                                      ↓
T3 (Admin) ←──── independent ────→ T4 (AIAS) ──→ T5 (Automation)
                                                      ↓
                                               T6 (Control Plane)
                                                      ↓
                                               T7 (Cusnir OS)
```

**T0 este BLOCKER absolut** — fără curățarea service_catalog, nicio altă fază nu are fundament.
