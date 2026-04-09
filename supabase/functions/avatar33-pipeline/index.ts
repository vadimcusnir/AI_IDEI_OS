import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitGuard } from "../_shared/rate-limiter.ts";

/**
 * Avatar33 Execution Engine — Romanian Psychological Standard
 * 33 de prompturi comerciale executate în ordine strictă pentru construcția
 * unui profil complet al clientului ideal (Avatar + JTBD + Schwartz).
 */

const AVATAR33_MODULES = [
  // ═══════════════════════════════════════════════════════════
  // FAZA 1: DISCOVERY (Prompts 1-8) — Descoperirea Avatarului
  // ═══════════════════════════════════════════════════════════
  { id: "a33_role_activation", name: "Activare Rol & Context", phase: "discovery",
    prompt: `Intră în rolul publicului țintă descris în conținutul de mai jos. Ai 5 ani de experiență și o bază mare de clienți. Îți cunoști profund clientela — le înțelegi motivele, gândirea, psihologia, limba, totul. Știi să îi atragi eficient.

Pe baza conținutului furnizat, scrie o listă din minim 10 Segmente care se adresează cel mai des și cer servicii. Pentru fiecare segment, descrie scurt profilul și frecvența solicitărilor.

Apoi, din lista formată, selectează cel mai mare segment, cu cea mai intensă durere emoțională, pe care segmentul caută să o rezolve ACUM. Răspunde cu Segmentul selectat și Descrie durerile lui în detaliu.

Folosește ## headings pentru structură.` },

  { id: "a33_subsegments", name: "Sub-segmente & Dureri", phase: "discovery",
    prompt: `Din segmentul principal identificat, identifică 5 sub-segmente cu cea mai mare durere emoțională, recurentă, și care sunt mai interesați de soluție decât oricine altcineva.

Pentru fiecare sub-segment:
- Descrie profilul demografic și psihografic
- Identifică durerea principală
- Scrie 10 solicitări frecvente cu care se adresează
- Selectează top 3 solicitări esențiale (pe care audiența nu le poate amâna principial)

La final, indică top 3 solicitări pentru segmentul principal.

Folosește ## headings.` },

  { id: "a33_deep_concerns", name: "Preocupări Profunde", phase: "discovery",
    prompt: `Reieșind din experiența cu acest avatar, răspunde la următoarele:

1. Ce anume îi preocupă în mod SPECIFIC? Care este acea întrebare unică la care doresc cel mai mult să primească un răspuns majoritatea dintre ei?

2. Descrie profilul demografic complet al unui utilizator interesat de serviciul/produsul descris: vârstă, gen, educație, venit, locație, stare civilă, profesie.

3. Care sunt problemele principale ale utilizatorului din această industrie?

4. Identifică interesele și hobby-urile comune ale persoanelor interesate.

5. Identifică tendințele care vor apărea în rândul utilizatorilor în următorul an.

Fii concret, nu generic. Folosește ## headings.` },

  { id: "a33_buyer_persona", name: "Profilul Cumpărătorului Ideal", phase: "discovery",
    prompt: `Acționezi ca un analist de marketing de clasă mondială cu atenție meticuloasă la detalii. Creează un profil complet al cumpărătorului ideal.

Structura OBLIGATORIE:

## Caracteristici Demografice
Nume fictiv, Vârstă, Descriere scurtă, Gen, Educație, Venit, Profesie

## Problema Principală
- Problema dominantă cu care se confruntă
- 5 emoții principale legate de problemă
- 5 frici mari (cele mai PROFUNDE, pe care nu le-ar spune nimănui, care adesea îl împiedică să doarmă noaptea)
- 5 moduri în care aceste frici afectează relațiile personale (soț/soție, copii, prieteni, colegi)
- 5 fraze neplăcute pe care le-ar putea spune rudele (lucruri considerate jignitoare, indiferent dacă au fost spuse cu intenție sau nu)

## Alte Soluții Încercate
- Ce au încercat în trecut (5-6 soluții diferite)
- Fragmente conversaționale (citate) despre ce au încercat
- Ce NU vor să facă pentru a-și rezolva problema (5+ lucruri concrete)
- Fragmente conversaționale despre ce nu vor să facă

## Transformare
- Cum ar arăta viața ideală dacă ar găsi soluția perfectă?
- Cum ar afecta relațiile cu partenerul, copiii, prietenii, colegii?

## Specificitate
- De ce depinde succesul avatarului în obținerea rezultatului?
- Pe cine dă vina pentru problemele sale?
- 5 obiecții principale care îl împiedică

Dă avatarului un NUME REAL. Fii extrem de detaliat și emoțional.` },

  { id: "a33_fear_deep_dive", name: "Frici Profunde & Relații", phase: "discovery",
    prompt: `Pe baza avatarului creat, spune-mi despre 5 frici ale lui [AVATAR] legate de problema identificată și despre ce se va întâmpla dacă NU rezolvă această problemă.

NU am nevoie de răspunsuri plictisitoare sau superficiale. Menționează cele mai PROFUNDE frici, pe care avatarul nu le-ar spune NIMĂNUI. Frici care adesea îl împiedică să doarmă noaptea.

Apoi, dă-mi exemple CONCRETE despre cum fiecare dintre aceste frici va afecta relațiile specifice:
- Cum vor influența aceste frici oamenii din jurul avatarului?
- Cum ar percepe acești oameni situația?
- Ce ar SPUNE acești oameni? (soțul/soția, sora, copiii, prietenii, colegii de la muncă)
- Include fraze specifice pe care aceștia le-ar putea spune — lucruri considerate jignitoare, indiferent dacă au fost spuse cu intenție sau nu.

Fă aceste exemple VII, DETALIATE și EMOȚIONALE.
Folosește ## headings.` },

  { id: "a33_failed_solutions", name: "Soluții Eșuate & Dezamăgiri", phase: "discovery",
    prompt: `Ca persoană care s-a luptat cu problema avatarului, menționează câteva ALTE metode de rezolvare pe care avatarul probabil le-a încercat în trecut.

Pentru fiecare soluție încercată:
1. Descrie soluția și de ce a ales-o
2. Enumeră dezamăgirile specifice (sub formă de CITATE din perspectiva avatarului)
3. Explică de ce această soluție probabil NU a ajutat

Apoi, imaginează-ți că avatarul a întâlnit un spirit magic care poate crea soluția PERFECTĂ. Enumeră:
- 20 de rezultate pe care avatarul ar DORI să le obțină
- 20 de lucruri pe care avatarul NU vrea să le facă pentru a obține aceste rezultate (fii CONCRET)
- Citate directe de la avatar în care spune că nu vrea să facă niciunul dintre aceste lucruri

Folosește ## headings.` },

  { id: "a33_magic_transformation", name: "Transformarea Magică", phase: "discovery",
    prompt: `Presupunând că spiritul magic a îndeplinit TOATE dorințele avatarului:

1. Cum crede el/ea că acest lucru va influența în mod CONCRET viața sa?
   - Cum va afecta modul în care se simte și emoțiile pe care le trăiește?
   - Ce va deveni disponibil în viața lui/ei?
   - Ce își poate permite acum din lucrurile la care renunța înainte?

2. Cum va influența asta modul în care ALȚII se vor raporta la el/ea?
   - Soțul/soția?
   - Copiii?
   - Colegii?
   - Prietenii?

Amintește-ți: acesta este scenariul de VIS al avatarului. Cea mai sălbatică imaginație. Este normal să aibă dorințe deșarte. Căutăm motoarele emoționale cheie despre care NU ar recunoaște niciodată nimănui.

Enumeră 15-20 de rezultate emoționale SPECIFICE.

3. Cum vrea avatarul să fie PERCEPUT de ceilalți oameni cheie din viața sa?
   - Folosește exemple concrete
   - Ce ar SPUNE aceștia avatarului? (în scenariul ideal al visurilor sale)
   - Fii cât mai specific și creativ

Folosește ## headings.` },

  { id: "a33_comprehensive_summary", name: "Rezumatul Complet al Avatarului", phase: "discovery",
    prompt: `Ia TOT ce ai aflat despre avatar și scrie un rezumat cuprinzător și detaliat, incluzând TOATE informațiile importante.

Rezumatul trebuie să includă:
- Toate detaliile demografice și psihografice
- Toate fricile și durerile profunde
- Soluțiile încercate și eșuate
- Dorințele secrete și transformarea visată
- TOȚI factorii emoționali profunzi care motivează acțiunea
- Toate citatele relevante
- Obiecțiile și barierele

Acest rezumat este DOCUMENTUL MASTER — profilul complet care va fi folosit pentru toate materialele publicitare, emailuri, pagini de vânzare, reclame.

Fă-l atât de lung CÂT ESTE NECESAR. Structurează cu ## headings clare.` },

  // ═══════════════════════════════════════════════════════════
  // FAZA 2: COMMERCIAL (Prompts 9-16) — Analiza Comercială
  // ═══════════════════════════════════════════════════════════
  { id: "a33_jtbd_framework", name: "Jobs-to-be-Done Framework", phase: "commercial",
    prompt: `Pe baza tuturor informațiilor despre avatar, generează un Raport Detaliat și Profesionist despre JTBD (Jobs to Be Done).

Pentru fiecare job (minim 8):
- **Job Statement**: Când eu... vreau să... pentru ca să...
- **Job Funcțional**: Ce trebuie să realizeze efectiv
- **Job Emoțional**: Sentimentele și stările emoționale asociate
- **Job Social**: Cum influențează percepția socială și interacțiunile
- **Context**: Situațiile specifice în care apelează la produs
- **Soluția Curentă**: Ce folosește acum
- **Costul Schimbării**: Ce îl ține pe loc
- **Criterii de Adoptare**: Ce l-ar convinge să schimbe

Folosește ## headings.` },

  { id: "a33_jtbd_situations", name: "Situații JTBD Concrete", phase: "commercial",
    prompt: `Generează top 10 situații și contexte CONCRETE JTBD în care se contextualizează nevoia avatarului de a procura produsul/serviciul.

Pentru FIECARE situație, descrie DETALIAT:
- Contextul complet al situației
- Cauza → Efectul (lanțul cauzal)
- Triggerele care activează nevoia
- Emoțiile trăite (conștiente și inconștiente)
- Gândurile conștiente vs. gândurile inconștiente
- Acțiunile întreprinse sau evitate
- Momentul exact de decizie

Formulează situațiile JTBD ca un profesionist. Fii extrem de specific — nu generic.

Folosește ## headings.` },

  { id: "a33_objections_full", name: "Registrul Obiecțiilor (15+)", phase: "commercial",
    prompt: `Imaginează-ți că ești avatarul și dorești rezultatul descris. Scopul tău: descrie 15 motive concrete pentru care NU crezi că vei putea atinge rezultatul și de aceea NU vei cumpăra.

Creează lista cu 15 obiecții în TREI categorii:
1. **Obiecții Interne** (credințe limitante, frici personale)
2. **Obiecții Externe** (circumstanțe, timp, bani, alți oameni)
3. **Probleme legate de produs/serviciu** (neîncredere, scepticism)

Clasifică-le de la cele mai comune la cele mai puțin comune.

Pentru FIECARE obiecție:
- Numele obiecției și popularitatea (scara 1-10)
- O citată sceptică de 150 cuvinte din perspectiva avatarului
- Argumente concrete pe care le consideră motiv
- Trebuie să fie universală și bazată pe credințe larg răspândite

Folosește ## headings.` },

  { id: "a33_counterarguments", name: "Contraargumente Strategice", phase: "commercial",
    prompt: `Acționezi ca un marketer de nivel mondial. Pregătește un CONTRAARGUMENT pentru fiecare obiecție din lista anterioară.

Fiecare contraargument trebuie construit astfel:

1. **Confirmare** (50 cuvinte): Confirmă obiecția și recunoaște impactul asupra percepției de sine și problemelor avatarului.

2. **Contraargument Principal** (150 cuvinte): Dezvoltă obiecția și tratează-o ca un AVANTAJ UNIC care distinge avatarul de ceilalți și îi crește potențialul de succes. Include comparații concrete pentru a sublinia superioritatea.

3. **Contraargument Emoțional** (150 cuvinte): Subliniază aspectele pozitive ale obiecției, accentuând că demonstrează calitățile excepționale ale avatarului și îl poziționează ca personalitate neobișnuită cu avantaj clar.

Transformă FIECARE obiecție dintr-un negativ într-un AVANTAJ REAL.

Folosește ## headings.` },

  { id: "a33_fears_symbols", name: "Simboluri & Metafore Vizuale", phase: "commercial",
    prompt: `Generează o listă cu 10 cele mai puternice Frici, Dureri, Dorințe, Nevoi și Probleme ale Avatarului.

Apoi:
1. Generează o analiză comparativă și creează un RATING din aceste probleme în funcție de gravitatea lor (scară 1-10).
2. Pentru fiecare problemă, scrie câte 3 argumente de ce ai pus anume nota respectivă.

Apoi oprește-te la capitolul FRICI și generează câte 5 SIMBOLURI (Sensuri Vizuale) pentru fiecare frică.
Aceste simboluri vor fi folosite de echipa de marketing pentru:
- Scrierea textelor publicitare
- Generarea imaginilor AI (Midjourney/DALL-E)
- Crearea de metafore vizuale în reclamele video

Fiecare simbol trebuie să fie:
- Vizual puternic
- Emoțional rezonant
- Ușor de tradus în imagine
- Universal înțeles

Folosește ## headings.` },

  { id: "a33_willingness", name: "Willingness to Pay & Monetizare", phase: "commercial",
    prompt: `Analizează potențialul de monetizare al avatarului:

## Disponibilitate de Plată
- Nivelul de sensibilitate la preț (1-10)
- Prețuri ancoră de la competitori
- Ce îl face să plătească MAI MULT (triggere premium)
- Ce îl face să AȘTEPTE (triggere de discount)
- Preferința de plată (one-time, abonament, rate)

## Matricea Pain × Willingness
- Intensitatea durerii × Disponibilitatea de plată
- Scor de urgență (1-100)
- Investiție emoțională (1-100)

## Analiza Competitivă din Perspectiva Avatarului
- Alternative directe (5+): de ce le aleg, de ce pleacă
- Alternative indirecte (5+): soluții neobvioase
- Alternativa DIY
- Alternativa "nu fac nimic" — costul inacțiunii

## Blind Spots în Piață
- Probleme pe care NIMENI nu le rezolvă
- Nevoi de care avatarul nu știe că le are
- Oportunități emergente

Folosește ## headings cu scoruri.` },

  { id: "a33_decision_process", name: "Procesul de Decizie Complet", phase: "commercial",
    prompt: `Cartografiază procesul COMPLET de decizie al avatarului:

## Etapa Conștientizării (Awareness)
- Cum descoperă că are o problemă?
- Ce triggere externe activează conștientizarea?
- Ce caută pe Google? Ce întreabă pe social media?

## Etapa Considerării (Consideration)
- Cum evaluează opțiunile?
- Ce criterii folosește (conștient și inconștient)?
- Cine influențează decizia?
- Ce informații caută?

## Etapa Deciziei (Decision)
- Care este triggerul FINAL care îl face să cumpere?
- Ce l-ar face să amâne?
- Cât durează ciclul de decizie?
- Ce confirmare caută post-decizie?

## Schwartz Awareness Levels
Pentru FIECARE din cele 5 nivele (Inconștient, Conștient de Problemă, Conștient de Soluție, Conștient de Produs, Cel Mai Conștient):
- Cum gândește avatarul la acest nivel
- Ce îl ÎMPIEDICĂ să treacă la următorul nivel
- Ce mesaj l-ar mișca

Folosește ## headings.` },

  // ═══════════════════════════════════════════════════════════
  // FAZA 3: CONTENT (Prompts 17-24) — Strategie de Conținut
  // ═══════════════════════════════════════════════════════════
  { id: "a33_hooks", name: "Hook Library (20 Hooks)", phase: "content",
    prompt: `Generează 20 hook-uri care opresc scroll-ul pentru acest avatar.

Categorii:
- **Curiozitate** (5): Deschid o buclă mentală imposibil de ignorat
- **Controversă** (3): Provoacă o reacție emoțională imediată
- **Statistici** (3): Folosesc numere surprinzătoare
- **Povești** (4): Încep cu o narațiune captivantă
- **Întrebări** (5): Pun o întrebare la care avatarul TREBUIE să răspundă mental

Pentru fiecare hook:
- Textul complet al hook-ului
- Platforma (LinkedIn/Twitter/YouTube/TikTok/Instagram)
- Triggerul psihologic activat
- De ce funcționează pe acest avatar specific

Scrie în stilul Sabri Suby — direct, provocator, imposibil de ignorat.
Folosește ## headings.` },

  { id: "a33_stories", name: "10 Template-uri de Povești", phase: "content",
    prompt: `Creează 10 template-uri de povești pentru acest avatar:

Tipuri:
- **Origin Stories** (2): Cum a început problema
- **Transformation** (2): Înainte vs. După
- **Failure-Lesson** (2): Ce a mers prost și ce a învățat
- **Customer-Hero** (2): Avatarul ca erou al propriei povești
- **Vision** (2): Viziunea viitorului ideal

Pentru FIECARE poveste:
- Setup (contextul emoțional)
- Conflict (tensiunea centrală)
- Resolution (rezolvarea)
- Moral (lecția)
- Unde să o folosești (email, ad, landing, reel)
- Triggerul emoțional principal

Folosește tehnici de storytelling avansat: loops deschise, cliffhangeri, detalii senzoriale.
Folosește ## headings.` },

  { id: "a33_email_seq", name: "Secvență Email Nurture (7 emailuri)", phase: "content",
    prompt: `Designează o secvență de 7 emailuri de nurture pentru acest avatar:

**Email 1 — Welcome + Identitate**: Confirmă că avatarul e în locul potrivit
**Email 2 — Validare Durere**: Arată că înțelegi problema mai bine decât el/ea
**Email 3 — Poveste + Speranță**: O transformare credibilă
**Email 4 — Dovadă Socială**: Alții ca el/ea au reușit
**Email 5 — Handling Obiecții**: Distruge barierele mentale
**Email 6 — Urgență + Scarcity**: De ce ACUM, nu mâine
**Email 7 — CTA Final**: Oferta irezistibilă

Pentru FIECARE email:
- Subject line (3 variante)
- Preview text
- Body complet (200-300 cuvinte)
- CTA specific
- Triggerul psihologic principal

Folosește ## headings.` },

  { id: "a33_funnel", name: "Arhitectura Funnel", phase: "content",
    prompt: `Designează funnel-ul optim de conversie:

## TOFU (Top of Funnel)
- 3 piese de conținut care atrag avatarul
- Tipul conținutului și platforma
- Hook-ul și mesajul principal

## Lead Magnet
- Design complet al lead magnet-ului
- Titlu (3 variante în stilul Sabri Suby)
- Ce conține și de ce este irezistibil
- Landing page: headline, subheadline, bullet points, CTA

## MOFU (Middle of Funnel)
- 3 touchpoints de nurture
- Conținut pentru fiecare touchpoint
- Secvența și timing-ul

## BOFU (Bottom of Funnel)
- Structura ofertei
- Prețul și justificarea
- Garanția și reversul riscului
- Scarcity element

## Post-Purchase
- Upsell imediat
- Secvența de onboarding
- Mecanismul de referral

5 Lead Magnets cu câte 3 titluri fiecare în stilul Sabri Suby.
IMPORTANT: Mesajele nu trebuie să atragă persoane care NU își permit produsul.

Folosește ## headings.` },

  { id: "a33_social", name: "15 Template-uri Social Media", phase: "content",
    prompt: `Creează 15 template-uri de postări social media:

**LinkedIn** (5 postări):
- Format lung (storytelling profesional)
- Hook + body + CTA + hashtags
- Ora optimă de postare

**Twitter/X** (5 thread-uri):
- Tweet 1 (hook) + 3-5 tweet-uri dezvoltare + CTA final
- Hashtags și timing

**Instagram** (3 postări):
- Caption complet + hook vizual + CTA
- Sugestie pentru vizualul care însoțește

**TikTok/Reels** (2 scripturi):
- Script pentru video de 60 secunde
- Hook în primele 3 secunde
- Structura completă

Fiecare postare trebuie să folosească limba și vocabularul EXACT al avatarului.
Folosește ## headings.` },

  { id: "a33_ad_copy", name: "Copy pentru Reclame (Facebook + Google)", phase: "content",
    prompt: `Generează copy pentru reclame care atrag acest avatar:

## Facebook/Meta Ads (6 variante)
Ia aleatoriu 3 Situații JTBD și formulează 6 texte pentru Facebook Ads.
- La fiecare text aplică o formulă DIFERITĂ (PAS, AIDA, Before-After-Bridge, etc.)
- Fii creativ, nu-ți fie frică să scrii texte LUNGI
- Operează cu: frici, dureri, dorințe, metafore, simboluri, tehnici persuasive, triggere emoționale
- Orice produce EMOȚIE în rândul avatarului și declanșează acțiunea de click

## Google Ads (5 headline-uri + descrieri)
- Headline-uri care captează atenția în căutare
- Descrieri care diferențiază de competiție

## YouTube Pre-roll (script 15s + 30s)
- Hook în primele 5 secunde
- Mesajul central
- CTA clar

## Retargeting Ads (3 variante)
- Pentru cei care au vizitat dar nu au convertit

Include pentru fiecare: Audiența targetată, Triggerul psihologic, De ce funcționează.
Folosește ## headings.` },

  { id: "a33_schwartz_content", name: "Conținut per Nivel Schwartz", phase: "content",
    prompt: `Combină informațiile despre Avatar cu JTBD și elaborează conținut pentru fiecare din cele 5 etape Schwartz:

## Etapa 1: INCONȘTIENT
- Profil specific al avatarului la acest nivel
- 5 situații JTBD concrete pentru acest nivel
- 20 subiecte de Reels (titluri) — scopul: aducerea la etapa Conștient de Problemă
- Ce anume îl împiedică să conștientizeze?

## Etapa 2: CONȘTIENT DE PROBLEMĂ
- Profil specific
- 20 subiecte de Reels
- Scopul: aducerea la Conștient de Soluție
- Diferențe în gândire față de nivelul anterior

## Etapa 3: CONȘTIENT DE SOLUȚIE
- Profil specific
- 20 subiecte de Reels
- Scopul: aducerea la Conștient de Produs

## Etapa 4: CONȘTIENT DE PRODUS
- Cum compară cu alternativele
- Ce dovezi sociale caută

## Etapa 5: CEL MAI CONȘTIENT
- Ce CTA funcționează
- Ce ofertă finală convertește

Descrie CALEA completă pe care o parcurge avatarul de la Inconștient la Cumpărător — inclusiv transformarea sa la fiecare etapă.

Folosește ## headings.` },

  // ═══════════════════════════════════════════════════════════
  // FAZA 4: SYNTHESIS (Prompts 25-33) — Sinteză & Livrabile
  // ═══════════════════════════════════════════════════════════
  { id: "a33_tension", name: "Harta Tensiunilor Emoționale", phase: "synthesis",
    prompt: `Cartografiază peisajul tensiunilor emoționale al avatarului:

## Tensiunea Primară
Dorință vs. Frică — descrie conflictul central

## Tensiuni Secundare (5+)
- Confort vs. Creștere
- Siguranță vs. Oportunitate
- Identitatea actuală vs. Identitatea dorită
- Aprobarea celorlalți vs. Autenticitate
- + alte tensiuni specifice

## Puncte de Rezoluție
- Momentele exacte când tensiunea se rezolvă (și cum)
- Călătoria emoțională de la Awareness la Purchase
- Momentele de peak emoțional
- Secvența de construire a încrederii

## Motoare Emoționale Ascunse
- De ce depinde succesul avatarului (satisfacție emoțională)
- Ce satisfacții trebuie să ABANDONEZE
- Pe cine dă VINA pentru probleme (forțe externe)
- Ce NU ar recunoaște niciodată

Folosește ## headings.` },

  { id: "a33_conversion", name: "Scor de Conversie", phase: "synthesis",
    prompt: `Calculează pregătirea pentru conversie a avatarului:

## Scoruri (fiecare 1-100, cu justificare)
- Pain Intensity: ___ (de ce?)
- Solution Awareness: ___ (de ce?)
- Trust Level Required: ___ (de ce?)
- Urgency Factor: ___ (de ce?)
- Price Sensitivity: ___ (de ce?)
- Emotional Investment: ___ (de ce?)
- Social Proof Need: ___ (de ce?)

## Conversion Score Compozit
- Formula: (Pain × 0.25) + (Urgency × 0.2) + (Emotional × 0.2) + (100 - PriceSens × 0.15) + (Awareness × 0.1) + (100 - TrustReq × 0.1)
- Scor final: ___
- Interpretare: Ce înseamnă acest scor

## Probabilitate de Conversie
- Estimare %
- Valoare medie per tranzacție
- Lifetime Value potențial
- Probabilitate de referral

Folosește ## headings.` },

  { id: "a33_segments", name: "Micro-Segmente (3-5)", phase: "synthesis",
    prompt: `Identifică 3-5 micro-segmente DISTINCTE în cadrul avatarului principal.

Pentru FIECARE micro-segment:
- Numele segmentului
- Caracteristica definitorie
- Estimare dimensiune (% din total)
- Durerea UNICĂ (diferită de celelalte segmente)
- Unghiul de mesaj UNIC
- Canalul optim de comunicare
- Dificultatea de conversie (1-10)
- Prioritate (P1/P2/P3)
- Potențial de revenue

Apoi clasează segmentele după:
1. Ușurința de conversie
2. Valoarea potențială
3. Accesibilitatea pe canale

Recomandă ordinea de atac strategică.
Folosește ## headings.` },

  { id: "a33_positioning", name: "Declarații de Poziționare", phase: "synthesis",
    prompt: `Construiește poziționarea perfectă:

## Formula de Bază
Pentru [target], care [situație], produsul/serviciul nostru este [categoria] care [beneficiu unic], spre deosebire de [alternativă], noi [diferențiator].

Creează 3 variante:
1. **Rațională**: Bazată pe logică și rezultate măsurabile
2. **Emoțională**: Bazată pe transformarea emoțională
3. **Aspirațională**: Bazată pe identitatea dorită

## Messaging Matrix
- Mesajul primar (1 propoziție)
- Mesaje suport (3)
- Puncte de dovadă pentru fiecare mesaj
- Ghid de ton al vocii
- 20 cuvinte DE FOLOSIT
- 20 cuvinte DE EVITAT
- 5 variante de tagline
- Elevator pitch (30s, 60s, 2min)

Folosește ## headings.` },

  { id: "a33_risk", name: "Harta Riscurilor & Mitigare", phase: "synthesis",
    prompt: `Identifică TOATE riscurile în targetarea acestui avatar:

## Riscuri de Piață (3)
- Descriere, Probabilitate, Impact, Strategie de mitigare

## Riscuri de Mesaj (3)
- Mesaje care ar putea fi percepute GREȘIT
- Tonuri care ar putea aliena avatarul

## Riscuri de Preț (3)
- Bariere financiare reale
- Percepția greșită a valorii

## Riscuri Competitive (3)
- Ce ar putea face competitorii
- Cum să te protejezi

## Riscuri de Timing (2)
- Sezonalitate
- Evenimente externe care influențează decizia

Pentru FIECARE: descriere, probabilitate (%), impact (1-10), mitigare concretă.
Folosește ## headings.` },

  { id: "a33_recommendations", name: "10 Recomandări Strategice", phase: "synthesis",
    prompt: `Oferă top 10 recomandări strategice pentru engagement cu acest avatar.

Pentru FIECARE recomandare:
- **Recomandarea**: Ce să faci (clar, acționabil)
- **Rațiune**: De ce funcționează pe acest avatar
- **Impact Estimat** (1-10)
- **Efort Necesar** (1-10)
- **Prioritate** (P1/P2/P3)
- **Timeline**: Când să implementezi
- **Metric de Succes**: Cum măsori rezultatul
- **Quick Win**: Un pas mic pe care îl poți face ASTĂZI

Ordonează după raportul Impact/Efort (cele mai mari câștiguri cu cel mai mic efort primele).
Folosește ## headings.` },

  { id: "a33_passport", name: "Client Passport (One-Pager)", phase: "synthesis",
    prompt: `Creează PAȘAPORTUL FINAL al Clientului — un sumar executiv de o pagină:

## 🎯 Client Passport

**Nume Avatar**: ___
**Tagline**: ___ (o propoziție care îl definește)

### Snapshot Demografic
Vârstă | Gen | Profesie | Venit | Locație | Educație

### Top 3 Dureri
1. ___
2. ___
3. ___

### Top 3 Dorințe
1. ___
2. ___
3. ___

### Stil de Decizie
___ (impulsiv/analitic/influențat social/etc.)

### Triggere de Cumpărare
___

### Obiecția Principală
___

### Mesajul Perfect
___

### Canale Recomandate
___

### Conversion Score
___ / 100

### Revenue Potential
___

### Cuvintele Lui/Ei (3 citate directe)
1. "___"
2. "___"
3. "___"

Formatează ca un CARD structurat, vizual curat.` },

  { id: "a33_yaml", name: "YAML Profile Export", phase: "synthesis",
    prompt: `Generează profilul COMPLET YAML al avatarului — format machine-readable:

\`\`\`yaml
avatar:
  name: ""
  tagline: ""
  demographics:
    age_range: ""
    gender: ""
    income: ""
    education: ""
    location: ""
    profession: ""
    family_status: ""
  psychographics:
    values: []
    beliefs: []
    identity_current: ""
    identity_desired: ""
    worldview: ""
  pains:
    surface: []
    deep_hidden: []
    intensity_avg: 0
    fear_symbols: []
  goals:
    immediate: []
    short_term: []
    long_term: []
    secret_desires: []
  jtbd:
    functional_jobs: []
    emotional_jobs: []
    social_jobs: []
    top_situations: []
  purchase:
    triggers: []
    objections: []
    decision_style: ""
    cycle_days: 0
    price_sensitivity: 0
    willingness_score: 0
  content:
    preferred_channels: []
    content_types: []
    language_patterns: []
    hooks_that_work: []
    words_to_use: []
    words_to_avoid: []
  schwartz_level: ""
  conversion_score: 0
  monetization_score: 0
  priority_segment: ""
  micro_segments: []
  key_quotes: []
\`\`\`

Completează TOATE câmpurile cu datele extrase. Returnează YAML valid.` },
];

