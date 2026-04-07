CREATE OR REPLACE VIEW public.service_manifests_public WITH (security_invoker=on) AS
SELECT id, service_key, pipeline_class, is_validated, base_neurons,
       preview_enabled, created_at
FROM public.service_manifests
WHERE is_validated = true;

GRANT SELECT ON public.service_manifests_public TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_active_services()
RETURNS TABLE(id uuid, service_key text, pipeline_class text, base_neurons int, preview_enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, service_key, pipeline_class, base_neurons, preview_enabled
  FROM public.service_manifests WHERE is_validated = true ORDER BY service_key;
$$;