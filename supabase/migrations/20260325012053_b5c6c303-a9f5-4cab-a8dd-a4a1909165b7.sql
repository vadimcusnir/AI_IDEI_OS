-- Fix search_path to include extensions for vector operators
CREATE OR REPLACE FUNCTION public.match_neurons(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  neuron_id integer,
  similarity float
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  SELECT
    ne.neuron_id,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM public.neuron_embeddings ne
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Fix permissive INSERT policy
DROP POLICY IF EXISTS "neuron_embeddings_insert_service" ON public.neuron_embeddings;
CREATE POLICY "neuron_embeddings_insert_own" ON public.neuron_embeddings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.neurons n
      WHERE n.id = neuron_embeddings.neuron_id
      AND n.author_id = auth.uid()
    )
  );