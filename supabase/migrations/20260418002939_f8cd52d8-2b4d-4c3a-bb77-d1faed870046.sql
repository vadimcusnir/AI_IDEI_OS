
-- Trigger: spike-detect auth failures and raise admin_alerts automatically
CREATE OR REPLACE FUNCTION public.detect_auth_failure_spike()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
  existing_alert_id UUID;
  failure_events TEXT[] := ARRAY[
    'code_exchange_failed',
    'session_restore_failed',
    'bad_jwt_recovered',
    'auth_error_normalized'
  ];
BEGIN
  -- Only react to failure events
  IF NEW.event_name <> ALL(failure_events) THEN
    RETURN NEW;
  END IF;

  -- Count failures in last 5 minutes
  SELECT COUNT(*) INTO recent_count
  FROM public.analytics_events
  WHERE event_name = ANY(failure_events)
    AND created_at > now() - interval '5 minutes';

  -- Threshold: >3 failures in 5 min
  IF recent_count <= 3 THEN
    RETURN NEW;
  END IF;

  -- Look for an open (unresolved) alert in the same window
  SELECT id INTO existing_alert_id
  FROM public.admin_alerts
  WHERE alert_type = 'auth_failure_spike'
    AND resolved_at IS NULL
    AND last_seen > now() - interval '15 minutes'
  ORDER BY last_seen DESC
  LIMIT 1;

  IF existing_alert_id IS NOT NULL THEN
    UPDATE public.admin_alerts
    SET last_seen = now(),
        occurrences = COALESCE(occurrences, 1) + 1,
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{recent_count}',
          to_jsonb(recent_count)
        )
    WHERE id = existing_alert_id;
  ELSE
    INSERT INTO public.admin_alerts (
      alert_type,
      severity,
      title,
      description,
      error_signal,
      impact_scope,
      recommended_action,
      first_seen,
      last_seen,
      occurrences,
      metadata
    ) VALUES (
      'auth_failure_spike',
      'high',
      'Auth failure spike detected',
      format('%s authentication failures in the last 5 minutes (threshold: 3).', recent_count),
      NEW.event_name,
      'authentication',
      'Inspect AuthFlowMonitor in /admin → Auth Flow tab. Check Supabase auth logs and Google OAuth provider status.',
      now(),
      now(),
      1,
      jsonb_build_object(
        'recent_count', recent_count,
        'last_event', NEW.event_name,
        'last_correlation_id', NEW.session_id,
        'last_event_params', NEW.event_params
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_detect_auth_failure_spike ON public.analytics_events;
CREATE TRIGGER trg_detect_auth_failure_spike
AFTER INSERT ON public.analytics_events
FOR EACH ROW
EXECUTE FUNCTION public.detect_auth_failure_spike();
