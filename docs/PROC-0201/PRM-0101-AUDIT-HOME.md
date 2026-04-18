# PRM-0101 OUTPUT — Audit Home Against World-Class SaaS UX

**Site:** ai-idei.com
**Audit date:** 2026-04-18
**Auditor protocol:** PRM-0101 v1.0
**Cluster:** CL-0101 / site_worldclass_alignment
**Process:** PROC-0201 / home_to_global_standard

---

## 1. EXECUTIVE VERDICT

| Dimensiune | Scor | Justificare |
|---|---|---|
| Înțelegere (5–15 sec) | 5/10 | Headline există, dar este metaforă, nu declarație de produs. Userul înțelege că e ceva despre AI și copywriting, dar nu știe exact ce face platforma. |
| Comoditate | 4/10 | Pagina are 17+ secțiuni, scroll masiv (~18.000px), sidebar vizibil doar în dashboard. Nicio orientare rapidă. |
| Eficiență | 4/10 | Două CTA-uri în hero (Start Free / See the Mechanism) fără ierarhie vizuală clară. Restul paginii nu produce acțiune, produce lectură. |
| Aliniere standard mondial | 4/10 | Structura este de landing page de marketing, nu de produs SaaS. Lipsesc: scope vizibil, pipeline persistent, empty state activ, next best action. |

**Verdict:** Pagina /home este un landing page de persuasiune lungă, nu un nod de orientare și activare — funcționează ca brochure, nu ca interfață de decizie.

---

## 2. HOME PAGE DISSECTION

