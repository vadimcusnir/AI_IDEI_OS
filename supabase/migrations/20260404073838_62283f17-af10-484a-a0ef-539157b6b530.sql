
-- Profile Jobs — execution lifecycle tracking
CREATE TABLE IF NOT EXISTS public.profile_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES intelligence_profiles(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  job_type text NOT NULL DEFAULT 'generate',
  status text NOT NULL DEFAULT 'created',
  input_params jsonb DEFAULT '{}'::jsonb,
  output_data jsonb,
  error_message text,
  credits_cost integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pj_user ON profile_jobs(user_id);
CREATE INDEX idx_pj_status ON profile_jobs(status);
CREATE INDEX idx_pj_profile ON profile_jobs(profile_id);

-- Profile Artifacts — generated assets from profiles
CREATE TABLE IF NOT EXISTS public.profile_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES intelligence_profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES profile_jobs(id) ON DELETE SET NULL,
  artifact_type text NOT NULL DEFAULT 'profile_snapshot',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  format text DEFAULT 'json',
  title text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pa_profile ON profile_artifacts(profile_id);

-- RLS
ALTER TABLE profile_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage profile_jobs" ON profile_jobs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own profile jobs" ON profile_jobs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users create own profile jobs" ON profile_jobs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins manage profile_artifacts" ON profile_artifacts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own profile artifacts" ON profile_artifacts
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Trigger for updated_at on profile_jobs
CREATE TRIGGER trg_pj_updated_at
  BEFORE UPDATE ON profile_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
