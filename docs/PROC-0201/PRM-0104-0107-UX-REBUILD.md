# PRM-0104 + PRM-0105 + PRM-0106 + PRM-0107 OUTPUT — UX Rebuild

**Site:** ai-idei.com
**Cluster:** CL-0101 / site_worldclass_alignment
**Process:** PROC-0201 / home_to_global_standard

---

## PRM-0104 — IDEAL HOME LAYOUT (Dashboard de activare)

### Principiu de construcție
/home funcționează ca nod de orientare + activare, nu ca landing page. Trei stări de user: first-time, returning, power user.

---

### LAYOUT COMPLET — ORDINE EXACTĂ

#### BLOC 1: HERO
**Scop:** Orientare imediată + activare
**Componentă UI:** Full-width section, dark background, max contrast pe CTA
**Conținut:**
- Headline funcțional (8–12 cuvinte)
- Subheadline (max 15 cuvinte)
- CTA primar: "Start Free" (filled button, accent color)
- CTA secundar: "See how it works" (text link, subdued)
- Trust line: "No credit card · 500 free credits · Cancel anytime"
- Visual: diagrama simplificată Input → Engine → Output (3 noduri, animată subtil)

**KPI urmărit:** Hero CTA click rate (target: >8% din vizitatori unici)

**Reguli de afișare:**
- First-time user (non-auth): afișează complet
- Returning user (non-auth): afișează cu CTA "Continue where you left off" dacă există sesiune salvată
- Auth user: redirecționează direct la /home (Cockpit) — nu afișează landing

---

#### BLOC 2: PROBLEM FRAME
**Scop:** Identificare cu problema
**Componentă UI:** 3 carduri orizontale, icoane simple, text scurt
**Conținut:**
- Card 1: "Too many ideas, not enough structure" + icon (scattered nodes)
- Card 2: "Too much time writing, not enough output" + icon (hourglass)
- Card 3: "Good thinking locked in notes and recordings" + icon (locked vault)

**KPI urmărit:** Time on section (proxy pentru identificare)

**Reguli de afișare:** Întotdeauna (non-auth)

---

#### BLOC 3: MECHANISM (condensat)
**Scop:** Înțelegere mecanism în 30 secunde
**Componentă UI:** 3-step horizontal flow cu exemplu real vizibil
**Conținut:**
- Step 1: "Upload" — voice note, document, transcript, rough draft (cu icoane input)
- Step 2: "Extract" — AI procesează: filtrare, parsing, clustering, compresie semantică
- Step 3: "Deploy" — 50+ outputs: articole, emailuri, scripturi, oferte, framework-uri
- Exemplu concret vizibil: "Input: 10-minute voice note → Output: 1 article + 3 emails + 1 offer page + 5 social posts"

**CTA:** "Try with your own idea →" (text link, duce la signup)

**KPI urmărit:** CTA click rate din secțiune

**Reguli de afișare:** Întotdeauna (non-auth)

---

#### BLOC 4: PROOF
**Scop:** Credibilitate
**Componentă UI:** 3 testimonial cards + 1 metric highlight bar
**Conținut:**
- 3 testimoniale reale: fotografie + nume complet + titlu + companie + citat specific cu rezultat
- Metric bar: "2,400+ knowledge workers · 1.2M+ neurons processed · 50+ AI services"

**KPI urmărit:** Engagement cu testimoniale (hover, click pe profil dacă există)

**Reguli de afișare:** Dacă există testimoniale reale; altfel înlocuiește cu metric bar extins

---

#### BLOC 5: OUTPUTS (condensat)
**Scop:** Demonstrare completitudine
**Componentă UI:** Tab navigation (5 tabs) + grid 2×3 cu preview per tab
**Conținut:**
- Tab CONTENT: Articles, Social posts, Threads, Newsletters, Scripts
- Tab SALES: Landing copy, Email sequences, Offer pages, Ad copy, VSLs
- Tab EDUCATION: Course modules, Frameworks, Guides, Checklists, Workshops
- Tab KNOWLEDGE: Insights, Patterns, Formulas, Mental models, Atomic notes
- Tab ASSISTANTS: Writing agent, Offer builder, Research helper, Campaign planner

**CTA:** "Explore all outputs →" (duce la /services)

**KPI urmărit:** Tab engagement rate

**Reguli de afișare:** Întotdeauna (non-auth)

---

#### BLOC 6: PRICING TEASER
**Scop:** Reducere fricțiune financiară
**Componentă UI:** 2 carduri simple (Free + Pro) + link la pricing complet
**Conținut:**
- Card Free: $0 / 500 Neurons / Features de bază / CTA "Start Free"
- Card Pro: $47/mo / 10,000 Neurons / Toate serviciile / CTA "Try Pro"
- Link: "See all plans →" (duce la /pricing)

