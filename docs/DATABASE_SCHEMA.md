# Database Schema — AI-IDEI v1.0

## Entity-Relationship Diagram

```
auth.users (managed by Supabase)
    │
    ├──→ profiles (1:1, user_id)
    ├──→ user_roles (1:N, user_id)
    ├──→ user_credits (1:1, user_id)
    ├──→ notification_preferences (1:1, user_id)
    ├──→ push_subscriptions (1:N, user_id)
    ├──→ notifications (1:N, user_id)
    ├──→ feedback (1:N, user_id)
    ├──→ credit_transactions (1:N, user_id)
    │
    ├──→ episodes (1:N, author_id)
    │       │
    │       └──→ neurons (1:N, episode_id)
    │               │
    │               ├──→ neuron_blocks (1:N, neuron_id)
    │               ├──→ neuron_versions (1:N, neuron_id)
    │               ├──→ neuron_links (N:N, source/target)
    │               ├──→ neuron_addresses (1:N, neuron_id)
    │               ├──→ neuron_clones (N:N, source/cloned)
    │               ├──→ neuron_jobs (1:N, neuron_id)
    │               │       │
    │               │       └──→ credit_transactions (1:N, job_id)
    │               │       └──→ artifacts (1:N, job_id)
    │               │               │
    │               │               └──→ artifact_neurons (N:N)
    │               │
    │               └──→ entities (1:N, neuron_id)
    │                       │
    │                       ├──→ entity_labels (1:N, entity_id)
    │                       ├──→ entity_content (1:N, entity_id)
    │                       ├──→ entity_relations (N:N, source/target)
    │                       ├──→ entity_topics (N:N)
    │                       │       │
    │                       │       └──→ topics (hierarchy via parent_topic_id)
    │                       │               └──→ topic_labels (1:N, topic_id)
    │                       │
    │                       └──→ idea_metrics (1:1, node_id)
    │
    └──→ guest_profiles (1:N, author_id)

Standalone tables:
    ├── service_catalog (AI service definitions)
    ├── block_type_registry (block type definitions)
    ├── changelog_entries (release notes)
    ├── changes_raw (raw change tracking)
    ├── push_config (VAPID configuration)
    ├── neuron_number_ranges (distributed ID allocation)
    ├── neuron_address_aliases (address shortcuts)
    ├── neuron_templates (reusable templates)
    ├── idea_rank_experiments (ranking A/B tests)
    └── idea_rank_predictions (ranking predictions)
```

## Key Relationships

| Relationship | Type | FK |
|-------------|------|-----|
| neurons → episodes | N:1 | neurons.episode_id |
| neurons → entities | 1:N | entities.neuron_id |
| entity_relations | N:N | source_entity_id, target_entity_id |
| entity_topics | N:N | entity_id, topic_id |
| neuron_links | N:N | source_neuron_id, target_neuron_id |
| neuron_jobs → neurons | N:1 | neuron_jobs.neuron_id |
| artifacts → neuron_jobs | N:1 | artifacts.job_id |
| artifact_neurons | N:N | artifact_id, neuron_id |
| topics → topics | Self-referential | parent_topic_id |

## Indexes

No custom indexes detected beyond primary keys and unique constraints. The following indexes would improve performance:

| Recommended Index | Table | Columns | Reason |
|------------------|-------|---------|--------|
| idx_neurons_author_updated | neurons | (author_id, updated_at DESC) | Neuron listing queries |
| idx_episodes_author_created | episodes | (author_id, created_at DESC) | Episode listing |
| idx_entities_type_published | entities | (entity_type, is_published) | Entity listing pages |
| idx_entities_slug | entities | (slug) WHERE is_published | Entity detail lookup |
| idx_entity_relations_source | entity_relations | (source_entity_id) | Graph traversal |
| idx_entity_relations_target | entity_relations | (target_entity_id) | Graph traversal |
| idx_credit_tx_user | credit_transactions | (user_id, created_at DESC) | Transaction history |
| idx_neuron_jobs_author | neuron_jobs | (author_id, created_at DESC) | Job listing |

## Realtime

| Table | Realtime Enabled |
|-------|-----------------|
| user_credits | Yes (via channel subscription in useCreditBalance) |
| notifications | Should be enabled for real-time bell |

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| episode-files | No | Audio/video uploads |
