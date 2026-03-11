
-- Drop old function first, then recreate with proper search_path
DROP FUNCTION IF EXISTS public.search_neurons_semantic;

CREATE OR REPLACE FUNCTION public.search_neurons_semantic(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  _user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  neuron_id bigint,
  title text,
  similarity float
)
LANGUAGE plpgsql STABLE
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ne.neuron_id,
    n.title,
    (1 - (ne.embedding <=> query_embedding))::float as similarity
  FROM public.neuron_embeddings ne
  JOIN public.neurons n ON n.id = ne.neuron_id
  WHERE 
    (n.visibility = 'public' OR n.author_id = _user_id)
    AND (1 - (ne.embedding <=> query_embedding)) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
