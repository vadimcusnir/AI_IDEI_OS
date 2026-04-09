
-- Drop existing safe view and recreate without auth_tokens
DROP VIEW IF EXISTS public.user_integrations_safe CASCADE;

CREATE VIEW public.user_integrations_safe AS
SELECT 
  id, user_id, connector_id, status, 
  created_at, updated_at,
  last_sync_at, next_sync_at, 
  documents_imported, neurons_generated,
  sync_interval_hours, settings, error_message
FROM public.user_integrations;

-- Grant access to the safe view
GRANT SELECT ON public.user_integrations_safe TO authenticated;
GRANT SELECT ON public.user_integrations_safe TO anon;

-- Ensure base table SELECT policy is scoped to own rows
DROP POLICY IF EXISTS "Users can view own integrations safe" ON public.user_integrations;
DROP POLICY IF EXISTS "user_integrations_select_own" ON public.user_integrations;
DROP POLICY IF EXISTS "user_integrations_select_own_safe" ON public.user_integrations;

CREATE POLICY "user_integrations_select_own" ON public.user_integrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
