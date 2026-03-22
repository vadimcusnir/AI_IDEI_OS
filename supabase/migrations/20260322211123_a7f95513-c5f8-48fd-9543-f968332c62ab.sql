
-- =============================================
-- P2: NOTEBOOKS TABLE (NotebookLM-style workspace)
-- =============================================
CREATE TABLE public.notebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Untitled Notebook',
  description text DEFAULT '',
  visibility text NOT NULL DEFAULT 'private',
  source_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notebooks_owner ON public.notebooks(owner_id);
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notebooks" ON public.notebooks
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Notebook sources (files/URLs attached to a notebook)
CREATE TABLE public.notebook_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'text',
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  file_url text,
  metadata jsonb DEFAULT '{}',
  is_selected boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nb_sources_notebook ON public.notebook_sources(notebook_id);
ALTER TABLE public.notebook_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage notebook sources via notebook ownership" ON public.notebook_sources
  FOR ALL TO authenticated
  USING (notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid()))
  WITH CHECK (notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid()));

-- Notebook chat messages
CREATE TABLE public.notebook_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nb_messages_notebook ON public.notebook_messages(notebook_id);
ALTER TABLE public.notebook_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage notebook messages via notebook ownership" ON public.notebook_messages
  FOR ALL TO authenticated
  USING (notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid()))
  WITH CHECK (notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid()));

-- Notebook studio artifacts (generated outputs)
CREATE TABLE public.notebook_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id uuid NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  artifact_type text NOT NULL DEFAULT 'note',
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nb_artifacts_notebook ON public.notebook_artifacts(notebook_id);
ALTER TABLE public.notebook_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage notebook artifacts via notebook ownership" ON public.notebook_artifacts
  FOR ALL TO authenticated
  USING (notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid()))
  WITH CHECK (notebook_id IN (SELECT id FROM public.notebooks WHERE owner_id = auth.uid()));

-- =============================================
-- P3: MOTOR 2 — CAPITALIZATION ENGINE TABLES
-- =============================================

-- Deduplication clusters
CREATE TABLE public.dedup_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_type text NOT NULL DEFAULT 'framework',
  canonical_title text NOT NULL DEFAULT '',
  canonical_content text DEFAULT '',
  member_count integer NOT NULL DEFAULT 1,
  frequency_score numeric NOT NULL DEFAULT 0,
  refinement_level integer NOT NULL DEFAULT 0,
  avg_similarity numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dedup_clusters_type ON public.dedup_clusters(cluster_type);
ALTER TABLE public.dedup_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read dedup clusters" ON public.dedup_clusters
  FOR SELECT TO authenticated USING (true);

-- Cluster members (links neurons/entities to clusters)
CREATE TABLE public.dedup_cluster_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid NOT NULL REFERENCES public.dedup_clusters(id) ON DELETE CASCADE,
  neuron_id integer REFERENCES public.neurons(id) ON DELETE SET NULL,
  entity_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  similarity_score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dedup_members_cluster ON public.dedup_cluster_members(cluster_id);
ALTER TABLE public.dedup_cluster_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read cluster members" ON public.dedup_cluster_members
  FOR SELECT TO authenticated USING (true);

-- MPI Scores (Monetization Potential Index)
CREATE TABLE public.mpi_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id integer REFERENCES public.neurons(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  mpi_score numeric NOT NULL DEFAULT 0,
  applicability_score numeric NOT NULL DEFAULT 0,
  clarity_score numeric NOT NULL DEFAULT 0,
  rarity_score numeric NOT NULL DEFAULT 0,
  recurrence_score numeric NOT NULL DEFAULT 0,
  differentiation_score numeric NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mpi_has_target CHECK (neuron_id IS NOT NULL OR entity_id IS NOT NULL)
);

CREATE INDEX idx_mpi_neuron ON public.mpi_scores(neuron_id);
CREATE INDEX idx_mpi_entity ON public.mpi_scores(entity_id);
CREATE INDEX idx_mpi_score_desc ON public.mpi_scores(mpi_score DESC);
ALTER TABLE public.mpi_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read MPI scores" ON public.mpi_scores
  FOR SELECT TO authenticated USING (true);

