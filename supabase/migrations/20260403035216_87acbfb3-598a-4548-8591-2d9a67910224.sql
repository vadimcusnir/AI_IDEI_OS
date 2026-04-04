
-- ═══════════════════════════════════════════════════
-- FAZA 11: AUTOMATION & DISTRIBUTION
-- ═══════════════════════════════════════════════════

-- T11.1: Automation Tables

CREATE TABLE public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  job_type text NOT NULL DEFAULT 'recurring_extract',
  service_unit_id uuid REFERENCES public.service_units(id),
  config jsonb NOT NULL DEFAULT '{}',
  schedule_cron text,
  is_active boolean NOT NULL DEFAULT true,
  max_runs integer DEFAULT NULL,
  total_runs integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.automation_jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  neurons_spent numeric NOT NULL DEFAULT 0,
  result_summary text,
  artifact_ids uuid[] DEFAULT '{}',
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.automation_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.automation_jobs(id) ON DELETE CASCADE,
  trigger_type text NOT NULL DEFAULT 'cron',
  trigger_config jsonb NOT NULL DEFAULT '{}',
  last_fired_at timestamptz,
  fire_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.distribution_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type text NOT NULL,
  channel_name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  total_sends integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.distribution_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.distribution_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES public.artifacts(id),
  automation_run_id uuid REFERENCES public.automation_runs(id),
  content_preview text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  delivery_metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_automation_jobs_user ON public.automation_jobs(user_id);
CREATE INDEX idx_automation_jobs_next_run ON public.automation_jobs(next_run_at) WHERE is_active = true;
CREATE INDEX idx_automation_runs_job ON public.automation_runs(job_id);
CREATE INDEX idx_automation_runs_status ON public.automation_runs(status);
CREATE INDEX idx_distribution_channels_user ON public.distribution_channels(user_id);
CREATE INDEX idx_distribution_sends_channel ON public.distribution_sends(channel_id);

-- RLS
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automation_jobs" ON public.automation_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own automation_runs" ON public.automation_runs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own triggers" ON public.automation_triggers FOR SELECT TO authenticated USING (job_id IN (SELECT id FROM public.automation_jobs WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own distribution_channels" ON public.distribution_channels FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own distribution_sends" ON public.distribution_sends FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime for runs monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_runs;
