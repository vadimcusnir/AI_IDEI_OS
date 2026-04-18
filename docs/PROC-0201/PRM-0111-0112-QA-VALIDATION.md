# PRM-0111 + PRM-0112 OUTPUT — QA Acceptance Protocol + Post-Launch Validation

**Site:** ai-idei.com
**Cluster:** CL-0101 / site_worldclass_alignment
**Process:** PROC-0201 / home_to_global_standard

---

## PRM-0111 — UX ACCEPTANCE PROTOCOL

### Instrucțiuni de utilizare

Fiecare criteriu are răspuns binar: **PASS** sau **FAIL**. Un FAIL pe orice criteriu P0 blochează lansarea. Un FAIL pe criteriu P1 necesită remediere înainte de lansare sau document de excepție aprobat.

---

### BLOC 1: COMPREHENSIUNE (/home landing)

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| C1 | Userul înțelege ce face produsul în 5 secunde (test cu 3 persoane noi) | User test: "Ce face acest site?" la 5 secunde după prima vedere | Răspuns corect ≥ 2/3 | Răspuns corect < 2/3 |
| C2 | Headline nu conține metafore sau jargon intern | Review manual | Zero metafore sau termeni neexplicați | Orice metaforă sau termen abstract |
| C3 | Subheadline ≤ 15 cuvinte | Word count | ≤ 15 cuvinte | > 15 cuvinte |
| C4 | Trust line vizibilă sub CTA primar | Inspecție vizuală | Vizibilă, contrast ≥ 4.5:1 | Lipsă sau contrast insuficient |
| C5 | Userul știe ce se întâmplă după click pe CTA primar | User test: "Ce crezi că se întâmplă dacă dai click?" | Răspuns corect ≥ 2/3 | Răspuns corect < 2/3 |

---

### BLOC 2: NAVIGAȚIE

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| N1 | Header conține: Logo / How It Works / What You Get / Features / Pricing / Log In / Start Free | Inspecție vizuală | Toate 7 elemente prezente | Orice element lipsă sau redenumit incorect |
| N2 | "Pricing" este vizibil în navigația principală | Inspecție vizuală | Vizibil fără hover sau scroll | Ascuns sau absent |
| N3 | Sidebar app conține structura canonică din PRM-0102 | Inspecție vizuală + DOM | Structura exactă: CORE/ECONOMY/INTELLIGENCE/TOOLS/SETTINGS | Orice deviere de la structura canonică |
| N4 | Fiecare item din sidebar are iconiță | Inspecție vizuală | 100% items cu iconiță | Orice item fără iconiță |
| N5 | Starea activă în sidebar este vizibil diferențiată | Inspecție vizuală | Highlight clar (accent color + bold) | Indistinguibil de starea inactivă |
| N6 | Breadcrumb vizibil pe toate paginile depth ≥ 2 | Verificare pe /services/:id, /library/:id | Breadcrumb prezent și funcțional | Lipsă pe orice pagină depth ≥ 2 |
| N7 | OPERATOR MODE toggle vizibil doar pentru admini | Test cu cont user standard | Nu apare în sidebar | Apare pentru user standard |
| N8 | Zero dead-ends: orice pagină are minim 2 ieșiri utile | Verificare manuală pe toate paginile din sitemap | ≥ 2 ieșiri per pagină | < 2 ieșiri pe orice pagină |

---

### BLOC 3: CTA HIERARCHY

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| CTA1 | Un singur CTA primar (filled button) per ecran | Inspecție vizuală pe toate paginile | Max 1 filled button per ecran | ≥ 2 filled buttons pe același ecran |
| CTA2 | CTA primar are contrast ≥ 4.5:1 față de background | Contrast checker (WebAIM) | ≥ 4.5:1 | < 4.5:1 |
| CTA3 | Sticky CTA bar apare după 30% scroll pe /home | Test manual + DevTools scroll event | Apare la 30% scroll, dispare la CTA final | Nu apare sau apare la alt procent |
| CTA4 | CTA primar pe mobile este full-width în hero și CTA final | Test pe viewport 375px | width: 100% | Nu este full-width |
| CTA5 | "Magic Button" span eliminat sau transformat în CTA real | DOM inspection | Nu există span cu rol button fără funcționalitate | Există |
| CTA6 | "Dashboard" din header landing redenumit în "Log In" | Inspecție vizuală | Label "Log In" | Label "Dashboard" sau altceva |

---

### BLOC 4: SCANNABILITY

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| S1 | /home are ≤ 7 secțiuni | Count manual | ≤ 7 secțiuni | > 7 secțiuni |
| S2 | Fiecare secțiune are SectionHeader cu label + title | Inspecție vizuală | 100% secțiuni cu header | Orice secțiune fără header |
| S3 | Total scroll height /home ≤ 8.000px pe desktop 1440px | DevTools → computed height | ≤ 8.000px | > 8.000px |
| S4 | Nicio secțiune nu depășește 400px înălțime fără CTA intern | Inspecție vizuală + DevTools | Respectat | Orice secțiune > 400px fără CTA |
| S5 | Ierarhie vizuală clară: H1 > H2 > H3 > body | Inspecție vizuală + DOM | Ierarhie respectată | Orice inversare de ierarhie |

