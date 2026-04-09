-- 1. Create safe public view for service_units (hides internal costs, prompts, scores)
CREATE OR REPLACE VIEW public.service_units_public AS
SELECT
  id, level, name, single_output, single_function, single_decision,
  mechanism, role, domain, intent, status, version, created_at
FROM public.service_units;

-- 2. Revoke anon direct SELECT on service_units and grant on view instead
DROP POLICY IF EXISTS "service_units_anon_read" ON public.service_units;

-- 3. Create anon read policy scoped to authenticated users only (no anon)
CREATE POLICY "service_units_auth_read" ON public.service_units
  FOR SELECT TO authenticated USING (true);

-- 4. Grant anon access to the safe view
GRANT SELECT ON public.service_units_public TO anon;
GRANT SELECT ON public.service_units_public TO authenticated;

-- 5. Fix function search_path on existing functions
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT n.nspname AS schema_name, p.proname AS function_name, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proconfig IS NULL OR NOT ('search_path=public' = ANY(p.proconfig))
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
                     fn.schema_name, fn.function_name, fn.args);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not alter function %.%(%): %', fn.schema_name, fn.function_name, fn.args, SQLERRM;
    END;
  END LOOP;
END$$;