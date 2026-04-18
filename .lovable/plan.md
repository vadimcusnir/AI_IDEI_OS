# PLAN — Reconstrucție /home (PRM-0101 → execuție)

**Scope:** P0 + P1 din audit. P2/P3 amânate.
**Pivot:** `src/pages/Landing.tsx` + componente `src/components/landing/`.
**Brand:** "Magic Button" rămâne, dar este ancorat cu output cuantificat.

---

## 1. Decizii confirmate
- Testimoniale → eliminate, înlocuite cu **metrici reale platformă**
- Headline → "Magic Button" păstrat + cuantificare
- Date DB live (2026-04-18): **402 neuroni · 142 servicii active · 46 episoade · 12 articole** (20 useri NU se afișează)

## 2. Arhitectura țintă /home (8 secțiuni, de la 17)

| # | Bloc | Componentă | Acțiune |
|---|---|---|---|
| 1 | HERO ancorat | `LandingHero` | REWRITE |
| 2 | PROOF BAND real | `LandingProofBand` | REWRITE (live RPC) |
| 3 | PROBLEM | `LandingProblem` | TRIM 6→3 |
| 4 | MECHANISM cu exemplu | `LandingMechanism` | REWRITE |
| 5 | OUTPUTS | `LandingOutputGalaxy` | KEEP simplu |
| 6 | WHY DIFFERENT (mutat) | `LandingWhyDifferent` | MOVE de la #11 |
| 7 | PRICING TEASER | `LandingPricing` | KEEP compact |
| 8 | FINAL CTA | `LandingFinalCTA` | KEEP |
| + | Sticky CTA | `StickyCtaBar` | NOU, 30% scroll |

## 3. Eliminate de pe /home
TransformationDiagram, LandingWhatYouGet, LandingControlSurface, LandingKnowledgeShowcase, LandingWhoFor, LandingBenefits, **LandingSocialProof**, EcosystemMap, LandingTranscribeCTA, PublicTestimonials.
→ Scroll: ~18.000px → ~6.500px.

## 4. Spec componente

### 4.1 LandingHero
- H1: `"The Magic Button for marketing."`
- Sub: `"One upload — voice note, doc, link — becomes 50+ ready-to-publish assets in under 2 minutes."`
- CTA primar: filled gold `Start free — no card`
- CTA secundar: text link `See how it works ↓`
- Trust line live: `402 neurons · 46 episodes · 142 services`
- Eliminat ExtractionEngine din hero (mutat în Mechanism)

### 4.2 LandingProofBand → fetch RPC `get_public_landing_stats`

### 4.3 LandingProblem → 3 puncte

### 4.4 LandingMechanism → 3 pași cu exemplu vizibil + CTA "Try with your own input →"

### 4.5 LandingPricing → prop `compact` (Free + Pro)

### 4.6 StickyCtaBar nou — fixed bottom mobile / top-right desktop, dismiss sessionStorage

### 4.7 Landing.tsx — reorder + cleanup imports

## 5. Backend
**Migration:** `RPC public.get_public_landing_stats()` SECURITY DEFINER STABLE, GRANT EXECUTE TO anon, authenticated. Returnează `{neurons, episodes, services, articles}`.

## 6. i18n × 3 limbi
- ADD: `hero.title|subtitle|trust_line`, `mechanism.example.*`, `sticky_cta.*`
- REMOVE: `social_proof.*`, `what_you_get.*`, `benefits.*`, `ecosystem.*`

## 7. Nav header rename
MECHANISM/OUTPUTS/CONTROL/ACCESS → **How it works / Outputs / Pricing / Sign in**

## 8. WelcomeScreen Command Center
Banner "Primul tău upload" + ghost preview "→ 12 neurons, 3 frameworks, 5 social posts" + skip "exemplu pre-încărcat".

## 9. Ordinea de execuție (12 pași)
1. Migration RPC
2. i18n × 3 limbi (paralel)
3. LandingHero rewrite
4. LandingProofBand wired
5. LandingProblem trim
6. LandingMechanism rewrite
7. LandingPricing compact prop
8. StickyCtaBar nou
9. Landing.tsx reorder + cleanup
10. Header nav rename
11. WelcomeScreen activation banner
12. QA preview + scroll + i18n parity

## 10. Out of scope (P2/P3)
Interactive demo, real KnowledgeShowcase, counter animation, dot nav, testimoniale reale, `/use-cases`, `/ecosystem`.

## 11. Risc & rollback
Componentele rămân fizic → rollback = reorder. Grep i18n keys înainte de delete. RPC fallback hardcoded.

## 12. Definition of done
- [ ] 8 secțiuni vizibile
- [ ] Scroll < 7.000px desktop
- [ ] Headline = "Magic Button" + cuantificare
- [ ] 1 CTA primar above the fold
- [ ] 0 testimoniale cu inițiale
- [ ] Proof = date reale DB
- [ ] Sticky CTA după 30% scroll
- [ ] Pricing în nav
- [ ] EN/RO/RU paritate
- [ ] Lighthouse perf > 85