---

### BLOC 5: MOBILE BEHAVIOR

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| M1 | /home funcțional pe viewport 375px (iPhone SE) | Test pe device sau DevTools | Zero overflow, zero element ascuns | Orice overflow sau element inaccesibil |
| M2 | /home funcțional pe viewport 768px (tablet) | Test pe device sau DevTools | Zero overflow | Orice overflow |
| M3 | Hamburger menu funcțional pe mobile | Test manual | Se deschide/închide corect, toate items vizibile | Nu funcționează sau items lipsă |
| M4 | Context Panel slide-up pe mobile (nu slide-in) | Test pe viewport 375px | Slide-up din bottom | Slide-in din lateral |
| M5 | Sticky CTA bar respectă safe-area-inset-bottom pe iOS | Test pe iOS Safari | Padding corect, nu acoperă home indicator | Acoperă home indicator |
| M6 | Sidebar app colapsabil pe mobile | Test pe viewport 375px | Sidebar se ascunde, toggle funcțional | Sidebar permanent vizibil pe mobile |

---

### BLOC 6: EMPTY STATES

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| E1 | Cockpit empty state (first login) implementat | Test cu cont nou | Afișează titlu + microcopy + CTA primar + CTA secundar + ghost preview | Orice element lipsă |
| E2 | Pipeline empty state implementat | Test cu pipeline gol | Afișează conform PRM-0106 | Lipsă sau incomplet |
| E3 | Library empty state implementat | Test cu library goală | Afișează conform PRM-0106 | Lipsă sau incomplet |
| E4 | Jobs empty state implementat | Test cu jobs gol | Afișează conform PRM-0106 | Lipsă sau incomplet |
| E5 | Outputs empty state implementat | Test cu outputs gol | Afișează conform PRM-0106 | Lipsă sau incomplet |
| E6 | Knowledge Graph empty state implementat | Test cu graph gol | Afișează conform PRM-0106 | Lipsă sau incomplet |
| E7 | Niciun empty state nu afișează doar un input field gol | Inspecție vizuală | Toate empty states au context + direction + preview | Orice empty state fără context |

---

### BLOC 7: ONBOARDING CLARITY

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| O1 | Userul nou știe ce să facă după primul login (test cu 3 persoane) | User test: "Ce faci acum?" | ≥ 2/3 răspund corect (upload ceva) | < 2/3 răspund corect |
| O2 | CTA din Cockpit empty state duce la /services cu filtru extraction | Test funcțional | Redirect corect cu filtru activ | Redirect greșit sau fără filtru |
| O3 | Demo walkthrough modal funcțional (CTA secundar din empty state) | Test funcțional | Modal se deschide, conținut demo vizibil | Nu se deschide sau conținut lipsă |

---

### BLOC 8: ACCESSIBILITY

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| A1 | Toate imaginile au alt text | axe DevTools sau WAVE | Zero erori alt text | Orice imagine fără alt text |
| A2 | Toate butoanele au label accesibil | axe DevTools | Zero erori button label | Orice buton fără label |
| A3 | Focus visible pe toate elementele interactive | Tab navigation manual | Focus ring vizibil pe toate elementele | Orice element fără focus ring |
| A4 | Keyboard navigation completă (Tab, Enter, Escape) | Test manual cu tastatură | Toate funcțiile accesibile via keyboard | Orice funcție inaccesibilă |
| A5 | Contrast text ≥ 4.5:1 pe toate textele body | Contrast checker | ≥ 4.5:1 | < 4.5:1 pe orice text body |

---

### BLOC 9: SPEED PERCEPTION

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| SP1 | LCP (Largest Contentful Paint) ≤ 2.5s | PageSpeed Insights | ≤ 2.5s | > 2.5s |
| SP2 | CLS (Cumulative Layout Shift) < 0.1 | PageSpeed Insights | < 0.1 | ≥ 0.1 |
| SP3 | INP (Interaction to Next Paint) < 200ms | PageSpeed Insights | < 200ms | ≥ 200ms |
| SP4 | Loading states (skeleton) pe toate componentele cu date async | Inspecție vizuală cu throttling | Skeleton vizibil pe toate | Orice componentă fără skeleton |

---

### BLOC 10: CONSISTENCY

| # | Criteriu | Metodă de verificare | Pass | Fail |
|---|---|---|---|---|
| CO1 | Terminologie consistentă landing ↔ app (conform mapping PRM-0102) | Review manual | Zero inconsistențe | Orice inconsistență terminologică |
| CO2 | Design tokens folosite în toate componentele (zero valori hardcodate) | Code review | Zero hardcoded values | Orice valoare hardcodată |
| CO3 | Toate componentele folosesc sistemul de componente din PRM-0109 | Code review | 100% componente din sistem | Orice componentă ad-hoc |
| CO4 | Footer consistent pe toate paginile publice | Inspecție vizuală | Identic pe toate paginile | Orice variație neintențională |

