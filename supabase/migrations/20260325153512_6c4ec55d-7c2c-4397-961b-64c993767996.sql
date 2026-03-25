
-- Update activate_power_unlock to also activate the linked agent
CREATE OR REPLACE FUNCTION public.activate_power_unlock(
  _user_id uuid,
  _capability_key text,
  _capability_name text,
  _xp_cost integer,
  _tier text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_xp integer;
  _already_unlocked boolean;
  _unlock_id uuid;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM os_power_unlocks
    WHERE user_id = _user_id AND capability_key = _capability_key
  ) INTO _already_unlocked;

  IF _already_unlocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_unlocked');
  END IF;

  SELECT COALESCE(total_xp, 0) INTO _current_xp
  FROM user_xp WHERE user_id = _user_id;

  IF _current_xp IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'no_xp_record');
  END IF;

  IF _current_xp < _xp_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_xp', 'current_xp', _current_xp, 'required_xp', _xp_cost);
  END IF;

  UPDATE user_xp SET total_xp = total_xp - _xp_cost WHERE user_id = _user_id;

  INSERT INTO os_power_unlocks (user_id, capability_key, capability_name, xp_cost, tier)
  VALUES (_user_id, _capability_key, _capability_name, _xp_cost, _tier)
  RETURNING id INTO _unlock_id;

  -- Activate linked agent (standby → active)
  UPDATE os_agents
  SET status = 'active'
  WHERE status = 'standby'
    AND metadata->>'module_key' = _capability_key;

  INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason)
  VALUES ('power_unlock', _user_id, _capability_key, 'ALLOW', 'XP spent: ' || _xp_cost || ' | Agent activated');

  RETURN jsonb_build_object('success', true, 'unlock_id', _unlock_id, 'xp_remaining', _current_xp - _xp_cost);
END;
$$;

-- Update revoke_power_unlock to deactivate the linked agent
CREATE OR REPLACE FUNCTION public.revoke_power_unlock(
  _user_id uuid,
  _capability_key text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unlock_record RECORD;
  _refund integer;
BEGIN
  SELECT * INTO _unlock_record
  FROM os_power_unlocks
  WHERE user_id = _user_id AND capability_key = _capability_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_unlocked');
  END IF;

  _refund := _unlock_record.xp_cost / 2;

  DELETE FROM os_power_unlocks WHERE id = _unlock_record.id;

  UPDATE user_xp SET total_xp = total_xp + _refund WHERE user_id = _user_id;

  -- Deactivate linked agent (active → standby)
  UPDATE os_agents
  SET status = 'standby'
  WHERE metadata->>'module_key' = _capability_key;

  INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason)
  VALUES ('power_revoke', _user_id, _capability_key, 'ALLOW', 'XP refunded: ' || _refund || ' | Agent deactivated');

  RETURN jsonb_build_object('success', true, 'xp_refunded', _refund);
END;
$$;

-- Enable realtime for os_agents and os_executions
ALTER PUBLICATION supabase_realtime ADD TABLE public.os_agents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.os_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.os_memory_patterns;
