
-- ═══════════════════════════════════════════════════════
-- Performance indexes for entity_relations (fixes O(n²) in compute_idearank)
-- ═══════════════════════════════════════════════════════

-- Composite indexes for the hot paths in PageRank iteration
CREATE INDEX IF NOT EXISTS idx_entity_relations_source ON entity_relations (source_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relations_target ON entity_relations (target_entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_relations_source_target ON entity_relations (source_entity_id, target_entity_id);

-- Covering index for relation type lookups during PageRank
CREATE INDEX IF NOT EXISTS idx_entity_relations_target_type ON entity_relations (target_entity_id, relation_type);

-- Entities published filter (used in every iteration)
CREATE INDEX IF NOT EXISTS idx_entities_published ON entities (is_published) WHERE is_published = true;

-- Idea metrics node lookup
CREATE INDEX IF NOT EXISTS idx_idea_metrics_node ON idea_metrics (node_id);
