
CREATE TABLE public.pipeline_phase_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_phase TEXT NOT NULL,
  to_phase TEXT NOT NULL,
  action_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipeline_phase_log_session ON public.pipeline_phase_log(session_id);
CREATE INDEX idx_pipeline_phase_log_user ON public.pipeline_phase_log(user_id);
CREATE INDEX idx_pipeline_phase_log_created ON public.pipeline_phase_log(created_at DESC);

ALTER TABLE public.pipeline_phase_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phase logs" ON public.pipeline_phase_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own phase logs" ON public.pipeline_phase_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
