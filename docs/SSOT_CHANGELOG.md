
## $(date +%Y-%m-%d) — CI guard smoke test
- version: 11.0
- domain: edge_functions
- change: noop edit on neuron-chat to validate ssot-guard workflow
- rule_refs: [RULE-003]
- pr: (auto)

## 2026-04-24 — CI guard smoke test
- version: 11.0
- domain: edge_functions
- change: noop edit on neuron-chat to validate ssot-guard workflow
- rule_refs: [RULE-003]
- pr: test/ssot-guard-fail
