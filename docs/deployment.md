# Deployment

## Overview

AI-IDEI is deployed via Lovable Cloud with automatic frontend and backend deployment.

## Frontend

- Built with Vite (React + TypeScript)
- Deployed automatically on push to main
- Published at: https://ai-idei-os.lovable.app

## Backend (Edge Functions)

Edge Functions deploy automatically when code changes are pushed. No manual deployment required.

### Functions

| Function | Purpose |
|----------|---------|
| extract-neurons | AI neuron extraction from transcripts |
| generate-entities | Project neurons → knowledge graph entities |
| neuron-chat | AI chat interface for neuron context |
| run-service | Execute AI service workflows |
| chunk-transcript | Semantic transcript segmentation |
| create-topup-checkout | Stripe checkout for NEURONS credits |
| verify-topup | Idempotent payment verification |
| sitemap | Dynamic sitemap generation |

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | Supabase anon key |
| STRIPE_SECRET_KEY | Stripe secret (Edge Functions only) |
| LOVABLE_API_KEY | AI gateway access |

## Database Migrations

Managed through Lovable Cloud. Schema changes are applied via migration tool with automatic approval flow.
