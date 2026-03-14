
-- Fix: Drop and recreate view with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.neuron_lifecycle_pricing;

CREATE VIEW public.neuron_lifecycle_pricing 
WITH (security_invoker = true)
AS
SELECT 
  n.id as neuron_id,
  n.lifecycle,
  n.credits_cost as base_cost,
  CASE n.lifecycle
    WHEN 'ingested' THEN 1.0
    WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8
    WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END as lifecycle_multiplier,
  ROUND(n.credits_cost * CASE n.lifecycle
    WHEN 'ingested' THEN 1.0
    WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8
    WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END) as adjusted_cost
FROM neurons n;
