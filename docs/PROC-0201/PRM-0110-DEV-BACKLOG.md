# PRM-0110 OUTPUT — Convert UX Strategy Into Dev Backlog

**Site:** ai-idei.com
**Cluster:** CL-0101 / site_worldclass_alignment
**Process:** PROC-0201 / home_to_global_standard

---

## EPIC 1: Home Page Reconstruction

**Obiectiv:** Reconstruiește /home ca interfață de decizie cu 7 blocuri, ierarhie CTA clară și terminologie aliniată cu app-ul.

**Impact UX:** Comprehensiune în 5 secunde, bounce rate redus, activation rate crescut
**Impact comercial:** Conversie cold traffic crescută, CAC redus

---

### STORY 1.1 — Hero Section Rebuild

**Titlu:** Rebuild hero section with functional headline and CTA hierarchy

**Descriere:** Înlocuiește headline-ul actual ("The Really Closest Thing To A Magic Button...") cu declarație funcțională. Stabilește ierarhia CTA: primar filled (Start Free) + secundar text link (See how it works). Adaugă trust line sub CTA-uri.

**Criterii de acceptanță:**
- [ ] Headline ≤ 12 cuvinte, declarație funcțională (nu metaforă)
- [ ] CTA primar: filled button, accent color, label "Start Free — No card required"
- [ ] CTA secundar: text link, label "See how it works", anchor la secțiunea MECHANISM
- [ ] Trust line: "No credit card · 500 free credits · Cancel anytime"
- [ ] Hero vizual: diagrama Input → Engine → Output (3 noduri, animată subtil)
- [ ] Mobile: CTA primar full-width

**Dependențe:** Design tokens implementate (EPIC 5)
**Prioritate:** P0
**Complexitate:** M (3–5 zile)
**Owner recomandat:** Frontend dev + Copywriter

---

### STORY 1.2 — Remove Ticker, Add Functional Navigation

**Titlu:** Replace decorative ticker with functional navigation labels

**Descriere:** Elimină ticker-ul animat (CAPTURE/DISTILL/STRUCTURE/MULTIPLY/DEPLOY) din header. Actualizează navigația header la: How It Works / What You Get / Features / Pricing.

**Criterii de acceptanță:**
- [ ] Ticker eliminat complet din DOM
- [ ] Header navigation: [How It Works] [What You Get] [Features] [Pricing]
- [ ] Fiecare item este anchor link sau route link funcțional
- [ ] Mobile: hamburger menu cu aceleași items
- [ ] "Start Free" button persistent în header (desktop + mobile)

**Dependențe:** —
**Prioritate:** P0
**Complexitate:** S (1–2 zile)
**Owner recomandat:** Frontend dev

---

### STORY 1.3 — Compress Page from 17+ Sections to 7

**Titlu:** Restructure /home to 7-section architecture

**Descriere:** Elimină secțiunile redundante (ECOSYSTEM, KNOWLEDGE BASE cu conținut fals). Comasează WHERE DIFFERENT în secțiunea MECHANISM. Reordonează conform TARGET HOME ARCHITECTURE din PRM-0101.

**Criterii de acceptanță:**
- [ ] Pagina are exact 7 secțiuni: Hero / Problem Frame / Mechanism / Proof / Outputs / Pricing Teaser / CTA Final
- [ ] Secțiunile ECOSYSTEM și KNOWLEDGE BASE (cu demo content) sunt eliminate
- [ ] Secțiunea WHY DIFFERENT este integrată în MECHANISM sau PROBLEM FRAME
- [ ] Total scroll height ≤ 8.000px pe desktop 1440px
- [ ] Fiecare secțiune are SectionHeader component cu label + title + subtitle

**Dependențe:** Story 1.1, Story 1.2
**Prioritate:** P0
**Complexitate:** L (5–8 zile)
**Owner recomandat:** Frontend dev + Designer

---

### STORY 1.4 — Add Sticky CTA Bar

**Titlu:** Implement sticky CTA bar that appears after 30% scroll

