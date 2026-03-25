
-- Rate limit tracking table (replaces in-memory Map)
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id TEXT PRIMARY KEY, -- key = user_id + function_name
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_seconds INTEGER NOT NULL DEFAULT 60,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_entries (window_start);

-- RLS: only service role should access this
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- No public access - only service role (edge functions use service role key)
CREATE POLICY "Service role only" ON public.rate_limit_entries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Cleanup function for expired entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_entries 
  WHERE window_start + (window_seconds || ' seconds')::interval < now();
$$;

-- Atomic check-and-increment function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER DEFAULT 30,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry rate_limit_entries%ROWTYPE;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Try to get existing entry
  SELECT * INTO v_entry FROM rate_limit_entries WHERE id = p_key FOR UPDATE;
  
  IF v_entry IS NULL THEN
    -- New entry
    INSERT INTO rate_limit_entries (id, request_count, window_start, window_seconds, updated_at)
    VALUES (p_key, 1, now(), p_window_seconds, now());
    
    allowed := true;
    remaining := p_max_requests - 1;
    reset_at := now() + (p_window_seconds || ' seconds')::interval;
    RETURN NEXT;
    RETURN;
  END IF;
  
  v_window_end := v_entry.window_start + (v_entry.window_seconds || ' seconds')::interval;
  
  IF now() > v_window_end THEN
    -- Window expired, reset
    UPDATE rate_limit_entries 
    SET request_count = 1, window_start = now(), window_seconds = p_window_seconds, updated_at = now()
    WHERE id = p_key;
    
    allowed := true;
    remaining := p_max_requests - 1;
    reset_at := now() + (p_window_seconds || ' seconds')::interval;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Increment
  UPDATE rate_limit_entries 
  SET request_count = request_count + 1, updated_at = now()
  WHERE id = p_key;
  
  IF v_entry.request_count + 1 > p_max_requests THEN
    allowed := false;
    remaining := 0;
    reset_at := v_window_end;
  ELSE
    allowed := true;
    remaining := p_max_requests - (v_entry.request_count + 1);
    reset_at := v_window_end;
  END IF;
  
  RETURN NEXT;
  RETURN;
END;
$$;