**KPI urmărit:** Click rate pe CTA pricing

**Reguli de afișare:** Întotdeauna (non-auth)

---

#### BLOC 7: CTA FINAL
**Scop:** Ultimul punct de activare
**Componentă UI:** Full-width section, contrast maxim, headline + CTA + trust line
**Conținut:**
- Headline: "Start turning your ideas into assets today."
- CTA: "Start Free — No card required" (filled button, large)
- Trust line: "Join 2,400+ knowledge workers. Cancel anytime."

**KPI urmărit:** CTA click rate (target: >5% din cei care ajung la final)

**Reguli de afișare:** Întotdeauna (non-auth)

---

### VERSIUNI PER TIP DE USER

| Tip user | Modificare față de layout standard |
|---|---|
| First-time (non-auth) | Layout complet, toate 7 blocuri |
| Returning (non-auth, cookie existent) | Hero modificat: "Welcome back. Continue where you left off." + CTA "Log In" primar |
| Auth user (redirect la /home Cockpit) | Nu vede landing page. Vede Cockpit cu empty state activ sau pipeline activ. |
| Auth user, power user (>10 sesiuni) | Cockpit fără onboarding tips. Pipeline persistent vizibil. Quick actions în hero Cockpit. |

---

## PRM-0105 — NAVIGAȚIE GLOBALĂ STANDARDIZATĂ

### Navigație publică (landing page)

**Header desktop:**
```
[Logo AI-IDEI]  [How It Works]  [What You Get]  [Features]  [Pricing]  ···  [Log In]  [Start Free ▶]
```

**Reguli:**
- Logo = link la /
- "Start Free" = filled button, accent color, always visible
- "Log In" = ghost button
- Nicio altă acțiune în header (elimină language selector din poziție proeminentă — mută în footer)
- Mobile: hamburger menu cu aceleași items în ordine verticală

**Header mobile:**
```
[Logo]  ···  [Start Free]  [☰]
```

**Footer (3 coloane):**
```
[AI-IDEI logo + tagline]  |  PLATFORM: How It Works / What You Get / Pricing / Docs  |  COMPANY: About / Blog / Changelog / Contact  |  LEGAL: Terms / Privacy / Data Privacy
```

---

### Navigație internă (sidebar app)

**Structură finală (după comasare din PRM-0102):**

```
[AI-IDEI logo]
[Search ⌘K]
[Workspace selector ▾]

CORE
  🏠 Cockpit
  ⚡ Pipeline
  🔧 Services
  📚 Library
  📋 Jobs

ECONOMY
  💳 Credits & Purchases

INTELLIGENCE
  🧠 Neurons
  🕸 Knowledge Graph
  📊 Analytics

TOOLS
  📦 Outputs
  🎓 Learning & Progress

[divider]

⚙ Settings
  VIP Program
  Integrations
  Personal OS

[divider]

[User avatar] [name] [plan badge]
[OPERATOR MODE toggle] (admin only)
```

**Reguli sidebar:**
- Sidebar colapsabil (toggle button persistent)
- Starea activă: highlight cu accent color + bold label
- Hover: subtle background change
- Niciun item fără iconiță
- Grupele (CORE / ECONOMY / INTELLIGENCE / TOOLS) sunt labels, nu clickabile

---

### Breadcrumbs

**Format:** `Cockpit > Services > [Service Name]`

**Reguli:**
- Vizibil pe toate paginile depth ≥ 2
- Primul item = Cockpit (link activ)
- Ultimul item = pagina curentă (nu link)
- Mobile: afișează doar ultimele 2 niveluri

---

### Contextual navigation

**Pipeline bar (persistent):**
- Vizibil pe toate ecranele CORE și ECONOMY
- Afișează: job curent activ + status (running / complete / failed) + % progres
- Click pe bar → deschide /jobs cu job-ul curent selectat

**Cross-links critice:**
- /services/:id → "Add to Pipeline" button persistent
- /library/:id → "Process with AI" button persistent
- /deliverables → "Save to Library" button per output
- /credits → "Upgrade Plan" link persistent când sold < 200 Neurons

---

### Anti-patterns de eliminat

