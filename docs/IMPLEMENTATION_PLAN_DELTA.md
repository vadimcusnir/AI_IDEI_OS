# PLAN DE IMPLEMENTARE — DELTA V2 (POST-AUDIT COMPLET)

**Data**: 2026-04-03
**Surse canonice** (în ordinea priorității):
1. `SSOT_GUARDIAN.md` (constituția operațională)
2. `07_AI-IDEI-LAST-04_STANDARD-2.txt` (AIAS infiltration)
3. `07_AI-IDEI-LAST-05.txt` (Implementation Directive Master v2)
4. `07_AI-IDEI-LAST-03_SERVICII-2.txt` (Step Back Engine)
5. `07_AI-IDEI-LAST-02_SERVICII-2.txt` (OTOS seed library vol.2)
6. `07_AI-IDEI-LAST-01_SERVICII-2.txt` (OTOS seed library vol.1)

---

## EXECUTIVE SUMMARY

| Domeniu | Stare actuală | Gap |
|---------|--------------|-----|
| OTOS Registry (os_otos) | 1121 formule cu intent, mechanism, scoring 5D, neurons_cost, tier S/A/B/C | ✅ COMPLET |
| MMS Registry (os_mms) | 20 sisteme cu bundle pricing + PSC scoring | ✅ COMPLET |
| LCSS Registry (os_lcss) | 5 OS-uri cu macro_intent | ✅ COMPLET |
| Service Manifests | 1121 manifeste cu pipeline class + schemas | ✅ COMPLET |
| Service Catalog | 3485 intrări (mirror OTOS) | ✅ COMPLET |
| Command Center + Mode Panels | 6 panouri contextuale + ModeChipBar | ✅ COMPLET |
| Admin Dashboard | Paginare, logs reale, safety gates | ✅ COMPLET |
| **Service Contract System** | Tabele service_units, prompt_vault, deliverable_contracts, service_release_log | 🔴 NEEXISTENT |
| **Execution Kernel** | intent_map, mms_nodes/edges, intent-router, prompt-broker, mms-auto-composer | 🔴 NEEXISTENT |
| **User Surface Translation** | OTOS→Action, MMS→System, LCSS→Program în UI | 🔴 NEEXISTENT |
| **Admin Kernel Tab** | CRUD pe service_units, prompt_vault, release gate | 🔴 NEEXISTENT |
| **Admin Runtime Tab** | 6 panouri: router, jobs, prompt broker, artifacts, pricing, capacity | 🔴 NEEXISTENT |
| **Command Layer** | Decision engine, priority engine, command types | 🔴 NEEXISTENT |
| **i18n RU** | Limba rusă pe suprafețe publice | 🔴 NEEXISTENT |
| **Release Gates** | Validare automată atomicitate + dedup + Root2 + schema | 🔴 NEEXISTENT |
| **AIAS Infiltration** | Structured inputs, output contracts, agent certification | 🔴 NEEXISTENT |
| **Ruta /programs** | LCSS expuse ca Programs pentru user | 🔴 NEEXISTENT |

---

## ARHITECTURA ȚINTĂ (din Doc 5)

### Stivă completă
```
USER SURFACE: Action (OTOS) / System (MMS) / Program (LCSS)
    ↕
COMMAND LAYER: intent → decision pipeline → priority engine → execution plan
    ↕
EXECUTION KERNEL: intent_router → prompt_broker → job_lifecycle → artifact_model
    ↕
CONTRACT SYSTEM: service_units → prompt_vault → deliverable_contracts → release_log
    ↕
CANONICAL REGISTRY: os_otos (1121) → os_mms (20) → os_lcss (5)
    ↕
ADMIN CONTROL PLANE: kernel / runtime / analytics / compliance / command
```

### Reguli canonice (din Doc 5, non-negociabile)
- 1 service = 1 output = 1 function = 1 decision
- NEURONS = compute credits; NOTA2 = access/governance only
- Toate prețurile comerciale = Root2 valid
- Promptul rămâne encrypted server-side (prompt_vault)
- Userul vede Action/System/Program, nu OTOS/MMS/LCSS
- Chat-first rămâne interfața principală
- EN/RO/RU obligatoriu pe suprafețe publice

