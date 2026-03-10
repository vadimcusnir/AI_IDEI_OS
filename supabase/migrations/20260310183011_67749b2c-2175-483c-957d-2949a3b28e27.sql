
-- Add insight_family and relation weight infrastructure
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS insight_family TEXT;
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS idea_rank FLOAT DEFAULT 0;
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS reuse_count INT DEFAULT 0;
ALTER TABLE public.entities ADD COLUMN IF NOT EXISTS citation_sources JSONB DEFAULT '[]'::jsonb;

-- Create IdeaRank computation function
CREATE OR REPLACE FUNCTION public.compute_idearank()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  d FLOAT := 0.85;
  total_entities INT;
  iteration INT;
  max_iterations INT := 30;
  -- Relation weights
BEGIN
  SELECT COUNT(*) INTO total_entities FROM entities WHERE is_published = true;
  IF total_entities = 0 THEN RETURN; END IF;

  -- Initialize: set all idea_rank to 1/N
  UPDATE entities SET idea_rank = 1.0 / total_entities WHERE is_published = true;

  -- Iterative computation
  FOR iteration IN 1..max_iterations LOOP
    -- Compute new rank for each entity
    UPDATE entities e SET idea_rank = (1.0 - d) / total_entities + d * COALESCE((
      SELECT SUM(
        src.idea_rank * 
        CASE r.relation_type
          WHEN 'DERIVED_FROM' THEN 1.0
          WHEN 'SUPPORTS' THEN 0.8
          WHEN 'EXTENDS' THEN 0.7
          WHEN 'APPLIES_TO' THEN 0.6
          WHEN 'REFERENCES' THEN 0.5
          WHEN 'MENTIONS' THEN 0.4
          WHEN 'INSPIRES' THEN 0.7
          WHEN 'CONTRADICTS' THEN 0.3
          WHEN 'RELATES_TO' THEN 0.5
          WHEN 'PART_OF' THEN 0.6
          ELSE 0.5
        END
        / GREATEST(1, (SELECT COUNT(*) FROM entity_relations WHERE source_entity_id = r.source_entity_id))
      )
      FROM entity_relations r
      JOIN entities src ON src.id = r.source_entity_id AND src.is_published = true
      WHERE r.target_entity_id = e.id
    ), 0)
    WHERE e.is_published = true;
  END LOOP;

  -- Apply multipliers: evidence, reuse, confidence
  UPDATE entities SET 
    importance_score = idea_rank 
      * LN(1 + COALESCE(evidence_count, 0) + 1)
      * LN(1 + COALESCE(reuse_count, 0) + 1)
      * GREATEST(0.1, COALESCE(confidence_score, 0.5))
  WHERE is_published = true;

  -- Normalize importance_score to 0-100 range
  UPDATE entities SET importance_score = importance_score * 100.0 / GREATEST(0.001, (
    SELECT MAX(importance_score) FROM entities WHERE is_published = true
  ))
  WHERE is_published = true;
END;
$$;

-- Create index for idea_rank queries
CREATE INDEX IF NOT EXISTS idx_entities_idea_rank ON public.entities(idea_rank DESC);
CREATE INDEX IF NOT EXISTS idx_entities_importance ON public.entities(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_entities_family ON public.entities(insight_family);
