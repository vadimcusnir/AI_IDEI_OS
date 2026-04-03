
-- Command Layer tables for Phase 8

-- T8.1: command_decisions — stores each command engine decision
CREATE TABLE public.command_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT,
  user_goal TEXT NOT NULL,
  system_state JSONB DEFAULT '{}'::jsonb,
  pipeline_result JSONB DEFAULT '{}'::jsonb,
  next_actions JSONB DEFAULT '[]'::jsonb,
  priority_tasks JSONB DEFAULT '[]'::jsonb,
  agent_sequences JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  command_type TEXT NOT NULL DEFAULT 'generate_revenue',
  priority_score NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'suggested',
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.command_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own decisions" ON public.command_decisions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users create own decisions" ON public.command_decisions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own decisions" ON public.command_decisions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- T8.2: decision_pipeline_stages — tracks 6-stage pipeline per decision
CREATE TABLE public.decision_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.command_decisions(id) ON DELETE CASCADE,
  stage_order INT NOT NULL,
  stage_name TEXT NOT NULL,
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  duration_ms INT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.decision_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own pipeline stages" ON public.decision_pipeline_stages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.command_decisions cd WHERE cd.id = decision_id AND cd.user_id = auth.uid()));

-- T8.4: command_types registry
CREATE TABLE public.command_types (
  type_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Zap',
  color TEXT NOT NULL DEFAULT 'primary',
  weight_impact NUMERIC(3,2) NOT NULL DEFAULT 0.35,
  weight_revenue NUMERIC(3,2) NOT NULL DEFAULT 0.35,
  weight_urgency NUMERIC(3,2) NOT NULL DEFAULT 0.20,
  weight_effort NUMERIC(3,2) NOT NULL DEFAULT 0.10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.command_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read command types" ON public.command_types
  FOR SELECT TO authenticated USING (true);

-- Enable realtime for command_decisions
ALTER PUBLICATION supabase_realtime ADD TABLE public.command_decisions;
