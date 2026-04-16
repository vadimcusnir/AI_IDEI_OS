
-- ═══ 1. ANOMALY ALERTS — Remove user write policies ═══
DROP POLICY IF EXISTS "anomaly_alerts_insert_own" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "anomaly_alerts_update_own" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "anomaly_alerts_delete_own" ON public.anomaly_alerts;

-- ═══ 2. SECURITY EVENTS — Remove user INSERT policy ═══
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;

-- ═══ 3. USER INTEGRATIONS SAFE VIEW — drop and recreate ═══
DROP VIEW IF EXISTS public.user_integrations_safe;

CREATE VIEW public.user_integrations_safe
WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  connector_id,
  status,
  settings,
  sync_interval_hours,
  last_sync_at,
  next_sync_at,
  documents_imported,
  neurons_generated,
  error_message,
  created_at,
  updated_at
FROM public.user_integrations;

COMMENT ON VIEW public.user_integrations_safe IS 'Safe view excluding auth_tokens from client access';
