# Architecture

## System Overview

AI-IDEI follows a layered architecture with clear separation between frontend, API, data, and AI layers.

```
┌──────────────────────────────────────────────┐
│            Frontend (React SPA)              │
│  Vite · TypeScript · Tailwind · shadcn/ui    │
├──────────────────────────────────────────────┤
│            API Layer                         │
│  Supabase Edge Functions (Deno runtime)      │
│  REST API · Realtime subscriptions           │
├──────────────────────────────────────────────┤
│            Data Layer                        │
│  PostgreSQL · Row-Level Security             │
│  Knowledge Graph · IdeaRank engine           │
├──────────────────────────────────────────────┤
│            AI Pipeline                       │
│  Multi-model extraction · Semantic chunking  │
│  3-axis analysis · Entity normalization      │
└──────────────────────────────────────────────┘
```

## Core Entities

| Entity | Description |
|--------|-------------|
| Episode | Raw content (transcript, audio, video) |
| Neuron | Atomic knowledge unit (framework, pattern, formula) |
| Entity | Semantic graph node projected from neurons |
| Service | AI workflow combining neurons → deliverables |
| Artifact | Generated output from service execution |

## Security Model

All tables use PostgreSQL Row-Level Security (RLS). User roles (`admin`, `moderator`, `user`) are stored in a dedicated `user_roles` table with a `SECURITY DEFINER` helper function `has_role()` to prevent recursive RLS checks.

## Economic Model

- **NEURONS** — compute credits for AI service execution
- **NOTA2** — access token (future)
- Pricing follows **Root2** model (digit sum = 2)

## Edge Functions

All backend logic runs as Supabase Edge Functions (Deno). Functions handle:
- Transcript chunking and AI extraction
- Service execution and artifact generation
- Stripe payment processing
- Push notification delivery
- Entity projection and IdeaRank computation
