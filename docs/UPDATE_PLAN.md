# AI-IDEI Platform — Plan Complet de Actualizare

> Generat din analiza a 8 documente de specificații: github_tasks.yml, TASKs_Avansat.txt, TASKs-2.txt, TASKs_Avansat_servicii.txt, TASKs_Avansat_servicii_2.txt, TASKs_Avansat_servicii_3_web*.txt, psycho_profile.txt, user_experience.txt

---

## Viziune Arhitecturală

Platforma nu este un SaaS clasic. Este un **Knowledge Operating System** cu pipeline determinist:

```
Media → Transcript → Extraction Engine → Knowledge Graph → Intelligence Assets → Services → Deliverables
```

Planul este organizat pe **6 faze**, de la fundație la scalare, cu priorități P0 (critic) → P3 (viitor).

---

## FAZA 0 — STABILIZARE & SECURITATE (P0)
*Prerequisite pentru orice dezvoltare ulterioară*

### 0.1 Securitate Edge Functions
| # | Sarcină | Status actual |
|---|---------|---------------|
| 0.1.1 | ✅ Activare JWT auth pe `extract-neurons`, `chunk-transcript`, `extract-guests`, `generate-entities` | DONE — toate derivează user_id din JWT |
| 0.1.2 | ✅ Extragere `user_id` din JWT token (nu din payload) | DONE — verificat în toate funcțiile |
| 0.1.3 | ✅ Audit complet al tuturor edge functions pentru pattern-ul corect | DONE |
| 0.1.4 | ✅ Fix CORS headers pe `generate-entities` | DONE |
| 0.1.5 | ✅ Fix `search_path` pe funcțiile email (enqueue_email, read_email_batch, etc.) | DONE |

### 0.2 Performanță & Stabilitate
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 0.2.1 | ✅ Indexuri DB: `neurons.author_id`, `entities.slug`, `neuron_blocks.neuron_id`, `episodes.author_id` + 6 altele | DONE |
| 0.2.2 | ✅ Error Boundaries pe rute principale (Extractor, NeuronEditor, Intelligence, RunService, BatchRunner) | DONE |
| 0.2.3 | Eliminare navigație duplicată (SiteHeader vs AppSidebar) | P1 |

### 0.3 i18n & Consistență
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 0.3.1 | Standardizare limbă UI: EN principal + RO opțional | P1 |
| 0.3.2 | Migrare texte hardcodate în fișiere locale (`src/locales/`) | P1 |
| 0.3.3 | Eliminare mix RO/EN din interfață | P1 |

---

## FAZA 1 — UX CORE PAGES POLISH (P0-P1)
*Pagini existente → funcționale și clare*

### 1.1 Extractor Page
| # | Sarcină | Status |
|---|---------|--------|
| 1.1.1 | ✅ Stabilizare container input la schimbare source type | DONE |
| 1.1.2 | ✅ Drag-and-drop fișiere fără click suplimentar | DONE |
| 1.1.3 | ✅ Butoane Edit/Copy/Download vizibile în header episod | DONE |
| 1.1.4 | ✅ Tooltipuri pe Extract, Preview Segments, Guests | DONE |
| 1.1.5 | ✅ Notificări descriptive la finalizare extracție | DONE |
| 1.1.6 | ✅ Vizualizare transcript cu structură pe speaker (timeline) | DONE — TranscriptViewer component |
| 1.1.7 | ✅ Import PDF cu extragere automată text | DONE — pdfjs-dist integration |

### 1.2 Neurons Page
| # | Sarcină | Status |
|---|---------|--------|
| 1.2.1 | ✅ Preview pane split-view | DONE |
| 1.2.2 | ✅ Sidebar foldere profesional (3 niveluri) | DONE |
| 1.2.3 | ✅ Sidebar unificat reutilizat în Guests/Library/Intelligence | DONE — FolderSidebar shared component |
| 1.2.4 | ✅ Bulk operations (delete, move, tag) | DONE |

### 1.3 Neuron Editor (`/n/*`)
| # | Sarcină | Status |
|---|---------|--------|
| 1.3.1 | ✅ Toolbar funcțional (insert blocks, Bold/Italic/Undo) | DONE |
| 1.3.2 | ✅ Tooltipuri descriptive pe toate butoanele | DONE |
| 1.3.3 | ✅ Stabilitate layout la deschidere panouri laterale | DONE |
| 1.3.4 | ✅ Drag-and-drop reordonare blocuri | DONE |
| 1.3.5 | ✅ Keyboard shortcuts (Ctrl+Enter = Run, Ctrl+S = Save) | DONE |

