
-- Service presets: users save favorite service combinations
CREATE TABLE public.service_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  service_keys text[] NOT NULL DEFAULT '{}',
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.service_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own presets"
  ON public.service_presets FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public presets visible to all"
  ON public.service_presets FOR SELECT TO authenticated
  USING (is_public = true);

-- Service run history with results
CREATE TABLE public.service_run_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_key text NOT NULL,
  service_name text NOT NULL,
  neuron_id integer,
  job_id uuid,
  status text DEFAULT 'pending',
  credits_cost integer DEFAULT 0,
  duration_ms integer,
  result_preview text DEFAULT '',
  inputs jsonb DEFAULT '{}',
  batch_id uuid,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.service_run_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own run history"
  ON public.service_run_history FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_service_run_history_user ON public.service_run_history(user_id, created_at DESC);
CREATE INDEX idx_service_run_history_batch ON public.service_run_history(batch_id) WHERE batch_id IS NOT NULL;
