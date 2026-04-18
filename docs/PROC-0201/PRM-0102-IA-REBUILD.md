# PRM-0102 OUTPUT — Rebuild IA From Screen Graph

**Site:** ai-idei.com
**Cluster:** CL-0101 / site_worldclass_alignment
**Process:** PROC-0201 / home_to_global_standard

---

## SITEMAP CANONIC

### Layer 0 — Public (pre-auth)

```
/ (home)
├── /pricing
├── /docs (Documentation)
├── /about
│   ├── /about/platform
│   └── /about/vadim
├── /blog
├── /changelog
├── /forum
└── /services (marketplace public)
```

### Layer 1 — App (post-auth, sidebar navigation)

```
/home (Cockpit / Command Center)
├── /pipeline
├── /services
│   └── /services/:id
├── /library
│   └── /library/:id
├── /jobs
│   └── /jobs/:id
├── /credits
├── /marketplace
│   └── /marketplace/:id
├── /purchases
├── /neurons
├── /knowledge-graph
├── /analytics
├── /deliverables
├── /learning
├── /progress
└── /workspace
    ├── /workspace/personal-os
    ├── /workspace/augmentation
    ├── /workspace/vip
    └── /workspace/integrations
```

### Layer 2 — Admin (operator mode only)

```
/admin
├── /admin/dashboard
├── /admin/council-chat
├── /admin/control-center
├── /admin/cost-engine
├── /admin/kernel
├── /admin/runtime
├── /admin/analytics
└── /admin/catalog
```

---

## ROUTE MAP — UI GRAPH

### Reguli impuse

- **Zero dead-ends:** orice ecran are minim 2 ieșiri utile
- **Depth max 3:** niciun ecran nu necesită mai mult de 3 clickuri de la /home
- **Pipeline persistent:** bara de status pipeline vizibilă pe toate ecranele core
- **Context propagation:** selecția din /services se propagă în /pipeline și /deliverables

### Noduri și relații

| Nod | Tip | Ieșiri utile | Depth de la /home |
|---|---|---|---|
| /home (Cockpit) | Hub central | → /pipeline, → /services, → /library, → /jobs | 0 |
| /pipeline | Workflow activ | → /services (adaugă step), → /deliverables (vezi output), → /jobs (status) | 1 |
| /services | Catalog execuție | → /services/:id (execută), → /pipeline (adaugă), → /library (salvează) | 1 |
| /services/:id | Execuție serviciu | → /pipeline (adaugă la pipeline), → /deliverables (output direct), → /credits (verifică sold) | 2 |
| /library | Knowledge base | → /library/:id (deschide), → /services (procesează), → /deliverables (exportă) | 1 |
| /library/:id | Item individual | → /services (re-procesează), → /deliverables (exportă), → /knowledge-graph (conectează) | 2 |
| /jobs | Status execuții | → /deliverables (vezi output), → /services (re-rulează), → /pipeline (adaugă) | 1 |
| /credits | Economie | → /marketplace (cumpără), → /pricing (upgrade plan) | 1 |
| /marketplace | Achiziții | → /purchases (istoric), → /credits (sold) | 1 |
| /neurons | Intelligence | → /knowledge-graph (vizualizare), → /library (surse) | 1 |
| /knowledge-graph | Vizualizare | → /library/:id (click nod), → /neurons (detalii) | 1 |
| /deliverables | Outputs | → /library (salvează), → /services (re-procesează), → export (download) | 1 |

---

## PAGINI DE ELIMINAT

| Pagină | Motiv |
|---|---|
| /workspace/personal-os | Funcționalitate neclară, suprapunere cu /home (Cockpit) |
| /workspace/augmentation | Termen abstract, conținut nedefinit public |
| /admin/council-chat | Funcționalitate internă expusă în sidebar user — confuzie |
| /forum (extern) | Redirecționare externă fără context — dead-end |

---

## PAGINI DE COMASAT

| Pagini sursă | Pagină rezultat | Motiv |
|---|---|---|
| /about/platform + /about/vadim | /about (cu tabs) | Două pagini separate pentru același context "despre" creează navigație inutilă |
| /purchases + /credits | /credits (cu tab Purchases) | Ambele sunt despre economie — același context mental |
| /learning + /progress | /learning (cu tab Progress) | Progresul este parte din experiența de learning, nu o pagină separată |
| /workspace/vip + /workspace/integrations | /settings (cu tabs: VIP / Integrations / Personal OS) | "Workspace" ca label este vag — "Settings" este standard universal |

---

## NOMENCLATURĂ FINALĂ MENIURI

### Navigație publică (landing page header)

| Label actual | Label recomandat | Motiv |
|---|---|---|
| MECHANISM | How It Works | Standard universal, comprehensibil imediat |
| OUTPUTS | What You Get | Orientat pe beneficiu, nu pe termen tehnic |
| CONTROL | Features | Standard SaaS |
| ACCESS | Pricing | Direct, fără ambiguitate |

### Navigație internă (sidebar app)

| Secțiune | Label actual | Label recomandat | Motiv |
|---|---|---|---|
| CORE | Command Center | Cockpit | Cockpit este deja titlul paginii — consistență |
| CORE | Pipeline | Pipeline | OK — păstrează |
| CORE | Services | Services | OK — păstrează |
| CORE | Library | Library | OK — păstrează |
| CORE | Jobs | Jobs | OK — păstrează |
| ECONOMY | Credits | Credits | OK — păstrează |
| ECONOMY | Marketplace | Marketplace | OK — păstrează |
| ECONOMY | Purchases | → comasează în Credits | Vezi mai sus |
| INTELLIGENCE | Neurons | Neurons | OK — dar necesită tooltip explicativ |
| INTELLIGENCE | Knowledge Graph | Knowledge Graph | OK — păstrează |
| TOOLS | Deliverables | Outputs | Mai clar pentru user nou |
| TOOLS | Learning | Learning | OK — păstrează |
| TOOLS | Progress | → comasează în Learning | Vezi mai sus |
| WORKSPACE | Personal OS | → mută în Settings | Termen abstract |
| WORKSPACE | Augmentation | → elimină sau redenumește | Neclară funcțional |
| WORKSPACE | VIP Program | → mută în Settings/VIP | |
| WORKSPACE | Integrations | → mută în Settings/Integrations | |

### Structură sidebar finală recomandată

```
CORE
  Cockpit (home)
  Pipeline
  Services
  Library
  Jobs

ECONOMY
  Credits & Purchases

INTELLIGENCE
  Neurons
  Knowledge Graph
  Analytics

TOOLS
  Outputs (ex-Deliverables)
  Learning & Progress

SETTINGS
  VIP Program
  Integrations
  Personal OS
```

---

## REGULI DE GUVERNANȚĂ IA

1. Orice pagină nouă adăugată trebuie să aibă minim 2 ieșiri utile definite înainte de implementare.
2. Depth maxim 3 de la Cockpit — orice funcționalitate mai adâncă se accesează prin modal sau panel, nu prin pagină nouă.
3. Terminologia din sidebar trebuie să corespundă cu terminologia din landing page (după redenumire).
4. Orice pagină eliminată trebuie să aibă redirect 301 configurat.
5. Pipeline bar (status execuție curentă) este persistent pe toate ecranele CORE și ECONOMY.