| Anti-pattern | Locație actuală | Remediere |
|---|---|---|
| Language selector în header proeminent | Header landing (🇬🇧 button) | Mută în footer sau în user settings |
| "OPERATOR MODE" toggle vizibil pentru toți userii | Sidebar bottom | Vizibil doar pentru useri cu rol admin |
| Navigație landing (MECHANISM/OUTPUTS/CONTROL/ACCESS) ≠ navigație app | — | Aliniază terminologia conform PRM-0102 |
| Footer cu 5 coloane și 20+ linkuri | Footer landing | Comprimă la 3 coloane conform structurii de mai sus |
| Sidebar fără icoane pe unele items | Sidebar app | Adaugă iconiță pentru fiecare item |

---

## PRM-0106 — EMPTY STATES CARE ACTIVEAZĂ

Schema: **Context → Direction → Preview** pentru fiecare empty state.

---

### EMPTY STATE 1: Cockpit (Command Center) — First login

**Trigger:** User autentificat, 0 sesiuni anterioare, 0 joburi

**Titlu:** "Your extraction engine is ready."

**Microcopy:** "Start by uploading something you already have — a voice note, a document, a rough draft, or a transcript. AI-IDEI will extract the knowledge and show you what it can become."

**CTA primar:** "Upload your first source →" (duce la /services cu filtru "extraction")

**CTA secundar:** "See an example first" (deschide modal cu demo walkthrough)

**Ghost preview:** Afișează un pipeline demo gri (non-interactiv) cu 3 joburi fictive completate și outputs vizibile — pentru a arăta cum arată un Cockpit activ

**Error fallback:** Dacă upload eșuează → "Something went wrong with the upload. Try a different format (MP3, PDF, TXT, DOCX) or paste text directly."

**Metrică de activare:** % useri care fac primul upload în prima sesiune (target: >40%)

---

### EMPTY STATE 2: Pipeline — Fără joburi active

**Trigger:** User autentificat, Pipeline gol

**Titlu:** "No active pipeline yet."

**Microcopy:** "A pipeline is a sequence of AI services applied to your source. Start by adding a service to your first upload."

**CTA primar:** "Add your first service →" (duce la /services)

**CTA secundar:** "Learn how pipelines work" (duce la /learning cu articolul Pipeline 101)

**Ghost preview:** Diagrama unui pipeline simplu cu 3 pași (Upload → Extract → Output) în stil ghost/gri

**Metrică de activare:** % useri care creează primul pipeline în primele 24h

---

### EMPTY STATE 3: Library — Fără items

**Trigger:** User autentificat, Library goală

**Titlu:** "Your knowledge library is empty."

**Microcopy:** "Every source you upload and every output you save builds your library. Start by uploading your first document or recording."

**CTA primar:** "Upload a source →" (duce la /services)

**CTA secundar:** "Browse example library" (deschide modal cu demo library)

**Ghost preview:** 3 carduri ghost cu tipuri de items: Document / Recording / Framework

**Metrică de activare:** % useri care au minim 3 items în Library după 7 zile

---

### EMPTY STATE 4: Jobs — Fără joburi

**Trigger:** User autentificat, Jobs gol

**Titlu:** "No jobs running yet."

**Microcopy:** "Jobs appear here when you run an AI service. Each job shows its status, cost in Neurons, and outputs when complete."

**CTA primar:** "Run your first service →" (duce la /services)

**CTA secundar:** — (nu este necesar)

**Ghost preview:** 2 carduri ghost cu status "Complete" și "Running" pentru context vizual

**Metrică de activare:** % useri care rulează primul job în prima sesiune

---

### EMPTY STATE 5: Outputs (Deliverables) — Fără outputs

**Trigger:** User autentificat, Outputs gol

**Titlu:** "No outputs generated yet."

**Microcopy:** "Outputs appear here after you run AI services. They are organized by type — copy, content, frameworks, and more — and can be exported or saved to your library."

**CTA primar:** "Generate your first output →" (duce la /services)

**CTA secundar:** "See output examples" (deschide modal cu galerie de outputs demo)

**Ghost preview:** Grid 2×3 cu output cards ghost (Article / Email / Script / Framework / Offer / Social post)

**Metrică de activare:** % useri cu minim 1 output generat în prima sesiune

---

### EMPTY STATE 6: Knowledge Graph — Fără noduri

**Trigger:** User autentificat, Knowledge Graph gol

**Titlu:** "Your knowledge graph grows with every upload."

**Microcopy:** "Each source you process adds nodes to your graph — insights, patterns, frameworks, and connections between ideas. The more you upload, the more valuable your graph becomes."

**CTA primar:** "Start building your graph →" (duce la /services)

**CTA secundar:** "See a sample graph" (deschide modal cu demo graph)

**Ghost preview:** Vizualizare ghost a unui knowledge graph cu 8–10 noduri și conexiuni