const BATCH_SIZE = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  let user: any = null;
  let totalCost = 0;
  let settled = false;

  try {
    // Auth
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: { user: authUser }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }
    user = authUser;

    // Rate limit
    const rateLimited = await rateLimitGuard(user.id, req, { maxRequests: 5, windowSeconds: 60 }, getCorsHeaders(req));
    if (rateLimited) return rateLimited;

    if (req.method === "GET") {
      const modules = AVATAR33_MODULES.map(m => ({ id: m.id, name: m.name, phase: m.phase }));
      const phases = ["discovery", "commercial", "content", "synthesis"];
      return new Response(JSON.stringify({ modules, phases, total: modules.length, estimated_credits: 33 * 50 }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { content, selected_modules, job_id } = body;

    if (!content || content.length < 50) {
      return new Response(JSON.stringify({ error: "Content must be at least 50 characters" }), { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
    }

    const modulesToRun = selected_modules?.length
      ? AVATAR33_MODULES.filter(m => selected_modules.includes(m.id))
      : AVATAR33_MODULES;

    totalCost = modulesToRun.length * 50;

    // RESERVE neurons
    const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
      _user_id: user.id,
      _amount: totalCost,
      _description: `RESERVE: Avatar33 Pipeline: ${modulesToRun.length} modules`,
    });

    if (reserveErr || !reserved) {
      return new Response(JSON.stringify({ error: "Insufficient credits", needed: totalCost }), {
        status: 402, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Execute in batches — each batch builds on prior results for context chaining
    const results: Record<string, { name: string; phase: string; content: string }> = {};
    let completedCount = 0;
    let contextAccumulator = "";

    for (let i = 0; i < modulesToRun.length; i += BATCH_SIZE) {
      const batch = modulesToRun.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (mod) => {
        try {
          // Build context: original content + prior results summary (for continuity)
          const contextSuffix = contextAccumulator
            ? `\n\n--- CONTEXT DIN MODULELE ANTERIOARE ---\n${contextAccumulator.slice(-8000)}`
            : "";

          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: mod.prompt },
                { role: "user", content: content.slice(0, 25000) + contextSuffix },
              ],
            }),
          });

          if (!resp.ok) return { id: mod.id, name: mod.name, phase: mod.phase, content: `Error: ${resp.status}` };

          const data = await resp.json();
          return { id: mod.id, name: mod.name, phase: mod.phase, content: data.choices?.[0]?.message?.content || "" };
        } catch (e) {
          return { id: mod.id, name: mod.name, phase: mod.phase, content: `Error: ${(e as Error).message}` };
        }
      }));

      for (const r of batchResults) {
        results[r.id] = { name: r.name, phase: r.phase, content: r.content };
        completedCount++;
        // Accumulate key excerpts for context chaining
        contextAccumulator += `\n## ${r.name}\n${r.content.slice(0, 500)}`;
      }

      // Update job progress
      if (job_id) {
        await supabase.from("neuron_jobs").update({
          result: { progress: completedCount, total: modulesToRun.length, phase: batch[0]?.phase },
        }).eq("id", job_id);
      }
    }

    // Save as artifact
    const fullContent = Object.entries(results)
      .map(([_id, r]) => `# ${r.name}\n_Faza: ${r.phase}_\n\n${r.content}`)
      .join("\n\n---\n\n");

    await supabase.from("artifacts").insert({
      author_id: user.id,
      title: `Avatar33 — Profil Client — ${new Date().toLocaleDateString("ro-RO")}`,
      artifact_type: "profile",
      content: fullContent.slice(0, 200_000),
      format: "markdown",
      status: "generated",
      service_key: "avatar33-pipeline",
      job_id: job_id || null,
      tags: ["avatar33", "client-profile", "commercial", "avatar", "jtbd", "schwartz"],
      metadata: { modules_run: modulesToRun.length, credits_spent: totalCost },
    });

    if (job_id) {
      await supabase.from("neuron_jobs").update({
        status: "completed", completed_at: new Date().toISOString(),
        result: { modules: modulesToRun.length, credits_spent: totalCost },
      }).eq("id", job_id);
    }

    // SETTLE neurons
    await supabase.rpc("settle_neurons", { _user_id: user.id, _amount: totalCost, _description: `SETTLE: Avatar33 Pipeline` });
    settled = true;

    return new Response(JSON.stringify({ results, modules_completed: completedCount, credits_spent: totalCost }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("avatar33-pipeline error:", e);
    if (!settled && user?.id && totalCost > 0) {
      await supabase.rpc("release_neurons", { _user_id: user.id, _amount: totalCost, _description: `RELEASE: Avatar33 — error` }).catch(() => {});
    }
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