**Descriere:** Adaugă o bară fixă în partea de jos a viewport-ului care apare după ce userul a scrollat 30% din pagina /home. Conține: CTA primar "Start Free" + text link "Already have an account? Log in".

**Criterii de acceptanță:**
- [ ] Bara apare la 30% scroll (IntersectionObserver sau scroll event)
- [ ] Bara dispare când userul ajunge la CTA Final (ultima secțiune)
- [ ] Mobile: bara ocupă full-width, padding safe-area-inset-bottom
- [ ] Animație de intrare: slide-up, 200ms ease-out
- [ ] Nu acoperă conținut important (padding-bottom pe main egal cu înălțimea barei)

**Dependențe:** Story 1.1
**Prioritate:** P1
**Complexitate:** S (1–2 zile)
**Owner recomandat:** Frontend dev

---

### STORY 1.5 — Replace Fake Testimonials

**Titlu:** Replace initials-only testimonials with real social proof or remove section

**Descriere:** Secțiunea PROOF cu testimoniale (M.R., A.P., D.C.) trebuie înlocuită cu testimoniale reale (fotografie + nume complet + companie) sau eliminată complet dacă nu există testimoniale reale disponibile.

**Criterii de acceptanță:**
- [ ] Dacă există testimoniale reale: afișează fotografie + nume complet + titlu + companie + citat cu rezultat specific
- [ ] Dacă nu există testimoniale reale: secțiunea este eliminată și înlocuită cu metric bar extins (2,400+ users / 1.2M+ neurons / 50+ services)
- [ ] Niciun testimonial cu inițiale fără fotografie nu rămâne în producție

**Dependențe:** Content (testimoniale reale de la users)
**Prioritate:** P0
**Complexitate:** S (1 zi implementare, blocat de content)
**Owner recomandat:** Frontend dev + Product (colectare testimoniale)

---

### STORY 1.6 — Add Pricing to Public Navigation

**Titlu:** Add Pricing link to landing page header navigation

**Descriere:** Adaugă "Pricing" ca item în navigația header a landing page-ului. Link duce la /pricing.

**Criterii de acceptanță:**
- [ ] "Pricing" vizibil în header pe desktop
- [ ] "Pricing" vizibil în hamburger menu pe mobile
- [ ] Link funcțional → /pricing

**Dependențe:** Story 1.2
**Prioritate:** P0
**Complexitate:** XS (< 1 zi)
**Owner recomandat:** Frontend dev

---

## EPIC 2: App Navigation & Terminology Alignment

**Obiectiv:** Aliniază terminologia landing ↔ app. Restructurează sidebar conform PRM-0102.

---

### STORY 2.1 — Sidebar Restructure

**Titlu:** Restructure sidebar navigation per PRM-0102 canonical structure

**Descriere:** Redenumește și reorganizează sidebar-ul conform structurii finale din PRM-0102: elimină Purchases (comasează în Credits), comasează Learning + Progress, mută Workspace items în Settings.

**Criterii de acceptanță:**
- [ ] Sidebar structură: CORE (Cockpit/Pipeline/Services/Library/Jobs) / ECONOMY (Credits & Purchases) / INTELLIGENCE (Neurons/Knowledge Graph/Analytics) / TOOLS (Outputs/Learning & Progress) / SETTINGS
- [ ] "Purchases" eliminat ca item separat — integrat în Credits ca tab
- [ ] "Learning" și "Progress" comasate ca "Learning & Progress"
- [ ] "Workspace" items (Personal OS, Augmentation, VIP, Integrations) mutate în Settings
- [ ] Fiecare item are iconiță
- [ ] OPERATOR MODE toggle vizibil doar pentru useri cu rol admin

**Dependențe:** Backend (route changes, redirects)
**Prioritate:** P1
**Complexitate:** M (3–5 zile)
**Owner recomandat:** Frontend dev + Backend dev

---

### STORY 2.2 — Terminology Alignment Landing ↔ App

**Titlu:** Align landing page section names with app navigation labels

**Descriere:** Actualizează anchor links și referințe din landing page pentru a folosi terminologia din app. Exemplu: "MECHANISM" → "How It Works" (landing) care corespunde cu "Pipeline" (app).

