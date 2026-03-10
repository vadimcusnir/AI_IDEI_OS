
-- idea_metrics: stores all computed scores per entity node
CREATE TABLE public.idea_metrics (
  node_id uuid PRIMARY KEY REFERENCES public.entities(id) ON DELETE CASCADE,
  activation_score double precision NOT NULL DEFAULT 0,
  growth_score double precision NOT NULL DEFAULT 0,
  acceleration_score double precision NOT NULL DEFAULT 0,
  pagerank_score double precision NOT NULL DEFAULT 0,
  betweenness_score double precision NOT NULL DEFAULT 0,
  multi_hop_influence double precision NOT NULL DEFAULT 0,
  authority_score double precision NOT NULL DEFAULT 0,
  novelty_score double precision NOT NULL DEFAULT 0,
  decay_risk_score double precision NOT NULL DEFAULT 0,
  economic_conversion_score double precision NOT NULL DEFAULT 0,
  propagation_value_score double precision NOT NULL DEFAULT 0,
  amplification_probability double precision NOT NULL DEFAULT 0,
  model_version text NOT NULL DEFAULT 'mvp-v1',
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- Experiment tracking
CREATE TABLE public.idea_rank_experiments (
  experiment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version text NOT NULL,
  train_range tstzrange NOT NULL,
  validate_range tstzrange NOT NULL,
  test_range tstzrange NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  metrics jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Predictions per experiment
CREATE TABLE public.idea_rank_predictions (
  experiment_id uuid NOT NULL REFERENCES public.idea_rank_experiments(experiment_id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  snapshot_at timestamptz NOT NULL,
  predicted_score double precision NOT NULL DEFAULT 0,
  predicted_rank integer,
  predicted_growth double precision,
  predicted_economic_use double precision,
  PRIMARY KEY (experiment_id, node_id, snapshot_at)
);

-- RLS
ALTER TABLE public.idea_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_rank_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_rank_predictions ENABLE ROW LEVEL SECURITY;

-- idea_metrics: public read for published, admin write
CREATE POLICY "Published metrics readable" ON public.idea_metrics FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM entities WHERE entities.id = idea_metrics.node_id AND entities.is_published = true));
CREATE POLICY "Admins manage metrics" ON public.idea_metrics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- experiments: admin only
CREATE POLICY "Admins manage experiments" ON public.idea_rank_experiments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- predictions: admin only
CREATE POLICY "Admins manage predictions" ON public.idea_rank_predictions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_idea_metrics_pvs ON public.idea_metrics (propagation_value_score DESC);
CREATE INDEX idx_idea_metrics_activation ON public.idea_metrics (activation_score DESC);
CREATE INDEX idx_idea_metrics_computed ON public.idea_metrics (computed_at DESC);
CREATE INDEX idx_predictions_experiment ON public.idea_rank_predictions (experiment_id, snapshot_at);
