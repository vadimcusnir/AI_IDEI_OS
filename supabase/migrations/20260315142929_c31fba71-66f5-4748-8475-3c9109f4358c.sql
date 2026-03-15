
-- ============================================================
-- CRITICAL FIX: workspace_members privilege escalation
-- Drop the insecure INSERT policy and replace with a safe one
-- ============================================================

DROP POLICY IF EXISTS "Members can insert workspace_members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can insert workspace_members" ON public.workspace_members;
DROP POLICY IF EXISTS "Workspace members insert" ON public.workspace_members;

-- Only allow: 1) workspace owners to add members, 2) system trigger (auto-assign)
CREATE POLICY "Owners can add workspace members"
  ON public.workspace_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspaces
      WHERE id = workspace_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- FIX: Restrict system_config to admin-only read
-- ============================================================
DROP POLICY IF EXISTS "Authenticated read system_config" ON public.system_config;
CREATE POLICY "Admin read system_config"
  ON public.system_config
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX: Restrict training_samples to admin-only read
-- ============================================================
DROP POLICY IF EXISTS "Authenticated read training_samples" ON public.training_samples;
CREATE POLICY "Admin read training_samples"
  ON public.training_samples
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX: Restrict training_datasets to admin-only read
-- ============================================================
DROP POLICY IF EXISTS "Authenticated read training_datasets" ON public.training_datasets;
CREATE POLICY "Admin read training_datasets"
  ON public.training_datasets
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX: Restrict runtime_health to admin-only read
-- ============================================================
DROP POLICY IF EXISTS "Authenticated read runtime_health" ON public.runtime_health;
CREATE POLICY "Admin read runtime_health"
  ON public.runtime_health
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX: Restrict feature_flags to admin-only read
-- ============================================================
DROP POLICY IF EXISTS "Authenticated read feature_flags" ON public.feature_flags;
CREATE POLICY "Admin read feature_flags"
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX: Restrict imf_pipelines to admin-only read
-- ============================================================
DROP POLICY IF EXISTS "Users read active pipelines" ON public.imf_pipelines;
CREATE POLICY "Admin read imf_pipelines"
  ON public.imf_pipelines
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