| Bloc / Zonă | Scop declarat | Scop real | Utilitate | Problemă | Severitate | Acțiune recomandată |
|---|---|---|---|---|---|---|
| Ticker top (CAPTURE / DISTILL / STRUCTURE / MULTIPLY / DEPLOY) | Branding / pipeline vizual | Decorativ | Scăzută | Nu explică nimic. Userul nu știe ce înseamnă acești termeni în context. | CRITIC | Elimină sau transformă în breadcrumb navigabil cu tooltip explicativ. |
| Hero headline: "The Really Closest Thing To A Magic Button" | Value proposition | Metaforă de marketing | Medie | Formulare vagă. "Magic Button" este hiperbolic și ambiguu. Nu spune CE face produsul. | CRITIC | Rescrie cu declarație funcțională: ce este, pentru cine, ce produce. |
| Subheadline: "Turn one rough idea into persuasive copy..." | Clarificare produs | Parțial funcțional | Medie | Bun ca direcție, dar prea lung și prea vag ("real marketing execution"). | MAJOR | Comprimă la 12–15 cuvinte. Elimină "powered by a knowledge extraction OS built for commercial output" — jargon intern. |
| CTA-uri: Start Free / See the Mechanism | Activare / Educație | Ambele la același nivel vizual | Scăzută | Nu există ierarhie. Userul nu știe care e acțiunea principală. "See the Mechanism" este CTA de scroll, nu de decizie. | CRITIC | Start Free = CTA primar (fill, contrast). See the Mechanism = link text secundar. |
| Diagrama RAW INPUT → EXTRACTION ENGINE → ASSET OUTPUT | Explicare mecanism | Vizual decorativ | Medie | Diagrama este frumoasă dar nu interactivă și nu explică suficient fără context. | MODERAT | Transformă în 3 pași interactivi cu exemplu concret (input → output vizibil). |
| Metrici: 50+ / 12 / ∞ / <2min | Social proof / credibilitate | Numerele sunt abstracte | Scăzută | "∞ KNOWLEDGE REUSE" nu înseamnă nimic concret. "<2min IDEA TO ASSET" este nevalidat vizual. | MAJOR | Ancorează fiecare metric cu un exemplu real sau elimină-l. |
| Secțiunea BEFORE / AFTER | Educație problemă-soluție | Funcțional dar lung | Medie | Textul este lung și repetitiv. Lista de probleme (6 itemi) și soluții (5 itemi) nu diferențiază produsul față de orice alt AI tool. | MAJOR | Comprimă la 3 probleme + 3 soluții cu exemplu specific AI-IDEI. |
| THE MECHANISM (4 pași) | Explicare workflow | Parțial funcțional | Medie | Pașii sunt generici: "Choose the problem", "Use the right resource" — ar putea descrie orice platformă. | MAJOR | Specifică: "Upload a voice note → AI extrage 12 tipuri de assets → Alegi ce publici". |
| TRANSFORMATION (pipeline vizual) | Demo produs | Vizual fără interactivitate | Medie | Frumos vizual, dar static. Userul nu poate testa. Nu există preview real. | MODERAT | Adaugă CTA "Try with your own idea" sau link la demo. |
| WHAT YOU GET (4 carduri: Frameworks / Agents / Prompts / Examples) | Prezentare features | Funcțional dar neierarhizat | Medie | Toate 4 cardurile au același weight vizual. Nu se știe care e core și care e secundar. | MODERAT | Ierarhizează: Extraction Engine = core, restul = derivate. |
| KNOWLEDGE BASE (4 carduri preview) | Preview conținut | Decorativ | Scăzută | Cardurile sunt exemple inventate (nu sunt reale din platformă). Userul nu poate accesa direct. | MAJOR | Conectează la Library reală sau elimină. Nu pune conținut fals ca preview. |
| OUTPUT UNIVERSE (tabs: CONTENT / EDUCATION / SALES / KNOWLEDGE / ASSISTANTS) | Taxonomie outputs | Parțial funcțional | Medie | Tabs fără conținut vizibil în screenshot. Userul nu știe ce se află în fiecare tab. | MAJOR | Fiecare tab trebuie să aibă minim 3 exemple concrete vizibile. |
| CONTROL LAYER (6 parametri) | Diferențiere produs | Funcțional | Bună | Secțiunea este clară și diferențiatoare. | MINOR | Mută mai sus în pagină (înainte de WHO THIS IS FOR). |
| WHO THIS IS FOR (6 avatare) | Segmentare audiență | Funcțional | Bună | Avatarele sunt corecte dar descrierile sunt prea scurte pentru a produce identificare. | MINOR | Adaugă un exemplu de use case per avatar. |
| WHY DIFFERENT (tabel fără sistem / cu AI-IDEI) | Diferențiere | Funcțional | Bună | Tabelul este clar. Problema: apare prea târziu în pagină (după 60% scroll). | MAJOR | Mută în primele 3 secțiuni, imediat după hero. |
| PROOF (3 testimoniale cu inițiale) | Social proof | Slab | Scăzută | Testimonialele au doar inițiale (M.R., A.P., D.C.) — nu sunt credibile. Nicio fotografie, nicio companie, nicio cifră. | CRITIC | Înlocuiește cu testimoniale reale sau elimină secțiunea. Testimoniale false distrug credibilitatea. |
| ECOSYSTEM (6 categorii cu liste) | Prezentare completitudine | Redundant | Scăzută | Repetă informații deja prezentate în WHAT YOU GET. | MAJOR | Elimină sau comasează cu WHAT YOU GET. |
| CTA final (Start Free / Dashboard) | Activare | Parțial funcțional | Medie | CTA final există dar este îngropat după 17+ secțiuni. | MAJOR | Adaugă sticky CTA bar sau floating button pe tot parcursul scrollului. |
| Footer | Navigație secundară | Funcțional | Bună | Footer conține 5 coloane cu 20+ linkuri. Prea dens. | MODERAT | Simplifică la 3 coloane: Platform / Company / Legal. |

---

## 3. USER COMPREHENSION TEST

**Ce înțelege userul în 5 secunde?**
Că există o platformă AI legată de copywriting și marketing. Că există ceva numit "Knowledge Extraction Engine". Că poate "Start Free".

**Ce nu înțelege?**
Ce este concret produsul (tool? platformă? library? agent?). Ce înseamnă "Neurons". Ce este "Extraction Engine" în practică. Diferența dintre Frameworks, Agents, Prompts și Templates. De ce are nevoie de asta față de ChatGPT.

**Ce poate interpreta greșit?**
Că este un generator de conținut generic (ca Jasper sau Copy.ai). Că "Magic Button" = produs simplu fără learning curve. Că testimonialele cu inițiale sunt reale.

**Ce acțiune crede că trebuie să facă?**
Scroll pentru a înțelege mai bine produsul. Eventual click pe "See the Mechanism".

**Ce acțiune ar trebui de fapt să facă?**
Click pe "Start Free" → onboarding → primul upload → primul output. Aceasta este calea de activare. Pagina nu o comunică cu suficientă claritate și urgență.

---

## 4. FRICTION MAP (ordonate după impact)

**Orientare** — CRITIC
Userul nu știe unde se află în ierarhia produsului. Nu există breadcrumb, nu există scope indicator, nu există "ești pe landing page, dashboard e altceva".

**Limbaj** — CRITIC
"Knowledge Extraction OS", "Neurons", "Magic Button", "Atomic Knowledge Units" — terminologie internă neexplicată. Userul extern nu are context pentru acești termeni.

