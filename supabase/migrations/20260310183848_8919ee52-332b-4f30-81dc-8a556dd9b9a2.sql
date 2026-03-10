
-- Add emergence detection columns to idea_metrics
ALTER TABLE public.idea_metrics
  ADD COLUMN IF NOT EXISTS emergence_score double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS connectivity_growth double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS centrality_delta double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS structural_rarity double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_pagerank double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_activation double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_degree integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_emerging boolean NOT NULL DEFAULT false;

-- Index for emerging ideas queries
CREATE INDEX idx_idea_metrics_emergence ON public.idea_metrics (emergence_score DESC) WHERE is_emerging = true;
CREATE INDEX idx_idea_metrics_acceleration ON public.idea_metrics (acceleration_score DESC);