---

### SCORING FINAL

**PASS pentru lansare:** 0 FAIL pe criterii P0 (C1-C5, CTA1-CTA6, E1-E7, O1-O3, SP1-SP4)

**PASS cu observații:** ≤ 3 FAIL pe criterii P1, cu document de excepție aprobat

**FAIL — blocat:** Orice FAIL pe criteriu P0

---

## PRM-0112 — POST-LAUNCH VALIDATION

### Metodologie

Evaluare la 14 zile după lansare. Compară versiunea nouă cu versiunea anterioară pe 8 dimensiuni. Verdict binar final.

---

### DIMENSIUNEA 1: Time to Comprehension

**Metric:** % useri care răspund corect la "Ce face acest site?" în 5 secunde (user test, N=10)

**Baseline (versiunea anterioară):** NU EXISTĂ DATE (nu s-a măsurat anterior)

**Target post-lansare:** ≥ 70% răspunsuri corecte

**Metodă:** Usability test cu 10 persoane noi (cold), screen recording, întrebare la 5 secunde

---

### DIMENSIUNEA 2: Click Confidence

**Metric:** Hero CTA click rate (% din vizitatori unici care dau click pe CTA primar în hero)

**Baseline:** NU EXISTĂ DATE (nu s-a măsurat anterior)

**Target post-lansare:** ≥ 8% din vizitatori unici

**Metodă:** Google Analytics 4 / Plausible — event tracking pe CTA primar hero

---

### DIMENSIUNEA 3: Activation Clarity

**Metric:** % useri noi care fac primul upload în prima sesiune

**Baseline:** NU EXISTĂ DATE

**Target post-lansare:** ≥ 40% din useri noi autentificați

**Metodă:** Event tracking în app — "first_upload" event per user

---

### DIMENSIUNEA 4: CTA Discoverability

**Metric:** % useri care interacționează cu sticky CTA bar (click sau dismiss)

**Baseline:** N/A (funcționalitate nouă)

**Target post-lansare:** ≥ 15% din useri care scrollează > 30%

**Metodă:** Event tracking — "sticky_cta_interaction" event

---

### DIMENSIUNEA 5: Empty State Usefulness

**Metric:** % useri care dau click pe CTA primar din Cockpit empty state (first login)

**Baseline:** NU EXISTĂ DATE

**Target post-lansare:** ≥ 50% din useri la primul login

**Metodă:** Event tracking — "empty_state_cta_click" event pe Cockpit

---

### DIMENSIUNEA 6: IA Consistency

**Metric:** % sesiuni fără navigație confuză (fără back button imediat după navigare, fără timp > 10s pe o pagină fără acțiune)

**Baseline:** NU EXISTĂ DATE

**Target post-lansare:** ≥ 80% sesiuni fără indicatori de confuzie

**Metodă:** Session recording (Hotjar sau echivalent) — analiza comportamentului de navigație

---

### DIMENSIUNEA 7: Perceived Trust

**Metric:** Scor NPS la 7 zile după signup (întrebare: "Cât de mult ai recomanda AI-IDEI unui coleg?")

**Baseline:** NU EXISTĂ DATE

**Target post-lansare:** NPS ≥ 30

**Metodă:** Email survey la 7 zile post-signup, N minim 50 răspunsuri

---

### DIMENSIUNEA 8: Bounce Rate /home

**Metric:** Bounce rate pe /home (% sesiuni cu 0 interacțiuni după landing)

**Baseline:** NU EXISTĂ DATE

**Target post-lansare:** ≤ 60% bounce rate

**Metodă:** Google Analytics 4 / Plausible — bounce rate pe /home

---

### VERDICT BINAR

**WORLD-CLASS TRAJECTORY** dacă:
- ≥ 5 din 8 dimensiuni ating target-ul
- Dimensiunile 1 (Comprehension), 3 (Activation) și 5 (Empty State) ating target-ul obligatoriu

**NOT YET** dacă:
- < 5 din 8 dimensiuni ating target-ul
- SAU oricare din dimensiunile 1, 3, 5 nu atinge target-ul

---

### ACȚIUNI POST-VERDICT

**Dacă WORLD-CLASS TRAJECTORY:**
- Documentează baseline-urile pentru iterația următoare
- Identifică cele 1–2 dimensiuni sub target și planifică optimizare P2
- Avansează la PROC-0202 (dacă există) sau la expansiune de features

**Dacă NOT YET:**
- Identifică dimensiunile sub target
- Mapează la stories din backlog (EPIC 1–6)
- Prioritizează stories care adresează dimensiunile critice (1, 3, 5)
- Re-validează la 14 zile după remediere
