-- CRITICAL FIX 1: runtime_validations — block user self-insert of access verdicts
DROP POLICY IF EXISTS "runtime_validations_insert_own" ON public.runtime_validations;
DROP POLICY IF EXISTS "runtime_validations_update_own" ON public.runtime_validations;

-- CRITICAL FIX 2: access_window_state — block user DELETE (entitlement reset)
DROP POLICY IF EXISTS "access_window_state_delete_own" ON public.access_window_state;

-- CRITICAL FIX 3: dynamic_pricing_log — block remaining user write policies
DROP POLICY IF EXISTS "dynamic_pricing_log_insert_own" ON public.dynamic_pricing_log;
DROP POLICY IF EXISTS "dynamic_pricing_log_update_own" ON public.dynamic_pricing_log;

-- WARN FIX: Storage UPDATE policies for file replacement
CREATE POLICY "Users can update own episode files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'episode-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own notebook files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'notebook-files' AND (storage.foldername(name))[1] = auth.uid()::text);