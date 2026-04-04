
-- ============================================
-- 1. ENTITLEMENTS ENGINE
-- ============================================
CREATE TABLE public.entitlements (
  user_id UUID PRIMARY KEY,
  nota2_balance NUMERIC DEFAULT 0,
  tenure_months INT DEFAULT 0,
  neurons_burned BIGINT DEFAULT 0,
  reputation_score NUMERIC(6,2) DEFAULT 0,
  computed_level TEXT NOT NULL DEFAULT 'L1' CHECK (computed_level IN ('L1','L2','L3','L4')),
  access_flags JSONB NOT NULL DEFAULT '{}',
  cusnir_os_access BOOLEAN DEFAULT false,
  feature_gates JSONB NOT NULL DEFAULT '{}',
  last_computed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own entitlements"
  ON public.entitlements FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin full access entitlements"
  ON public.entitlements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 2. MODULE REGISTRY SSOT
-- ============================================
CREATE TABLE public.system_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('ui','api','ai','economy','infrastructure')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','deprecated','blocked','pending')),
  description TEXT DEFAULT '',
  dependencies TEXT[] DEFAULT '{}',
  access_requirements JSONB DEFAULT '{}',
  monetization_link TEXT,
  min_tier TEXT DEFAULT 'L1' CHECK (min_tier IN ('L1','L2','L3','L4')),
  edge_function_key TEXT,
  component_path TEXT,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads modules"
  ON public.system_modules FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin manages modules"
  ON public.system_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. CUSNIR_OS LEDGER (append-only audit)
-- ============================================
CREATE TABLE public.cusnir_os_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'access_grant','access_revoke','override','cost_adjustment',
    'flow_redirect','resource_allocation','operator_intervention',
    'policy_change','anomaly_detected','tier_change'
  )),
  actor_id UUID,
  target_id UUID,
  target_resource TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','critical','audit')),
  immutable_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ledger_actor ON public.cusnir_os_ledger(actor_id);
CREATE INDEX idx_ledger_event ON public.cusnir_os_ledger(event_type);
CREATE INDEX idx_ledger_created ON public.cusnir_os_ledger(created_at DESC);

ALTER TABLE public.cusnir_os_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads ledger"
  ON public.cusnir_os_ledger FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System inserts ledger"
  ON public.cusnir_os_ledger FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 4. TIER PROGRESSION L1-L4
-- ============================================
CREATE TABLE public.tier_progression_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_level TEXT UNIQUE NOT NULL CHECK (tier_level IN ('L1','L2','L3','L4')),
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  neurons_spent_threshold BIGINT DEFAULT 0,
  assets_created_threshold INT DEFAULT 0,
  revenue_generated_threshold NUMERIC DEFAULT 0,
  streak_days_threshold INT DEFAULT 0,
  unlock_effects JSONB DEFAULT '{}',
  feature_unlocks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tier_progression_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads tier rules"
  ON public.tier_progression_rules FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin manages tier rules"
  ON public.tier_progression_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default progression rules
INSERT INTO public.tier_progression_rules (tier_level, label, description, neurons_spent_threshold, assets_created_threshold, revenue_generated_threshold, streak_days_threshold, unlock_effects, feature_unlocks) VALUES
('L1', 'User', 'Basic platform access', 0, 0, 0, 0, '{"max_daily_neurons": 500, "max_services": 3}', ARRAY['extract', 'basic_services']),
('L2', 'Builder', 'Active content creator', 5000, 5, 0, 7, '{"max_daily_neurons": 2000, "max_services": 8, "marketplace_access": true}', ARRAY['advanced_services', 'marketplace', 'library']),
('L3', 'Operator', 'Strategic operator with economic output', 50000, 25, 100, 30, '{"max_daily_neurons": 10000, "max_services": 20, "automation": true}', ARRAY['automation', 'api_access', 'bulk_operations']),
('L4', 'Orchestrator', 'Full OS access with governance', 200000, 100, 1000, 90, '{"max_daily_neurons": 50000, "unlimited_services": true, "cusnir_os": true}', ARRAY['cusnir_os', 'agent_swarm', 'governance', 'full_api']);

