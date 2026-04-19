# PRM-0204–0207 — UI Specifications: Command Center

**Process:** PROC-0202 — command_center_ux_standard
**Acoperă:** Layout ideal · Navigație · Empty States · CTA Hierarchy
**Output:** Specificații complete pentru implementare frontend

---

## 1. Layout Ideal — Command Center

### 1.1 Desktop (>1280px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px, fixed)     │ MAIN CANVAS (flex-1)          │ PANEL-R (320px) │
│                            │                               │ (colapsibil)    │
│ [Logo 32px]                │ [SESSION HEADER 48px]         │                 │
│ [Workspace 36px]           │  ← All sessions | Title | ⊕  │ [State]         │
│ ─────────────────          │ ─────────────────────────     │ [Runs]          │
│ CORE                       │                               │ [Assets]        │
│  ● Command Center          │ [CHAT THREAD]                 │                 │
│  ○ Pipeline                │  max-w-2xl, mx-auto           │ (content here)  │
│  ○ Library                 │  padding: 24px 16px           │                 │
│  ○ Services                │  overflow-y: auto             │                 │
│  ○ Neurons                 │                               │                 │
│ ─────────────────          │                               │                 │
│ [More ▾]                   │                               │                 │
│  Jobs · Credits · etc.     │                               │                 │
│ ─────────────────          │                               │                 │
│ [OPERATOR MODE toggle]     │ [INPUT ZONE sticky bottom]    │                 │
│ [VIP · 14,577 N]           │  border-t, bg-background/95   │                 │
│ [VA vadim.kusnir]          │  backdrop-blur-sm             │                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tablet (640px–1280px)

- Sidebar colapsează în drawer (slide-in din stânga, overlay)
- Panel-R dispare — conținut accesibil prin bottom sheet
- Main canvas: 100% lățime
- Input zone: padding 16px

### 1.3 Mobile (<640px)

- Sidebar: drawer complet (full-screen overlay)
- Bottom nav: 4 itemi fixați (`Command Center`, `Pipeline`, `Library`, `More`)
- Panel-R: bottom sheet (swipe-up)
- Input zone: padding 12px, textarea min-h 44px (touch target)

---

## 2. Input Zone — Specificații detaliate

### 2.1 Structura componentei

```
[INPUT ZONE]
├── [MODE PILLS ROW] — deasupra textarea
│   ├── Pill: Extract (icon: ⬆ + label)
│   ├── Pill: Analyze (icon: 🔍 + label)
│   └── Pill: Generate (icon: ✨ + label)
│
├── [TEXTAREA ROW]
│   ├── [+] Attach button (stânga)
│   ├── Textarea (flex-1, auto-resize)
│   └── [Submit] button (dreapta, activ când text > 0)
│
└── [HINT ROW] — sub textarea
    ├── Stânga: `Enter to run · / for commands · + to attach`
    └── Dreapta: `~{N} neurons` (cost estimat, dinamic)
```

### 2.2 Stările textarea

| Stare | Comportament vizual |
|---|---|
| Default | border: 1px solid border/40, placeholder vizibil |
| Focus | border: 1px solid primary/60, ring 2px primary/20 |
| Typing | border: 1px solid primary/80, submit button activat |
| Processing | disabled, opacity 0.5, spinner în submit button |
| Error | border: 1px solid destructive, mesaj eroare sub textarea |

### 2.3 Mode Pills

| Stare | Stil |
|---|---|
| Inactive | bg-muted/40, text-muted-foreground, border border/20 |
| Active/Selected | bg-primary/15, text-primary, border border-primary/40 |
| Hover | bg-muted/60 |

### 2.4 Submit Button

```
Default (empty): opacity 0.3, cursor not-allowed
Active (text present): opacity 1, bg-primary, hover: bg-primary/90
Processing: spinner animation, disabled
```

---

## 3. Empty State — Specificații detaliate

### 3.1 Structura (2 zone distincte)

```
[EMPTY STATE]
├── [ZONE A — Acțiune imediată] (centrat vertical, max-w-lg)
│   ├── Icon/Logo animat (32px, subtle pulse)
│   ├── Title: "Command Center" (h2, 24px)
│   ├── Subtitle: "Run a command, extract knowledge, or continue a session." (14px, muted)
│   └── [SUGGESTIONS GRID] (2×2, max 4 carduri)
│       └── Fiecare card: icon + title + body + CTA button
│
└── [ZONE B — Context/Istoric] (scroll, max-w-2xl)
    ├── [RECENT SESSIONS] (max 5 vizibile, Show more)
    └── [RECOMMENDED ACTIONS] (max 3 carduri L1/L2/L3)
```

### 3.2 Suggestion Cards

```css
.suggestion-card {
  border: 1px solid border/20;
  border-radius: 12px;
  padding: 16px;
  background: muted/20;
  cursor: pointer;
  transition: all 200ms;
}

.suggestion-card:hover {
  border-color: primary/40;
  background: primary/5;
}

.suggestion-card .icon { font-size: 20px; margin-bottom: 8px; }
.suggestion-card .title { font-size: 14px; font-weight: 600; }
.suggestion-card .body { font-size: 12px; color: muted-foreground; margin-top: 4px; }
```