---

## FAZE DE IMPLEMENTARE

### FAZA 4 — SERVICE CONTRACT SYSTEM (P0)
> Transformă fiecare OTOS într-un obiect contractual complet cu 4 componente separate.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T4.1 | Crează tabelul `service_units` (id, level OTOS/MMS/LCSS, name, single_output, single_function, single_decision, mechanism, role, prompt_id, deliverable_id, score_json, cost_json, pricing_json, status, otos_id FK) | — |
| T4.2 | Crează tabelul `prompt_vault` (prompt_id PK, service_unit_id FK, system_role, purpose, input_schema JSONB, output_schema JSONB, quality_gate JSONB, rules JSONB, version, hash, access_scope, created_at) | T4.1 |
| T4.3 | Crează tabelul `deliverable_contracts` (deliverable_id PK, service_unit_id FK, primary_assets JSONB, secondary_assets JSONB, asset_type enum, reuse_value enum, exportability text[], storage_target, ownership) | T4.1 |
| T4.4 | Crează tabelul `service_release_log` (id, service_unit_id FK, atomicity_check bool, duplication_check bool, schema_check bool, monetization_check bool, root2_check bool, total_score numeric, approval_status enum, reviewed_by, created_at) | T4.1 |
| T4.5 | Populează `service_units` cu top 120 OTOS canonice selectate din `os_otos` (tier S + A), cu dedup semantic | T4.1 |
| T4.6 | Generează `prompt_vault` entries pentru cele 120 unități (purpose, input/output schema, quality gate, rules — fără raw prompt încă) | T4.2, T4.5 |
| T4.7 | Generează `deliverable_contracts` (primary: 1 output, secondary: variante, exportability, storage_target: library) | T4.3, T4.5 |

### FAZA 5 — EXECUTION KERNEL (P0)
> Conectează registrul la un motor de execuție real.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T5.1 | Crează tabelul `intent_map` (intent_key PK, label, description, required_roles text[], domain_filter text[], is_active) cu 6 intenturi core: get_clients, improve_conversion, build_authority, increase_revenue, retain, scale | — |
| T5.2 | Crează tabelele `mms_nodes` (id, mms_id FK, otos_id FK, role, step_order, depends_on uuid[]) și `mms_edges` (id, mms_id FK, from_node FK, to_node FK, edge_type) | — |
| T5.3 | Populează `mms_nodes` + `mms_edges` pentru cele 20 MMS existente (DAG explicit) | T5.2 |
| T5.4 | Edge Function `intent-router` — primește {user_intent, audience_type, context} → returnează top 3 MMS candidate cu confidence, neurons_cost, expected_outputs | T5.1 |
| T5.5 | Edge Function `prompt-broker` — primește {service_unit_id, user_inputs} → încarcă prompt din vault → execută via LLM → salvează artifact → settle neurons | T4.2 |
| T5.6 | Edge Function `mms-auto-composer` — primește {intent, constraints} → selectează OTOS top-score → verifică compatibilitate → construiește DAG → returnează MMS optim | T5.1, T5.2 |

### FAZA 6 — USER SURFACE TRANSLATION (P0)
> Userul nu vede OTOS/MMS/LCSS. Vede Action/System/Program.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T6.1 | Refactorizează `/services` — carduri semantice cu 2 tipuri: Action (OTOS) cu "Quick Action, 1 output, X credits" și System (MMS) cu "Execution Pack, multiple outputs, X credits" | — |
| T6.2 | Crează ruta `/programs` — afișează LCSS ca Programs cu card: objective, includes (MMS list), duration, outputs_over_time, plan_type, CTA "Start Program" | — |
| T6.3 | Actualizează Command Center chat response — la orice intent, sugerează 3 nivele: Quick Action / Recommended System / Growth Program | T5.4 |
| T6.4 | Elimină termenii OTOS/MMS/LCSS din toate componentele user-facing (grep + replace) | — |
| T6.5 | Actualizează Library cu categorii semantice: messages, headlines, offers, frameworks, plans, scripts, systems, program_outputs | — |
| T6.6 | Actualizează execution UI — progres semantic (analyzing_input → selecting_best_path → generating_assets → validating_output → saving_to_library), nu noduri/grafuri | — |

