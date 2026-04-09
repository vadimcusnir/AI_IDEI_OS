
-- 1. Safe view for user_integrations (hide auth_tokens)
DROP VIEW IF EXISTS public.user_integrations_safe;
CREATE VIEW public.user_integrations_safe AS
SELECT id, user_id, connector_id, status, settings, sync_interval_hours, last_sync_at, next_sync_at, documents_imported, neurons_generated, error_message, created_at, updated_at
FROM public.user_integrations;

DROP POLICY IF EXISTS "Users can view own integrations" ON public.user_integrations;
DROP POLICY IF EXISTS "Users can view own integrations safe" ON public.user_integrations;
CREATE POLICY "Users can view own integrations safe"
ON public.user_integrations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Safe view for webhook_endpoints (hide secret)
DROP VIEW IF EXISTS public.webhook_endpoints_safe;
CREATE VIEW public.webhook_endpoints_safe AS
SELECT id, user_id, url, events, is_active, description, failure_count, last_triggered_at, created_at, updated_at
FROM public.webhook_endpoints;

DROP POLICY IF EXISTS "Users can view own webhook endpoints" ON public.webhook_endpoints;
DROP POLICY IF EXISTS "Users can view own webhook endpoints safe" ON public.webhook_endpoints;
CREATE POLICY "Users can view own webhook endpoints safe"
ON public.webhook_endpoints FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. login_attempts: Block authenticated INSERT
DROP POLICY IF EXISTS "Block authenticated inserts to login_attempts" ON public.login_attempts;
CREATE POLICY "Block authenticated inserts to login_attempts"
ON public.login_attempts AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);

-- 4. dedup: Remove overly broad policies
DROP POLICY IF EXISTS "Authenticated users read dedup clusters" ON public.dedup_clusters;
DROP POLICY IF EXISTS "Authenticated users read cluster members" ON public.dedup_cluster_members;

-- 5. identity_dimensions: public → authenticated
DO $$ 
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'identity_dimensions' AND schemaname = 'public' AND roles::text LIKE '%{public}%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.identity_dimensions', pol.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Users can view own identity dimensions" ON public.identity_dimensions;
DROP POLICY IF EXISTS "Users can insert own identity dimensions" ON public.identity_dimensions;
DROP POLICY IF EXISTS "Users can update own identity dimensions" ON public.identity_dimensions;
DROP POLICY IF EXISTS "Users can delete own identity dimensions" ON public.identity_dimensions;

CREATE POLICY "Users can view own identity dimensions" ON public.identity_dimensions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own identity dimensions" ON public.identity_dimensions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own identity dimensions" ON public.identity_dimensions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own identity dimensions" ON public.identity_dimensions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. neuron_versions: public → authenticated (neurons uses author_id)
DROP POLICY IF EXISTS "Users can create versions for own neurons" ON public.neuron_versions;
CREATE POLICY "Users can create versions for own neurons" ON public.neuron_versions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.neurons n WHERE n.id = neuron_id AND n.author_id = auth.uid()));