**Structură** — CRITIC
17+ secțiuni fără ierarhie clară. Pagina nu are un arc narativ cu punct de decizie clar. Este o acumulare de argumente, nu un funnel de activare.

**CTA** — CRITIC
Două CTA-uri în hero la același nivel vizual. Niciun CTA persistent pe scroll. CTA final îngropat la 18.000px scroll.

**Onboarding** — MAJOR
Nu există niciun indicator al primului pas după "Start Free". Userul nu știe ce îl așteaptă după click.

**Navigație** — MAJOR
Navigația header (MECHANISM / OUTPUTS / CONTROL / ACCESS) nu corespunde cu navigația internă din dashboard (Command Center / Pipeline / Services / Library). Ruptura de terminologie creează dezorientare.

**Empty states** — MAJOR
Nu există empty state pe /home pentru user nou. Dashboard-ul (Command Center) are un empty state minimal — doar un input field fără context sau direcție.

**Densitate vizuală** — MODERAT
Pagina alternează între secțiuni dense (ECOSYSTEM cu 6 coloane) și secțiuni vizuale (diagrame). Ritmul este inconsistent.

**Ierarhie** — MODERAT
Toate secțiunile au aceeași greutate vizuală. Nu există o secțiune dominantă care să comunice "aceasta este esența produsului".

---

## 5. WORLD-CLASS GAP

| Standard corect | Starea actuală | Diferența | Costul diferenței | Remedierea exactă |
|---|---|---|---|---|
| Hero = declarație funcțională în 8–12 cuvinte (Linear: "The issue tracking tool you'll enjoy using") | "The Really Closest Thing To A Magic Button For Copywriting And Marketing Work" — 15 cuvinte, metaforă | Userul nu știe ce face produsul în 5 secunde | Bounce rate ridicat, conversie scăzută pe cold traffic | Rescrie: "Turn any idea, note, or recording into copy, content, and marketing assets — in minutes." |
| Un singur CTA principal above the fold (Notion, Vercel, Linear) | Două CTA-uri la același nivel vizual | Userul nu știe ce să facă | Click confidence scăzut, hesitation | Start Free = primar (filled button, contrast maxim). See the Mechanism = text link sub CTA. |
| Social proof cu date reale: nume, companie, cifre (Stripe, Intercom) | 3 testimoniale cu inițiale (M.R., A.P., D.C.) fără fotografie sau companie | Zero credibilitate | Userul tratează testimonialele ca inventate | Înlocuiește cu testimoniale reale sau elimină complet secțiunea. |
| Navigație consistentă între landing și app (Figma, Notion) | Landing: MECHANISM / OUTPUTS / CONTROL / ACCESS. App: Command Center / Pipeline / Services / Library | Ruptura de terminologie | Userul care trece din landing în app este dezorientat | Aliniază terminologia sau explică tranziția explicit. |
| Empty state activ cu Context → Direction → Preview (Linear, Notion) | Dashboard Command Center = input field gol fără context | Userul nu știe ce să facă după login | Activation rate scăzut, churn timpuriu | Construiește empty state complet: "Primul tău upload. Încearcă cu o înregistrare vocală sau un document." + CTA + ghost preview. |
| Pricing vizibil sau accesibil în max 2 clickuri de pe /home | Pricing este în footer (link) și în sidebar (dashboard) | Userul care vrea să înțeleagă costul trebuie să caute | Conversie pierdută pe segmentul price-conscious | Adaugă link "Pricing" în navigația principală a landing page-ului. |
| Pagina /home ≤ 8–10 secțiuni cu arc narativ clar | 17+ secțiuni, ~18.000px scroll | Cognitive overload, pierdere de focus | Userul abandonează înainte de CTA final | Restructurează la 7 secțiuni: Hero → Problem → Mechanism → Proof → Outputs → Pricing → CTA final. |

---

## 6. TARGET HOME ARCHITECTURE

Structura ideală pentru /home în ordine exactă:

