
-- Add size_bytes and stored_at to artifacts
ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS size_bytes bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stored_at timestamptz DEFAULT now();

-- Create billing_config table
CREATE TABLE IF NOT EXISTS public.billing_config (
  config_key text PRIMARY KEY,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.billing_config ENABLE ROW LEVEL SECURITY;

-- Only admins can modify billing config
CREATE POLICY "Anyone can read billing_config"
  ON public.billing_config FOR SELECT
  TO authenticated USING (true);

-- Insert default storage billing config
INSERT INTO public.billing_config (config_key, config_value, description) VALUES
  ('storage_rate', '{"neurons_per_gb_month": 50}', 'Storage cost: NEURONS per GB per month'),
  ('storage_free_days', '{"days": 30}', 'Free storage period for new artifacts'),
  ('storage_free_gb', '{"gb": 5}', 'Free storage quota per workspace in GB')
ON CONFLICT (config_key) DO NOTHING;

-- Create storage_billing_log for audit trail
CREATE TABLE IF NOT EXISTS public.storage_billing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid REFERENCES public.workspaces(id),
  billing_date date NOT NULL DEFAULT CURRENT_DATE,
  total_bytes bigint DEFAULT 0,
  billable_bytes bigint DEFAULT 0,
  neurons_charged integer DEFAULT 0,
  artifact_count integer DEFAULT 0,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.storage_billing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing log"
  ON public.storage_billing_log FOR SELECT
  TO authenticated USING (user_id = auth.uid());

-- Index for fast billing queries
CREATE INDEX IF NOT EXISTS idx_artifacts_author_size
  ON public.artifacts (author_id, size_bytes)
  WHERE size_bytes > 0;

CREATE INDEX IF NOT EXISTS idx_storage_billing_user_date
  ON public.storage_billing_log (user_id, billing_date DESC);

-- RPC to calculate storage cost for a user
CREATE OR REPLACE FUNCTION public.calculate_storage_cost(p_user_id uuid)
RETURNS TABLE (
  total_bytes bigint,
  billable_bytes bigint,
  free_bytes bigint,
  cost_neurons integer,
  artifact_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_gb numeric;
  v_rate numeric;
  v_free_days integer;
  v_total bigint;
  v_billable bigint;
  v_count bigint;
BEGIN
  -- Get config values
  SELECT (config_value->>'gb')::numeric INTO v_free_gb
    FROM billing_config WHERE config_key = 'storage_free_gb';
  SELECT (config_value->>'neurons_per_gb_month')::numeric INTO v_rate
    FROM billing_config WHERE config_key = 'storage_rate';
  SELECT (config_value->>'days')::integer INTO v_free_days
    FROM billing_config WHERE config_key = 'storage_free_days';

  v_free_gb := COALESCE(v_free_gb, 5);
  v_rate := COALESCE(v_rate, 50);
  v_free_days := COALESCE(v_free_days, 30);

  -- Calculate total storage (only billable artifacts past free period)
  SELECT COALESCE(SUM(size_bytes), 0), COUNT(*)
    INTO v_total, v_count
    FROM artifacts
    WHERE author_id = p_user_id
      AND size_bytes > 0;

  -- Billable = total minus free tier
  v_billable := GREATEST(0, v_total - (v_free_gb * 1073741824)::bigint);

  RETURN QUERY SELECT
    v_total,
    v_billable,
    LEAST(v_total, (v_free_gb * 1073741824)::bigint),
    CEIL((v_billable::numeric / 1073741824) * v_rate)::integer,
    v_count;
END;
$$;
