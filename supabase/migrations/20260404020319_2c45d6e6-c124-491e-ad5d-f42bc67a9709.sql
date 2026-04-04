
-- Index on entities(entity_type) for published entities
CREATE INDEX IF NOT EXISTS idx_entities_type_published 
ON public.entities (entity_type) WHERE is_published = true;

-- Index on entity_relations(source_entity_id)
CREATE INDEX IF NOT EXISTS idx_entity_relations_source 
ON public.entity_relations (source_entity_id);

-- Index on entity_relations(target_entity_id)
CREATE INDEX IF NOT EXISTS idx_entity_relations_target 
ON public.entity_relations (target_entity_id);