**Criterii de acceptanță:**
- [ ] Document de mapping terminologie creat și aprobat
- [ ] Landing page folosește terminologia publică (How It Works / What You Get / Features / Pricing)
- [ ] App folosește terminologia internă (Cockpit / Pipeline / Services / Library)
- [ ] Nicio referință la "MECHANISM", "OUTPUTS", "CONTROL", "ACCESS" ca labels de navigație

**Dependențe:** Story 1.2, Story 2.1
**Prioritate:** P1
**Complexitate:** S (1–2 zile)
**Owner recomandat:** Frontend dev + Copywriter

---

## EPIC 3: Empty States Implementation

**Obiectiv:** Implementează empty states active (Context → Direction → Preview) pentru toate ecranele core.

---

### STORY 3.1 — Cockpit Empty State (First Login)

**Titlu:** Implement Cockpit empty state for first-time users

**Descriere:** Implementează empty state complet pentru Cockpit când userul nu are sesiuni anterioare și 0 joburi. Schema: Context → Direction → Preview.

**Criterii de acceptanță:**
- [ ] Trigger: user auth, 0 jobs, 0 library items
- [ ] Titlu: "Your extraction engine is ready."
- [ ] Microcopy conform PRM-0106
- [ ] CTA primar: "Upload your first source →" → /services (filtru extraction)
- [ ] CTA secundar: "See an example first" → modal demo walkthrough
- [ ] Ghost preview: pipeline demo gri cu 3 joburi fictive
- [ ] Dispare automat după primul job creat

**Dependențe:** EmptyState component (EPIC 5)
**Prioritate:** P1
**Complexitate:** M (2–3 zile)
**Owner recomandat:** Frontend dev

---

### STORY 3.2 — Empty States pentru Pipeline, Library, Jobs, Outputs, Knowledge Graph

**Titlu:** Implement empty states for all core screens

**Descriere:** Implementează empty states pentru: Pipeline / Library / Jobs / Outputs / Knowledge Graph conform specificațiilor din PRM-0106.

**Criterii de acceptanță:**
- [ ] Pipeline empty state implementat conform PRM-0106
- [ ] Library empty state implementat conform PRM-0106
- [ ] Jobs empty state implementat conform PRM-0106
- [ ] Outputs empty state implementat conform PRM-0106
- [ ] Knowledge Graph empty state implementat conform PRM-0106
- [ ] Toate empty states au ghost preview

**Dependențe:** Story 3.1, EmptyState component (EPIC 5)
**Prioritate:** P1
**Complexitate:** L (5–7 zile)
**Owner recomandat:** Frontend dev

---

## EPIC 4: CTA System Implementation

**Obiectiv:** Implementează ierarhia CTA pe toate paginile conform PRM-0107.

---

### STORY 4.1 — CTA Hierarchy Audit and Fix

**Titlu:** Fix CTA hierarchy across all pages per PRM-0107 matrix

**Descriere:** Auditează și corectează CTA-urile pe toate paginile conform CTA Matrix din PRM-0107. Elimină erorile identificate.

**Criterii de acceptanță:**
- [ ] Nicio pagină nu are două filled buttons la același nivel vizual
- [ ] Fiecare pagină are maxim un CTA primar
- [ ] "Magic Button" span eliminat sau transformat în CTA real
- [ ] "Dashboard" din header landing redenumit în "Log In"
- [ ] CTA text final conform tabelului din PRM-0107

**Dependențe:** Button component (EPIC 5)
**Prioritate:** P0
**Complexitate:** M (2–4 zile)
**Owner recomandat:** Frontend dev

---

## EPIC 5: Design System Implementation

**Obiectiv:** Implementează design tokens și componentele de bază din PRM-0109.

---

### STORY 5.1 — Design Tokens

**Titlu:** Implement design tokens (colors, spacing, typography)

**Descriere:** Implementează toate design tokens din PRM-0109 ca CSS custom properties sau Tailwind config.

