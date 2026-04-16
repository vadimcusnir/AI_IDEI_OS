CREATE OR REPLACE FUNCTION public.mcl_compute_priority(
  _revenue_potential numeric, _urgency numeric, _frequency numeric,
  _effort numeric, _strategic_value numeric, _risk numeric
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT (COALESCE(_revenue_potential,0)*0.30)
       + (COALESCE(_urgency,0)*0.20)
       + (COALESCE(_frequency,0)*0.15)
       + (COALESCE(_strategic_value,0)*0.20)
       - (COALESCE(_effort,0)*0.10)
       - (COALESCE(_risk,0)*0.05);
$$;