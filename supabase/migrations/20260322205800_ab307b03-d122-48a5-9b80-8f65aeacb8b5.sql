
-- =============================================
-- OS MODULES REGISTRY — P1
-- =============================================

CREATE TABLE public.os_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT UNIQUE NOT NULL,
  module_name TEXT NOT NULL,
  module_type TEXT NOT NULL DEFAULT 'infra' CHECK (module_type IN ('infra', 'actor', 'observer', 'external')),
  version TEXT NOT NULL DEFAULT 'v1.0',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'deprecated', 'experimental')),
  owner TEXT NOT NULL DEFAULT 'Core',
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'warning', 'critical')),
  avg_latency_ms INTEGER DEFAULT 0,
  error_rate NUMERIC DEFAULT 0,
  last_health_check TIMESTAMPTZ DEFAULT now(),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.os_modules ENABLE ROW LEVEL SECURITY;

-- Admin-only write, authenticated read
CREATE POLICY "Authenticated users can read os_modules" ON public.os_modules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage os_modules" ON public.os_modules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_os_modules_updated_at BEFORE UPDATE ON public.os_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- System stats RPC for /cusnir-os
CREATE OR REPLACE FUNCTION public.os_system_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN jsonb_build_object(
    'total_modules', (SELECT COUNT(*) FROM os_modules),
    'active_modules', (SELECT COUNT(*) FROM os_modules WHERE status = 'active'),
    'healthy_modules', (SELECT COUNT(*) FROM os_modules WHERE health_status = 'healthy'),
    'warning_modules', (SELECT COUNT(*) FROM os_modules WHERE health_status = 'warning'),
    'critical_modules', (SELECT COUNT(*) FROM os_modules WHERE health_status = 'critical'),
    'avg_latency_ms', (SELECT COALESCE(AVG(avg_latency_ms), 0) FROM os_modules WHERE status = 'active'),
    'avg_error_rate', (SELECT COALESCE(AVG(error_rate), 0) FROM os_modules WHERE status = 'active'),
    'active_jobs', (SELECT COUNT(*) FROM neuron_jobs WHERE status IN ('pending', 'processing')),
    'queue_depth', (SELECT COUNT(*) FROM neuron_jobs WHERE status = 'pending'),
    'decision_ledger_24h', (SELECT COUNT(*) FROM decision_ledger WHERE created_at > now() - interval '24 hours'),
    'os_version', 'v1.0.0',
    'prompt_system_version', 'v1.0'
  );
END;
$$;