### 1.4 Jobs Page
| # | Sarcină | Status |
|---|---------|--------|
| 1.4.1 | ✅ Legendă statusuri cu explicații | DONE |
| 1.4.2 | ✅ Ghid educativ pipeline | DONE |
| 1.4.3 | ✅ Notificări automate la finalizare/eșuare job | DONE |
| 1.4.4 | ✅ Retry automat cu UI feedback | DONE |

### 1.5 Library Page
| # | Sarcină | Status |
|---|---------|--------|
| 1.5.1 | ✅ Diferențiere Neurons vs Library (explainer banner) | DONE |
| 1.5.2 | ✅ Vizibilitate controlată (private/team/public per artefact) | DONE |
| 1.5.3 | ✅ Filtrare și sortare avansată + folder sidebar | DONE |

### 1.6 Guest Pages
| # | Sarcină | Status |
|---|---------|--------|
| 1.6.1 | ✅ Descriere clară funcție | DONE |
| 1.6.2 | ✅ Detecție duplicate | DONE |
| 1.6.3 | ✅ Notificare publicare cu URL | DONE |
| 1.6.4 | ✅ Editare/completare profil — paywall preview pattern | DONE |
| 1.6.5 | ✅ Organizare în foldere (sidebar reutilizabil) | DONE |

### 1.7 Guest Profile (`/guest/*`)
| # | Sarcină | Status |
|---|---------|--------|
| 1.7.1 | ✅ Design premium cu gradient mesh | DONE |
| 1.7.2 | ✅ Expertise bars animate | DONE |
| 1.7.3 | ✅ Framework cards interactive | DONE |
| 1.7.4 | ✅ Versiune gratuită vs. plată (paywall pe detalii avansate) | DONE — PaywallSection component |
| 1.7.5 | ✅ Explicații sub fiecare framework | DONE |
| 1.7.6 | ✅ Citate extinse (zeci) + stil comunicare | DONE — QuotesSection expandable |

### 1.8 Pipeline Indicator
| # | Sarcină | Status |
|---|---------|--------|
| 1.8.1 | ✅ Tooltipuri pe fiecare etapă | DONE |
| 1.8.2 | ✅ Click navigare la pagina relevantă | DONE |
| 1.8.3 | ✅ Pagină dedicată Pipeline Overview | DONE — /pipeline cu 9 etape, output badges, navigare |

### 1.9 General UX
| # | Sarcină | Status |
|---|---------|--------|
| 1.9.1 | ✅ Iconografie consistentă privat/public/gratuit/plătit | DONE — AccessIcons shared component |
| 1.9.2 | ✅ Indicatoare cost NEURONS pe servicii | DONE — Coins + cost pe fiecare service card |
| 1.9.3 | ✅ SEOHead pe toate paginile | DONE — adăugat pe Links, Auth, NotFound, Architecture, PromptForge, MediaProfiles, ResetPassword, PublicProfile, BatchRunner, RunService |

---

## FAZA 2 — EXTRACTION ENGINE AVANSAT (P0)
*Motorul de extracție: de la ~5 extractori la ~120*

### 2.1 Pipeline Extracție Multi-Nivel
| # | Nivel | Sarcină | Status |
|---|-------|---------|--------|
| 2.1.1 | L0 | ✅ Input Layer — normalizare media, PDF/DOCX parsing | DONE — PDF via pdfjs-dist |
| 2.1.2 | L1 | ✅ Segmentation — chunking semantic 300-800 tokens | DONE — chunk-transcript edge function |
| 2.1.3 | L2 | ✅ Atomic Extraction — statements, definitions, principles, questions | DONE — deep-extract L2_atomic |
| 2.1.4 | L3 | ✅ Entity Extraction — persons, companies, concepts, frameworks | DONE — deep-extract L3_entity + extract-guests |
| 2.1.5 | L4 | ✅ Structural Extraction — frameworks, mental models, processes | DONE — deep-extract L4_structural |
| 2.1.6 | L5 | ✅ Psychological Extraction — cognitive style, emotional drivers, traits | DONE — deep-extract L5_psychological |
| 2.1.7 | L6 | ✅ Narrative Extraction — anchor stories, metaphors, pivot phrases | DONE — deep-extract L6_narrative |
| 2.1.8 | L7 | ✅ Commercial Extraction — JTBD, purchase triggers, opportunities | DONE — deep-extract L7_commercial |
| 2.1.9 | L8 | ✅ Pattern Detection — decision/persuasion/influence patterns | DONE — deep-extract L8_pattern |
| 2.1.10 | L9 | ✅ Insight Synthesis — strategic/psychological/commercial insights | DONE — deep-extract L9_synthesis |
| 2.1.11 | L10 | ✅ Profile Generation — speaker profiles cu componente psihologice | DONE — extract-guests edge function |
| 2.1.12 | L11 | ✅ Knowledge Graph Update — noduri, edge-uri, clustering | DONE — generate-entities + compute_idearank |
| 2.1.13 | L12 | Content Production — articole, rapoarte, social posts | P2 (via IMF Pipeline) |

