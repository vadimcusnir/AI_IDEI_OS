<p align="center">
  <img src="public/favicon.gif" alt="AI-IDEI" width="80" />
</p>

<h1 align="center">AI-IDEI — Knowledge Extraction Operating System</h1>

<p align="center">
  <strong>The Magic Marketing Button — upload content once, extract knowledge, generate unlimited professional deliverables with AI.</strong>
</p>

<p align="center">
  <a href="https://ai-idei-os.lovable.app"><img src="https://img.shields.io/badge/Live-ai--idei--os.lovable.app-00C853?style=flat-square&logo=vercel&logoColor=white" alt="Live" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Edge_Functions-56-FF6F00?style=flat-square&logo=deno&logoColor=white" alt="Edge Functions" />
  <img src="https://img.shields.io/badge/Tables-135+-4A154B?style=flat-square&logo=postgresql&logoColor=white" alt="Tables" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
</p>

---

## 🧬 What is AI-IDEI?

AI-IDEI is a **Knowledge Extraction Operating System** that transforms raw expertise (podcasts, interviews, texts, videos) into structured, reusable intellectual assets. It combines AI extraction pipelines, a knowledge graph engine, and a service marketplace to create an intelligence layer over unstructured content.

**One podcast → 50+ professional deliverables.** Articles, marketing frameworks, courses, psychological profiles, social posts — all generated automatically from extracted knowledge neurons.

### Core Flow

```
📥 Upload Content (video, audio, text, URL)
    ↓
📝 Automatic Transcription
    ↓
🧠 AI Knowledge Extraction (3-axis: Internal · Narrative · Commercial)
    ↓
⚛️ Neuron Generation (atomic knowledge units)
    ↓
🔗 Entity Projection → Knowledge Graph + IdeaRank
    ↓
⚡ AI Services Execution → 50+ Deliverables
    ↓
📚 Library (infinite reuse)
```

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Frontend (React 19 + Vite 7)                │
│  SPA · Tailwind · shadcn/ui · Framer Motion · i18next    │
├──────────────────────────────────────────────────────────┤
│              API Layer (56 Edge Functions)                │
│  Deno · REST · Realtime · Webhooks · Stripe · AI Gateway │
├──────────────────────────────────────────────────────────┤
│              Data Layer (135+ tables · RLS)               │
│  PostgreSQL · Knowledge Graph · IdeaRank · Multi-tenant  │
├──────────────────────────────────────────────────────────┤
│              AI Pipeline (Multi-model)                    │
│  Extraction · Chunking · Entity Resolution · Ranking     │
│  Gemini · GPT · Multi-provider via Lovable AI gateway    │
└──────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3.4 |
| **UI** | shadcn/ui, Radix Primitives, Framer Motion, Recharts |
| **State** | TanStack Query, React Context, Realtime subscriptions |
| **Backend** | Supabase (PostgreSQL 15, 56 Edge Functions, Auth, Storage) |
| **AI** | Multi-provider via Lovable AI (Gemini, GPT-5, GPT-5-mini) |
| **Payments** | Stripe (NEURONS credit system, Root2 pricing) |
| **Security** | RLS on all 135+ tables, RBAC, SECURITY DEFINER functions |
| **i18n** | react-i18next (EN/RO, extensible) |
| **Testing** | Vitest, Playwright, Testing Library |

---

## ⚡ Key Features

### Knowledge Pipeline
- **📥 Instant Action Surface** — Paste URL, drop file, or type text → automatic transcription + extraction
- **🧠 Neuron Editor** — Block-based IDE for atomic knowledge units with slash commands, templates, AI tools, and version history
- **🔍 3-Axis Extraction** — Internal/Psychological, Narrative, Commercial analysis on every piece of content
- **🌐 Knowledge Graph** — Interactive force-directed visualization of entity relationships with IdeaRank scoring

### AI Services & Generation
- **⚡ Service Catalog** — 25+ AI services (Class A/B/C/S) generating articles, strategies, social posts, courses
- **🤖 Agent OS** — Command center with 50+ slash commands, 10 professional Command Packs, 3-level memory
- **📓 Notebooks** — AI-assisted research notebooks with contextual chat
- **🎯 IMF Pipeline** — Automated multi-step extraction → service execution chain

### Platform & Economy
- **💰 NEURONS Credits** — Internal economy (1000 credits = $10) with Stripe integration and Root2 pricing
- **🏪 Knowledge Marketplace** — Publish and trade knowledge assets with licensing
- **👥 Guest Pages** — Auto-generated profile pages for people mentioned in transcripts
- **📊 Intelligence Dashboard** — Real-time KPIs, graph analytics, and anomaly detection
- **🏆 Gamification** — XP system, streaks, achievements, daily challenges, leaderboards
- **👤 VIP System** — 11-month progressive unlock with NOTA2 token gating

