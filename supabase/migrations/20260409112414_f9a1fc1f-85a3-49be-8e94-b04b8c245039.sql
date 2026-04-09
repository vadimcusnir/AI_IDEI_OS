-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS public.service_units_public;
CREATE VIEW public.service_units_public
WITH (security_invoker = true) AS
SELECT
  id, level, name, single_output, single_function, single_decision,
  mechanism, role, domain, intent, status, version, created_at
FROM public.service_units;

GRANT SELECT ON public.service_units_public TO anon;
GRANT SELECT ON public.service_units_public TO authenticated;