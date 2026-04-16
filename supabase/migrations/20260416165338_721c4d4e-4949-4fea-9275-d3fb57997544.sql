-- F-003: Drop overly permissive SELECT policies on service_units
-- These allow any authenticated user to read cost_json, pricing_json, score_json
DROP POLICY IF EXISTS "service_units_auth_read" ON public.service_units;
DROP POLICY IF EXISTS "service_units_select_authenticated" ON public.service_units;

-- Ensure admin-only SELECT policy exists (admin_full covers ALL ops, but add explicit SELECT for clarity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'service_units' AND policyname = 'service_units_admin_full'
  ) THEN
    CREATE POLICY "service_units_admin_full" ON public.service_units
      FOR ALL USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;