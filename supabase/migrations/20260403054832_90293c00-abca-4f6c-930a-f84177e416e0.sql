
CREATE TABLE IF NOT EXISTS public.provider_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  auth_status TEXT NOT NULL DEFAULT 'unknown',
  quota_status TEXT NOT NULL DEFAULT 'unknown',
  spend_status TEXT NOT NULL DEFAULT 'unknown',
  balance_remaining NUMERIC,
  quota_remaining NUMERIC,
  quota_limit NUMERIC,
  monthly_spend NUMERIC,
  failure_rate_1h NUMERIC DEFAULT 0,
  failure_rate_24h NUMERIC DEFAULT 0,
  avg_latency_1h NUMERIC DEFAULT 0,
  avg_latency_24h NUMERIC DEFAULT 0,
  retry_rate NUMERIC DEFAULT 0,
  last_successful_call TIMESTAMPTZ,
  last_failed_call TIMESTAMPTZ,
  error_signatures JSONB DEFAULT '[]'::jsonb,
  alert_level TEXT DEFAULT 'none',
  metadata JSONB DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_cost_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_type TEXT NOT NULL,
  provider_key TEXT,
  service_key TEXT,
  user_id UUID,
  tier TEXT,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  amount_credits NUMERIC DEFAULT 0,
  cost_category TEXT NOT NULL DEFAULT 'measured',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  provider_key TEXT,
  service_key TEXT,
  title TEXT NOT NULL,
  description TEXT,
  error_signal TEXT,
  impact_scope TEXT,
  recommended_action TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  occurrences INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.unit_economics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  segment TEXT,
  tier TEXT,
  service_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_cost_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_economics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_provider_health" ON public.provider_health_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_provider_health" ON public.provider_health_checks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_read_cost_ledger" ON public.platform_cost_ledger FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_cost_ledger" ON public.platform_cost_ledger FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_read_alerts" ON public.admin_alerts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_alerts" ON public.admin_alerts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_update_alerts" ON public.admin_alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_read_unit_economics" ON public.unit_economics_daily FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_insert_unit_economics" ON public.unit_economics_daily FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX idx_unit_economics_unique ON public.unit_economics_daily (snapshot_date, metric_key, COALESCE(segment, ''), COALESCE(tier, ''), COALESCE(service_key, ''));
CREATE INDEX idx_provider_health_provider ON public.provider_health_checks (provider_key, checked_at DESC);
CREATE INDEX idx_cost_ledger_period ON public.platform_cost_ledger (created_at DESC, cost_type);
CREATE INDEX idx_admin_alerts_active ON public.admin_alerts (severity, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_unit_economics_date ON public.unit_economics_daily (snapshot_date DESC, metric_key);

CREATE OR REPLACE FUNCTION public.finops_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN '{}'::jsonb;
  END IF;
  SELECT jsonb_build_object(
    'jobs_running', (SELECT COUNT(*) FROM neuron_jobs WHERE status IN ('pending', 'running')),
    'jobs_failed_1h', (SELECT COUNT(*) FROM neuron_jobs WHERE status = 'failed' AND created_at > now() - interval '1 hour'),
    'jobs_failed_24h', (SELECT COUNT(*) FROM neuron_jobs WHERE status = 'failed' AND created_at > now() - interval '24 hours'),
    'jobs_completed_24h', (SELECT COUNT(*) FROM neuron_jobs WHERE status = 'completed' AND created_at > now() - interval '24 hours'),
    'total_credits_spent_24h', (SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE tx_type = 'spend' AND created_at > now() - interval '24 hours'),
    'total_credits_refunded_24h', (SELECT COALESCE(SUM(amount), 0) FROM credit_transactions WHERE tx_type = 'refund' AND created_at > now() - interval '24 hours'),
    'active_alerts', (SELECT COUNT(*) FROM admin_alerts WHERE resolved_at IS NULL),
    'critical_alerts', (SELECT COUNT(*) FROM admin_alerts WHERE resolved_at IS NULL AND severity = 'critical'),
    'total_users', (SELECT COUNT(*) FROM user_credits),
    'avg_job_cost', (SELECT COALESCE(AVG(amount), 0) FROM credit_transactions WHERE tx_type = 'spend' AND created_at > now() - interval '24 hours')
  ) INTO result;
  RETURN result;
END;
$$;