| # | Nume bloc | Obiectiv | Conținut | Componentă UI | CTA | Condiție afișare | Motiv strategic |
|---|---|---|---|---|---|---|---|
| 1 | HERO | Orientare + activare imediată | Headline funcțional (8–12 cuvinte) + subheadline (15 cuvinte max) + CTA primar + CTA secundar (text link) | Full-width hero, dark bg, contrast maxim pe CTA | "Start Free — No card required" | Întotdeauna | Primele 5 secunde determină bounce sau engagement. |
| 2 | PROBLEM FRAME | Identificare problemă | 3 probleme specifice (nu liste de 6) cu formulare în vocea userului | 3 carduri orizontale cu icoane | — | Întotdeauna | Userul trebuie să se recunoască înainte să asculte soluția. |
| 3 | MECHANISM (condensat) | Explicare mecanism în 3 pași | Upload → AI procesează → Primești assets. Cu exemplu concret vizibil. | 3-step visual cu exemplu real (input text → output list) | "See full demo" (text link) | Întotdeauna | Userul trebuie să înțeleagă CE face produsul, nu doar CE promite. |
| 4 | PROOF | Credibilitate | 3 testimoniale reale cu nume, fotografie, companie + 1 metric real (ex: "47 assets generate din un singur podcast") | Testimonial cards + metric highlight | — | Dacă există testimoniale reale; altfel elimină | Social proof fals distruge mai mult decât absența lui. |
| 5 | OUTPUTS (condensat) | Demonstrare completitudine | 5–6 tipuri de output cu exemplu vizibil per tip | Tab sau grid 2×3 cu preview | "Explore all outputs" | Întotdeauna | Userul trebuie să vadă ce primește concret. |
| 6 | PRICING (teaser) | Reducere fricțiune financiară | Free plan + planul popular + link la pricing complet | 2 carduri simple + link | "See all plans" | Întotdeauna | Userul price-conscious abandoneaza dacă nu vede costul rapid. |
| 7 | CTA FINAL | Activare | Headline de urgență + CTA primar + trust line ("No credit card. Cancel anytime.") | Full-width section, contrast maxim | "Start Free" | Întotdeauna | Ultimul punct de decizie înainte de exit. |

**Secțiuni interzise pe /home:**
- ECOSYSTEM (redundant cu WHAT YOU GET)
- KNOWLEDGE BASE cu conținut fals/demo
- Testimoniale cu inițiale fără fotografie
- Orice secțiune care depășește 400px înălțime fără CTA intern

---

## 7. IMPLEMENTATION PRIORITIES

**P0 — Blocante (fac imposibilă conversia)**
- Rescrie headline hero cu declarație funcțională
- Stabilește ierarhia CTA: un singur primar above the fold
- Elimină sau înlocuiește testimonialele cu inițiale
- Adaugă Pricing în navigația principală a landing page-ului

**P1 — Critice (reduc semnificativ conversia)**
- Comprimă pagina de la 17+ secțiuni la 7
- Construiește empty state activ pentru Command Center (primul login)
- Aliniază terminologia landing ↔ app (MECHANISM → Command Center etc.)
- Adaugă sticky CTA bar pe scroll (apare după 30% scroll)

**P2 — Optimizare (îmbunătățesc activarea)**
- Transformă diagrama RAW INPUT → OUTPUT în 3 pași interactivi cu exemplu real
- Adaugă "Try with your own idea" CTA în secțiunea MECHANISM
- Conectează cardurile KNOWLEDGE BASE la Library reală
- Adaugă un exemplu de use case per avatar în WHO THIS IS FOR

**P3 — Polish (îmbunătățesc percepția calității)**
- Simplifică footer la 3 coloane
- Adaugă micro-animații la metrici (counter animation)
- Adaugă progress indicator pe scroll (dot navigation laterală)
- Optimizează contrast pe CTA secundar

---

## 8. FINAL DECISION

**RECONSTRUIEȘTI COMPLET.**

Justificare: Pagina actuală este un landing page de persuasiune lungă construit pe logica "convinge prin volum de argumente". Această logică este incompatibilă cu standardul unui produs SaaS care trebuie să funcționeze ca nod de orientare și activare.

Problemele nu sunt de polish sau de rearanjare — sunt structurale: terminologie greșită, ierarhie CTA absentă, social proof nefuncțional, 17 secțiuni fără arc narativ, ruptura landing ↔ app. Rearanjarea secțiunilor existente nu rezolvă aceste probleme.

Reconstrucția completă pe schema celor 7 blocuri definite în TARGET HOME ARCHITECTURE, cu implementarea P0 și P1 simultane, va produce o pagină care funcționează ca interfață de decizie, nu ca broșură de marketing.

**Consecința neimplementării:** Fiecare user care ajunge pe /home din cold traffic și nu înțelege produsul în 15 secunde este o conversie pierdută permanent. La volumul actual de trafic, aceasta se traduce în cost de achiziție ridicat și activation rate scăzut — indiferent cât de bun este produsul în interior.
