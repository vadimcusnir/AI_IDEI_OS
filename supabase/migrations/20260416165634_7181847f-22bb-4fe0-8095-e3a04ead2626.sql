-- F-007: Atomic rate limit increment for API keys
CREATE OR REPLACE FUNCTION public.increment_api_key_usage(_key_id uuid, _daily_limit int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_count int;
BEGIN
  UPDATE api_keys
  SET requests_today = requests_today + 1,
      last_used_at = now()
  WHERE id = _key_id
    AND requests_today < _daily_limit
  RETURNING requests_today INTO _new_count;

  RETURN _new_count IS NOT NULL;
END;
$$;