-- P3-001: Enable pgvector and create embeddings table
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.neuron_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id integer REFERENCES public.neurons(id) ON DELETE CASCADE NOT NULL,
  embedding vector(768),
  model_name text DEFAULT 'text-embedding-004',
  created_at timestamptz DEFAULT now(),
  UNIQUE(neuron_id)
);

CREATE INDEX IF NOT EXISTS idx_neuron_embeddings_neuron ON public.neuron_embeddings(neuron_id);

-- Similarity search function
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
AS $$
  SELECT
    ne.neuron_id,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM public.neuron_embeddings ne
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
$$;

ALTER TABLE public.neuron_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "neuron_embeddings_select_all" ON public.neuron_embeddings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "neuron_embeddings_insert_service" ON public.neuron_embeddings
  FOR INSERT TO authenticated WITH CHECK (true);