# Technical Specification — AI-IDEI v1.0

## 1. Backend Architecture

### 1.1 Database (PostgreSQL via Supabase)

**Core Tables (28 tables):**

| Table | Purpose | RLS |
|-------|---------|-----|
| `neurons` | Atomic knowledge units | Owner + public visibility |
| `neuron_blocks` | Block content for neurons | Follows neuron visibility |
| `neuron_versions` | Version history snapshots | Follows neuron visibility |
| `neuron_links` | Inter-neuron relations | Follows neuron visibility |
| `neuron_clones` | Fork/clone tracking | Owner only |
| `neuron_addresses` | Hierarchical addressing | Follows neuron visibility |
| `neuron_address_aliases` | Address shortlinks | Public read |
| `neuron_templates` | Reusable templates | Owner + public templates |
| `neuron_number_ranges` | Distributed ID allocation | Service role only |
| `neuron_jobs` | AI execution jobs | Owner + visibility |
| `episodes` | Raw content records | Owner only |
| `entities` | Knowledge graph nodes | Admin + published read |
| `entity_labels` | Localized entity names | Admin + published read |
| `entity_content` | Localized entity content | Admin + published read |
| `entity_relations` | Graph edges with weights | Admin + published read |
| `entity_topics` | Entity-topic associations | Admin + published read |
| `topics` | Topic taxonomy | Public read |
| `topic_labels` | Localized topic names | Public read |
| `idea_metrics` | IdeaRank scores (22 dimensions) | Admin + published read |
| `idea_rank_experiments` | A/B testing for ranking | Admin only |
| `idea_rank_predictions` | Ranking predictions | Admin only |
| `artifacts` | Generated deliverables | Owner only |
| `artifact_neurons` | Artifact-neuron links | Owner only |
| `service_catalog` | AI service definitions | Admin manage, auth read |
| `user_credits` | Credit balances | Owner only |
| `credit_transactions` | Transaction ledger | Owner + admin |
| `profiles` | User profiles | Public read, owner write |
| `user_roles` | Role assignments (admin/moderator/user) | Via `has_role()` |
| `guest_profiles` | Detected guest pages | Owner + public if published |
| `notifications` | User notifications | Owner only |
| `notification_preferences` | Channel preferences | Owner only |
| `push_subscriptions` | Web push endpoints | Owner only |
| `push_config` | VAPID configuration | No RLS (internal) |
| `feedback` | User feedback/testimonials | Owner + admin |
| `changelog_entries` | Release notes | Admin + published read |
| `changes_raw` | Raw change tracking | Admin only |
| `block_type_registry` | Block type definitions | Admin + public read |

### 1.2 Database Functions

| Function | Type | Purpose |
|----------|------|---------|
| `compute_idearank()` | SECURITY DEFINER | Full IdeaRank computation (5 phases) |
| `has_role(_user_id, _role)` | SECURITY DEFINER | Role check without RLS recursion |
| `handle_new_user()` | Trigger | Auto-create profile + notification prefs |
| `handle_new_user_credits()` | Trigger | 500 NEURONS welcome bonus |
| `update_updated_at_column()` | Trigger | Auto-update timestamps |
| `notify_artifact_created()` | Trigger | Notification on artifact creation |
| `notify_version_created()` | Trigger | Notification on version save |
| `notify_job_status()` | Trigger | Notification on job completion/failure |
| `notify_credits_low()` | Trigger | Alert when balance < 50 |
| `notify_feedback_submitted()` | Trigger | Notify all admins on new feedback |
| `notify_feedback_responded()` | Trigger | Notify user on admin response |
| `notify_changelog_published()` | Trigger | Notify all users on new release |
| `trigger_send_push()` | Trigger | Trigger push notification via edge function |

### 1.3 Database Views

| View | Purpose |
|------|---------|
| `neuron_stats` | Aggregated stats per author |

### 1.4 Enums

| Enum | Values |
|------|--------|
| `app_role` | admin, moderator, user |
| `content_category` | transcript, insight, framework, strategy, formula, pattern, avatar, argument_map, narrative, psychological, commercial |
| `neuron_lifecycle` | ingested, structured, active, capitalized, compounded |
| `service_class` | A, B, C |

## 2. Edge Functions

| Function | JWT | Purpose |
|----------|-----|---------|
| `extract-neurons` | No* | 3-axis AI extraction from transcripts |
| `extract-insights` | No | AI analysis tools for neuron editor |
| `extract-guests` | No* | Detect and profile people in transcripts |
| `generate-entities` | No* | Project neurons → knowledge graph entities |
| `neuron-chat` | Yes | AI chat within neuron context |
| `neuron-api` | Yes | External API access to neurons |
| `run-service` | Yes | Execute AI service workflows |
| `chunk-transcript` | No* | Semantic transcript segmentation |
| `transcribe-audio` | Yes | Audio → text via ElevenLabs |
| `create-topup-checkout` | No* | Stripe checkout session creation |
| `verify-topup` | No* | Idempotent payment verification |
| `changelog-ingest` | No | Ingest raw changes |
| `changelog-generate` | No | AI-generate changelog entries |
| `init-push` | No* | Initialize VAPID keys |
| `send-push` | No* | Deliver push notifications |
| `sitemap` | No* | Dynamic XML sitemap |

*Note: Functions marked "No" for JWT still perform auth via `supabase.auth.getUser()` internally where needed. The `verify_jwt = false` in config.toml allows public access for webhook/internal calls.*

**Security concern:** Several functions that should validate JWT (`extract-neurons`, `chunk-transcript`, `generate-entities`) have `verify_jwt = false`. They pass `user_id` in the request body instead of extracting from JWT. See Security Audit.

## 3. Frontend Architecture

### 3.1 Route Structure

