
-- ═══════════════════════════════════════════════════════════
-- System Architecture Runtime — Fail-closed validation spine
-- ═══════════════════════════════════════════════════════════

-- Runtime health checks (circuit breaker state per service)
CREATE TABLE public.runtime_health (
  service_key text PRIMARY KEY,
  status text NOT NULL DEFAULT 'healthy',
  last_check_at timestamptz NOT NULL DEFAULT now(),
  consecutive_failures integer NOT NULL DEFAULT 0,
  circuit_state text NOT NULL DEFAULT 'closed',
  circuit_opened_at timestamptz,
  cooldown_until timestamptz,
  error_rate_1h float NOT NULL DEFAULT 0,
  avg_latency_ms integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Runtime validation log (every access check recorded)
CREATE TABLE public.runtime_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  service_key text NOT NULL,
  validation_type text NOT NULL DEFAULT 'access',
  verdict text NOT NULL,
  reason text,
  latency_ms integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- System config (runtime-tunable parameters)
CREATE TABLE public.system_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Feature flags
CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  rollout_percentage integer NOT NULL DEFAULT 0,
  allowed_roles text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_runtime_validations_user ON public.runtime_validations(user_id, created_at DESC);
CREATE INDEX idx_runtime_validations_service ON public.runtime_validations(service_key, created_at DESC);
CREATE INDEX idx_runtime_health_status ON public.runtime_health(circuit_state);

-- RLS
ALTER TABLE public.runtime_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runtime_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- runtime_health: authenticated read, admin write
CREATE POLICY "Authenticated read runtime_health" ON public.runtime_health FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage runtime_health" ON public.runtime_health FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- runtime_validations: user reads own, admin all
CREATE POLICY "Users read own validations" ON public.runtime_validations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin full access runtime_validations" ON public.runtime_validations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- system_config: authenticated read, admin write
CREATE POLICY "Authenticated read system_config" ON public.system_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage system_config" ON public.system_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- feature_flags: authenticated read, admin write
CREATE POLICY "Authenticated read feature_flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage feature_flags" ON public.feature_flags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Fail-closed access check with circuit breaker
CREATE OR REPLACE FUNCTION public.check_access_safe(_user_id uuid, _service_key text, _ip_hint text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _health RECORD;
  _result jsonb;
  _start_ts timestamptz;
  _latency integer;
BEGIN
  _start_ts := clock_timestamp();

  -- Check circuit breaker
  SELECT * INTO _health FROM runtime_health WHERE service_key = _service_key;
  
  IF _health IS NOT NULL THEN
    -- Circuit open = fail-closed (DENY)
    IF _health.circuit_state = 'open' THEN
      INSERT INTO runtime_validations (user_id, service_key, validation_type, verdict, reason, latency_ms)
      VALUES (_user_id, _service_key, 'circuit_breaker', 'DENY', 'CIRCUIT_OPEN', 0);
      
      RETURN jsonb_build_object('verdict', 'DENY', 'reason', 'SERVICE_UNAVAILABLE', 'circuit', 'open');
    END IF;
    
    -- Half-open: allow limited traffic
    IF _health.circuit_state = 'half_open' AND _health.cooldown_until IS NOT NULL AND now() < _health.cooldown_until THEN
      INSERT INTO runtime_validations (user_id, service_key, validation_type, verdict, reason, latency_ms)
      VALUES (_user_id, _service_key, 'circuit_breaker', 'DENY', 'CIRCUIT_HALF_OPEN_COOLDOWN', 0);
      
      RETURN jsonb_build_object('verdict', 'DENY', 'reason', 'SERVICE_RECOVERING', 'circuit', 'half_open');
    END IF;
  END IF;

  -- Delegate to existing check_access_logged
  _result := check_access_logged(_user_id, _service_key, _ip_hint);
  
  _latency := EXTRACT(MILLISECONDS FROM (clock_timestamp() - _start_ts))::integer;

  -- Log validation
  INSERT INTO runtime_validations (user_id, service_key, validation_type, verdict, reason, latency_ms, metadata)
  VALUES (_user_id, _service_key, 'access', _result->>'verdict', _result->>'reason', _latency, _result);

  -- Update health metrics
  INSERT INTO runtime_health (service_key, last_check_at, avg_latency_ms)
  VALUES (_service_key, now(), _latency)
  ON CONFLICT (service_key) DO UPDATE SET
    last_check_at = now(),
    avg_latency_ms = (runtime_health.avg_latency_ms + _latency) / 2,
    consecutive_failures = CASE
      WHEN (_result->>'verdict') = 'DENY' AND (_result->>'reason') NOT IN ('insufficient_credits', 'no_credits')
      THEN runtime_health.consecutive_failures + 1
      ELSE 0
    END,
    circuit_state = CASE
      WHEN runtime_health.consecutive_failures + 1 >= 10 THEN 'open'
      WHEN runtime_health.consecutive_failures + 1 >= 5 THEN 'half_open'
      ELSE 'closed'
    END,
    circuit_opened_at = CASE
      WHEN runtime_health.consecutive_failures + 1 >= 10 THEN now()
      ELSE runtime_health.circuit_opened_at
    END,
    cooldown_until = CASE
      WHEN runtime_health.consecutive_failures + 1 >= 10 THEN now() + interval '5 minutes'
      WHEN runtime_health.consecutive_failures + 1 >= 5 THEN now() + interval '1 minute'
      ELSE NULL
    END,
    updated_at = now();

  RETURN _result;
END;
$$;

-- Function to check feature flag
CREATE OR REPLACE FUNCTION public.is_feature_enabled(_key text, _user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _flag RECORD;
BEGIN
  SELECT * INTO _flag FROM feature_flags WHERE key = _key;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT _flag.enabled THEN RETURN false; END IF;
  
  -- Full rollout
  IF _flag.rollout_percentage >= 100 THEN RETURN true; END IF;
  
  -- Role-based check
  IF _user_id IS NOT NULL AND array_length(_flag.allowed_roles, 1) > 0 THEN
    IF EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = _user_id AND ur.role::text = ANY(_flag.allowed_roles)
    ) THEN RETURN true; END IF;
  END IF;
  
  -- Percentage rollout (deterministic hash)
  IF _user_id IS NOT NULL AND _flag.rollout_percentage > 0 THEN
    RETURN (abs(hashtext(_user_id::text || _key)) % 100) < _flag.rollout_percentage;
  END IF;
  
  RETURN false;
END;
$$;

-- Get runtime system stats
CREATE OR REPLACE FUNCTION public.runtime_system_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN jsonb_build_object(
    'services_healthy', (SELECT COUNT(*) FROM runtime_health WHERE circuit_state = 'closed'),
    'services_degraded', (SELECT COUNT(*) FROM runtime_health WHERE circuit_state = 'half_open'),
    'services_down', (SELECT COUNT(*) FROM runtime_health WHERE circuit_state = 'open'),
    'validations_1h', (SELECT COUNT(*) FROM runtime_validations WHERE created_at > now() - interval '1 hour'),
    'denials_1h', (SELECT COUNT(*) FROM runtime_validations WHERE created_at > now() - interval '1 hour' AND verdict = 'DENY'),
    'avg_latency_ms', (SELECT COALESCE(AVG(avg_latency_ms), 0) FROM runtime_health),
    'feature_flags_active', (SELECT COUNT(*) FROM feature_flags WHERE enabled = true),
    'active_jobs', (SELECT COUNT(*) FROM neuron_jobs WHERE status IN ('pending', 'running'))
  );
END;
$$;

-- Seed default system config
INSERT INTO public.system_config (key, value, description, category) VALUES
('circuit_breaker_threshold', '{"failures": 10, "cooldown_seconds": 300}', 'Circuit breaker open threshold', 'runtime'),
('rate_limit_default', '{"requests_per_minute": 60, "burst": 10}', 'Default rate limit for edge functions', 'security'),
('max_concurrent_jobs', '{"value": 5}', 'Max concurrent jobs per user', 'execution'),
('wallet_snapshot_ttl', '{"seconds": 60}', 'Wallet snapshot freshness TTL', 'wallet'),
('daily_xp_cap', '{"value": 200}', 'Maximum XP earnable per day', 'gamification');

-- Seed feature flags
INSERT INTO public.feature_flags (key, enabled, description, rollout_percentage) VALUES
('vip_tier', true, 'CusnirOS VIP tier access', 100),
('data_pipeline', true, 'Data collection pipeline', 100),
('knowledge_dashboard', true, 'Knowledge base dashboard', 100),
('war_rooms', false, 'VIP War Room collaboration', 0),
('advanced_analytics', false, 'Advanced analytics dashboard', 0);
