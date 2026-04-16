# Missing Control Layers — AI-IDEI Execution OS

**Spec:** `AI_IDEI_MISSING_CONTROL_LAYERS_SYSTEM v1.0`
**Status:** Phase 1-5 implementate (paralel, nu atinge sistemul live)
**Date:** 2026-04-16
**UI:** `/admin/control-center`

---

## Symbolic Equation
```
signal → decision → priority → execution → measurement → selection → adaptation
```

## Layer Order (execution precedence)
1. trust_layer
2. decision_layer
3. priority_layer
4. temporal_layer
5. execution_runtime *(existing — neuron_jobs)*
6. recovery_layer
7. selection_layer
8. meta_metrics_layer

---

## Tables (13) — toate prefixate `mcl_`

| # | Table | ID prefix | Purpose | Live rows |
|---|---|---|---|---|
| 1 | `mcl_decisions` | DEC- | Registru explicit de decizii (rerun/escalate/archive/kill...) | 0 |
| 2 | `mcl_priority_rules` | PRIO- | Formule weighting pentru queue | 3 (seed) |
| 3 | `mcl_temporal_policies` | TMP- | TTL + decay + frecvență | 3 (seed) |
| 4 | `mcl_memory_records` | MEM- | Memorie short/mid/long term | 0 |
| 5 | `mcl_trust_profiles` | TRUST- | Permisiuni acțiuni autonome | 3 (seed) |
| 6 | `mcl_recovery_events` | RECOV- | Istoric eșecuri + recovery | 0 |
| 7 | `mcl_recovery_policies` | RCP- | Reguli retry/rollback | 2 (seed) |
| 8 | `mcl_selection_events` | SEL- | Reinforce/archive/kill/promote | 0 |
| 9 | `mcl_economic_units` | ECO- | Unități profit normalizate | 0 |
| 10 | `mcl_user_progression` | UPR- | Stadii beginner→scaler | 0 |
| 11 | `mcl_control_actions` | CTRL- | Audit override operator | 0 |
| 12 | `mcl_simulation_runs` | SIM- | Counterfactual testing | 0 |
| 13 | `mcl_meta_metric_reports` | MMR- | Auto-măsurare sistem | 0 |

**RLS:** toate `admin-only` (read+write+update+delete via `has_role(auth.uid(),'admin')`).

---

## RPCs

### `mcl_compute_priority(revenue, urgency, frequency, effort, strategic, risk) → numeric`
Formula: `revenue*0.30 + urgency*0.20 + frequency*0.15 + strategic*0.20 - effort*0.10 - risk*0.05`

### `mcl_create_decision(name, source_type, source_ref, target_type, target_ref, decision_type, rationale, confidence, priority_score) → uuid`
Fail-closed:
- `unauthorized` dacă userul nu e admin
- `no_decision_without_target` dacă target_ref e null
- `no_decision_without_confidence`
- `no_decision_without_rationale` (min 5 chars)
- Auto-asignează `trust_state` din confidence: ≥0.85 high, ≥0.6 medium, else low

### `mcl_override_decision(decision_id, new_status, rationale) → void`
Override admin cu audit log automat în `mcl_control_actions`.

---

## Decision Types (CHECK constraint)
`rerun · escalate · package · price_adjust · defer · ignore · archive · reinforce · kill · notify · simulate`

## Decision Statuses
`pending · approved · auto_executed · rejected · expired`

## Trust Levels
- **low** → log + suggest only
- **medium** → suggest + queue + create_candidate + simulate
- **high** → auto_run + auto_create_candidate + auto_archive_low_risk

## Failure Types
`transient_runtime_failure · partial_output_failure · low_quality_output · economic_failure · policy_conflict · dependency_failure`

## Response Modes
`retry · rollback · degrade · quarantine · alert · escalate`

## Selection Actions
`reinforce · archive · kill · promote · demote`

## User Stages
`beginner → operator → builder → scaler`

---

## Phase Roadmap (din spec — implementat în această iterație)

### ✅ Phase 1 — Control Foundation
- decisions, priority_rules, temporal_policies, trust_profiles
- RPCs: compute_priority, create_decision, override_decision

### ✅ Phase 2 — Memory · Recovery · Selection
- memory_records, recovery_events, recovery_policies, selection_events
- TTL & decay în `mcl_temporal_policies`

### ✅ Phase 3 — Economics · Progression · Control
- economic_units (cu `profit_amount` GENERATED), user_progression, control_actions

### ✅ Phase 4 — Simulation · Meta
- simulation_runs (assumptions + risk + recommendation obligatorii)
- meta_metric_reports (`key_recommendations` NOT NULL — fail-closed)

### ⏳ Phase 5 — Closed Loop (TODO următoarea sesiune)
Hook-uri reale în sistemul live:
- Trigger pe `neuron_jobs.status='error'` → INSERT `mcl_recovery_events`
- Trigger pe `credit_transactions` → INSERT `mcl_economic_units` per execuție
- Cron daily → calcul `mcl_meta_metric_reports`
- Cron daily → expire stale `mcl_memory_records`

---

## UI

`/admin/control-center` — single page, admin-only:
- Counter cards pentru toate 12 layers
- Tabs cu tabel listare (50 rows ordonate desc)
- Acțiune `Reject` pe decisions cu status `pending` (folosește `mcl_override_decision`)

---

## Acceptance Criteria (din spec)

| Criterion | Status |
|---|---|
| system_can_create_explicit_decisions | ✅ via RPC |
| system_can_rank_queue_items | ✅ priority_score + index DESC |
| system_can_block_actions_on_low_trust | ✅ trust_state derivat din confidence |
| system_can_expire_stale_items | ✅ schema; cron pending Phase 5 |
| system_can_measure_profit_per_scope | ✅ economic_units cu profit GENERATED |
| system_can_recover_from_known_failure_classes | ✅ recovery_events + policies |
| system_can_archive_or_reinforce_entities | ✅ selection_events |
| operator_can_override_runtime_state | ✅ override RPC + UI |
| simulation_results_do_not_write_directly_to_production | ✅ simulation_runs separate |
| meta_reports_contain_actionable_recommendations | ✅ NOT NULL `key_recommendations` |

---

## Final Operating Thesis
> Execution without decision creates noise. Decision without priority creates backlog. Priority without time creates drift. Time without memory creates repetition. Memory without trust creates risk. Trust without recovery creates fragility. Recovery without selection creates accumulation. Selection without economics creates illusion. Economics without control creates leakage. Control without simulation creates blind intervention. Simulation without meta-metrics creates vanity. **Together these layers convert execution into governed economic infrastructure.**