**Metrică de activare:** % useri cu minim 10 noduri în Knowledge Graph după 30 zile

---

## PRM-0107 — CTA SYSTEM COMPLET

### Principii

1. **Un singur CTA primar per ecran.** Orice altceva este secundar sau terțiar.
2. **Ierarhie vizuală strictă:** Primar = filled button / Secundar = outlined button / Terțiar = text link
3. **Logica de progres:** Explorare → Onboarding → Utilizare → Upgrade — fiecare CTA se aliniază cu stadiul userului

---

### CTA MATRIX PE PAGINI

| Pagină | CTA Primar | CTA Secundar | CTA Terțiar | Logică |
|---|---|---|---|---|
| /home (landing, non-auth) | "Start Free" | "See how it works" (text link) | — | Activare directă |
| /home (landing, returning non-auth) | "Log In" | "Start Free" (outlined) | — | Reactivare |
| /pricing | "Start Free" (pe planul Explorer) | "Try Pro" (pe planul Pro) | "See all features" (text link) | Conversie plan |
| /docs | — | "Start Free" (în header) | — | Suport → conversie |
| /about | "Start Free" | "See how it works" | — | Brand → conversie |
| Cockpit (auth, empty) | "Upload your first source" | "See an example" | — | Activare primă sesiune |
| Cockpit (auth, activ) | "New session" | "View pipeline" | "Browse services" | Continuare workflow |
| /services | "Run service" (per card) | "Add to Pipeline" | "Learn more" (text link) | Execuție |
| /services/:id | "Run Now" | "Add to Pipeline" | "Save for later" | Execuție directă |
| /library | "Upload new source" | "Process selected" | — | Adăugare + procesare |
| /library/:id | "Process with AI" | "Export" | "Add to Pipeline" | Procesare item existent |
| /credits | "Buy Neurons" | "Upgrade Plan" | — | Monetizare |
| /marketplace | "Buy" (per item) | "Preview" | — | Achiziție |
| /pricing (plan pages) | "Choose [Plan]" | "Start Free" (fallback) | "Contact us" (Enterprise) | Conversie plan |

---

### TEXT FINAL RECOMANDAT PENTRU CTA-URI PRINCIPALE

| Context | Text actual (dacă există) | Text recomandat | Motiv |
|---|---|---|---|
| Hero landing, primar | "Start Free" | "Start Free — No card required" | Elimină fricțiunea financiară |
| Hero landing, secundar | "See the Mechanism" | "See how it works" | Mai clar, standard universal |
| Cockpit empty state | — | "Upload your first source →" | Descrie acțiunea concretă |
| Services card | — | "Run Now" | Imperativ direct, fără ambiguitate |
| Pipeline empty | — | "Add your first service →" | Descrie acțiunea concretă |
| Pricing card primar | "Choose Pro" | "Try Pro Free for 7 days" (dacă există trial) sau "Choose Pro" | Dacă există trial, îl comunici |
| CTA final landing | — | "Start Free — No card required" | Consistent cu hero |

---

### REGULI DE PRIORITATE VIZUALĂ

1. Pe orice ecran, CTA primar are contrast ≥ 4.5:1 față de background.
2. CTA primar este întotdeauna mai mare decât CTA secundar (min 8px diferență în font-size sau padding).
3. Niciodată două filled buttons pe același ecran la același nivel vizual.
4. CTA-urile text link nu au border sau background — sunt distincte de outlined buttons.
5. Pe mobile, CTA primar are width: 100% (full-width) în hero și în CTA final.
6. Sticky CTA bar apare după 30% scroll pe landing page: "Start Free" (filled) + "Already have an account? Log in" (text link).

---

### ERORI DE ELIMINAT

| Eroare | Locație | Impact | Remediere |
|---|---|---|---|
| Două CTA-uri la același nivel vizual în hero | /home hero | Hesitation, scădere click rate | Ierarhizează: primar filled, secundar text link |
| "See the Mechanism" ca CTA — duce la scroll, nu la pagină | /home hero | Userul nu știe că e scroll, nu navigație | Transformă în anchor link explicit sau elimină |
| Niciun CTA persistent pe scroll | /home landing | Userul care vrea să acționeze după 50% scroll nu are unde | Adaugă sticky CTA bar |
| CTA "Dashboard" în header landing | /home header | Userul non-auth care dă click ajunge la login — fără context | Redenumește în "Log In" sau elimină din header landing |
| "Magic Button" ca span cu rol button | /home hero | Element interactiv fără funcționalitate clară | Elimină sau transformă în CTA real cu destinație clară |
