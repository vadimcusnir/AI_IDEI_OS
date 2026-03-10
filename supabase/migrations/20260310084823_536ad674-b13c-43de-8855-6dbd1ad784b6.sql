
-- Move materialized view out of public API exposure
REVOKE SELECT ON public.neuron_stats FROM anon, authenticated;
