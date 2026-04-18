-- Wave 4 — Proactive failure monitoring
-- RPC for upserting admin alerts with dedup (called from edge functions via service role)

CREATE OR REPLACE FUNCTION public.upsert_admin_alert(
  p_alert_type text,
  p_severity text,
  p_title text,
  p_error_signal text DEFAULT NULL,
  p_service_key text DEFAULT NULL,
  p_provider_key text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_impact_scope text DEFAULT NULL,
  p_recommended_action text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_alert_id uuid;
  v_dedup_window interval := interval '15 minutes';
BEGIN
  -- Try to find an active (unresolved) alert with the same signature in the dedup window
  SELECT id INTO v_alert_id
  FROM public.admin_alerts
  WHERE alert_type = p_alert_type
    AND COALESCE(error_signal, '') = COALESCE(p_error_signal, '')
    AND COALESCE(service_key, '') = COALESCE(p_service_key, '')
    AND resolved_at IS NULL
    AND last_seen > now() - v_dedup_window
  ORDER BY last_seen DESC
  LIMIT 1;

  IF v_alert_id IS NOT NULL THEN
    -- Increment occurrences and bump last_seen
    UPDATE public.admin_alerts
    SET occurrences = COALESCE(occurrences, 1) + 1,
        last_seen = now(),
        -- Escalate severity if new event is more severe
        severity = CASE
          WHEN p_severity = 'critical' THEN 'critical'
          WHEN p_severity = 'high' AND severity NOT IN ('critical') THEN 'high'
          ELSE severity
        END,
        metadata = metadata || p_metadata
    WHERE id = v_alert_id;
    RETURN v_alert_id;
  END IF;

  -- Insert new alert
  INSERT INTO public.admin_alerts (
    alert_type, severity, title, error_signal, service_key, provider_key,
    description, impact_scope, recommended_action, metadata
  )
  VALUES (
    p_alert_type, p_severity, p_title, p_error_signal, p_service_key, p_provider_key,
    p_description, p_impact_scope, p_recommended_action, p_metadata
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_admin_alert(text, text, text, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_admin_alert(text, text, text, text, text, text, text, text, text, jsonb) TO service_role;

-- Index to support dedup lookup
CREATE INDEX IF NOT EXISTS idx_admin_alerts_dedup
  ON public.admin_alerts (alert_type, error_signal, service_key, last_seen DESC)
  WHERE resolved_at IS NULL;