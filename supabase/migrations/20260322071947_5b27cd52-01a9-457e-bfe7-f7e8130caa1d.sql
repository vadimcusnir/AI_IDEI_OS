
-- HNSW index for fast approximate nearest neighbor search on neuron_embeddings
CREATE INDEX IF NOT EXISTS idx_neuron_embeddings_hnsw 
ON public.neuron_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Hybrid search: combines keyword (trigram) + vector search with RRF fusion
CREATE OR REPLACE FUNCTION public.search_neurons_hybrid(
  _query text,
  _query_embedding vector(768) DEFAULT NULL,
  _user_id uuid DEFAULT NULL,
  _match_count int DEFAULT 20
)
RETURNS TABLE(
  neuron_id int,
  title text,
  number int,
  content_category text,
  status text,
  score float,
  keyword_rank int,
  semantic_rank int,
  rrf_score float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  k constant int := 60; -- RRF constant
BEGIN
  RETURN QUERY
  WITH keyword_results AS (
    SELECT n.id AS nid, n.title, n.number, n.content_category, n.status, n.score,
           ROW_NUMBER() OVER (ORDER BY similarity(n.title, _query) DESC) AS kw_rank
    FROM neurons n
    WHERE (_user_id IS NULL OR n.author_id = _user_id)
      AND (n.title ILIKE '%' || _query || '%' OR n.content ILIKE '%' || _query || '%')
    LIMIT 50
  ),
  semantic_results AS (
    SELECT ne.neuron_id AS nid,
           ROW_NUMBER() OVER (ORDER BY ne.embedding <=> _query_embedding) AS sem_rank
    FROM neuron_embeddings ne
    JOIN neurons n ON n.id = ne.neuron_id
    WHERE _query_embedding IS NOT NULL
      AND (_user_id IS NULL OR n.author_id = _user_id)
      AND ne.embedding <=> _query_embedding < 0.7
    LIMIT 50
  ),
  combined AS (
    SELECT COALESCE(kw.nid, sem.nid) AS nid,
           kw.kw_rank,
           sem.sem_rank,
           COALESCE(1.0 / (k + kw.kw_rank), 0) + COALESCE(1.0 / (k + sem.sem_rank), 0) AS rrf
    FROM keyword_results kw
    FULL OUTER JOIN semantic_results sem ON kw.nid = sem.nid
  )
  SELECT n.id, n.title, n.number, n.content_category, n.status, n.score,
         c.kw_rank::int, c.sem_rank::int, c.rrf::float
  FROM combined c
  JOIN neurons n ON n.id = c.nid
  ORDER BY c.rrf DESC
  LIMIT _match_count;
END;
$$;
