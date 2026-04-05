
-- Create immutable wrapper for date_trunc used in index
CREATE OR REPLACE FUNCTION public.trunc_minute(ts timestamptz)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT date_trunc('minute', ts)
$$;

-- Dedup: same source+path within same minute = blocked
CREATE UNIQUE INDEX IF NOT EXISTS idx_llm_referrer_dedup
ON public.llm_referrer_log (
  referrer_source,
  page_path,
  public.trunc_minute(created_at)
);

-- Admin query index
CREATE INDEX IF NOT EXISTS idx_llm_referrer_created
ON public.llm_referrer_log (created_at DESC);
