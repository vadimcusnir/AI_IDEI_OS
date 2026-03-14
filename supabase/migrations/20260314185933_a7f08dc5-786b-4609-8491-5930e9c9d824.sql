
-- Insight scores table for the scoring engine (Phase 2.2)
CREATE TABLE public.insight_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id bigint NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  novelty double precision NOT NULL DEFAULT 0,
  information_density double precision NOT NULL DEFAULT 0,
  utility double precision NOT NULL DEFAULT 0,
  demand double precision NOT NULL DEFAULT 0,
  composite_score double precision NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'standard',
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  model_version text NOT NULL DEFAULT 'scoring-v1',
  extraction_level text DEFAULT NULL,
  UNIQUE(neuron_id)
);

ALTER TABLE public.insight_scores ENABLE ROW LEVEL SECURITY;

-- Users can read scores for their own neurons
CREATE POLICY "Users can read own neuron scores"
  ON public.insight_scores FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.neurons n 
    WHERE n.id = insight_scores.neuron_id 
    AND (n.author_id = auth.uid() OR n.visibility = 'public')
  ));

-- Admins can manage all scores
CREATE POLICY "Admins manage scores"
  ON public.insight_scores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_insight_scores_neuron_id ON public.insight_scores(neuron_id);
CREATE INDEX idx_insight_scores_composite ON public.insight_scores(composite_score DESC);
CREATE INDEX idx_insight_scores_tier ON public.insight_scores(tier);

-- Neuron dedup tracking table
CREATE TABLE public.neuron_duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_a bigint NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  neuron_b bigint NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  similarity double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(neuron_a, neuron_b)
);

ALTER TABLE public.neuron_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own duplicates"
  ON public.neuron_duplicates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.neurons n 
    WHERE (n.id = neuron_duplicates.neuron_a OR n.id = neuron_duplicates.neuron_b)
    AND n.author_id = auth.uid()
  ));

CREATE POLICY "Users can update own duplicates"
  ON public.neuron_duplicates FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.neurons n 
    WHERE (n.id = neuron_duplicates.neuron_a OR n.id = neuron_duplicates.neuron_b)
    AND n.author_id = auth.uid()
  ));

CREATE INDEX idx_neuron_duplicates_a ON public.neuron_duplicates(neuron_a);
CREATE INDEX idx_neuron_duplicates_b ON public.neuron_duplicates(neuron_b);
CREATE INDEX idx_neuron_duplicates_status ON public.neuron_duplicates(status);
