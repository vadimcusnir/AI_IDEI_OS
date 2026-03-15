
-- ═══════════════════════════════════════════
-- UNIFIED CONTROL LAYER — 3 Registries + Audit
-- ═══════════════════════════════════════════

-- ENUM for edit modes
CREATE TYPE public.edit_mode AS ENUM ('safe', 'strict', 'experimental', 'locked');
CREATE TYPE public.execution_regime AS ENUM ('fast', 'balanced', 'strict', 'simulation', 'emergency');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.control_scope AS ENUM ('global', 'app', 'service', 'user');

-- ═══════════════════════════════════════════
-- 1. PROMPT REGISTRY
-- ═══════════════════════════════════════════
CREATE TABLE public.prompt_registry (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  core_prompt TEXT NOT NULL,
  input_schema JSONB DEFAULT '{}',
  output_schema JSONB DEFAULT '{}',
  modifiers JSONB DEFAULT '[]',
  execution_mode execution_regime NOT NULL DEFAULT 'balanced',
  cost_profile JSONB DEFAULT '{"estimated_tokens": 0, "max_tokens": 4096}',
  scope control_scope NOT NULL DEFAULT 'global',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  editable BOOLEAN NOT NULL DEFAULT true,
  risk_level risk_level NOT NULL DEFAULT 'medium',
  rollback_version INTEGER,
  last_modified_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prompt version history
CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id TEXT NOT NULL REFERENCES public.prompt_registry(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  core_prompt TEXT NOT NULL,
  modifiers JSONB DEFAULT '[]',
  execution_mode execution_regime NOT NULL DEFAULT 'balanced',
  cost_profile JSONB DEFAULT '{}',
  change_reason TEXT DEFAULT '',
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prompt_id, version)
);

-- ═══════════════════════════════════════════
-- 2. EXECUTION REGIMES CONFIG
-- ═══════════════════════════════════════════
CREATE TABLE public.execution_regime_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL,
  regime execution_regime NOT NULL DEFAULT 'balanced',
  max_cost_credits INTEGER DEFAULT 1000,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 300,
  validation_required BOOLEAN DEFAULT true,
  dry_run BOOLEAN DEFAULT false,
  output_marked BOOLEAN DEFAULT false,
  cost_cap_action TEXT DEFAULT 'block',
  fallback_regime execution_regime,
  scope control_scope NOT NULL DEFAULT 'global',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  editable BOOLEAN NOT NULL DEFAULT true,
  risk_level risk_level NOT NULL DEFAULT 'medium',
  last_modified_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service_key, scope)
);

-- ═══════════════════════════════════════════
-- 3. UI CONTROL REGISTRY
-- ═══════════════════════════════════════════
CREATE TABLE public.ui_control_registry (
  id TEXT PRIMARY KEY,
  element_type TEXT NOT NULL DEFAULT 'component',
  label TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  visible BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  action TEXT DEFAULT '',
  permissions TEXT[] DEFAULT '{}',
  state_overrides JSONB DEFAULT '{}',
  scope control_scope NOT NULL DEFAULT 'global',
  version INTEGER NOT NULL DEFAULT 1,
  editable BOOLEAN NOT NULL DEFAULT true,
  risk_level risk_level NOT NULL DEFAULT 'low',
  last_modified_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════
-- 4. CONTROL CHANGE LOG (unified audit)
-- ═══════════════════════════════════════════
CREATE TABLE public.control_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'update',
  old_value JSONB,
  new_value JSONB,
  edit_mode edit_mode NOT NULL DEFAULT 'safe',
  change_reason TEXT DEFAULT '',
  changed_by UUID REFERENCES auth.users(id),
  risk_level risk_level DEFAULT 'low',
  rolled_back BOOLEAN DEFAULT false,
  rolled_back_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════
-- RLS POLICIES — Admin-only access
-- ═══════════════════════════════════════════
ALTER TABLE public.prompt_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_regime_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_control_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_change_log ENABLE ROW LEVEL SECURITY;

-- Read policies (admin can read all, edge functions via service role bypass RLS)
CREATE POLICY "Admins can read prompt_registry" ON public.prompt_registry
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage prompt_registry" ON public.prompt_registry
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read prompt_versions" ON public.prompt_versions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert prompt_versions" ON public.prompt_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage execution_regime_config" ON public.execution_regime_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage ui_control_registry" ON public.ui_control_registry
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read control_change_log" ON public.control_change_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert control_change_log" ON public.control_change_log
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════
CREATE INDEX idx_prompt_registry_category ON public.prompt_registry(category);
CREATE INDEX idx_prompt_registry_active ON public.prompt_registry(is_active);
CREATE INDEX idx_prompt_versions_prompt ON public.prompt_versions(prompt_id, version DESC);
CREATE INDEX idx_execution_regime_service ON public.execution_regime_config(service_key);
CREATE INDEX idx_ui_control_visible ON public.ui_control_registry(visible, enabled);
CREATE INDEX idx_control_change_log_registry ON public.control_change_log(registry_type, item_id);
CREATE INDEX idx_control_change_log_time ON public.control_change_log(created_at DESC);

-- ═══════════════════════════════════════════
-- AUTO-VERSION TRIGGER for prompt_registry
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.prompt_registry_version_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.core_prompt IS DISTINCT FROM NEW.core_prompt
    OR OLD.modifiers IS DISTINCT FROM NEW.modifiers
    OR OLD.execution_mode IS DISTINCT FROM NEW.execution_mode THEN
    
    -- Archive old version
    INSERT INTO prompt_versions (prompt_id, version, core_prompt, modifiers, execution_mode, cost_profile, changed_by)
    VALUES (OLD.id, OLD.version, OLD.core_prompt, OLD.modifiers, OLD.execution_mode, OLD.cost_profile, NEW.last_modified_by);
    
    -- Increment version
    NEW.version := OLD.version + 1;
    NEW.rollback_version := OLD.version;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prompt_registry_version
  BEFORE UPDATE ON public.prompt_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.prompt_registry_version_trigger();

-- Auto-log changes to control_change_log
CREATE OR REPLACE FUNCTION public.control_change_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO control_change_log (registry_type, item_id, change_type, old_value, new_value, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE TG_OP WHEN 'INSERT' THEN 'create' WHEN 'UPDATE' THEN 'update' WHEN 'DELETE' THEN 'delete' END,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    CASE WHEN TG_OP != 'DELETE' THEN NEW.last_modified_by ELSE OLD.last_modified_by END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_prompt_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.prompt_registry
  FOR EACH ROW EXECUTE FUNCTION public.control_change_audit();

CREATE TRIGGER trg_execution_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.execution_regime_config
  FOR EACH ROW EXECUTE FUNCTION public.control_change_audit();

CREATE TRIGGER trg_ui_control_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.ui_control_registry
  FOR EACH ROW EXECUTE FUNCTION public.control_change_audit();
