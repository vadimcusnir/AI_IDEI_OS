# PRM-0203 + PRM-0208 — Rewrite Copy & Microcopy: Command Center

**Process:** PROC-0202 — command_center_ux_standard
**Input:** Audit PRM-0201 · DOM snapshot · limbaj curent
**Output:** Copy canonic pentru toate elementele de text din Command Center

---

## Regula de bază

Limba unică: **engleză**. Zero excepții. Orice element în română este un bug de produs, nu o alegere de design.

---

## 1. Titlul paginii / Welcome Message

| Element | Curent (bug) | Canonic (fix) | Motivare |
|---|---|---|---|
| Page title | `How can I help?` | `Command Center` | Nu ești ChatGPT. Ești un OS. |
| Subtitle | `Describe what you need, upload a file, or pick a suggestion below.` | `Run a command, extract knowledge, or continue a session.` | Limbaj de sistem, nu de asistent |

---

## 2. Input Bar

| Element | Curent (bug) | Canonic (fix) |
|---|---|---|
| Placeholder | `Execută comandă...` | `Run a command...` |
| Hint text | `Enter trimite · / comenzi · + servicii` | `Enter to run · / for commands · + to attach` |
| Mode: Extract | `Extract` | `Extract` ✓ |
| Mode: Analyze | `Analyze` | `Analyze` ✓ |
| Mode: Generate | `Generate` | `Generate` ✓ |
| Add input button tooltip | (lipsă) | `Attach file or service` |
| Cost indicator (nou) | (lipsă) | `~{N} neurons` (afișat dinamic) |

---

## 3. Sesiuni recente

| Element | Curent (bug) | Canonic (fix) |
|---|---|---|
| Section title | `RECENT SESSIONS` | `Recent Sessions` (sentence case) |
| Timestamp | `about 2 hours ago` | `2h ago` (compact) |
| Message count | `· 1 msgs` | `· 1 message` / `· 3 messages` |
| Show more | `Show 25 more` | `Show 25 more sessions` |
| Empty state sesiuni | (lipsă) | `No sessions yet. Run your first command below.` |

---

## 4. Empty State — Sugestii

**Curent (bug):** Sugestii generice cu valori hardcodate.

**Canonic — 4 sugestii dinamice bazate pe context real:**

```
Sugestie 1 (dacă există neuroni nefolosiți):
  Icon: ⚡
  Title: "Continue extraction"
  Body: "{N} neurons ready to process"
  CTA: "Extract now"

Sugestie 2 (dacă există pipeline activ):
  Icon: 🏭
  Title: "Run IMF Pipeline"
  Body: "Convert {N} neurons into deliverables"
  CTA: "Launch"

Sugestie 3 (dacă există knowledge graph incomplet):
  Icon: 🕸️
  Title: "Build knowledge graph"
  Body: "Connect your neurons into clusters"
  CTA: "Build"

Sugestie 4 (dacă există sesiuni recente):
  Icon: 🔄
  Title: "Continue last session"
  Body: "{session_title} · {time_ago}"
  CTA: "Resume"
```

**Fallback (zero activitate):**
```
  Icon: ▶
  Title: "Start here"
  Body: "Upload a document to extract your first neurons."
  CTA: "Upload file"
```

---

## 5. Knowledge Completeness Widget

| Element | Curent (bug) | Canonic (fix) |
|---|---|---|
| Title | `Knowledge Completeness` | `Knowledge Map` |
| Score | `0%` fără context | `{N}% complete — {X} dimensions mapped` |
| Sub-text | `400 neurons extracted • 8 dimensions incomplete` | `{N} neurons · {X} gaps detected` |
| CTA (lipsă) | (lipsă) | `Fill gaps →` |

---

## 6. Recommended Actions

| Element | Curent | Canonic |
|---|---|---|
| Section title | `RECOMMENDED ACTIONS` | `Recommended Actions` |
| L1 title | `Fragment Completion` | `Complete Knowledge Gaps` |
| L1 body | `Complete missing knowledge fragments` | `Fill {X} missing fragments to unlock deeper analysis.` |
| L1 anchor | `Anchored in: Prompts gap` | `Linked to: Prompts cluster` |
| L2 title | `Structured System Delivery` | `Organize Into Systems` |
| L2 body | `Organize extracted knowledge into coherent systems` | `Structure {N} neurons into {X} coherent systems.` |
| L3 title | `Automation Conversion` | `Convert to Automation` |
| L3 body | `Convert knowledge systems into automated workflows` | `Turn {X} systems into automated workflows.` |
| CTA: Explore | `Explore` | `Start` |
| CTA: Later | `Later` | `Skip` |

---

## 7. Context Panel (State / Runs / Assets)

| Element | Curent | Canonic |
|---|---|---|
| Tab: State | icon-only | `State` (icon + label) |
| Tab: Runs | icon-only | `Runs` (icon + label) |
| Tab: Assets | icon-only | `Assets` (icon + label) |
| State empty | (lipsă) | `No active state. Start a session to see variables.` |
| Runs empty | (lipsă) | `No runs yet. Commands will appear here when processing.` |
| Assets empty | (lipsă) | `No assets generated. Run a Generate command to create files.` |

---

## 8. Header sesiune

| Element | Curent | Canonic |
|---|---|---|
| Session title | `🚀 Magic Pipeline: Vera Varvara.txt` | titlu generat din prima comandă (păstrat) |
| Copy button | icon-only | `Copy session` (tooltip) |
| New session | `New session` | `New session` ✓ |
| Back to home | (lipsă) | `← All sessions` (breadcrumb) |

---

## 9. Navigație globală — Sidebar labels

| Curent | Canonic | Motivare |
|---|---|---|
| `Command Center` | `Command Center` ✓ | |
| `Pipeline` | `Pipeline` ✓ | |
| `Services` | `Services` ✓ | |
| `Library` | `Library` ✓ | |
| `Jobs` | `Jobs` ✓ | |
| `Credits` | `Credits` ✓ | |
| `Marketplace` | `Marketplace` ✓ | |
| `Purchases` | `Purchases` ✓ | |
| `Neurons` | `Neurons` ✓ | |
| `Knowledge Graph` | `Knowledge Graph` ✓ | |
| `My Analytics` | `Analytics` | Elimină posesivul redundant |
| `OPERATOR MODE` | `Operator Mode` (sentence case) | Consistență |
| `VIP 14,577N` | `VIP · 14,577 N` | Spațiere pentru lizibilitate |

---

## 10. Error Messages (nou — lipsesc complet în prezent)

| Situație | Mesaj canonic |
|---|---|
| Credite insuficiente | `Not enough neurons. This command requires ~{N}N. Top up →` |
| Timeout API | `Command timed out. Try again or simplify your request.` |
| Comandă invalidă | `Unknown command. Type / to see available commands.` |
| Upload eșuat | `File upload failed. Max size: 50MB. Supported: PDF, TXT, DOCX.` |
| Sesiune expirată | `Session expired. Your work is saved — resume anytime.` |
| Fișier prea mare | `File too large ({size}MB). Maximum allowed: 50MB.` |

---

## Verdict Copy

Sistemul curent are **6 bug-uri critice de limbaj** (română în interfață engleză, valori hardcodate, greșeli gramaticale) și **zero error messages** implementate. Rewrite-ul de mai sus acoperă 100% din suprafața de text vizibilă. Prioritatea de implementare: Input placeholder → Hint text → Empty state sugestii → Error messages → Context panel labels.