### 2.2 Scoring Engine
| # | Sarcină | Status |
|---|---------|--------|
| 2.2.1 | ✅ Formula: `score = novelty × information_density × utility × demand` | DONE — computed in deep-extract |
| 2.2.2 | ✅ Praguri: premium (>70), standard (40-70), discard (<40) | DONE — tier field in insight_scores |
| 2.2.3 | ✅ Stocare scoruri în tabel `insight_scores` | DONE — table + RLS + indexes |

### 2.3 Deduplicare & Merge
| # | Sarcină | Status |
|---|---------|--------|
| 2.3.1 | ✅ Embedding-based similarity detection (cosine > 0.40) | DONE — dedup-neurons edge function |
| 2.3.2 | ✅ Neuron merge logic cu păstrare proveniență | DONE — neuron_duplicates table |
| 2.3.3 | ✅ UI pentru confirmare merge | DONE — DuplicateMergePanel + Intelligence tab |

---

## FAZA 3 — SERVICE EXECUTION ENGINE (P0)
*Orchestrarea serviciilor AI*

### 3.1 Job Execution System
| # | Sarcină | Status |
|---|---------|--------|
| 3.1.1 | ✅ State machine: PENDING → RUNNING → COMPLETED/FAILED + dead_letter | DONE — neuron_jobs table |
| 3.1.2 | ✅ Pre-run protocol: checkAccess → estimate → reserve credits → execute → settle | DONE — run-service edge function |
| 3.1.3 | ✅ Retry system cu exponential backoff | DONE — process-queue + retry_failed_job |
| 3.1.4 | ✅ Dead letter queue pentru job-uri failed permanent | DONE — dead_letter field + process-queue |
| 3.1.5 | ✅ Progres live via Supabase Realtime | DONE — realtime enabled on neuron_jobs |

### 3.2 Service Classification
| # | Clasă | Descriere | Status |
|---|-------|-----------|--------|
| 3.2.1 | S (Sync) | ✅ Servicii rapide <20s: summary, key quotes, SEO keywords | DONE — Class A services |
| 3.2.2 | C (Cognitive) | ✅ Analiză profundă 1-5min: psychological profile, business ideas | DONE — Class B services |
| 3.2.3 | X (Extended) | ✅ Pipeline complet: personality intelligence, market intelligence | DONE — Class C + IMF pipeline |

### 3.3 Service Manifest
| # | Sarcină | Status |
|---|---------|--------|
| 3.3.1 | ✅ Tabel `service_catalog` cu input_schema, pipeline, pricing, QA rules | DONE |
| 3.3.2 | ✅ Service runner edge function cu routing pe clasă | DONE — run-service |
| 3.3.3 | ✅ Artifact packager (MD, TXT, JSON, clipboard export) | DONE — ArtifactExportMenu |

### 3.4 Servicii Specializate
| # | Serviciu | Module prompts | Status |
|---|---------|---------------|--------|
| 3.4.1 | ✅ Transcript Intelligence | Extracție completă din transcript | DONE — extract-insights + deep-extract |
| 3.4.2 | ✅ Personality Intelligence | 45 prompts pe 10 module (Avatar Psihologic) | DONE — service_catalog entry + 10 deliverables |
| 3.4.3 | ✅ Avatar33 Execution Engine | 33 prompts pentru avatar comercial | DONE — service_catalog entry + 13 deliverables |
| 3.4.4 | ✅ Webinar Generator | 48 prompts pe 12 module | DONE — service_catalog entry + 12 deliverables |
| 3.4.5 | ✅ Podcast Intelligence | Framework-uri, pattern-uri retorice | DONE — service_catalog entry + 8 deliverables |

---

## FAZA 4 — ECONOMIC LAYER & ACCESS (P1)
*Monetizare și control acces*

