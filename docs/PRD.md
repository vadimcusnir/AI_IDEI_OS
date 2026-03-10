# Product Requirements Document — AI-IDEI v1.0

## 1. Product Overview

**AI-IDEI** is a Knowledge Operating System that transforms raw expertise (podcasts, interviews, texts) into structured, reusable knowledge assets using AI extraction pipelines and knowledge graph architecture.

**Core Value Proposition:** Upload content once → extract dozens of atomic knowledge units → generate unlimited AI-powered deliverables.

**Target Users:**
- Content creators seeking to monetize expertise
- Researchers extracting structured intelligence from interviews
- Entrepreneurs building knowledge-driven products
- Educators creating course material from existing content

## 2. Core Features

### 2.1 Content Ingestion (Extractor)
- Upload text, audio (.mp3/.wav/.m4a), video (.mp4/.webm/.mov), or URL
- YouTube title auto-detection via oEmbed API
- Transcript import from .txt, .srt, .vtt files
- Audio/video transcription via ElevenLabs API
- Transcript editing, export (TXT/SRT), and copy
- Episode management with status tracking (uploaded → transcribing → transcribed → chunked → analyzed)

### 2.2 Neuron Editor
- Block-based editor with 15+ block types (text, heading, code, checklist, prompt, formula, etc.)
- Slash command menu for block insertion
- AI tools panel (Extract Insights, Frameworks, Questions, Quotes, Prompts)
- Template system (save as template, pick from template library)
- Version history with diff tracking
- Neuron addressing system (domain.level1.level2.level3)
- Folder organization with AI-suggested categorization
- Clone/fork neurons between users
- Neuron lifecycle: ingested → structured → active → capitalized → compounded

### 2.3 Knowledge Graph
- Interactive force-directed graph visualization (react-force-graph-2d)
- Entity types: Insight, Pattern, Formula, Application, Contradiction, Profile
- Relation types: supports, contradicts, extends, references, derived_from, applies_to, mentions, inspires
- Language-independent entities with localized labels (entity_labels) and content (entity_content)
- Topic clustering with hierarchical topics
- IdeaRank scoring with 20+ dimensions

### 2.4 IdeaRank Engine
- PageRank-derived algorithm computed via `compute_idearank()` DB function
- 5-component Propagation Value Score: Activation (30%) + Growth (20%) + Centrality (20%) + Authority (15%) + Economic (15%)
- Emergence Detection Engine: novelty × acceleration × connectivity growth
- 30 iteration convergence with weighted relations
- Metrics: pagerank, betweenness, multi-hop influence, novelty, decay risk, structural rarity

### 2.5 AI Services
- Service catalog with Class A (Analysis), B (Production), C (Orchestration)
- 11+ services: insight-extractor, framework-detector, question-engine, quote-extractor, prompt-generator, market-research, course-generator, content-classifier, strategy-builder, argument-mapper, profile-extractor
- Deterministic credit cost per service
- Job tracking with real-time status (pending → running → completed/failed)
- Artifact generation with markdown output

### 2.6 Credit Economy (NEURONS)
- Internal compute credits: 1 NEURON = $0.01
- Welcome bonus: 500 NEURONS for new users
- Stripe-integrated top-up: 500 ($11), 1000 ($20), 5000 ($92) — Root2 pricing
- Real-time balance via Supabase realtime subscriptions
- Transaction history with filtering (spend, topup, bonus, reserve, release)
- Consumption analytics per service
- Low-balance notifications (< 50 NEURONS)

### 2.7 Guest Pages
- Auto-detect people mentioned in transcripts via AI
- Generate profile pages with: bio, expertise areas, frameworks, psychological traits, key quotes
- Public/private visibility toggle
- SEO-optimized with slug-based URLs (/guest/:slug)

### 2.8 Public Knowledge Infrastructure
- Entity listing pages: /insights, /patterns, /formulas, /contradictions, /applications, /profiles
- Entity detail pages with IdeaRank scores, related entities, evidence, topics
- Topic listing (/topics) and detail pages (/topics/:slug)
- JSON-LD structured data for SEO
- Dynamic sitemap generation via edge function

### 2.9 Intelligence Dashboard
- Knowledge Graph visualization tab
- Analytics tab: neuron categories, lifecycles, recent activity, credit stats
- Pipeline status indicator (Episodes → Neurons → Jobs → Artifacts)

