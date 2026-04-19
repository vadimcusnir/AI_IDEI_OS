# PRM-0202 — Rebuild IA: Command Center Screen Architecture

**Process:** PROC-0202 — command_center_ux_standard
**Input:** Audit PRM-0201 · DOM snapshot · sesiuni live
**Output:** Arhitectura canonică a ecranului, noduri, relații, stări de sistem, route map

---

## 1. Modelul curent (As-Is)

```
/home (Cockpit)
├── [SIDEBAR] nav globală (27 itemi, 5 secțiuni)
│   ├── CORE: Command Center, Pipeline, Services, Library, Jobs
│   ├── ECONOMY: Credits, Marketplace, Purchases
│   ├── INTELLIGENCE: Neurons, Knowledge Graph, My Analytics
│   ├── TOOLS: Deliverables, Learning, Progress, Workspace, Personal OS,
│   │         Augmentation, VIP Program, Integrations
│   └── ADMIN: Dashboard, Council Chat, Control Center, Cost Engine,
│              Kernel, Runtime, Analytics, Catalog
│
├── [HEADER] Toggle Sidebar | Session Title | Copy | New Session | User Avatar
│
├── [MAIN CANVAS] — stare goală sau sesiune activă
│   ├── Empty State: How can I help? + Sugestii + Recent Sessions + Recommended Actions
│   └── Session Active: Thread mesaje + Input bar
│
├── [INPUT BAR] + Add Input | Extract/Analyze/Generate | Textarea | State/Runs/Assets
│
└── [MOBILE NAV] Home | Pipeline | Library | Services | More
```

**Probleme arhitecturale identificate:**
- Sidebar conține 27 itemi — nu există ierarhie de profunzime
- ADMIN vizibil în mod User — risc de confuzie și acces greșit
- Empty State și Session Active partajează același canvas fără separare clară
- Panoul drept (State/Runs/Assets) nu are loc definit în ierarhia de informații

---

## 2. Modelul canonic (To-Be)

### 2.1 Structura zonelor ecranului

```
/home (Command Center)
┌─────────────────────────────────────────────────────────────────────┐
│ [SIDEBAR-L] 240px                │ [MAIN CANVAS] flex-1             │ [PANEL-R] 320px (colapsibil)
│ ─────────────────────────────── │ ──────────────────────────────── │ ─────────────────────────────
│ Logo + Workspace Switcher        │ [HEADER-SESSION]                 │ [TAB: State]
│                                  │  Session title | New | Copy      │   Variabile sesiune
│ [NAV PRIMARY — 5 itemi max]      │                                  │   Context activ
│  ● Command Center (activ)        │ [CHAT THREAD]                    │   Model selectat
│  ○ Pipeline                      │  max-w-2xl mx-auto               │
│  ○ Library                       │  padding: 24px 16px              │ [TAB: Runs]
│  ○ Services                      │                                  │   Execuții curente
│  ○ Neurons                       │ [EMPTY STATE] — când nu e sesiune│   Status + cost
│                                  │  sau                             │
│ [NAV SECONDARY — colapsibil]     │ [MESSAGES] — când sesiune activă │ [TAB: Assets]
│  Jobs / Credits / Purchases      │                                  │   Fișiere generate
│  Knowledge Graph / Analytics     │ [INPUT ZONE — sticky bottom]     │   Exporturi
│                                  │  Mode pills + Textarea + Submit  │
│ [FOOTER NAV]                     │  Cost estimat + Hint text        │
│  OPERATOR MODE toggle            │                                  │
│  VIP status                      │                                  │
│  User avatar                     │                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Noduri și relații

| Nod | Tip | Relație cu | Stare |
|---|---|---|---|
| `CommandCenter` | Route | root `/home` | always visible |
| `SessionList` | Component | `CommandCenter` | visible în empty state |
| `SessionActive` | Component | `CommandCenter` | visible când sesiune selectată |
| `InputBar` | Component | `CommandCenter` | always visible, sticky bottom |
| `ModeSelector` | Sub-component | `InputBar` | Extract / Analyze / Generate |
| `CommandPalette` | Overlay | `InputBar` (trigger: `/`) | on-demand |
| `ServicePicker` | Overlay | `InputBar` (trigger: `+`) | on-demand |
| `ContextPanel` | Panel | `SessionActive` | colapsibil, default closed |
| `StateTab` | Tab | `ContextPanel` | variabile sesiune |
| `RunsTab` | Tab | `ContextPanel` | execuții active |
| `AssetsTab` | Tab | `ContextPanel` | fișiere generate |
| `Sidebar` | Layout | global | persistent desktop, drawer mobile |
| `WorkspaceSwitcher` | Component | `Sidebar` | dropdown |
| `GlobalSearch` | Overlay | global (trigger: `⌘K`) | on-demand |

### 2.3 Stările sistemului

```
CommandCenter States:
├── IDLE (empty state)
│   ├── no session selected
│   ├── shows: welcome message + suggestions + recent sessions + recommended actions
│   └── input: active, accepts new commands
│
├── SESSION_ACTIVE
│   ├── session selected from list or new session started
│   ├── shows: message thread + context panel (optional)
│   └── input: active, context-aware
│
├── PROCESSING
│   ├── command submitted, AI generating
│   ├── shows: typing indicator + cost counter
│   └── input: disabled or queued
│
├── SESSION_ERROR
│   ├── API error, insufficient credits, timeout
│   ├── shows: error message + retry action
│   └── input: re-enabled
│
└── SESSION_COMPLETE
    ├── AI response received
    ├── shows: full response + action buttons (Copy, Export, Continue)
    └── input: re-enabled
```

### 2.4 Route Map canonic

```
/home                          → CommandCenter (IDLE)
/home?session={id}             → CommandCenter (SESSION_ACTIVE, session preloaded)
/home/new                      → CommandCenter (SESSION_ACTIVE, blank session)
/home?mode=extract             → CommandCenter (IDLE, Extract mode pre-selected)
/home?mode=analyze             → CommandCenter (IDLE, Analyze mode pre-selected)
/home?mode=generate            → CommandCenter (IDLE, Generate mode pre-selected)
```

---

## 3. Ierarhia de informații (Information Hierarchy)

### Nivel 1 — Permanent vizibil
- Input bar (textarea + submit)
- Mode selector (Extract / Analyze / Generate)
- Session title (când sesiune activă)

### Nivel 2 — Vizibil la scroll / în viewport
- Mesajele sesiunii active
- Empty state (sugestii + sesiuni recente)

### Nivel 3 — On-demand (click/trigger)
- Context panel (State / Runs / Assets)
- Command palette (`/` trigger)
- Service picker (`+` trigger)
- Session list completă (Show more)

### Nivel 4 — Navigație globală
- Sidebar (persistent desktop, drawer mobile)
- Global search (`⌘K`)

---

## 4. Decizii arhitecturale

| Decizie | Motivare |
|---|---|
| Sidebar redus la 5 itemi primari | Limita cognitivă 7±2; itemii secundari în sub-nav colapsibil |
| ADMIN separat în mod OPERATOR | Previne confuzia utilizatorilor normali; securitate prin obscuritate UI |
| Empty state restructurat în 2 zone | Zone: (A) acțiune imediată, (B) context/istoric — nu amestecate |
| Context panel default închis | Reduce zgomotul vizual; se deschide automat când există conținut relevant |
| Route params pentru mode pre-selection | Permite deep-linking din Pipeline sau alte module |
| Mobile nav: 4 itemi + More | Aliniament cu pattern iOS/Android standard; elimină redundanța cu sidebar |