### 4.1 Credit System Enhancement
| # | Sarcină | Status |
|---|---------|--------|
| 4.1.1 | ✅ Credit reservation la start job + settlement la finalizare | DONE — reserve_credits + settle_credits DB functions |
| 4.1.2 | ✅ Refund automat la job failed | DONE — refund_credits DB function |
| 4.1.3 | ✅ Cost preview înainte de execuție (UI) | DONE — Cost Preview panel in RunService |
| 4.1.4 | ✅ Pricing transitions bazat pe neuron lifecycle | DONE — neuron_lifecycle_pricing view |

### 4.2 Access Control (`checkAccess`)
| # | Sarcină | Status |
|---|---------|--------|
| 4.2.1 | ✅ Funcție canonică `checkAccess(user, resource, context)` → ALLOW/PAYWALL/DENY | DONE — check_access DB function |
| 4.2.2 | ✅ Entitlement resolver (credite, tier, token) | DONE — integrated in check_access |
| 4.2.3 | ✅ UI verdict system (lock/unlock vizual pe servicii) | DONE — Shield/Lock icons in RunService |
| 4.2.4 | Access Simulator pentru admin | P2 |

### 4.3 Root2 Pricing
| # | Sarcină | Status |
|---|---------|--------|
| 4.3.1 | ✅ Funcție calcul Root2 (suma cifrelor = 2) | DONE — root2_validate + root2_nearest DB functions |
| 4.3.2 | Aplicare pe prețuri vizibile (pachete, servicii) | P2 |
| 4.3.3 | Admin toggle Root2 pe categorii | P3 |

### 4.4 Free vs Premium Tiers
| # | Sarcină | Status |
|---|---------|--------|
| 4.4.1 | ✅ Free Set (~20 extractori): summary, quotes, topics, viral clips | DONE — access_tier column + free services |
| 4.4.2 | ✅ Premium Set (~100 extractori): psychological, strategic, business | DONE — default premium tier |
| 4.4.3 | ✅ Paywall UI cu preview gratuit + unlock plătit | DONE — FREE/PREMIUM badges on Services page + PAYWALL verdict |

---

## FAZA 5 — ADVANCED FEATURES (P1-P2)
*Funcționalități avansate și diferențiatoare*

### 5.1 Chat Interface (Conversational Layer)
| # | Sarcină | Status |
|---|---------|--------|
| 5.1.1 | ✅ Componentă chat cu input text + drag-drop fișiere | DONE — PlatformChat component |
| 5.1.2 | ✅ Parser intenții (LLM via Lovable AI gateway) | DONE — neuron-chat integration |
| 5.1.3 | ✅ Conectare la edge functions (extract, generate, run-service) | DONE — via neuron-chat |
| 5.1.4 | Context persistent pe sesiune | P2 |
| 5.1.5 | Suport multi-modal (audio/video upload din chat) | P2 |

### 5.2 Psychological Profile Engine
| # | Sarcină | Status |
|---|---------|--------|
| 5.2.1 | Pipeline LIWC-based: corpus → tokenizare → matrice lexicală → TF-IDF | P1 |
| 5.2.2 | Mapare către Big Five traits via regression | P2 |
| 5.2.3 | Generare psychological feature vector per speaker | P2 |
| 5.2.4 | ✅ Vizualizare radar chart în profil guest | DONE — RadarChart SVG component |

### 5.3 Webinar Generator Service
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 5.3.1 | Webinar Structure Engine (timing, slide allocation, constraint: 1 slide = 1 min, max 40 words) | P2 |
| 5.3.2 | Slide Compression Engine (40-word enforcement + semantic preservation) | P2 |
| 5.3.3 | Speech Expansion Engine (speaker notes, 110-150 words/slide) | P2 |
| 5.3.4 | Visual Deck Engine (layout types, image prompts) | P2 |
| 5.3.5 | Bonus Generator (5 PDF bonuses: antidot obiecții, validare socială) | P3 |
| 5.3.6 | Export: PPTX, PDF, DOCX, TXT, ZIP | P2 |

### 5.4 Marketplace & Knowledge Assets
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 5.4.1 | Tabele `knowledge_assets`, `asset_transactions`, `asset_licenses` | P2 |
| 5.4.2 | Pricing dual USD + NEURONS | P2 |
| 5.4.3 | Mini-landing pages pentru artefacte | P2 |
| 5.4.4 | Recenzii și rating-uri cu moderare admin | P2 |
| 5.4.5 | Catalog public cu portofolii creatori | P3 |