### 2.10 Platform Infrastructure
- i18n ready (EN canonical, extensible via react-i18next)
- Dark/light theme via next-themes
- Global search across neurons
- Push notifications (web push via VAPID keys)
- Notification preferences (per-channel: email/push, per-type: jobs/credits/feedback/versions)
- Feedback system with admin response workflow
- Changelog system with publish/draft states
- Onboarding checklist for new users
- Export/Import panel for neurons

## 3. User Flows

### 3.1 New User Flow
1. Landing page → "Start Free" → Auth (email/password or Google OAuth)
2. Email verification required (no auto-confirm)
3. Redirect to /home (Cockpit)
4. 500 NEURONS welcome bonus auto-credited
5. Onboarding checklist guides first actions

### 3.2 Content Processing Flow
1. Open Extractor → Upload content (text/audio/video/URL)
2. Auto-transcription for audio/video
3. Semantic chunking (200-800 token segments)
4. 3-axis AI extraction (Internal/Psychological, Narrative, Commercial)
5. Neurons created with content categories and blocks
6. Entity projection → Knowledge Graph
7. IdeaRank computation

### 3.3 Service Execution Flow
1. Browse service catalog → Select service
2. Choose input neurons
3. System checks credit balance (credit firewall)
4. Job created → Edge function executes
5. AI generates deliverables
6. Artifact saved → Credits deducted
7. Notification sent

## 4. Architecture

### 4.1 Frontend
- React 18 SPA with Vite bundler
- Tailwind CSS with semantic design tokens (HSL)
- shadcn/ui + Radix Primitives for UI components
- Framer Motion for animations
- TanStack Query for server state
- React Context for auth state
- react-i18next for internationalization
- react-force-graph-2d for knowledge graph visualization

### 4.2 Backend
- Supabase (PostgreSQL) for data storage
- Row-Level Security on all tables
- Edge Functions (Deno runtime) for backend logic
- Supabase Auth (email/password + Google OAuth)
- Supabase Storage for episode files
- Realtime subscriptions for live balance updates

### 4.3 External Integrations
- Stripe for payment processing
- ElevenLabs for audio transcription
- Lovable AI gateway for multi-model AI (no user API key required)

## 5. Technical Dependencies

| Dependency | Purpose |
|-----------|---------|
| @supabase/supabase-js | Database, auth, storage, realtime |
| @tanstack/react-query | Server state management |
| react-router-dom | Client-side routing |
| framer-motion | Animations |
| react-force-graph-2d | Knowledge graph visualization |
| recharts | Analytics charts |
| sonner | Toast notifications |
| react-i18next | Internationalization |
| zod | Schema validation |
| react-hook-form | Form management |
| next-themes | Theme switching |
| react-markdown | Markdown rendering |
| react-resizable-panels | Panel layouts |
| lucide-react | Icon library |

## 6. Roadmap

### Completed (v1.0)
- [x] Content ingestion pipeline (text, audio, video, URL)
- [x] Block-based neuron editor with slash commands
- [x] AI extraction services (11+ services)
- [x] Knowledge Graph with IdeaRank engine
- [x] NEURONS credit economy + Stripe
- [x] Guest profile pages
- [x] Public entity pages with SEO
- [x] i18n infrastructure
- [x] Push notification system
- [x] Admin dashboard
- [x] Changelog system

### Phase 2: IdeaRank UI Layer
- [ ] Trending ideas widget on home
- [ ] Entity listings sorted by IdeaRank/freshness
- [ ] Topic discovery pages

### Phase 3: Knowledge Assets & Marketplace
- [ ] Knowledge asset schema (knowledge_assets, asset_transactions, asset_licenses)
- [ ] Dual pricing engine (USD + NEURONS)
- [ ] Asset catalog and creator profiles
- [ ] Revenue distribution (70/30 creator/platform)

### Phase 4: Market Intelligence
- [ ] Demand scoring and recommendations
- [ ] Market analytics dashboard
- [ ] Semantic search with vector embeddings

### Phase 5: Global Scale
- [ ] Multilingual entity content (RO, RU)
- [ ] Subscription tiers
- [ ] API access for external integrations
- [ ] Mobile-optimized experience
