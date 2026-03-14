
-- Downgrade ladder function: applies escalating penalties based on abuse history
CREATE OR REPLACE FUNCTION public.apply_abuse_ladder(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _unresolved_count integer;
  _critical_count integer;
  _action text;
BEGIN
  -- Count unresolved abuse events
  SELECT COUNT(*) INTO _unresolved_count
  FROM abuse_events
  WHERE user_id = _user_id AND resolved_at IS NULL;

  SELECT COUNT(*) INTO _critical_count
  FROM abuse_events
  WHERE user_id = _user_id AND severity = 'critical' AND resolved_at IS NULL;

  -- Ladder logic
  IF _critical_count >= 3 OR _unresolved_count >= 10 THEN
    _action := 'suspended';
    -- Freeze credits
    UPDATE user_credits SET balance = 0, updated_at = now() WHERE user_id = _user_id;
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (_user_id, 0, 'suspension', 'Account suspended due to abuse violations');
  ELSIF _unresolved_count >= 5 THEN
    _action := 'downgraded';
    -- Halve credits as penalty
    UPDATE user_credits SET balance = balance / 2, updated_at = now() WHERE user_id = _user_id;
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (_user_id, 0, 'downgrade', 'Credits halved due to repeated abuse');
  ELSIF _unresolved_count >= 2 THEN
    _action := 'cooldown';
    -- Log cooldown, no credit change
    INSERT INTO decision_ledger (event_type, actor_id, verdict, reason, metadata)
    VALUES ('abuse_ladder', _user_id, 'COOLDOWN', 'Rate limited for 1 hour',
      jsonb_build_object('unresolved_events', _unresolved_count));
  ELSE
    _action := 'none';
  END IF;

  -- Update all unresolved events with action
  IF _action != 'none' THEN
    UPDATE abuse_events
    SET action_taken = _action
    WHERE user_id = _user_id AND resolved_at IS NULL;
  END IF;

  RETURN _action;
END;
$$;

-- Incident table for admin tracking
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  related_user_id uuid,
  related_job_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_created ON public.incidents(created_at DESC);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage incidents"
  ON public.incidents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
