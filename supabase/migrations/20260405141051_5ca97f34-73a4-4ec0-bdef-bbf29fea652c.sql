
CREATE OR REPLACE FUNCTION public.trunc_minute(ts timestamptz)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
  SELECT date_trunc('minute', ts)
$$;
