
-- T10.1: AIAS Level 1 Agent Profiles
CREATE TABLE public.aias_agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_unit_id UUID REFERENCES public.service_units(id) ON DELETE CASCADE,
  agent_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  certification_level INT NOT NULL DEFAULT 1,
  compliance_score NUMERIC(4,2) DEFAULT 0,
  canonical_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  input_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_contract JSONB NOT NULL DEFAULT '{}'::jsonb,
  job_lifecycle TEXT[] DEFAULT ARRAY['pending','processing','completed','failed'],
  artifact_model JSONB DEFAULT '{}'::jsonb,
  scoring_dimensions JSONB DEFAULT '{"clarity":0,"depth":0,"actionability":0,"precision":0,"commercial_value":0}'::jsonb,
  is_certified BOOLEAN DEFAULT false,
  certified_at TIMESTAMPTZ,
  last_audit_at TIMESTAMPTZ,
  total_executions INT DEFAULT 0,
  success_rate NUMERIC(4,2) DEFAULT 0,
  avg_quality_score NUMERIC(4,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aias_agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read agent profiles" ON public.aias_agent_profiles
  FOR SELECT TO authenticated USING (true);

-- T10.3: AIAS Output Contracts (Context/Execution/Verdict structure)
CREATE TABLE public.aias_output_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID REFERENCES public.aias_agent_profiles(id) ON DELETE CASCADE,
  context_schema JSONB NOT NULL DEFAULT '{"required_fields":["situation","objective","constraints"]}'::jsonb,
  execution_schema JSONB NOT NULL DEFAULT '{"required_fields":["analysis","methodology","findings"]}'::jsonb,
  verdict_schema JSONB NOT NULL DEFAULT '{"required_fields":["recommendation","confidence","next_steps"]}'::jsonb,
  export_formats TEXT[] DEFAULT ARRAY['markdown','json','pdf'],
  auto_library BOOLEAN DEFAULT true,
  quality_gate JSONB DEFAULT '{"min_score":0.65,"required_sections":3}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aias_output_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read output contracts" ON public.aias_output_contracts
  FOR SELECT TO authenticated USING (true);

-- T10.4: AIAS Routing Metadata (enforcement log)
CREATE TABLE public.aias_routing_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_profile_id UUID REFERENCES public.aias_agent_profiles(id) ON DELETE SET NULL,
  service_unit_id UUID,
  user_id UUID NOT NULL,
  request_intent TEXT,
  schema_valid BOOLEAN DEFAULT false,
  score_check_passed BOOLEAN DEFAULT false,
  certification_check BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  routing_confidence NUMERIC(4,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aias_routing_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own routing" ON public.aias_routing_metadata
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
