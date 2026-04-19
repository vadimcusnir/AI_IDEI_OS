# PROC-0202 — command_center_ux_standard

**Process:** Audit complet, redesign IA, specificații UI și backlog de implementare pentru Command Center (ai-idei.com/home)

**Input:** Live site ai-idei.com · DOM snapshot · sesiuni active
**Output:** Redesigned IA · UI specs · Dev backlog · QA protocol

---

## Prompt Stack

| # | Fișier | Conținut |
|---|---|---|
| PRM-0201 | `PRM-0201-AUDIT-COMMAND-CENTER.md` | Audit în 8 straturi · scoruri · gap map |
| PRM-0202 | `PRM-0202-IA-REBUILD.md` | Arhitectura canonică · noduri · stări · route map |
| PRM-0203+0208 | `PRM-0203-0208-COPY-REWRITE.md` | Rewrite complet microcopy · error messages · labels |
| PRM-0204–0207 | `PRM-0204-0207-UI-SPECS.md` | Layout · navigație · empty states · CTA hierarchy · animații |
| PRM-0209 | `PRM-0209-COMPONENT-SYSTEM.md` | Componente reutilizabile · props · stări · reguli |
| PRM-0210 | `PRM-0210-DEV-BACKLOG.md` | 7 epics · 23 stories · criterii de acceptanță · ~23 zile |
| PRM-0211+0212 | `PRM-0211-0212-QA-VALIDATION.md` | Checklist pass/fail · launch gate · metrici post-lansare |

---

## Scor audit global

| Strat | Scor curent | Scor target |
|---|---|---|
| Layout & Spatial Logic | 5.5/10 | 9/10 |
| Empty State | 3.5/10 | 9/10 |
| Input & Command System | 4.5/10 | 9/10 |
| Session Management | 4.0/10 | 9/10 |
| Context Panel | 3.0/10 | 9/10 |
| Global Navigation | 4.0/10 | 9/10 |
| System Feedback | 4.5/10 | 9/10 |
| Microcopy & Language | 3.0/10 | 9/10 |
| **TOTAL** | **4.0/10** | **9/10** |

---

## Ordinea de implementare

1. EPIC 1 — Language Fix (P0, 2 zile)
2. EPIC 7 — System Feedback (P1, 2 zile)
3. EPIC 2 — Empty State Redesign (P0, 3 zile)
4. EPIC 3 — Input System Enhancement (P1, 4 zile)
5. EPIC 4 — Context Panel (P1, 5 zile)
6. EPIC 5 — Navigation Restructure (P1, 3 zile)
7. EPIC 6 — Session Management (P2, 4 zile)

**Total:** ~23 zile development
