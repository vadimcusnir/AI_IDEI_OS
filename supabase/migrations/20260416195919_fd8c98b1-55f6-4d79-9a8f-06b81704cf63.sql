-- F-003: Restrictive views for aias_*
CREATE OR REPLACE VIEW public.aias_agent_profiles_public AS
SELECT id, agent_key, display_name, status, certification_level, is_certified,
       total_executions, success_rate, avg_quality_score, created_at, updated_at
FROM public.aias_agent_profiles
WHERE status = 'active' AND is_certified = true;

GRANT SELECT ON public.aias_agent_profiles_public TO authenticated, anon;

CREATE OR REPLACE VIEW public.aias_routing_metadata_safe AS
SELECT id, agent_profile_id, service_unit_id, routing_confidence, schema_valid,
       certification_check, score_check_passed, blocked, created_at
FROM public.aias_routing_metadata
WHERE user_id = auth.uid();

GRANT SELECT ON public.aias_routing_metadata_safe TO authenticated;

-- F-005: LLM failure refund
CREATE OR REPLACE FUNCTION public.refund_llm_failure(
  _user_id uuid, _amount numeric, _reason text,
  _service_key text DEFAULT NULL, _job_id uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _refund_id uuid;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  UPDATE public.profiles
  SET credits_balance = COALESCE(credits_balance, 0) + _amount
  WHERE id = _user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, service_key, job_id)
  VALUES (_user_id, _amount, 'refund', 'LLM failure refund: ' || _reason, _service_key, _job_id)
  RETURNING id INTO _refund_id;

  INSERT INTO public.compliance_log (actor_id, action_type, target_type, target_id, description, severity, metadata)
  VALUES (_user_id, 'llm_refund', 'credit_transaction', _refund_id,
          format('Refund of %s credits for LLM failure', _amount), 'info',
          jsonb_build_object('reason', _reason, 'service_key', _service_key, 'job_id', _job_id));

  RETURN jsonb_build_object('success', true, 'refund_id', _refund_id, 'amount', _amount);
END; $$;

REVOKE EXECUTE ON FUNCTION public.refund_llm_failure FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_llm_failure TO service_role;

-- Cross-tenant access detection
CREATE OR REPLACE FUNCTION public.detect_cross_tenant_access(
  _actor_id uuid, _target_user_id uuid, _resource text, _action text DEFAULT 'read'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _actor_id IS NULL OR _target_user_id IS NULL OR _actor_id = _target_user_id THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _actor_id AND role = 'admin') THEN
    RETURN;
  END IF;

  INSERT INTO public.admin_alerts (
    alert_type, severity, title, description, impact_scope, recommended_action, metadata
  ) VALUES (
    'cross_tenant_access', 'high',
    format('Cross-tenant access: %s on %s', _action, _resource),
    format('User %s attempted %s on resource owned by %s', _actor_id, _action, _target_user_id),
    'security', 'Investigate user activity and verify RLS policies',
    jsonb_build_object('actor_id', _actor_id, 'target_user_id', _target_user_id,
                       'resource', _resource, 'action', _action, 'detected_at', now())
  );

  INSERT INTO public.abuse_events (user_id, abuse_type, severity, details)
  VALUES (_actor_id, 'cross_tenant_access', 'high',
          jsonb_build_object('target_user_id', _target_user_id, 'resource', _resource, 'action', _action));
END; $$;

REVOKE EXECUTE ON FUNCTION public.detect_cross_tenant_access FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.detect_cross_tenant_access TO authenticated, service_role;

-- F-009: JSON-LD validation
CREATE OR REPLACE FUNCTION public.validate_jsonld_schema(_schema jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  _serialized text;
  _danger_patterns text[] := ARRAY[
    '<script', '</script', 'javascript:', 'data:text/html',
    'onerror=', 'onload=', 'onclick=', 'onmouseover=',
    'eval(', 'document.cookie', 'window.location'
  ];
  _pattern text;
BEGIN
  IF _schema IS NULL THEN
    RETURN jsonb_build_object('valid', true, 'sanitized', '{}'::jsonb);
  END IF;

  _serialized := lower(_schema::text);

  FOREACH _pattern IN ARRAY _danger_patterns LOOP
    IF position(_pattern IN _serialized) > 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'dangerous_pattern_detected', 'pattern', _pattern);
    END IF;
  END LOOP;

  IF NOT (_schema ? '@context') THEN
    RETURN jsonb_build_object('valid', false, 'error', 'missing_context');
  END IF;

  RETURN jsonb_build_object('valid', true, 'sanitized', _schema);
END; $$;

GRANT EXECUTE ON FUNCTION public.validate_jsonld_schema TO authenticated, anon, service_role;

-- Mass export audit
CREATE TABLE IF NOT EXISTS public.export_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_count integer NOT NULL DEFAULT 1,
  export_type text NOT NULL DEFAULT 'download',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.export_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own export logs"
ON public.export_audit_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all export logs"
ON public.export_audit_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_export_audit_user_time
ON public.export_audit_log (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_export(
  _resource_type text, _resource_count integer DEFAULT 1,
  _export_type text DEFAULT 'download', _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id uuid := auth.uid();
  _recent_total integer;
  _alerted boolean := false;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  INSERT INTO public.export_audit_log (user_id, resource_type, resource_count, export_type, metadata)
  VALUES (_user_id, _resource_type, _resource_count, _export_type, _metadata);

  SELECT COALESCE(SUM(resource_count), 0) INTO _recent_total
  FROM public.export_audit_log
  WHERE user_id = _user_id AND created_at > now() - interval '1 hour';

  IF _recent_total > 50 THEN
    PERFORM public.log_suspicious_export(_user_id, _resource_type, _recent_total);
    _alerted := true;
  END IF;

  RETURN jsonb_build_object('success', true, 'recent_total', _recent_total, 'alerted', _alerted);
END; $$;

GRANT EXECUTE ON FUNCTION public.record_export TO authenticated;