-- Capacity state (system-wide capacity tracking)
CREATE TABLE public.capacity_state (
  id integer PRIMARY KEY DEFAULT 1,
  monthly_capacity bigint NOT NULL DEFAULT 35000000,
  consumed_neurons bigint NOT NULL DEFAULT 0,
  utilization numeric GENERATED ALWAYS AS (
    CASE WHEN monthly_capacity > 0 THEN consumed_neurons::numeric / monthly_capacity ELSE 0 END
  ) STORED,
  current_multiplier numeric NOT NULL DEFAULT 1.0,
  queue_depth integer NOT NULL DEFAULT 0,
  avg_job_latency_ms integer NOT NULL DEFAULT 0,
  llm_cost_per_credit numeric NOT NULL DEFAULT 0.01,
  margin_target numeric NOT NULL DEFAULT 10.0,
  premium_only_mode boolean NOT NULL DEFAULT false,
  reset_at timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.capacity_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read capacity" ON public.capacity_state
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins update capacity" ON public.capacity_state
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed initial capacity row
INSERT INTO public.capacity_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Dynamic pricing log
CREATE TABLE public.dynamic_pricing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid,
  user_id uuid,
  base_price numeric NOT NULL DEFAULT 0,
  multiplier numeric NOT NULL DEFAULT 1.0,
  tier_discount numeric NOT NULL DEFAULT 0,
  final_price numeric NOT NULL DEFAULT 0,
  utilization_at_time numeric NOT NULL DEFAULT 0,
  queue_depth_at_time integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dpl_created ON public.dynamic_pricing_log(created_at DESC);
ALTER TABLE public.dynamic_pricing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read pricing log" ON public.dynamic_pricing_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- RPC: Compute dynamic price
-- =============================================
CREATE OR REPLACE FUNCTION public.compute_dynamic_price(
  _base_price numeric,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _cap RECORD;
  _tier text;
  _mult numeric := 1.0;
  _tier_mod numeric := 1.0;
  _final numeric;
BEGIN
  SELECT * INTO _cap FROM capacity_state WHERE id = 1;
  SELECT tier INTO _tier FROM access_window_state WHERE user_id = _user_id;

  -- Utilization multiplier
  IF _cap.utilization < 0.60 THEN _mult := 1.0;
  ELSIF _cap.utilization < 0.80 THEN _mult := 1.0 + ((_cap.utilization - 0.60) * 1.5);
  ELSIF _cap.utilization < 0.90 THEN _mult := 1.414;
  ELSIF _cap.utilization < 0.95 THEN _mult := 2.0;
  ELSE _mult := 2.5;
  END IF;

  -- Latency protection
  IF _cap.avg_job_latency_ms > 5000 THEN _mult := _mult + 0.15; END IF;

  -- Tier discount
  _tier_mod := CASE
    WHEN _tier = 'vip' THEN 0.80
    WHEN _tier = 'pro' THEN 1.0
    WHEN _tier = 'starter' THEN 1.05
    ELSE 1.10
  END;

  _final := ROUND(_base_price * _mult * _tier_mod, 2);

  RETURN jsonb_build_object(
    'base_price', _base_price,
    'multiplier', _mult,
    'tier', COALESCE(_tier, 'free'),
    'tier_modifier', _tier_mod,
    'final_price', _final,
    'utilization', _cap.utilization,
    'premium_only', _cap.premium_only_mode
  );
END;
$$;

-- =============================================
-- RPC: Capacity dashboard stats
-- =============================================
CREATE OR REPLACE FUNCTION public.capacity_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _cap RECORD;
  _dedup_count integer;
  _mpi_avg numeric;
  _top_mpi jsonb;
BEGIN
  SELECT * INTO _cap FROM capacity_state WHERE id = 1;
  SELECT COUNT(*) INTO _dedup_count FROM dedup_clusters;
  SELECT COALESCE(AVG(mpi_score), 0) INTO _mpi_avg FROM mpi_scores;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO _top_mpi FROM (
    SELECT m.mpi_score, m.applicability_score, m.clarity_score, m.rarity_score,
      COALESCE(n.title, e.title) as title
    FROM mpi_scores m
    LEFT JOIN neurons n ON n.id = m.neuron_id
    LEFT JOIN entities e ON e.id = m.entity_id
    ORDER BY m.mpi_score DESC LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'monthly_capacity', _cap.monthly_capacity,
    'consumed', _cap.consumed_neurons,
    'utilization', _cap.utilization,
    'multiplier', _cap.current_multiplier,
    'queue_depth', _cap.queue_depth,
    'avg_latency_ms', _cap.avg_job_latency_ms,
    'premium_only', _cap.premium_only_mode,
    'dedup_clusters', _dedup_count,
    'avg_mpi', _mpi_avg,
    'top_mpi', _top_mpi
  );
END;
$$;

-- Update trigger for notebooks
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON public.notebooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update source count trigger
CREATE OR REPLACE FUNCTION public.update_notebook_source_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE notebooks SET source_count = (
    SELECT COUNT(*) FROM notebook_sources WHERE notebook_id = COALESCE(NEW.notebook_id, OLD.notebook_id)
  ) WHERE id = COALESCE(NEW.notebook_id, OLD.notebook_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_notebook_source_count
  AFTER INSERT OR DELETE ON public.notebook_sources
  FOR EACH ROW EXECUTE FUNCTION update_notebook_source_count();
