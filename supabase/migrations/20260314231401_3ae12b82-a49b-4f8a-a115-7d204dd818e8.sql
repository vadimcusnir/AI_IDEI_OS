
-- API Keys table for public REST API access
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  name text NOT NULL DEFAULT 'Default',
  scopes text[] NOT NULL DEFAULT ARRAY['read'],
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  requests_today integer NOT NULL DEFAULT 0,
  daily_limit integer NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Index for fast lookups
CREATE INDEX idx_api_keys_hash ON public.api_keys (key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_user ON public.api_keys (user_id);

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON public.api_keys FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reset daily counters (can be called by cron)
CREATE OR REPLACE FUNCTION public.reset_api_key_counters()
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
  UPDATE api_keys SET requests_today = 0 WHERE requests_today > 0;
$$;