**Criterii de acceptanță:**
- [ ] Toate color tokens implementate ca CSS variables
- [ ] Toate spacing tokens implementate
- [ ] Toate typography tokens implementate
- [ ] Nicio valoare hardcodată în componente (toate referențiază tokens)

**Dependențe:** —
**Prioritate:** P0 (blocker pentru toate celelalte EPIC-uri)
**Complexitate:** S (1–2 zile)
**Owner recomandat:** Frontend dev

---

### STORY 5.2 — Core Components

**Titlu:** Implement Button, Card, SectionHeader, EmptyState, CTARow components

**Descriere:** Implementează componentele de bază din PRM-0109 cu toate variantele și stările.

**Criterii de acceptanță:**
- [ ] Button: toate variantele (primary/secondary/ghost/danger/link) + toate stările
- [ ] Card: toate variantele + toate stările
- [ ] SectionHeader: toate props implementate
- [ ] EmptyState: toate props + ghost preview support
- [ ] CTARow: sticky variant funcțional
- [ ] Toate componentele sunt accesibile (ARIA, keyboard nav, focus visible)
- [ ] Storybook sau echivalent cu toate variantele documentate

**Dependențe:** Story 5.1
**Prioritate:** P0
**Complexitate:** L (5–8 zile)
**Owner recomandat:** Frontend dev

---

### STORY 5.3 — Advanced Components

**Titlu:** Implement ProgressRail, MetricTile, EntityList, ContextPanel, StatusBanner

**Descriere:** Implementează componentele avansate din PRM-0109.

**Criterii de acceptanță:**
- [ ] ProgressRail: toate stările de step (pending/running/complete/error)
- [ ] MetricTile: trend indicator funcțional
- [ ] EntityList: pagination + empty state + loading skeleton
- [ ] ContextPanel: slide-in desktop + slide-up mobile
- [ ] StatusBanner: toate tipurile + dismissible funcțional
- [ ] Pipeline Status Bar (compoziție) implementat și persistent pe ecranele CORE

**Dependențe:** Story 5.2
**Prioritate:** P1
**Complexitate:** L (5–8 zile)
**Owner recomandat:** Frontend dev

---

## EPIC 6: IA & Routes

**Obiectiv:** Implementează restructurarea IA din PRM-0102: redirects, comasări, eliminări.

---

### STORY 6.1 — Route Cleanup and Redirects

**Titlu:** Implement route changes, merges, and 301 redirects per PRM-0102

**Descriere:** Elimină paginile identificate în PRM-0102, comasează paginile indicate, configurează redirects 301.

**Criterii de acceptanță:**
- [ ] /workspace/personal-os → redirect 301 → /settings/personal-os
- [ ] /workspace/augmentation → redirect 301 → /settings (sau elimină dacă funcționalitate nedefinită)
- [ ] /purchases → redirect 301 → /credits?tab=purchases
- [ ] /progress → redirect 301 → /learning?tab=progress
- [ ] /about/platform și /about/vadim → comasate în /about cu tabs
- [ ] Toate redirects testate și funcționale
- [ ] Niciun 404 pe rutele vechi

**Dependențe:** Story 2.1
**Prioritate:** P1
**Complexitate:** M (2–3 zile)
**Owner recomandat:** Frontend dev + Backend dev

---

## REZUMAT BACKLOG

| Epic | Stories | Prioritate max | Complexitate totală estimată |
|---|---|---|---|
| EPIC 1: Home Page Reconstruction | 6 stories | P0 | 15–22 zile |
| EPIC 2: App Navigation & Terminology | 2 stories | P1 | 4–7 zile |
| EPIC 3: Empty States | 2 stories | P1 | 7–10 zile |
| EPIC 4: CTA System | 1 story | P0 | 2–4 zile |
| EPIC 5: Design System | 3 stories | P0 | 11–18 zile |
| EPIC 6: IA & Routes | 1 story | P1 | 2–3 zile |

**Total estimat:** 41–64 zile de development (1 developer full-time)
**Secvență recomandată:** EPIC 5 (tokens + components) → EPIC 1 (home) → EPIC 4 (CTA) → EPIC 3 (empty states) → EPIC 2 (navigation) → EPIC 6 (routes)
