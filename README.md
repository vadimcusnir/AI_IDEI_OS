<p align="center">
  <img src="public/favicon.gif" alt="AI-IDEI" width="80" />
</p>

<h1 align="center">AI-IDEI — Knowledge Extraction Operating System</h1>

<p align="center">
  <strong>Transform expertise into structured, reusable knowledge assets using AI pipelines and knowledge graph architecture.</strong>
</p>

<p align="center">
  <a href="https://github.com/vadimcusnir/AI_IDEI_OS/actions"><img src="https://github.com/vadimcusnir/AI_IDEI_OS/workflows/CI/badge.svg" alt="CI Status" /></a>
  <a href="https://github.com/vadimcusnir/AI_IDEI_OS/actions"><img src="https://github.com/vadimcusnir/AI_IDEI_OS/workflows/Security/badge.svg" alt="Security" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## Overview

AI-IDEI is a **Knowledge Operating System** that extracts structured ideas, insights, frameworks, and entities from transcripts and transforms them into reusable knowledge assets. It combines AI extraction pipelines with a knowledge graph to create an intelligence layer over unstructured content.

**Core value proposition:** Upload content once → extract dozens of atomic knowledge units → generate unlimited AI-powered deliverables.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)            │
│  SPA · Tailwind · shadcn/ui · react-i18next         │
├─────────────────────────────────────────────────────┤
│                   API Layer                          │
│  Supabase Edge Functions (Deno) · REST · Realtime   │
├─────────────────────────────────────────────────────┤
│                   Data Layer                         │
│  PostgreSQL · RLS · Knowledge Graph · IdeaRank      │
├─────────────────────────────────────────────────────┤
│                   AI Pipeline                        │
│  Multi-model extraction · Semantic chunking          │
│  Entity normalization · Graph ranking                │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui, Radix Primitives, Framer Motion |
| State | TanStack Query, React Context |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| AI Models | Multi-provider via Lovable AI gateway |
| Payments | Stripe (NEURONS credit system) |
| i18n | react-i18next (EN canonical, extensible) |

## Knowledge Graph Model

The platform builds a **language-independent semantic graph** where entities are unique nodes and localized labels provide multilingual access.

```
Entity (language-independent)
    ├── entity_labels (name per language)
    ├── entity_content (full content per language)
    ├── entity_relations (weighted edges)
    ├── entity_topics (topic clustering)
    └── idea_metrics (IdeaRank scoring)
```

**Entity types:** Insight · Pattern · Formula · Application · Contradiction · Profile

**Relation types:** supports · contradicts · extends · references · derived_from · applies_to

### IdeaRank Engine

A PageRank-derived algorithm that scores entities based on graph centrality, evidence strength, and economic signals:

```
PVS = 0.30·Activation + 0.20·Growth + 0.20·Centrality + 0.15·Authority + 0.15·Economic
```

Includes emergence detection (novelty × acceleration × connectivity growth) to surface rising ideas.

## Idea Extraction Pipeline

```
Content Upload → Transcription → Semantic Chunking → AI Analysis
    ↓                                                      ↓
Episode Record                                    3-Axis Extraction
    ↓                                          (Internal · Narrative · Commercial)
    ↓                                                      ↓
    └──────────────── Neuron Generation ←──────────────────┘
                            ↓
                   Entity Projection → Knowledge Graph
                            ↓
                   IdeaRank Computation → Discovery
```

**Extraction axes:**
- **Internal/Psychological** — cognitive patterns, decision frameworks, mental models
- **Narrative** — storytelling structures, persuasion techniques, argument maps
- **Commercial/JTBD** — market insights, value propositions, growth strategies

## Key Features

- **🧠 Neuron Editor** — Block-based editor for atomic knowledge units with slash commands, templates, and AI tools
- **📊 Knowledge Graph** — Interactive visualization of entity relationships with force-directed layout
- **🔍 IdeaRank** — Graph-based ranking algorithm with 20+ scoring dimensions and emergence detection
- **⚡ AI Services** — Class A/B/C service catalog generating 50+ deliverables per execution
- **💰 NEURONS Credits** — Internal economy with Stripe integration and Root2 pricing
- **👥 Guest Pages** — Auto-generated profile pages for people mentioned in transcripts
- **📈 Intelligence Dashboard** — Real-time metrics, KPIs, and knowledge graph statistics
- **🌐 i18n Ready** — English canonical with extensible multilingual support
- **🔒 RLS Security** — Row-level security on all tables with role-based access control

## Installation

### Prerequisites

- Node.js 18+ or Bun
- Supabase project (or Lovable Cloud)

### Setup

```bash
# Clone the repository
git clone https://github.com/vadimcusnir/AI_IDEI_OS.git
cd AI_IDEI_OS

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

## Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Lint
npm run lint
```

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/              # shadcn/ui primitives
│   ├── neuron/          # Neuron editor components
│   ├── intelligence/    # Knowledge graph & stats
│   └── links/           # Public profile blocks
├── pages/               # Route pages
├── hooks/               # Custom React hooks
├── contexts/            # React contexts (Auth)
├── i18n/                # Internationalization config
├── locales/             # Translation files (EN canonical)
├── integrations/        # Supabase client & types
└── lib/                 # Utilities

supabase/
├── functions/           # Edge Functions (Deno)
│   ├── extract-neurons/ # AI neuron extraction
│   ├── generate-entities/ # Entity projection
│   ├── neuron-chat/     # AI chat interface
│   ├── run-service/     # Service execution
│   └── ...
└── config.toml          # Supabase configuration

docs/
├── architecture.md      # System architecture
├── knowledge-graph.md   # Graph model documentation
├── extraction-pipeline.md # AI pipeline details
└── deployment.md        # Deployment guide
```

## Roadmap

- [x] Neuron extraction pipeline
- [x] Block-based neuron editor
- [x] Knowledge Graph with IdeaRank
- [x] NEURONS credit economy + Stripe
- [x] Guest profile pages
- [x] i18n infrastructure (EN canonical)
- [ ] Multilingual entity content (RO, RU)
- [ ] Knowledge Asset marketplace
- [ ] Semantic search with vector embeddings
- [ ] API access for external integrations
- [ ] Mobile-optimized experience

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with <a href="https://lovable.dev">Lovable</a> · Powered by <a href="https://supabase.com">Supabase</a>
</p>