### FAZA 7 — ADMIN CONTROL PLANE COMPLET (P1)
> /admin devine cockpit-ul întregului OS.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T7.1 | `/admin/kernel` tab — CRUD pe service_units (add via contract compiler, edit cu versioning, deprecate/archive/merge), prompt_vault (masked preview, version, hash), deliverable_contracts, release gate console | T4.* |
| T7.2 | `/admin/runtime` tab — 6 panouri live: router_state (top intents, confidence, misroute rate), job_queue (queued/processing/completed/failed), prompt_broker (version, hash, execution count), artifact_pipeline (generated/save rate/export rate), pricing_engine (Root2 violations, cost/price spread), system_capacity (queue backlog, latency, saturation) | T5.* |
| T7.3 | `/admin/compliance` tab — verificări: Root2 pricing, atomicitate, EN/RO/RU coverage, RLS scope, prompt exposure scan, service overlap detection | T4.4 |
| T7.4 | `/admin/command` tab — panel strategic: suggested_actions cu priority score, ranked_actions, warnings, orchestration preview | T8.* |
| T7.5 | Admin analytics extinse: revenue per OTOS/MMS/LCSS, neurons burn per unit, intent→run→completed→artifact→export→revenue funnel, top roles/mechanisms, pricing violations blocked, retention by intent | — |

### FAZA 8 — COMMAND LAYER (P1)
> Stratul care decide CE merită executat, nu doar CUM.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T8.1 | `command_engine` — input: user_goal + system_state + performance_metrics + historical_data → output: next_actions + priority_tasks + agent_sequences + warnings | T5.4 |
| T8.2 | `decision_pipeline` — 6 etape fixe: context_aggregation → objective_clarification → opportunity_detection → risk_analysis → action_selection → execution_plan | T8.1 |
| T8.3 | `priority_engine` — scor: impact×0.35 + revenue_potential×0.35 + urgency×0.20 + (11-effort)×0.10 | T8.1 |
| T8.4 | 5 command types canonice: generate_revenue, improve_conversion, build_authority, optimize_system, reduce_risk | T8.1 |
| T8.5 | UI command_panel minim: suggested_actions + execution_button, sistem sugerează → user execută | T8.1-T8.4 |

### FAZA 9 — I18N + RELEASE GATES (P1)
> Completare limbă + validare automată.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T9.1 | Adaugă traduceri RU complete pentru suprafețe publice (landing, pricing, services, programs, docs) | — |
| T9.2 | Release gate automatizat — DB function `validate_service_release` care verifică: atomicity, dedup, schema, monetization, root2, total_score ≥ 0.65 | T4.4 |
| T9.3 | Gate 3 (Presentation) — nu lansează serviciu user-facing fără EN + RO + RU keys complete | T9.1 |

### FAZA 10 — AIAS STANDARD INFILTRATION (P2)
> Nu lansezi standardul. Îl infiltrezi.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T10.1 | Phase 0: Wrap agenți existenți în format AIAS Level 1 (canonical schema, job lifecycle, artifact model, basic scoring) — zero UI changes | T5.5 |
| T10.2 | Phase 1: Structured input forms (din prompt_vault.input_schema) → replace free text; Output enforce: Context/Execution/Verdict | T4.2, T10.1 |
| T10.3 | Phase 2: Artifact economy — orice output = artifact salvabil, export PDF/JSON/DOCX, library integration automată | T10.2 |
| T10.4 | Phase 3: Router enforcement — block invalid agents (missing schema, low score), store routing metadata | T5.4, T10.3 |
| T10.5 | Phase 4-7: Certification badges, marketplace gate, public API, SDK — doar după validare internă completă | T10.4 |

### FAZA 11 — AUTOMATION & DISTRIBUTION (P2)
> Execuție recurentă + canale de distribuție.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T11.1 | Tabele automation: automation_jobs, automation_runs, automation_triggers | — |
| T11.2 | 6 tipuri: recurring extract, recurring generation, send digest, publish asset, notify low balance, scheduled pipeline | T11.1 |
| T11.3 | Email/Social distribution channels | T11.2 |

