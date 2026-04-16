
-- ═══════════════════════════════════════════════════════════════
-- GOVERNANCE HARDENING: Approval workflow + Version lock + TTL + Monitoring
-- ═══════════════════════════════════════════════════════════════

-- 1. PROMPT VAULT: Version locking
ALTER TABLE public.prompt_vault
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID;

-- Trigger: block UPDATE on locked prompts (except unlock by admin)
CREATE OR REPLACE FUNCTION public.enforce_prompt_vault_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_locked = true AND NEW.is_locked = true THEN
    RAISE EXCEPTION 'Cannot modify locked prompt (version %). Unlock first via approval workflow.', OLD.version;
  END IF;
  IF OLD.is_locked = false AND NEW.is_locked = true THEN
    NEW.locked_at = now();
    NEW.locked_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prompt_vault_lock ON public.prompt_vault;
CREATE TRIGGER trg_prompt_vault_lock
  BEFORE UPDATE ON public.prompt_vault
  FOR EACH ROW EXECUTE FUNCTION public.enforce_prompt_vault_lock();

-- 2. PROMPT VAULT CHANGE REQUESTS (approval workflow)
CREATE TABLE IF NOT EXISTS public.prompt_vault_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompt_vault(id) ON DELETE CASCADE,
  service_unit_id UUID,
  requested_by UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('create','update','unlock','deactivate')),
  proposed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  diff_summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','applied')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_vault_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pvcr_admin_all" ON public.prompt_vault_change_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. ARTIFACT RETENTION TTL
ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retention_policy TEXT NOT NULL DEFAULT 'standard';

-- Default: 90 days for standard, NULL = keep forever (locked artifacts)
CREATE OR REPLACE FUNCTION public.set_artifact_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at IS NULL AND NEW.is_locked = false AND NEW.retention_policy = 'standard' THEN
    NEW.expires_at = now() + interval '90 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_artifact_expiry ON public.artifacts;
CREATE TRIGGER trg_artifact_expiry
  BEFORE INSERT ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.set_artifact_expiry();

-- Cleanup function (called by pg_cron later)
CREATE OR REPLACE FUNCTION public.cleanup_expired_artifacts()
RETURNS TABLE(deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM public.artifacts
    WHERE expires_at IS NOT NULL
      AND expires_at < now()
      AND is_locked = false
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_count FROM deleted;
  
  RETURN QUERY SELECT v_count;
END;
$$;

-- 4. MONITORING: Alert trigger on prompt_vault modifications
CREATE OR REPLACE FUNCTION public.alert_on_prompt_vault_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_alerts (
    alert_type, severity, title, description,
    impact_scope, metadata
  ) VALUES (
    'prompt_vault_modification',
    CASE WHEN TG_OP = 'DELETE' THEN 'high' ELSE 'medium' END,
    'Prompt Vault ' || TG_OP,
    format('Prompt for service_unit_id=%s was %s by user %s',
      COALESCE(NEW.service_unit_id, OLD.service_unit_id),
      TG_OP,
      auth.uid()
    ),
    'governance',
    jsonb_build_object(
      'operation', TG_OP,
      'prompt_id', COALESCE(NEW.id, OLD.id),
      'version', COALESCE(NEW.version, OLD.version),
      'actor', auth.uid()
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prompt_vault_alert ON public.prompt_vault;
CREATE TRIGGER trg_prompt_vault_alert
  AFTER INSERT OR UPDATE OR DELETE ON public.prompt_vault
  FOR EACH ROW EXECUTE FUNCTION public.alert_on_prompt_vault_change();

-- 5. MONITORING: Cross-tenant access detection helper
CREATE OR REPLACE FUNCTION public.log_suspicious_export(
  _user_id UUID,
  _artifact_count INTEGER,
  _window_minutes INTEGER DEFAULT 5
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _artifact_count > 50 THEN
    INSERT INTO public.admin_alerts (
      alert_type, severity, title, description, impact_scope, metadata
    ) VALUES (
      'mass_export', 'high',
      'Mass artifact export detected',
      format('User %s exported %s artifacts in %s minutes', _user_id, _artifact_count, _window_minutes),
      'data_exfiltration_risk',
      jsonb_build_object('user_id', _user_id, 'count', _artifact_count, 'window_min', _window_minutes)
    );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_artifacts_expires_at ON public.artifacts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pvcr_status ON public.prompt_vault_change_requests(status, created_at DESC);
