
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users read capacity" ON public.capacity_state;

-- Admin-only full read access
CREATE POLICY "Admins can read capacity_state"
  ON public.capacity_state FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public view with only non-sensitive columns for regular users
CREATE OR REPLACE VIEW public.capacity_state_public AS
SELECT
  id,
  utilization,
  queue_depth,
  premium_only_mode,
  updated_at
FROM public.capacity_state;
