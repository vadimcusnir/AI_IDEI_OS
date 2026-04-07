-- 1. Drop the overly broad ALL policy that includes SELECT
DROP POLICY IF EXISTS "Users manage own integrations" ON public.user_integrations;

-- 2. Re-add ALL policy scoped to INSERT/UPDATE/DELETE only (not SELECT)
-- Already have separate insert/update/delete policies, so this is not needed.

-- 3. Revoke column-level SELECT on auth_tokens
REVOKE SELECT (auth_tokens) ON public.user_integrations FROM authenticated;
REVOKE SELECT (auth_tokens) ON public.user_integrations FROM anon;

-- 4. Ensure the safe view has security_invoker=on
DROP VIEW IF EXISTS public.user_integrations_safe;
CREATE VIEW public.user_integrations_safe WITH (security_invoker=on) AS
SELECT id, user_id, connector_id, status, settings,
       documents_imported, neurons_generated,
       last_sync_at, next_sync_at, sync_interval_hours,
       error_message, created_at, updated_at
FROM public.user_integrations;

GRANT SELECT ON public.user_integrations_safe TO authenticated;