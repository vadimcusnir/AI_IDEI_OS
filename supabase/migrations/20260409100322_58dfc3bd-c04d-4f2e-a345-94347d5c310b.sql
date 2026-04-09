-- User Identity Profiles (extracted from user content)
CREATE TABLE public.user_identity_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'pending',
  completeness_score NUMERIC(5,2) DEFAULT 0,
  tone_of_voice JSONB DEFAULT '{}',
  cognitive_logic JSONB DEFAULT '{}',
  problem_solving_model JSONB DEFAULT '{}',
  knowledge_signature JSONB DEFAULT '{}',
  dark_patterns JSONB DEFAULT '{}',
  operational_identity JSONB DEFAULT '{}',
  identity_layers JSONB DEFAULT '{}',
  source_neuron_ids INTEGER[] DEFAULT '{}',
  last_extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_identity_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own identity" ON public.user_identity_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own identity" ON public.user_identity_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own identity" ON public.user_identity_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Personal OS Configs
CREATE TABLE public.personal_os_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  os_version TEXT NOT NULL DEFAULT '1.0',
  identity_layer JSONB DEFAULT '{}',
  knowledge_layer JSONB DEFAULT '{}',
  execution_layer JSONB DEFAULT '{}',
  adaptation_layer JSONB DEFAULT '{}',
  monetization_layer JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_os_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own OS" ON public.personal_os_configs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own OS" ON public.personal_os_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own OS" ON public.personal_os_configs
  FOR UPDATE USING (auth.uid() = user_id);

-- AI Twin Sessions
CREATE TABLE public.ai_twin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  twin_config_id UUID REFERENCES public.personal_os_configs(id) ON DELETE SET NULL,
  session_context JSONB DEFAULT '{}',
  messages_count INTEGER DEFAULT 0,
  feedback_score NUMERIC(3,2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_twin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own twin sessions" ON public.ai_twin_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own twin sessions" ON public.ai_twin_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own twin sessions" ON public.ai_twin_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_identity_profiles_updated_at
  BEFORE UPDATE ON public.user_identity_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_os_configs_updated_at
  BEFORE UPDATE ON public.personal_os_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();