### Infrastructure
- **🔒 Enterprise Security** — RLS on all tables, RBAC, abuse detection, compliance logging
- **📱 Responsive** — Full mobile experience with adaptive bottom navigation
- **🌍 i18n** — English + Romanian with extensible translation system
- **📧 Email System** — Transactional emails, digests, push notifications
- **🔗 API & Webhooks** — RESTful API with key management, webhook delivery system
- **📈 Analytics** — Event tracking, session analytics, anomaly alerts

---

## 🧬 Knowledge Graph & IdeaRank

The platform builds a **language-independent semantic graph** where entities are unique nodes with localized labels.

```
Entity (language-independent)
    ├── entity_labels (name per language)
    ├── entity_content (full content per language)
    ├── entity_relations (weighted edges: supports, contradicts, extends, etc.)
    ├── entity_topics (topic clustering)
    └── idea_metrics (IdeaRank: 20+ scoring dimensions)
```

**IdeaRank Formula:**
```
PVS = 0.30·Activation + 0.20·Growth + 0.20·Centrality + 0.15·Authority + 0.15·Economic
```

Includes emergence detection (novelty × acceleration × connectivity) to surface rising ideas before they become obvious.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase project (or Lovable Cloud)

### Installation

```bash
git clone https://github.com/vadimcusnir/AI_IDEI_OS.git
cd AI_IDEI_OS
npm install
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

---

## 📁 Project Structure

```
src/
├── components/           # 200+ React components
│   ├── ui/               # shadcn/ui primitives (50+)
│   ├── neuron/           # Neuron editor & blocks
│   ├── intelligence/     # Knowledge graph & analytics
│   ├── services/         # AI service panels
│   ├── onboarding/       # Guided onboarding flow
│   ├── gamification/     # XP, streaks, achievements
│   ├── premium/          # Tier gating & paywall
│   └── ...
├── pages/                # 85+ route pages
├── hooks/                # 30+ custom hooks
├── contexts/             # Auth, Workspace, Theme
├── i18n/                 # i18n configuration
├── locales/              # EN/RO translation files
├── integrations/         # Supabase client & types
└── lib/                  # Utilities & helpers

supabase/
├── functions/            # 56 Edge Functions (Deno)
│   ├── extract-neurons/  # AI neuron extraction
│   ├── run-service/      # Service execution engine
│   ├── neuron-chat/      # AI chat interface
│   ├── stripe-webhook/   # Payment processing
│   ├── transcribe-*/     # Audio/video transcription
│   ├── generate-*/       # Content generation
│   ├── extraction-pipeline/ # Full pipeline orchestrator
│   └── ...
├── migrations/           # Database migrations
└── config.toml           # Supabase configuration

docs/
├── NAVIGATION_AUDIT.md   # Navigation architecture audit
└── ...
```

---

## 📊 Platform Stats

| Metric | Count |
|--------|-------|
| React Components | 200+ |
| Route Pages | 85+ |
| Edge Functions | 56 |
| Database Tables | 135+ |
| RLS Policies | Active on all tables |
| DB Functions | 40+ (SECURITY DEFINER) |
| Custom Hooks | 30+ |
| Translation Keys | 500+ |

---

## 🗺 Roadmap

- [x] Neuron extraction pipeline (3-axis)
- [x] Block-based neuron editor with AI tools
- [x] Knowledge Graph with IdeaRank engine
- [x] NEURONS credit economy + Stripe
- [x] Guest profile pages
- [x] Agent OS with Command Packs
- [x] Gamification (XP, streaks, achievements)
- [x] Marketplace for knowledge assets
- [x] i18n infrastructure (EN/RO)
- [x] Mobile-optimized experience
- [x] Contextual onboarding flow
- [x] Notebooks with AI chat
- [ ] Vector embeddings + semantic search
- [ ] Multilingual entity content (RU, FR, DE)
- [ ] Public API v2 with OAuth
- [ ] Native mobile app (React Native)
- [ ] Team workspaces & collaboration

---

## 🔐 Security

- Row-Level Security (RLS) enabled on **all 135+ tables**
- RBAC with `user_roles` table and `has_role()` SECURITY DEFINER function
- Admin operations require multi-level approval
- Append-only decision ledger for compliance
- Abuse detection engine with severity tracking
- API key management with daily rate limits

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with <a href="https://lovable.dev">Lovable</a> · Powered by <a href="https://supabase.com">Supabase</a> · AI by <a href="https://lovable.dev">Lovable AI</a></sub>
</p>

<p align="center">
  <sub>
    <strong>Tags:</strong> knowledge-extraction · ai-pipeline · knowledge-graph · neuron-editor · expertise-capitalization · content-intelligence · marketing-automation · supabase · react · typescript · idearank · knowledge-os
  </sub>
</p>
