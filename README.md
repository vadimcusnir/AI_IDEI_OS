<p align="center">
  <img src="public/favicon.gif" alt="AI-IDEI" width="80" />
</p>

<h1 align="center">AI-IDEI — Knowledge Extraction Operating System</h1>

<p align="center">
  <strong>Transform raw expertise into structured intelligence. Upload content once — extract knowledge neurons, generate 50+ professional deliverables, and monetize your intellectual capital.</strong>
</p>

<p align="center">
  <a href="https://ai-idei.com"><img src="https://img.shields.io/badge/Live-ai--idei.com-00C853?style=flat-square&logo=vercel&logoColor=white" alt="Live" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Edge_Functions-81-FF6F00?style=flat-square&logo=deno&logoColor=white" alt="Edge Functions" />
  <img src="https://img.shields.io/badge/Tables-135+-4A154B?style=flat-square&logo=postgresql&logoColor=white" alt="Tables" />
  <img src="https://img.shields.io/badge/Components-377-8B5CF6?style=flat-square&logo=react&logoColor=white" alt="Components" />
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
</p>

---

## 🧬 What is AI-IDEI?

AI-IDEI is a **Knowledge Extraction Operating System** built by [Vadim Cușnir](https://ai-idei.com/about-vadim-cusnir) (Cușnir Media SRL). It transforms raw expertise — podcasts, interviews, texts, videos, URLs — into structured, reusable intellectual assets through AI-powered extraction pipelines, a semantic knowledge graph, and an integrated service marketplace.

**One podcast → 50+ professional deliverables.** Articles, marketing frameworks, courses, psychological profiles, social media content — all generated automatically from extracted knowledge neurons.

### Core Pipeline

```
📥 Upload Content (video, audio, text, URL, drag & drop)
    ↓
📝 Automatic Transcription (audio/video → text)
    ↓
🧠 AI Knowledge Extraction (3-axis: Internal · Narrative · Commercial)
    ↓
⚛️ Neuron Generation (atomic knowledge units with metadata)
    ↓
🔗 Entity Projection → Knowledge Graph + IdeaRank Scoring
    ↓
⚡ AI Services Execution → 50+ Deliverables (articles, strategies, courses)
    ↓
📚 Library (infinite reuse, licensing, marketplace)
```

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              Frontend (React 19 + Vite 8 + TypeScript 5)     │
│  SPA · Tailwind 3.4 · shadcn/ui · Framer Motion · i18next   │
│  377 components · 94 pages · 77 custom hooks                 │
├──────────────────────────────────────────────────────────────┤
│              API Layer (81 Edge Functions)                    │
│  Deno · REST · Realtime · Webhooks · Stripe · AI Gateway     │
│  Rate limiting · JWT + API Key auth · CORS whitelist         │
├──────────────────────────────────────────────────────────────┤
│              Data Layer (135+ tables · RLS everywhere)        │
│  PostgreSQL · Knowledge Graph · IdeaRank · Multi-tenant      │
│  40+ SECURITY DEFINER functions · RBAC · Decision Ledger     │
├──────────────────────────────────────────────────────────────┤
│              AI Pipeline (Multi-model orchestration)          │
│  Extraction · Chunking · Entity Resolution · Ranking         │
│  Gemini 2.5 · GPT-5 · Multi-provider via Lovable AI         │
├──────────────────────────────────────────────────────────────┤
│              Economy Engine (NEURONS credits)                 │
│  Stripe integration · Root2 pricing · VIP tiers · NOTA2      │
│  Pay-per-action · Subscription plans · Marketplace           │
└──────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5, Vite 8, Tailwind CSS 3.4 |
| **UI System** | shadcn/ui, Radix Primitives, Framer Motion, Recharts, react-force-graph-2d |
| **State** | TanStack Query, Zustand stores, React Context, Supabase Realtime |
| **Backend** | Supabase (PostgreSQL 15, 81 Edge Functions, Auth, Storage) |
| **AI** | Multi-provider via Lovable AI (Gemini 2.5 Pro/Flash, GPT-5, GPT-5-mini) |
| **Payments** | Stripe (NEURONS credit system, Root2 pricing: $23/$47/$95) |
| **Security** | RLS on all 135+ tables, RBAC, SECURITY DEFINER, abuse detection |
| **i18n** | react-i18next (EN/RO/RU, extensible) |
| **Monitoring** | Sentry error tracking, custom analytics, anomaly detection |
| **Testing** | Vitest, Playwright, Testing Library |

---

## ⚡ Key Features

### 🧠 Knowledge Pipeline
- **Instant Action Surface** — Paste URL, drop file, or type text → automatic transcription + extraction in <60 seconds
- **3-Axis Extraction** — Internal/Psychological, Narrative, and Commercial analysis on every piece of content
- **Neuron Editor** — Block-based IDE for atomic knowledge units with slash commands, templates, AI tools, and version history
- **Knowledge Graph** — Interactive force-directed visualization of entity relationships with IdeaRank scoring
- **Magic Pipeline Button** — One-click: Upload → Extract → Generate pipeline

### 🤖 Agent OS & Command Center
- **Command Center** — Unified chat interface for orchestrating all AI operations
- **Slash Commands** — 50+ commands across 7 modes (Extract, Generate, Structure, Analyze, Research, Monetize, Library)
- **Plan Preview & Execution** — AI generates execution plans with cost estimation before running
- **Streaming Responses** — Real-time SSE streaming with abort capability
- **Context Drawer** — Live execution state, outputs, and template saving

### 💰 Economy & Monetization
- **NEURONS Credits** — Internal economy with Stripe integration and Root2 pricing ($23/$47/$95)
- **Pay-Per-Action Catalog** — Transparent pricing per service (e.g., Analyze Podcast – 29 neurons)
- **Tiered Subscriptions** — Starter, Pro, Enterprise plans with monthly allocations
- **Knowledge Marketplace** — Publish, license, and trade knowledge assets with platform commission
- **VIP System** — 11-month progressive unlock with NOTA2 token gating

### 📊 Intelligence & Analytics
- **Intelligence Dashboard** — Real-time KPIs, graph analytics, and anomaly detection
- **IdeaRank Engine** — 20+ scoring dimensions with emergence detection
- **Guest Pages** — Auto-generated profile pages for entities mentioned in content
- **Notebooks** — AI-assisted research notebooks with contextual chat

### 🏆 Engagement & Gamification
- **XP System** — Experience points for platform actions
- **Streaks & Challenges** — Daily challenges with bonus credit rewards
- **Achievements** — Unlockable badges across multiple categories
- **Leaderboards** — Community ranking system

### 🔒 Infrastructure & Security
- **Enterprise Security** — RLS on all tables, RBAC, abuse detection, compliance logging
- **Admin Dashboard** — User management, job monitoring, system health, approval workflows
- **Responsive Design** — Full mobile experience with adaptive bottom navigation
- **i18n** — English, Romanian, Russian with extensible translation system
- **Email System** — Transactional emails with custom domain support
- **API & Webhooks** — RESTful API with key management and webhook delivery
- **Automated Content** — Blog auto-publish pipeline, changelog generation

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
├── components/           # 377 React components
│   ├── ui/               # shadcn/ui primitives (50+)
│   ├── neuron/           # Neuron editor & block system
│   ├── intelligence/     # Knowledge graph & analytics
│   ├── command-center/   # Agent OS & chat interface
│   ├── services/         # AI service panels & catalog
│   ├── onboarding/       # Guided onboarding flow
│   ├── gamification/     # XP, streaks, achievements
│   ├── premium/          # Tier gating & paywall
│   ├── admin/            # Admin dashboard modules
│   ├── landing/          # Landing page sections
│   └── ...
├── pages/                # 94 route pages
├── hooks/                # 77 custom hooks
├── services/             # Business logic services
├── stores/               # Zustand state stores
├── contexts/             # Auth, Workspace, Theme
├── config/               # Centralized route registry & constants
├── i18n/                 # i18n configuration
├── locales/              # EN/RO/RU translation files
├── integrations/         # Supabase client & types
└── lib/                  # Utilities & helpers

supabase/
├── functions/            # 81 Edge Functions (Deno)
│   ├── extract-neurons/  # AI neuron extraction
│   ├── run-service/      # Service execution engine
│   ├── agent-orchestrator/ # Multi-step pipeline orchestrator
│   ├── neuron-chat/      # AI chat interface
│   ├── stripe-webhook/   # Payment processing
│   ├── transcribe-*/     # Audio/video transcription
│   ├── content-generate/ # Content generation
│   ├── blog-generate/    # Automated blog pipeline
│   ├── changelog-generate/ # Changelog automation
│   └── ...
├── migrations/           # Database migrations
└── config.toml           # Supabase configuration
```

---

## 📊 Platform Stats

| Metric | Count |
|--------|-------|
| React Components | 377 |
| Route Pages | 94 |
| Custom Hooks | 77 |
| Edge Functions | 81 |
| Database Tables | 135+ |
| RLS Policies | Active on all tables |
| DB Functions | 40+ (SECURITY DEFINER) |
| Translation Keys | 500+ |
| AI Models Supported | 12+ (Gemini, GPT-5, etc.) |

---

## 🗺 Roadmap

- [x] Neuron extraction pipeline (3-axis)
- [x] Block-based neuron editor with AI tools
- [x] Knowledge Graph with IdeaRank engine
- [x] NEURONS credit economy + Stripe
- [x] Guest profile pages
- [x] Agent OS with Command Center
- [x] Gamification (XP, streaks, achievements)
- [x] Marketplace for knowledge assets
- [x] i18n infrastructure (EN/RO/RU)
- [x] Mobile-optimized responsive experience
- [x] Contextual onboarding flow
- [x] Notebooks with AI chat
- [x] Admin dashboard with user management
- [x] Blog auto-publish pipeline
- [x] Changelog automation
- [x] Centralized route registry
- [x] Root2 tiered pricing ($23/$47/$95)
- [ ] Vector embeddings + semantic search
- [ ] Multilingual entity content (FR, DE)
- [ ] Public API v2 with OAuth
- [ ] Native mobile app (React Native)
- [ ] Team workspaces & collaboration

---

## 🔐 Security

- Row-Level Security (RLS) enabled on **all 135+ tables**
- RBAC with `user_roles` table and `has_role()` SECURITY DEFINER function
- Admin operations require multi-level approval workflows
- Append-only decision ledger for compliance auditing
- Abuse detection engine with severity tracking
- API key management with daily rate limits and sliding window
- CORS origin whitelisting on all edge functions
- Sentry error tracking and anomaly alerting

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built by <a href="https://ai-idei.com/about-vadim-cusnir">Vadim Cușnir</a> · Powered by <a href="https://lovable.dev">Lovable</a> + <a href="https://supabase.com">Supabase</a></sub>
</p>

<p align="center">
  <sub>
    <strong>Tags:</strong> knowledge-extraction · ai-pipeline · knowledge-graph · neuron-editor · expertise-capitalization · content-intelligence · marketing-automation · supabase · react · typescript · idearank · knowledge-os · agent-os · command-center · neurons-credits · root2-pricing
  </sub>
</p>
