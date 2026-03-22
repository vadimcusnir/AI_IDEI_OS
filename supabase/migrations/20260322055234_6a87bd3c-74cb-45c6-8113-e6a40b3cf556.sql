
-- HNSW index for semantic search on neuron_embeddings
-- Using ivfflat as a fallback since HNSW requires pgvector >= 0.5.0
CREATE INDEX IF NOT EXISTS idx_neuron_embeddings_vector 
ON public.neuron_embeddings 
USING ivfflat ((embedding::vector(768)) vector_cosine_ops)
WITH (lists = 100);

-- Index for insight_scores lookups
CREATE INDEX IF NOT EXISTS idx_insight_scores_tier 
ON public.insight_scores (tier, composite_score DESC);

-- Create service_manifests table for pipeline declarative config
CREATE TABLE IF NOT EXISTS public.service_manifests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key text NOT NULL REFERENCES public.service_catalog(service_key),
  pipeline_class text NOT NULL DEFAULT 'S' CHECK (pipeline_class IN ('S', 'C', 'X')),
  input_schema jsonb DEFAULT '{}',
  output_schema jsonb DEFAULT '{}',
  access_requirements jsonb DEFAULT '{}',
  pipeline_steps jsonb DEFAULT '[]',
  dependencies text[] DEFAULT '{}',
  estimated_duration_seconds integer DEFAULT 30,
  is_validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_key)
);

ALTER TABLE public.service_manifests ENABLE ROW LEVEL SECURITY;

-- Admins can manage manifests
CREATE POLICY "Admins manage service manifests"
ON public.service_manifests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can read manifests
CREATE POLICY "Authenticated users can read manifests"
ON public.service_manifests
FOR SELECT
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_service_manifests_updated_at
  BEFORE UPDATE ON public.service_manifests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for imf_pipeline_runs so UI can track progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.imf_pipeline_runs;