### 5.5 IdeaRank UI Layer
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 5.5.1 | Widget "Idei în trend" pe homepage | P1 |
| 5.5.2 | Sortare entități după IdeaRank/freshness | P1 |
| 5.5.3 | Pagină /topics/discovery cu clustering interactiv | P2 |
| 5.5.4 | Algoritm IdeaRank: influence scoring + propagation modeling | P2 |

### 5.6 User Profile & Gamification
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 5.6.1 | Pagină profil indexabil per utilizator | P1 |
| 5.6.2 | Realizări/competențe din activitate platformă | P2 |
| 5.6.3 | Premii pentru neuroni/tokens acumulați | P2 |

---

## FAZA 6 — GOVERNANCE, TOKEN & SCALE (P2-P3)
*Infrastructură avansată și token economics*

### 6.1 Decision Ledger
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 6.1.1 | Tabel `decision_ledger` append-only | P1 |
| 6.1.2 | Logging hooks pentru access allow/deny/abuse | P1 |
| 6.1.3 | Audit viewer în Admin | P2 |
| 6.1.4 | Export CSV/JSON pentru audit extern | P2 |

### 6.2 Abuse Detection
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 6.2.1 | Detectare prompt probing | P1 |
| 6.2.2 | Detectare export farming | P1 |
| 6.2.3 | Downgrade ladder: cooldown → downgrade → suspend | P2 |

### 6.3 Admin Control Plane
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 6.3.1 | Wallet management dashboard | P1 |
| 6.3.2 | Reconciliation engine (cost vs revenue) | P2 |
| 6.3.3 | Incident management panel | P2 |
| 6.3.4 | Entropy monitoring (cost growth vs revenue growth) | P3 |

### 6.4 Token NOTA2
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 6.4.1 | Smart contract Solana (100M supply fix) | P3 |
| 6.4.2 | Wallet connection (Phantom/Solflare) | P3 |
| 6.4.3 | Token-gated access verificare periodică | P3 |
| 6.4.4 | Ciclu ritualic 11 luni (tracking + notificări) | P3 |
| 6.4.5 | Guvernanță on-chain (propuneri, vot, quorum) | P3 |

### 6.5 Scaling
| # | Sarcină | Prioritate |
|---|---------|-----------|
| 6.5.1 | Arhitectură 100M neuroni (distributed storage, graph indexing) | P3 |
| 6.5.2 | Vector search semantic (Supabase pgvector) | P2 |
| 6.5.3 | API REST/GraphQL pentru integrări externe | P2 |
| 6.5.4 | PWA / mobile optimization | P2 |

---

## SUMAR CANTITATIV

| Fază | Sarcini | Prioritate dominantă | Status |
|------|---------|---------------------|--------|
| Faza 0 — Securitate | ~8 | P0 | ~90% DONE |
| Faza 1 — UX Polish | ~35 | P0-P1 | ✅ 100% DONE |
| Faza 2 — Extraction Engine | ~15 | P0-P1 | ✅ 100% DONE |
| Faza 3 — Service Execution | ~12 | P0-P1 | ✅ ~95% DONE |
| Faza 4 — Economic Layer | ~12 | P1-P2 | ✅ ~75% DONE |
| Faza 5 — Advanced Features | ~25 | P1-P2 | ~5% DONE |
| Faza 6 — Governance & Token | ~15 | P2-P3 | 0% |
| **TOTAL** | **~122 sarcini** | | **~65% complet** |

---

## RECOMANDARE IMPLEMENTARE

### Sprint 1 (acum): Faza 0 + Faza 1 restante
- Securitate edge functions
- Indexuri DB
- Sidebar unificat
- Vizibilitate controlată
- SEOHead pe toate paginile

### Sprint 2: Faza 2 (L2-L5 extraction)
- Atomic extraction
- Structural extraction  
- Scoring engine
- Deduplicare

### Sprint 3: Faza 3 (execution engine)
- checkAccess
- Pre-run protocol
- Service runner
- Cost preview UI

### Sprint 4: Faza 4 + 5.1 (economic + chat)
- Credit reservation/settlement
- Free vs Premium tiers
- Chat interface conversațional
- IdeaRank widget

### Sprint 5+: Faza 5-6 (advanced)
- Webinar Generator
- Marketplace
- Token NOTA2
- Scaling

---

*Document generat pe baza analizei a ~30.000 linii de specificații tehnice.*