### 3.3 Separarea zonelor A și B

- Zona A: `min-height: 40vh`, centrat vertical
- Separator: `border-t border/10` cu label `RECENT ACTIVITY`
- Zona B: scroll normal, `padding-bottom: 80px` (clearance pentru input bar)

---

## 4. Navigație Globală — Specificații

### 4.1 Sidebar restructurat

```
[SIDEBAR 240px]
├── [HEADER] Logo (32px) + Workspace Switcher
│
├── [PRIMARY NAV] — 5 itemi, always visible
│   ● Command Center    (icon: terminal)
│   ○ Pipeline          (icon: workflow)
│   ○ Library           (icon: book-open)
│   ○ Services          (icon: zap)
│   ○ Neurons           (icon: brain)
│
├── [SECONDARY NAV] — colapsibil, default closed
│   [More ▾ / ▲]
│   ○ Jobs              (icon: briefcase)
│   ○ Credits           (icon: coins)
│   ○ Marketplace       (icon: store)
│   ○ Purchases         (icon: receipt)
│   ○ Knowledge Graph   (icon: network)
│   ○ Analytics         (icon: bar-chart)
│
├── [ADMIN NAV] — vizibil DOAR în OPERATOR MODE
│   ○ Dashboard
│   ○ Council Chat
│   ○ Control Center
│   ○ Cost Engine
│   ○ Kernel / Runtime / Catalog
│
└── [FOOTER]
    [Operator Mode toggle]
    [VIP · {N} N]
    [Avatar + username]
```

### 4.2 Nav Item States

| Stare | Stil |
|---|---|
| Default | text-muted-foreground, icon opacity 0.6 |
| Hover | text-foreground, bg-muted/40, icon opacity 1 |
| Active | text-primary, bg-primary/10, border-l-2 border-primary |
| Badge | dot roșu (notificări) sau număr (count) |

### 4.3 Mobile Bottom Nav

```
[HOME] [PIPELINE] [LIBRARY] [SERVICES] [MORE]
  ↑ active indicator: dot sau underline 2px primary
  ↑ tap target: min 44×44px
  ↑ label: 10px, font-weight 500
```

---

## 5. Context Panel Drept — Specificații

### 5.1 Comportament

- **Default:** închis (0px width)
- **Deschis:** 320px, slide-in din dreapta (300ms ease-out)
- **Trigger:** click pe tab (State/Runs/Assets) din toolbar dreapta
- **Auto-open:** când există runs active sau assets generate

### 5.2 Tabs cu label + icon

```
[State]  (icon: sliders)
[Runs]   (icon: play-circle) + badge count dacă runs active
[Assets] (icon: file-box)    + badge count dacă assets prezente
```

### 5.3 Tab Content

**State Tab:**
```
Session Variables:
  Mode: {Extract/Analyze/Generate}
  Model: {model_name}
  Context: {N} messages
  Neurons used: {N}N
  Session ID: {id}
```

**Runs Tab:**
```
[Run card]
  Status: ● Running / ✓ Complete / ✗ Failed
  Command: "{first 60 chars of command}"
  Duration: {Xs}
  Cost: {N}N
  [View output] [Retry]
```

**Assets Tab:**
```
[Asset card]
  Type: PDF / TXT / JSON / MD
  Name: "{filename}"
  Size: {size}
  Generated: {time_ago}
  [Download] [Preview]
```

---

## 6. CTA Hierarchy — Command Center

### Nivelul 1 — Primary CTA (o singură acțiune dominantă per ecran)
- **Empty state:** Input bar (textarea focus automat la load)
- **Session active:** Submit button

### Nivelul 2 — Secondary CTAs
- Mode pills (Extract / Analyze / Generate)
- New session button
- Suggestion cards

### Nivelul 3 — Tertiary CTAs
- Show more sessions
- Explore (Recommended Actions)
- Context panel tabs

### Nivelul 4 — Utility CTAs
- Copy session
- Download asset
- Skip (Later)

### Regulă de implementare
Nu există niciodată doi butoni de nivel 1 în același viewport. Submit button este singurul element cu `bg-primary` solid în zona de input.

---

## 7. Animații și tranziții

| Element | Animație | Durată |
|---|---|---|
| Sidebar open/close | slide-x + fade | 250ms ease-out |
| Context panel open/close | slide-x | 300ms ease-out |
| Message appear | fade-up (translateY 8px → 0) | 200ms ease-out |
| Typing indicator | pulse dots (3 dots, staggered) | 600ms loop |
| Mode pill select | scale 0.97 → 1 + color transition | 150ms |
| Suggestion card hover | translateY -2px + shadow | 200ms |
| Submit button activate | opacity 0.3 → 1 | 150ms |
| Cost indicator update | number count-up | 300ms |