-- User tier progress tracking
CREATE TABLE public.user_tier_progress (
  user_id UUID PRIMARY KEY,
  current_level TEXT NOT NULL DEFAULT 'L1' CHECK (current_level IN ('L1','L2','L3','L4')),
  neurons_spent_total BIGINT DEFAULT 0,
  assets_created_total INT DEFAULT 0,
  revenue_generated_total NUMERIC DEFAULT 0,
  current_streak_days INT DEFAULT 0,
  longest_streak_days INT DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  level_achieved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_tier_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress"
  ON public.user_tier_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin full access progress"
  ON public.user_tier_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 5. COMPUTE ENTITLEMENTS RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.compute_entitlements(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _nota2 NUMERIC := 0;
  _tenure INT := 0;
  _burned BIGINT := 0;
  _rep NUMERIC := 0;
  _level TEXT := 'L1';
  _progress RECORD;
  _rule RECORD;
  _flags JSONB := '{}';
  _cusnir BOOLEAN := false;
BEGIN
  -- Get NOTA2 balance
  SELECT COALESCE(balance, 0) INTO _nota2
  FROM public.nota2_balances WHERE user_id = _user_id;

  -- Get VIP tenure
  SELECT COALESCE(current_month, 0) INTO _tenure
  FROM public.vip_progress WHERE user_id = _user_id;

  -- Get user tier progress
  SELECT * INTO _progress FROM public.user_tier_progress WHERE user_id = _user_id;

  IF _progress IS NOT NULL THEN
    _burned := COALESCE(_progress.neurons_spent_total, 0);

    -- Determine level from rules
    FOR _rule IN SELECT * FROM public.tier_progression_rules ORDER BY neurons_spent_threshold DESC LOOP
      IF _burned >= _rule.neurons_spent_threshold
         AND COALESCE(_progress.assets_created_total, 0) >= _rule.assets_created_threshold
         AND COALESCE(_progress.current_streak_days, 0) >= _rule.streak_days_threshold
      THEN
        _level := _rule.tier_level;
        _flags := COALESCE(_rule.unlock_effects, '{}');
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- Cusnir_OS access: L4 + 11 months tenure + NOTA2 > 0
  _cusnir := (_level = 'L4' AND _tenure >= 11 AND _nota2 > 0);

  -- Upsert entitlements
  INSERT INTO public.entitlements (user_id, nota2_balance, tenure_months, neurons_burned, reputation_score, computed_level, access_flags, cusnir_os_access, feature_gates, last_computed_at, updated_at)
  VALUES (_user_id, _nota2, _tenure, _burned, _rep, _level, _flags, _cusnir, _flags, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    nota2_balance = EXCLUDED.nota2_balance,
    tenure_months = EXCLUDED.tenure_months,
    neurons_burned = EXCLUDED.neurons_burned,
    computed_level = EXCLUDED.computed_level,
    access_flags = EXCLUDED.access_flags,
    cusnir_os_access = EXCLUDED.cusnir_os_access,
    feature_gates = EXCLUDED.feature_gates,
    last_computed_at = now(),
    updated_at = now();

  -- Log tier change in ledger
  IF _progress IS NULL OR _progress.current_level != _level THEN
    INSERT INTO public.cusnir_os_ledger (event_type, actor_id, target_id, payload, severity)
    VALUES ('tier_change', _user_id, _user_id,
      jsonb_build_object('old_level', COALESCE(_progress.current_level, 'L1'), 'new_level', _level, 'burned', _burned),
      'audit');

    -- Update user_tier_progress
    INSERT INTO public.user_tier_progress (user_id, current_level, level_achieved_at, updated_at)
    VALUES (_user_id, _level, now(), now())
    ON CONFLICT (user_id) DO UPDATE SET current_level = _level, level_achieved_at = now(), updated_at = now();
  END IF;

  RETURN jsonb_build_object(
    'level', _level,
    'nota2', _nota2,
    'tenure', _tenure,
    'burned', _burned,
    'cusnir_os', _cusnir,
    'flags', _flags
  );
END;
$$;
