
-- ═══════════════════════════════════════════════════════════
-- Admin Panel Production — Granular permissions, compliance, emergency controls
-- ═══════════════════════════════════════════════════════════

-- Admin permissions (granular RBAC beyond basic roles)
CREATE TABLE public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_key text NOT NULL,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, permission_key)
);

-- Compliance audit log (immutable)
CREATE TABLE public.compliance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action_type text NOT NULL,
  target_type text NOT NULL DEFAULT 'user',
  target_id text,
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'info',
  ip_hint text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Emergency controls
CREATE TABLE public.emergency_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_type text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  activated_by uuid,
  activated_at timestamptz,
  deactivated_at timestamptz,
  reason text NOT NULL DEFAULT '',
  affected_scope text NOT NULL DEFAULT 'global',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin activity sessions
CREATE TABLE public.admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_count integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_action_at timestamptz NOT NULL DEFAULT now(),
  ip_hint text,
  user_agent text,
  metadata jsonb DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_admin_perms_user ON public.admin_permissions(user_id);
CREATE INDEX idx_compliance_log_actor ON public.compliance_log(actor_id, created_at DESC);
CREATE INDEX idx_compliance_log_target ON public.compliance_log(target_type, target_id);
CREATE INDEX idx_emergency_controls_active ON public.emergency_controls(is_active);
CREATE INDEX idx_admin_sessions_admin ON public.admin_sessions(admin_id, started_at DESC);

-- RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Admin-only access for all tables
CREATE POLICY "Admin manage admin_permissions" ON public.admin_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage compliance_log" ON public.compliance_log FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage emergency_controls" ON public.emergency_controls FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage admin_sessions" ON public.admin_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Prevent compliance log modifications (append-only)
CREATE TRIGGER compliance_log_no_update BEFORE UPDATE ON public.compliance_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_update();
CREATE TRIGGER compliance_log_no_delete BEFORE DELETE ON public.compliance_log
FOR EACH ROW EXECUTE FUNCTION public.prevent_ledger_delete();

-- Function to check granular admin permission
CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Super-admin (has 'admin' role) gets everything
  IF has_role(_user_id, 'admin') THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE user_id = _user_id
      AND permission_key = _permission
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$;

-- Function to log compliance action
CREATE OR REPLACE FUNCTION public.log_compliance(_actor_id uuid, _action text, _target_type text, _target_id text DEFAULT NULL, _description text DEFAULT '', _severity text DEFAULT 'info')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO compliance_log (actor_id, action_type, target_type, target_id, description, severity)
  VALUES (_actor_id, _action, _target_type, _target_id, _description, _severity)
  RETURNING id INTO _id;
  
  RETURN _id;
END;
$$;

-- Function to activate emergency control
CREATE OR REPLACE FUNCTION public.activate_emergency(_control_type text, _reason text, _scope text DEFAULT 'global')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _admin_id uuid;
  _id uuid;
BEGIN
  _admin_id := auth.uid();
  IF NOT has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can activate emergency controls';
  END IF;

  INSERT INTO emergency_controls (control_type, is_active, activated_by, activated_at, reason, affected_scope)
  VALUES (_control_type, true, _admin_id, now(), _reason, _scope)
  RETURNING id INTO _id;

  -- Log to compliance
  PERFORM log_compliance(_admin_id, 'emergency_activate', 'system', _control_type, _reason, 'critical');

  -- Log to decision ledger
  INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason, metadata)
  VALUES ('emergency_control', _admin_id, _control_type, 'ACTIVATED', _reason,
    jsonb_build_object('scope', _scope, 'control_id', _id));

  RETURN _id;
END;
$$;

-- Function to deactivate emergency control
CREATE OR REPLACE FUNCTION public.deactivate_emergency(_control_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _admin_id uuid;
BEGIN
  _admin_id := auth.uid();
  IF NOT has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can deactivate emergency controls';
  END IF;

  UPDATE emergency_controls SET
    is_active = false,
    deactivated_at = now(),
    updated_at = now()
  WHERE id = _control_id AND is_active = true;

  IF NOT FOUND THEN RETURN false; END IF;

  PERFORM log_compliance(_admin_id, 'emergency_deactivate', 'system', _control_id::text, '', 'critical');

  RETURN true;
END;
$$;

-- Seed default emergency control types (inactive)
INSERT INTO public.emergency_controls (control_type, reason, affected_scope) VALUES
('maintenance_mode', 'Platform maintenance window', 'global'),
('job_freeze', 'Freeze all job execution', 'execution'),
('registration_lock', 'Lock new user registration', 'auth'),
('credit_freeze', 'Freeze all credit operations', 'wallet'),
('api_lockdown', 'Lock external API access', 'api');
