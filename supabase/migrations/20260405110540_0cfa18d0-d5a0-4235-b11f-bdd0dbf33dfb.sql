
DROP VIEW IF EXISTS public.capacity_state_public;

CREATE VIEW public.capacity_state_public
WITH (security_invoker = true) AS
SELECT
  id,
  utilization,
  queue_depth,
  premium_only_mode,
  updated_at
FROM public.capacity_state;
