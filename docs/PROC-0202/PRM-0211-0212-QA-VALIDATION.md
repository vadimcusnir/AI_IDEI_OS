# PRM-0211 + PRM-0212 — QA Protocol & Post-Launch Validation: Command Center

**Process:** PROC-0202 — command_center_ux_standard
**Output:** Checklist pass/fail per epic, criterii de lansare, protocol de validare post-lansare

---

## PRM-0211 — UX Acceptance Protocol

### Bloc 1 — Language & Microcopy (EPIC 1)

| # | Test | Pass Criteria | Fail Criteria |
|---|---|---|---|
| M1-01 | Audit string-uri română | Zero elemente în română în `/home` | Orice string în română = FAIL |
| M1-02 | Placeholder input | `Run a command...` | Orice altceva = FAIL |
| M1-03 | Hint text | `Enter to run · / for commands · + to attach` | Orice altceva = FAIL |
| M1-04 | Timestamp sesiune | `{N}h ago` / `Yesterday` / `Apr 15` (nu `999 days`) | Valoare hardcodată = FAIL |
| M1-05 | Pluralizare mesaje | `1 message` / `3 messages` | `msgs` sau `msg` = FAIL |
| M1-06 | Error messages | Toate 5 mesaje de eroare implementate | Orice eroare fără mesaj = FAIL |

**Verdict bloc:** Toate 6 teste PASS → bloc aprobat.

---

### Bloc 2 — Empty State (EPIC 2)

| # | Test | Pass Criteria | Fail Criteria |
|---|---|---|---|
| E2-01 | Zona A vizibilă | Centrat vertical, `min-height: 40vh` | Zona A absentă sau deplasată = FAIL |
| E2-02 | Zona B separată | Separator vizibil, scroll independent | Zone amestecate = FAIL |
| E2-03 | Sugestii dinamice | Sugestii bazate pe context real | Sugestii generice hardcodate = FAIL |
| E2-04 | Sesiuni limitate | Maxim 5 vizibile implicit | >5 sesiuni fără `Show more` = FAIL |
| E2-05 | Grupare temporală | Today / Yesterday / This week / Older | Fără grupare = FAIL |
| E2-06 | Knowledge Map dinamic | Scor real din API, nu 0% static | Valoare statică = FAIL |
| E2-07 | Empty state pentru sesiuni noi | Mesaj `No sessions yet...` | Ecran gol = FAIL |

**Verdict bloc:** Toate 7 teste PASS → bloc aprobat.

---

### Bloc 3 — Input System (EPIC 3)

| # | Test | Pass Criteria | Fail Criteria |
|---|---|---|---|
| I3-01 | Mode pill activ | Stil distinct vizibil, un singur mod activ | Fără stare activă = FAIL |
| I3-02 | Command palette | Se deschide la `/`, filtrare, navigare ↑↓, cost estimat | Absent sau nefuncțional = FAIL |
| I3-03 | Service picker | Se deschide la `+`, upload + servicii | Absent = FAIL |
| I3-04 | Cost estimator | `~{N} neurons` afișat dinamic | Absent sau static = FAIL |
| I3-05 | Submit state | Dezactivat când gol, activat când text prezent | Submit activ pe textarea goală = FAIL |
| I3-06 | Shift+Enter | Adaugă newline (nu trimite) | Trimite la Shift+Enter = FAIL |
| I3-07 | Auto-focus desktop | Textarea focusat la load pe desktop | Fără focus = FAIL |
| I3-08 | No auto-focus mobile | Keyboard nu apare automat pe mobile | Keyboard pop-up la load = FAIL |

**Verdict bloc:** Toate 8 teste PASS → bloc aprobat.

---

### Bloc 4 — Context Panel (EPIC 4)

| # | Test | Pass Criteria | Fail Criteria |
|---|---|---|---|
| P4-01 | Tab labels | Icon + text pe fiecare tab | Icon-only = FAIL |
| P4-02 | Badge Runs | Badge cu count când runs active | Fără badge = FAIL |
| P4-03 | Badge Assets | Badge cu count când assets noi | Fără badge = FAIL |
| P4-04 | Auto-open | Panoul se deschide automat la runs/assets | Nu se deschide = FAIL |
| P4-05 | Empty states | Mesaj specific per tab când gol | Ecran gol = FAIL |
| P4-06 | Run status | running/complete/failed cu indicator vizibil | Fără indicator status = FAIL |
| P4-07 | Asset download | Download funcțional | Download nefuncțional = FAIL |

