
-- Decision Ledger: append-only audit log for access decisions & platform events
CREATE TABLE public.decision_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'access_check',
  actor_id uuid,
  target_resource text,
  verdict text,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_decision_ledger_actor ON public.decision_ledger(actor_id);
CREATE INDEX idx_decision_ledger_event_type ON public.decision_ledger(event_type);
CREATE INDEX idx_decision_ledger_created ON public.decision_ledger(created_at DESC);

ALTER TABLE public.decision_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all ledger entries"
  ON public.decision_ledger FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert ledger entries"
  ON public.decision_ledger FOR INSERT TO authenticated
  WITH CHECK (true);

-- Abuse Events: tracks detected abuse patterns
CREATE TABLE public.abuse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  abuse_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  details jsonb DEFAULT '{}'::jsonb,
  action_taken text DEFAULT 'none',
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_abuse_events_user ON public.abuse_events(user_id);
CREATE INDEX idx_abuse_events_type ON public.abuse_events(abuse_type);
CREATE INDEX idx_abuse_events_created ON public.abuse_events(created_at DESC);

ALTER TABLE public.abuse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage abuse events"
  ON public.abuse_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Log access check function (wraps check_access + logs to ledger)
CREATE OR REPLACE FUNCTION public.check_access_logged(_user_id uuid, _service_key text, _ip_hint text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
BEGIN
  _result := check_access(_user_id, _service_key);
  
  INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason, ip_hint, metadata)
  VALUES (
    'access_check',
    _user_id,
    _service_key,
    _result->>'verdict',
    _result->>'reason',
    _ip_hint,
    _result
  );
  
  RETURN _result;
END;
$$;

-- Detect prompt probing: returns true if user made >20 access checks in last 5 min
CREATE OR REPLACE FUNCTION public.detect_prompt_probing(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  SELECT COUNT(*) INTO _count
  FROM decision_ledger
  WHERE actor_id = _user_id
    AND event_type = 'access_check'
    AND created_at > now() - interval '5 minutes';
  
  IF _count > 20 THEN
    INSERT INTO abuse_events (user_id, abuse_type, severity, details)
    VALUES (_user_id, 'prompt_probing', 'warning',
      jsonb_build_object('access_checks_5min', _count))
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Detect export farming: returns true if user exported >50 artifacts in last hour
CREATE OR REPLACE FUNCTION public.detect_export_farming(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  SELECT COUNT(*) INTO _count
  FROM artifacts
  WHERE author_id = _user_id
    AND created_at > now() - interval '1 hour';
  
  IF _count > 50 THEN
    INSERT INTO abuse_events (user_id, abuse_type, severity, details)
    VALUES (_user_id, 'export_farming', 'critical',
      jsonb_build_object('artifacts_1h', _count))
    ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
