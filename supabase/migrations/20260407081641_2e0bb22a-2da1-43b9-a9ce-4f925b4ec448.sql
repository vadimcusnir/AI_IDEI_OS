-- FIX ERROR 1: user_integrations auth_tokens — already have column revoke, ensure no broad SELECT
-- Drop any permissive SELECT that exposes auth_tokens
DROP POLICY IF EXISTS "Users can read own integrations" ON public.user_integrations;
CREATE POLICY "Users read own integrations safe"
ON public.user_integrations FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- FIX ERROR 2: webhook_endpoints secret — already revoked column SELECT, ensure policy is scoped
DROP POLICY IF EXISTS "Users can read own webhooks" ON public.webhook_endpoints;
CREATE POLICY "Users read own webhooks"
ON public.webhook_endpoints FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- FIX WARN: anomaly_alerts — remove user write access (system-only)
DROP POLICY IF EXISTS "Users can insert own alerts" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "Users can delete own alerts" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "anomaly_alerts_insert" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "anomaly_alerts_update" ON public.anomaly_alerts;
DROP POLICY IF EXISTS "anomaly_alerts_delete" ON public.anomaly_alerts;

-- FIX WARN: dynamic_pricing_log — remove user write access (system-only)
DROP POLICY IF EXISTS "Users can insert own pricing log" ON public.dynamic_pricing_log;
DROP POLICY IF EXISTS "Users can update own pricing log" ON public.dynamic_pricing_log;
DROP POLICY IF EXISTS "Users can delete own pricing log" ON public.dynamic_pricing_log;
DROP POLICY IF EXISTS "dynamic_pricing_log_insert" ON public.dynamic_pricing_log;
DROP POLICY IF EXISTS "dynamic_pricing_log_update" ON public.dynamic_pricing_log;
DROP POLICY IF EXISTS "dynamic_pricing_log_delete" ON public.dynamic_pricing_log;

-- FIX WARN: incoming_webhooks — revoke SELECT on webhook_key column
REVOKE SELECT (webhook_key) ON public.incoming_webhooks FROM authenticated, anon;

-- FIX WARN: login_attempts — ensure no user INSERT exists
DROP POLICY IF EXISTS "Users insert own attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "login_attempts_insert" ON public.login_attempts;