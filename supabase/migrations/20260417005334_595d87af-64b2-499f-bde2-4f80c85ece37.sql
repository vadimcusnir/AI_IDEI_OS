
-- Add columns for YAML prompt automation
ALTER TABLE public.prompt_registry
  ADD COLUMN IF NOT EXISTS yaml_spec text,
  ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'pending'
    CHECK (generation_status IN ('pending','generating','done','failed','manual')),
  ADD COLUMN IF NOT EXISTS generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_model text,
  ADD COLUMN IF NOT EXISTS linked_service_key text,
  ADD COLUMN IF NOT EXISTS generation_error text;

CREATE INDEX IF NOT EXISTS idx_prompt_registry_linked_service
  ON public.prompt_registry(linked_service_key);
CREATE INDEX IF NOT EXISTS idx_prompt_registry_gen_status
  ON public.prompt_registry(generation_status);

-- Batch job tracking
CREATE TABLE IF NOT EXISTS public.prompt_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','paused','done','failed')),
  total_services int NOT NULL DEFAULT 0,
  processed_count int NOT NULL DEFAULT 0,
  success_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  filter_scope text NOT NULL DEFAULT 'all_active',
  model text NOT NULL DEFAULT 'google/gemini-2.5-pro',
  schema_variant text NOT NULL DEFAULT 'extended_cot',
  started_at timestamptz,
  completed_at timestamptz,
  last_processed_service_key text,
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prompt_generation_jobs"
  ON public.prompt_generation_jobs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_prompt_generation_jobs_updated
  BEFORE UPDATE ON public.prompt_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
