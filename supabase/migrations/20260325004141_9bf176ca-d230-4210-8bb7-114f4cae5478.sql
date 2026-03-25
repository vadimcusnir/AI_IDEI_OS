-- Performance indexes for key query patterns

CREATE INDEX IF NOT EXISTS idx_neurons_author_updated 
  ON neurons(author_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_entities_type_published 
  ON entities(entity_type) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_entities_slug_published 
  ON entities(slug) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_entity_relations_source 
  ON entity_relations(source_entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_relations_target 
  ON entity_relations(target_entity_id);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created 
  ON credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_neuron_jobs_author_created 
  ON neuron_jobs(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_episodes_author_created 
  ON episodes(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artifacts_author_created 
  ON artifacts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_neurons_workspace_updated 
  ON neurons(workspace_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_artifacts_workspace_created 
  ON artifacts(workspace_id, created_at DESC);