**Verdict bloc:** Toate 7 teste PASS → bloc aprobat.

---

### Bloc 5 — Navigation (EPIC 5)

| # | Test | Pass Criteria | Fail Criteria |
|---|---|---|---|
| N5-01 | Primary nav | Exact 5 itemi în nav primară | >5 sau <5 = FAIL |
| N5-02 | ADMIN ascuns | ADMIN nav invizibil în User Mode | ADMIN vizibil = FAIL |
| N5-03 | Secondary nav | Colapsibil, stare salvată în localStorage | Nu se salvează = FAIL |
| N5-04 | Mobile bottom nav | 4 itemi, touch target ≥44px | <4 sau >4 itemi = FAIL |
| N5-05 | Active state | Item activ are indicator vizibil | Fără indicator = FAIL |

**Verdict bloc:** Toate 5 teste PASS → bloc aprobat.

---

### Bloc 6 — System Feedback (EPIC 7)

| # | Test | Pass Criteria | Fail Criteria |
|---|---|---|---|
| F6-01 | Skeleton loaders | Skeleton vizibil pentru sesiuni, mesaje, panel | Flash of empty content = FAIL |
| F6-02 | Typing indicator | 3 dots animate când AI procesează | Fără indicator = FAIL |
| F6-03 | Streaming | Text apare progresiv cu cursor animat | Text apare brusc = FAIL |
| F6-04 | Submit disabled | Submit dezactivat pe durata procesării | Submit activ în procesare = FAIL |

**Verdict bloc:** Toate 4 teste PASS → bloc aprobat.

---

### Criterii de lansare (Launch Gate)

**Blocker absolut (toate trebuie PASS):**
- Bloc 1 — Language: 6/6 PASS
- Bloc 3 — Input System: 8/8 PASS (cel puțin I3-01, I3-05, I3-06)
- Bloc 6 — System Feedback: 4/4 PASS

**Non-blocker (pot fi lansate în iterația 2):**
- Bloc 4 — Context Panel: P4-02, P4-03, P4-04 pot fi amânate
- Bloc 5 — Navigation: N5-02 este blocker, restul pot fi amânate
- Bloc 2 — Empty State: E2-03 (sugestii dinamice) poate fi amânat

---

## PRM-0212 — Post-Launch Validation Protocol

### Metrici de urmărit (primele 14 zile post-lansare)

| Metrică | Definiție | Target | Alarmă |
|---|---|---|---|
| Command Submission Rate | % sesiuni cu cel puțin o comandă trimisă | >70% | <50% |
| Mode Selection Rate | % comenzi cu mod explicit selectat | >40% | <20% |
| Session Return Rate | % utilizatori care revin în 7 zile | >50% | <30% |
| Empty State Bounce | % utilizatori care părăsesc din empty state fără acțiune | <30% | >50% |
| Error Rate | % comenzi care returnează eroare | <5% | >15% |
| Context Panel Open Rate | % sesiuni cu panel deschis | >25% | <10% |
| Command Palette Usage | % sesiuni cu `/` trigger | >15% | <5% |

### Semnale de validare pozitivă (Day 7)

- [ ] Command Submission Rate > 70%
- [ ] Zero rapoarte de bug pentru limba română în interfață
- [ ] Error Rate < 5%
- [ ] Nicio sesiune cu `999 days` în timestamp

### Semnale de alarmă (Day 3 — intervenție imediată)

- [ ] Error Rate > 15% → rollback sau hotfix
- [ ] Empty State Bounce > 60% → redesign urgent sugestii
- [ ] Command Submission Rate < 40% → investigare input bar

### Proces de validare

```
Day 1: Deploy + smoke test manual (toate blocurile QA)
Day 3: Verificare metrici de alarmă
Day 7: Raport complet metrici + decizie iterație 2
Day 14: Comparație baseline vs. post-lansare + verdict final
```

### Verdict final (Day 14)

**PASS:** Toate metricile target atinse → procesul PROC-0202 este închis.
**PARTIAL:** 3–5 metrici atinse → iterație 2 cu focus pe metricile ratate.
**FAIL:** <3 metrici atinse → audit complet + redesign parțial.
