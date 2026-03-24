
-- Asset distribution events (social, SEO, backlinks)
CREATE TABLE public.distribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.knowledge_assets(id) ON DELETE CASCADE,
  channel text NOT NULL,
  action text NOT NULL DEFAULT 'publish',
  reach_estimate integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.distribution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own distribution" ON public.distribution_events FOR SELECT TO authenticated USING (
  asset_id IN (SELECT id FROM public.knowledge_assets WHERE author_id = auth.uid())
);
CREATE POLICY "Admins manage distribution" ON public.distribution_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Feedback loop metrics for service/asset performance
CREATE TABLE public.domination_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  revenue numeric NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  usage_count integer NOT NULL DEFAULT 0,
  quality_score numeric NOT NULL DEFAULT 0,
  action_taken text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id, metric_date)
);

ALTER TABLE public.domination_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage domination_metrics" ON public.domination_metrics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_distribution_channel ON public.distribution_events(channel, created_at DESC);
CREATE INDEX idx_domination_metrics_type ON public.domination_metrics(entity_type, metric_date DESC);
