
-- =============================================
-- PHASE 5.1: Extended Graph Data Model
-- =============================================

-- Add confidence scoring and temporal metadata to entity_relations
ALTER TABLE public.entity_relations 
  ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 0.8,
  ADD COLUMN IF NOT EXISTS temporal_order TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Add constraint for temporal_order values
ALTER TABLE public.entity_relations 
  ADD CONSTRAINT chk_temporal_order 
  CHECK (temporal_order IS NULL OR temporal_order IN ('before', 'after', 'concurrent', 'causes', 'follows'));

-- =============================================
-- PHASE 5.2: HNSW index for vector search
-- =============================================

-- Create HNSW index on neuron_embeddings for faster similarity search
CREATE INDEX IF NOT EXISTS idx_neuron_embeddings_hnsw 
  ON public.neuron_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Hybrid search function: keyword + vector with RRF fusion
CREATE OR REPLACE FUNCTION public.hybrid_search_neurons(
  _query TEXT,
  _query_embedding vector(768),
  _user_id UUID,
  _match_count INT DEFAULT 20,
  _entity_type TEXT DEFAULT NULL,
  _min_confidence FLOAT DEFAULT 0.0,
  _date_from TIMESTAMPTZ DEFAULT NULL,
  _date_to TIMESTAMPTZ DEFAULT NULL,
  _rrf_k INT DEFAULT 60
)
RETURNS TABLE (
  neuron_id INT,
  title TEXT,
  content_category TEXT,
  lifecycle TEXT,
  score FLOAT,
  created_at TIMESTAMPTZ,
  keyword_rank INT,
  vector_rank INT,
  rrf_score FLOAT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _pattern TEXT := '%' || _query || '%';
BEGIN
  RETURN QUERY
  WITH keyword_results AS (
    SELECT n.id AS nid, n.title AS ntitle, n.content_category, n.lifecycle, n.score AS nscore, n.created_at AS ncreated,
           ROW_NUMBER() OVER (ORDER BY n.score DESC NULLS LAST) AS krank
    FROM neurons n
    WHERE n.author_id = _user_id
      AND n.title ILIKE _pattern
      AND (_entity_type IS NULL OR n.content_category = _entity_type)
      AND (_date_from IS NULL OR n.created_at >= _date_from)
      AND (_date_to IS NULL OR n.created_at <= _date_to)
    LIMIT _match_count * 2
  ),
  vector_results AS (
    SELECT ne.neuron_id AS nid, n.title AS ntitle, n.content_category, n.lifecycle, n.score AS nscore, n.created_at AS ncreated,
           1 - (ne.embedding <=> _query_embedding) AS similarity,
           ROW_NUMBER() OVER (ORDER BY ne.embedding <=> _query_embedding) AS vrank
    FROM neuron_embeddings ne
    JOIN neurons n ON n.id = ne.neuron_id
    WHERE n.author_id = _user_id
      AND 1 - (ne.embedding <=> _query_embedding) >= _min_confidence
      AND (_entity_type IS NULL OR n.content_category = _entity_type)
      AND (_date_from IS NULL OR n.created_at >= _date_from)
      AND (_date_to IS NULL OR n.created_at <= _date_to)
    LIMIT _match_count * 2
  ),
  combined AS (
    SELECT 
      COALESCE(k.nid, v.nid) AS nid,
      COALESCE(k.ntitle, v.ntitle) AS ntitle,
      COALESCE(k.content_category, v.content_category) AS content_category,
      COALESCE(k.lifecycle, v.lifecycle) AS lifecycle,
      COALESCE(k.nscore, v.nscore) AS nscore,
      COALESCE(k.ncreated, v.ncreated) AS ncreated,
      k.krank,
      v.vrank,
      COALESCE(1.0 / (_rrf_k + k.krank), 0) + COALESCE(1.0 / (_rrf_k + v.vrank), 0) AS rrf
    FROM keyword_results k
    FULL OUTER JOIN vector_results v ON k.nid = v.nid
  )
  SELECT c.nid, c.ntitle, c.content_category, c.lifecycle, c.nscore::FLOAT, c.ncreated,
         COALESCE(c.krank, 0)::INT, COALESCE(c.vrank, 0)::INT, c.rrf::FLOAT
  FROM combined c
  ORDER BY c.rrf DESC
  LIMIT _match_count;
END;
$$;

-- =============================================
-- PHASE 5.4: Knowledge gap & contradiction tables
-- =============================================

CREATE TABLE IF NOT EXISTS public.knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  suggested_sources TEXT[] DEFAULT '{}',
  gap_type TEXT NOT NULL DEFAULT 'unexplored',
  confidence FLOAT DEFAULT 0.5,
  status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contradiction_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  entity_a_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  entity_b_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'moderate',
  ai_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'unresolved',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_a_id, entity_b_id)
);

ALTER TABLE public.knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contradiction_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace gaps" ON public.knowledge_gaps
  FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can manage workspace gaps" ON public.knowledge_gaps
  FOR ALL TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can view workspace contradictions" ON public.contradiction_pairs
  FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can manage workspace contradictions" ON public.contradiction_pairs
  FOR ALL TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));