See `ROUTE_TREE.md` for complete route map.

### 3.2 Component Hierarchy

```
App
├── QueryClientProvider
│   └── ThemeProvider
│       └── AuthProvider
│           └── TooltipProvider
│               └── BrowserRouter
│                   └── Routes
│                       ├── Landing (public, standalone)
│                       ├── Auth (public, standalone)
│                       ├── ResetPassword (public, standalone)
│                       ├── PublicProfile (public, standalone)
│                       ├── GuestProfile (public, standalone)
│                       ├── AppLayout (shared layout)
│                       │   ├── SidebarProvider
│                       │   │   ├── AppSidebar
│                       │   │   └── Main content area
│                       │   │       ├── Header (scroll-aware)
│                       │   │       ├── GlobalSearch
│                       │   │       ├── Page content
│                       │   │       └── Footer
│                       │   ├── FeedbackFAB
│                       │   └── ContextualFeedbackPrompt
│                       ├── ProtectedRoute wrapper
│                       └── AdminRoute wrapper
```

### 3.3 State Management

| State Type | Solution |
|-----------|---------|
| Auth state | React Context (AuthContext) |
| Server data | TanStack Query |
| Local UI state | useState/useReducer |
| Credit balance | Custom hook with realtime subscription |
| Admin check | Custom hook with `has_role()` RPC |
| Theme | next-themes |
| i18n | react-i18next with browser language detection |

### 3.4 Design System

- HSL-based semantic tokens in `index.css`
- Light and dark themes
- Font stack: Instrument Serif (headings), Inter (body), JetBrains Mono (code)
- Custom tokens: panel, toolbar, status, graph, AI, note, sidebar
- All colors via Tailwind design tokens — no hardcoded colors in components

## 4. AI Pipeline Specification

### 4.1 Extraction Pipeline

```
1. Upload → Episode (status: uploaded)
2. Transcription (ElevenLabs) → Episode (status: transcribed)
3. Semantic Chunking (200-800 tokens) → Chunk array
4. Per-chunk AI extraction (3 axes × 3 prompts = 9 categories):
   - Internal: insight, psychological, avatar
   - Narrative: narrative, argument_map, framework
   - Commercial: strategy, formula, commercial, pattern
5. Neuron creation with blocks + category + lifecycle
6. Entity projection → Knowledge Graph entities
7. IdeaRank computation (30 iterations)
```

### 4.2 Service Execution Pipeline

```
1. User selects service + input neurons
2. Credit reservation (balance check)
3. Job created (status: pending)
4. Edge function invoked
5. AI generation via Lovable AI gateway
6. Artifact saved to DB
7. Credits deducted from balance
8. Notifications sent
9. Job status → completed/failed
```

### 4.3 IdeaRank Pipeline

```
Phase 0: Snapshot previous state
Phase 1: PageRank (30 iterations, weighted relations)
Phase 2: Per-node metrics (activation, betweenness, authority, economic)
Phase 3: PVS formula (5-component weighted score)
Phase 4: Emergence detection (6-component score, p95 threshold)
Phase 5: Write back to entities.importance_score
```

## 5. API Specification

### 5.1 Edge Function Endpoints

All endpoints at: `{SUPABASE_URL}/functions/v1/{function_name}`

| Endpoint | Method | Auth | Input | Output |
|----------|--------|------|-------|--------|
| `/extract-neurons` | POST | Bearer token | `{episode_id, user_id}` | `{neurons_created, chunks_processed, credits_spent}` |
| `/chunk-transcript` | POST | Bearer token | `{episode_id, user_id}` | `{chunks[], total_chunks, total_tokens}` |
| `/extract-guests` | POST | Bearer token | `{episode_id, user_id}` | `{guests_created}` |
| `/generate-entities` | POST | Bearer token | `{neuron_id, user_id}` | `{entities_created}` |
| `/run-service` | POST | Bearer token | `{service_key, neuron_ids[], user_id, input}` | `{artifact_id, credits_spent}` |
| `/extract-insights` | POST | Bearer token | `{action, blocks[], neuron_title}` | SSE stream |
| `/neuron-chat` | POST | Bearer token | `{neuron_id, message, history[]}` | SSE stream |
| `/create-topup-checkout` | POST | Bearer token | `{package_key}` | `{url}` |
| `/verify-topup` | POST | Bearer token | `{session_id}` | `{verified, neurons}` |
| `/transcribe-audio` | POST | Bearer token | `{episode_id, file_path}` | `{word_count}` |
| `/sitemap` | GET | None | — | XML sitemap |

### 5.2 Supabase Client Queries

Primary data access patterns:
- Neurons: filtered by `author_id`, ordered by `updated_at`
- Episodes: filtered by `author_id`, ordered by `created_at`
- Entities: filtered by `is_published`, ordered by `importance_score`
- Credits: filtered by `user_id`, realtime subscription
- Services: filtered by `is_active`, ordered by `credits_cost`
- Jobs: filtered by `author_id`, ordered by `created_at`

## 6. Infrastructure

### 6.1 Hosting
- Frontend: Lovable Cloud (auto-deploy on push)
- Backend: Supabase Edge Functions (auto-deploy)
- Database: Supabase PostgreSQL
- Storage: Supabase Storage (episode-files bucket, private)
- CDN: Lovable CDN for static assets

### 6.2 Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `STRIPE_SECRET_KEY` — Stripe secret (edge functions only)
- `LOVABLE_API_KEY` — AI gateway access (edge functions only)
- `ELEVENLABS_API_KEY` — Transcription API (edge functions only)
- `SUPABASE_SERVICE_ROLE_KEY` — Admin operations (edge functions only)

### 6.3 Monitoring
- Supabase dashboard for database metrics
- Edge function logs
- Client-side error toasts via sonner
- Push notification delivery tracking
