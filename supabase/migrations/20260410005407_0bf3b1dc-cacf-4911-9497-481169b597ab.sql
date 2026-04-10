-- Lock-in Score table
CREATE TABLE public.os_lockin_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_count INT NOT NULL DEFAULT 0,
  neurons_burned INT NOT NULL DEFAULT 0,
  active_agents INT NOT NULL DEFAULT 0,
  services_used INT NOT NULL DEFAULT 0,
  months_active INT NOT NULL DEFAULT 0,
  total_executions INT NOT NULL DEFAULT 0,
  lockin_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  dependency_level TEXT NOT NULL DEFAULT 'low',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.os_lockin_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own lockin scores"
  ON public.os_lockin_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_os_lockin_user ON public.os_lockin_scores(user_id, computed_at DESC);

-- Superlayer execution results
CREATE TABLE public.os_superlayer_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  axis TEXT NOT NULL,
  module_key TEXT NOT NULL,
  input_text TEXT NOT NULL DEFAULT '',
  output JSONB NOT NULL DEFAULT '{}',
  quality_score NUMERIC(3,2) DEFAULT 0,
  credits_cost INT NOT NULL DEFAULT 0,
  model_used TEXT DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.os_superlayer_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own superlayer results"
  ON public.os_superlayer_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own superlayer results"
  ON public.os_superlayer_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_os_superlayer_user ON public.os_superlayer_results(user_id, created_at DESC);
CREATE INDEX idx_os_superlayer_axis ON public.os_superlayer_results(axis, module_key);

-- Lock-in Score computation function
CREATE OR REPLACE FUNCTION public.compute_lockin_score(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_neurons_burned INT;
  v_asset_count INT;
  v_months_active INT;
  v_total_executions INT;
  v_active_agents INT;
  v_services_used INT;
  v_score NUMERIC(5,2);
  v_level TEXT;
BEGIN
  -- Neurons burned (from credit_transactions)
  SELECT COALESCE(SUM(ABS(amount)), 0)::INT INTO v_neurons_burned
  FROM credit_transactions
  WHERE user_id = _user_id AND transaction_type IN ('debit', 'reserve');

  -- Assets created
  SELECT COUNT(*)::INT INTO v_asset_count
  FROM artifacts
  WHERE author_id = _user_id;

  -- Months active (from profile created_at)
  SELECT GREATEST(1, EXTRACT(MONTH FROM AGE(now(), MIN(created_at))))::INT INTO v_months_active
  FROM profiles
  WHERE id = _user_id;

  -- Total OS executions
  SELECT COUNT(*)::INT INTO v_total_executions
  FROM os_executions
  WHERE user_id = _user_id;

  -- Active agents
  SELECT COUNT(*)::INT INTO v_active_agents
  FROM os_agents
  WHERE status = 'active';

  -- Services used (unique service executions)
  SELECT COUNT(DISTINCT service_key)::INT INTO v_services_used
  FROM service_executions
  WHERE user_id = _user_id;

  -- Weighted score calculation (0-100)
  v_score := LEAST(100, (
    LEAST(25, (v_neurons_burned::NUMERIC / 500) * 25) +  -- 25% weight: neurons
    LEAST(20, (v_asset_count::NUMERIC / 50) * 20) +       -- 20% weight: assets
    LEAST(20, (v_months_active::NUMERIC / 11) * 20) +     -- 20% weight: tenure
    LEAST(15, (v_total_executions::NUMERIC / 100) * 15) +  -- 15% weight: executions
    LEAST(10, (v_active_agents::NUMERIC / 12) * 10) +     -- 10% weight: agents
    LEAST(10, (v_services_used::NUMERIC / 20) * 10)        -- 10% weight: services
  ));

  -- Dependency level
  v_level := CASE
    WHEN v_score >= 80 THEN 'critical'
    WHEN v_score >= 60 THEN 'high'
    WHEN v_score >= 40 THEN 'medium'
    WHEN v_score >= 20 THEN 'low'
    ELSE 'minimal'
  END;

  -- Store snapshot
  INSERT INTO os_lockin_scores (user_id, asset_count, neurons_burned, active_agents, services_used, months_active, total_executions, lockin_score, dependency_level)
  VALUES (_user_id, v_asset_count, v_neurons_burned, v_active_agents, v_services_used, v_months_active, v_total_executions, v_score, v_level);

  RETURN jsonb_build_object(
    'score', v_score,
    'level', v_level,
    'vectors', jsonb_build_object(
      'neurons_burned', v_neurons_burned,
      'asset_count', v_asset_count,
      'months_active', v_months_active,
      'total_executions', v_total_executions,
      'active_agents', v_active_agents,
      'services_used', v_services_used
    )
  );
END;
$$;