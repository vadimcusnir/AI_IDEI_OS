
-- ═══════════════════════════════════════════
-- AGENT OS: Intent Engine, Planner, Tool Registry, Action Tracking
-- ═══════════════════════════════════════════

-- 1. Agent Intents Registry
CREATE TABLE public.agent_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  default_plan_id UUID,
  confidence_threshold FLOAT NOT NULL DEFAULT 0.6,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active intents" ON public.agent_intents
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage intents" ON public.agent_intents
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. Agent Plan Templates
CREATE TABLE public.agent_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  steps JSONB NOT NULL DEFAULT '[]',
  estimated_credits INTEGER NOT NULL DEFAULT 0,
  estimated_duration_seconds INTEGER NOT NULL DEFAULT 60,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_plan_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read plan templates" ON public.agent_plan_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage plan templates" ON public.agent_plan_templates
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Agent Actions (user-level action sessions)
CREATE TABLE public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL DEFAULT '',
  intent_key TEXT NOT NULL DEFAULT 'general',
  intent_confidence FLOAT NOT NULL DEFAULT 0,
  plan_template_id UUID REFERENCES public.agent_plan_templates(id),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'running', 'completed', 'failed', 'cancelled')),
  total_credits_estimated INTEGER NOT NULL DEFAULT 0,
  total_credits_spent INTEGER NOT NULL DEFAULT 0,
  input_summary TEXT,
  result_summary TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  workspace_id UUID REFERENCES public.workspaces(id)
);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own actions" ON public.agent_actions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own actions" ON public.agent_actions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own actions" ON public.agent_actions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_agent_actions_user ON public.agent_actions(user_id, created_at DESC);

-- 4. Agent Steps (individual steps within an action)
CREATE TABLE public.agent_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES public.agent_actions(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  tool_name TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  input_params JSONB DEFAULT '{}',
  output_data JSONB,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  job_id UUID,
  artifact_id UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own steps" ON public.agent_steps
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agent_actions WHERE id = agent_steps.action_id AND user_id = auth.uid())
  );
CREATE POLICY "System inserts steps" ON public.agent_steps
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_actions WHERE id = agent_steps.action_id AND user_id = auth.uid())
  );
CREATE POLICY "System updates steps" ON public.agent_steps
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.agent_actions WHERE id = agent_steps.action_id AND user_id = auth.uid())
  );

CREATE INDEX idx_agent_steps_action ON public.agent_steps(action_id, step_order);

-- 5. Agent Tool Registry
CREATE TABLE public.agent_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB DEFAULT '{}',
  avg_latency_ms INTEGER DEFAULT 3000,
  avg_credits_cost INTEGER DEFAULT 0,
  service_key TEXT,
  requires_confirmation BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active tools" ON public.agent_tools
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage tools" ON public.agent_tools
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. Agent Action History (for plan learning)
CREATE TABLE public.agent_action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_key TEXT NOT NULL,
  plan_template_id UUID REFERENCES public.agent_plan_templates(id),
  success BOOLEAN NOT NULL DEFAULT false,
  total_steps INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER NOT NULL DEFAULT 0,
  total_credits INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_action_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own history" ON public.agent_action_history
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts history" ON public.agent_action_history
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_agent_history_user ON public.agent_action_history(user_id, created_at DESC);
CREATE INDEX idx_agent_history_intent ON public.agent_action_history(intent_key, success);

-- Enable realtime for agent_steps (progress tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_actions;

-- Function to update plan template success rates
CREATE OR REPLACE FUNCTION public.update_plan_success_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan_template_id IS NOT NULL THEN
    IF NEW.success THEN
      UPDATE agent_plan_templates SET success_count = success_count + 1, updated_at = now()
      WHERE id = NEW.plan_template_id;
    ELSE
      UPDATE agent_plan_templates SET failure_count = failure_count + 1, updated_at = now()
      WHERE id = NEW.plan_template_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_plan_success_rate
  AFTER INSERT ON public.agent_action_history
  FOR EACH ROW EXECUTE FUNCTION public.update_plan_success_rate();
