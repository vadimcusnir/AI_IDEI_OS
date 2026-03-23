
-- Add missing execution fields to service_manifests
ALTER TABLE public.service_manifests
ADD COLUMN IF NOT EXISTS base_neurons integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS cost_multiplier numeric DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS preview_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS preview_limit_pct integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS retry_attempts integer DEFAULT 2,
ADD COLUMN IF NOT EXISTS confidence_threshold numeric DEFAULT 0.75;

-- Create service_executions table for tracking runs
CREATE TABLE IF NOT EXISTS public.service_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL,
  manifest_id uuid REFERENCES public.service_manifests(id),
  status text NOT NULL DEFAULT 'pending',
  input jsonb NOT NULL DEFAULT '{}',
  cost_estimated integer DEFAULT 0,
  cost_actual integer DEFAULT 0,
  current_step integer DEFAULT 0,
  total_steps integer DEFAULT 1,
  artifacts_count integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions"
ON public.service_executions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own executions"
ON public.service_executions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own executions"
ON public.service_executions FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Add execution_id to artifacts for linking
ALTER TABLE public.artifacts
ADD COLUMN IF NOT EXISTS execution_id uuid REFERENCES public.service_executions(id),
ADD COLUMN IF NOT EXISTS preview_content text,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT true;

-- Enable realtime for service_executions
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_executions;
