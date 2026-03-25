
-- =========================================================
-- CUSNIR_OS SUPERLAYER — DATABASE SCHEMA (Spec Section 11)
-- =========================================================

-- OTOS: One-Thing Operating Systems (atomic mechanisms)
CREATE TABLE public.os_otos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mechanism TEXT NOT NULL DEFAULT '',
  output_type TEXT NOT NULL DEFAULT 'system',
  description TEXT DEFAULT '',
  domain TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MMS: Multi-Mechanism Systems (composed from OTOS)
CREATE TABLE public.os_mms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  intent TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  otos_ids UUID[] DEFAULT '{}',
  complexity_level INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LCSS: Large Composite Strategic Systems (composed from MMS)
CREATE TABLE public.os_lcss (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  macro_intent TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  mms_ids UUID[] DEFAULT '{}',
  strategic_value INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OS Agents: autonomous execution units
CREATE TABLE public.os_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  capabilities TEXT[] DEFAULT '{}',
  agent_type TEXT NOT NULL DEFAULT 'executor',
  status TEXT NOT NULL DEFAULT 'standby',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_active_at TIMESTAMPTZ,
  performance_score NUMERIC(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OS Executions: execution log for agents/systems
CREATE TABLE public.os_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.os_agents(id) ON DELETE SET NULL,
  otos_id UUID REFERENCES public.os_otos(id) ON DELETE SET NULL,
  mms_id UUID REFERENCES public.os_mms(id) ON DELETE SET NULL,
  lcss_id UUID REFERENCES public.os_lcss(id) ON DELETE SET NULL,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  performance JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  credits_cost NUMERIC(10,2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Memory patterns: persistent learning store
CREATE TABLE public.os_memory_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL DEFAULT 'success',
  category TEXT NOT NULL DEFAULT 'general',
  pattern_data JSONB NOT NULL DEFAULT '{}',
  frequency INT NOT NULL DEFAULT 1,
  effectiveness_score NUMERIC(5,2) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Power unlocks: gamified capability progression
CREATE TABLE public.os_power_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability_key TEXT NOT NULL,
  capability_name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  xp_cost INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'base',
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, capability_key)
);

-- =========================================================
-- RLS POLICIES
-- =========================================================

ALTER TABLE public.os_otos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_mms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_lcss ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_memory_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_power_unlocks ENABLE ROW LEVEL SECURITY;

-- Admin full access on all OS tables
CREATE POLICY "admin_full_access" ON public.os_otos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access" ON public.os_mms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access" ON public.os_lcss FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access" ON public.os_agents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access" ON public.os_executions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access" ON public.os_memory_patterns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin_full_access" ON public.os_power_unlocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Owner read for executions and patterns
CREATE POLICY "os_executions_select_own" ON public.os_executions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "os_memory_patterns_select_own" ON public.os_memory_patterns FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "os_power_unlocks_select_own" ON public.os_power_unlocks FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Authenticated read for system definitions
CREATE POLICY "os_otos_select_auth" ON public.os_otos FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_mms_select_auth" ON public.os_mms FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_lcss_select_auth" ON public.os_lcss FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_agents_select_auth" ON public.os_agents FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX idx_os_executions_user ON public.os_executions(user_id, created_at DESC);
CREATE INDEX idx_os_executions_status ON public.os_executions(status) WHERE status NOT IN ('completed', 'failed');
CREATE INDEX idx_os_memory_patterns_user ON public.os_memory_patterns(user_id, pattern_type);
CREATE INDEX idx_os_power_unlocks_user ON public.os_power_unlocks(user_id);