### FAZA 12 — CUSNIR OS KERNEL (P3)
> Stratul de guvernanță avansată.

| Task | Descriere | Dependențe |
|------|-----------|-----------|
| T12.1 | Step Back Service Generation Engine live (causal chain → control points → mechanisms → OTOS → MMS → LCSS) | T5.6 |
| T12.2 | Memory Engine (trigger trg_extract_execution_pattern, agent profiles cu eficacitate 80/20) | — |
| T12.3 | Power Unlocks XP-based cu activate/revoke | — |

---

## ORDINE OBLIGATORIE DE EXECUȚIE

```
COMPLETAT: Faza 0 (Curățare) → Faza 1 (Scoring+Indexing+Manifests) → Faza 2 (Mode Panels) → Faza 3 (Admin)

URMĂTOARELE:
Faza 4 (Contract System) ──→ Faza 5 (Execution Kernel) ──→ Faza 6 (User Translation)
                                                               ↓
                                                Faza 7 (Admin Complete) ←── Faza 8 (Command Layer)
                                                               ↓
                                                Faza 9 (i18n + Gates)
                                                               ↓
                                                Faza 10 (AIAS)
                                                               ↓
                                                Faza 11 (Automation)
                                                               ↓
                                                Faza 12 (Cusnir OS Kernel)
```

---

## SITE STRUCTURE DUPĂ IMPLEMENTARE COMPLETĂ

```yaml
public:
  - / (landing)
  - /pricing
  - /how-it-works
  - /services (Actions + Systems)
  - /programs (LCSS as Programs)
  - /library (public assets)
  - /docs
  - /blog
  - /changelog

app (autentificat):
  - /home (Command Center — chat-first)
  - /workspace
  - /services (catalog cu Actions + Systems)
  - /programs (catalog cu Programs)
  - /library (saved artifacts)
  - /jobs (istoric execuții)
  - /billing
  - /settings

admin:
  - /admin (overview executiv)
  - /admin/kernel (registry control)
  - /admin/runtime (execution monitoring)
  - /admin/analytics (metrics)
  - /admin/compliance (gates + audit)
  - /admin/command (decision panel)
  - /admin/db-schema (structural map)
```

---

## VISIBILITY MODEL (REGULA DE AUR)

```yaml
internal_only:
  - OTOS / MMS / LCSS (termeni)
  - prompt_vault (conținut)
  - DAG / composer / orchestrator
  - routing_weights / internal_scores
  - scoring intern brut

user_visible:
  - intent (ce vrei să faci)
  - expected_result (ce primești)
  - time_to_result (cât durează)
  - credit_cost (cât costă)
  - artifacts_delivered (ce active ai creat)
  - next_step (ce urmează)
  - upgrade_path (cum crești)

naming_translation:
  OTOS → "Action" / "Quick Action"
  MMS → "System" / "Execution Pack"
  LCSS → "Program" / "Growth Engine"
```

---

## KPIs DE SUCCES

| Metric | Target |
|--------|--------|
| Service units cu contract complet | ≥120 |
| Prompt vault entries | = service_units count |
| Deliverable contracts | = service_units count |
| Intent map entries | 6 core intents |
| MMS cu DAG explicit (nodes+edges) | 20 |
| Release gate pass rate | measurable |
| OTOS/MMS/LCSS eliminat din UI | 0 occurrences |
| Ruta /programs live | ✅ |
| RU translations complete | ≥80% public surfaces |
| Admin kernel tab functional | ✅ |
| Admin runtime tab functional | ✅ |
| first_action_completion_rate | measurable |
| intent→artifact conversion rate | measurable |

---

## STARE CURENTĂ

- **Fazele 0-3**: ✅ COMPLETATE (curățare DB, scoring OTOS, manifeste, mode panels, admin paginare+logs+safety)
- **Faza 4**: 🔴 URMĂTOAREA — Service Contract System
- **Fazele 5-12**: 🔴 PLANIFICATE
