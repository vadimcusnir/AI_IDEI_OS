
-- =============================================================
-- Phase 8: Entitlements Enforcement + Tier Progression L1-L4
-- =============================================================

-- compute_entitlements: returns real access matrix for a user
CREATE OR REPLACE FUNCTION public.compute_entitlements(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _nota2 bigint := 0;
  _tenure int := 0;
  _burned bigint := 0;
  _cusnir_os boolean := false;
  _level text := 'L1';
  _flags jsonb := '{}'::jsonb;
  _sub_tier text;
  _is_admin boolean;
  _created_at timestamptz;
  _vip_month int := 0;
BEGIN
  -- Check admin
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = 'admin') INTO _is_admin;
  
  -- NOTA2 balance
  SELECT COALESCE(balance, 0) INTO _nota2
  FROM nota2_balances WHERE user_id = _user_id;
  
  -- Burned neurons (total spent)
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO _burned
  FROM credit_transactions WHERE user_id = _user_id AND amount < 0;
  
  -- Tenure (months since signup)
  SELECT created_at INTO _created_at
  FROM profiles WHERE id = _user_id;
  
  IF _created_at IS NOT NULL THEN
    _tenure := GREATEST(0, EXTRACT(MONTH FROM age(now(), _created_at))::int 
                + EXTRACT(YEAR FROM age(now(), _created_at))::int * 12);
  END IF;
  
  -- Subscription tier
  SELECT tier INTO _sub_tier
  FROM subscribers WHERE user_id = _user_id AND status = 'active'
  LIMIT 1;
  
  -- VIP month progress
  SELECT COALESCE(current_month, 0) INTO _vip_month
  FROM vip_progress WHERE user_id = _user_id;
  
  -- Determine level
  IF _is_admin THEN
    _level := 'L4';
  ELSIF _sub_tier = 'vip' AND _vip_month >= 11 AND _nota2 >= 100 THEN
    _level := 'L4';
    _cusnir_os := true;
  ELSIF _sub_tier IN ('pro', 'vip') AND _tenure >= 3 AND _burned >= 500 THEN
    _level := 'L3';
  ELSIF _sub_tier IS NOT NULL AND _tenure >= 1 THEN
    _level := 'L2';
  ELSE
    _level := 'L1';
  END IF;
  
  -- Cusnir_OS for admins
  IF _is_admin THEN _cusnir_os := true; END IF;
  
  -- Feature flags
  _flags := jsonb_build_object(
    'can_publish', _level IN ('L2','L3','L4'),
    'can_automate', _level IN ('L3','L4'),
    'can_orchestrate', _level = 'L4',
    'marketplace_access', _level IN ('L2','L3','L4'),
    'priority_queue', _level IN ('L3','L4'),
    'multi_agent', _cusnir_os
  );
  
  RETURN jsonb_build_object(
    'level', _level,
    'nota2', _nota2,
    'tenure', _tenure,
    'burned', _burned,
    'cusnir_os', _cusnir_os,
    'vip_month', _vip_month,
    'subscription_tier', COALESCE(_sub_tier, 'none'),
    'is_admin', _is_admin,
    'flags', _flags
  );
END;
$$;

-- evaluate_tier_progression: checks if user can advance and returns requirements
CREATE OR REPLACE FUNCTION public.evaluate_tier_progression(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ent jsonb;
  _current text;
  _next text;
  _requirements jsonb;
  _met jsonb;
  _can_advance boolean := false;
BEGIN
  _ent := compute_entitlements(_user_id);
  _current := _ent->>'level';
  
  CASE _current
    WHEN 'L1' THEN
      _next := 'L2';
      _requirements := jsonb_build_object(
        'subscription', 'any active subscription',
        'tenure_months', 1
      );
      _met := jsonb_build_object(
        'subscription', (_ent->>'subscription_tier') != 'none',
        'tenure_months', (_ent->>'tenure')::int >= 1
      );
      _can_advance := ((_ent->>'subscription_tier') != 'none') AND ((_ent->>'tenure')::int >= 1);
      
    WHEN 'L2' THEN
      _next := 'L3';
      _requirements := jsonb_build_object(
        'subscription', 'pro or vip',
        'tenure_months', 3,
        'neurons_burned', 500
      );
      _met := jsonb_build_object(
        'subscription', (_ent->>'subscription_tier') IN ('pro', 'vip'),
        'tenure_months', (_ent->>'tenure')::int >= 3,
        'neurons_burned', (_ent->>'burned')::int >= 500
      );
      _can_advance := ((_ent->>'subscription_tier') IN ('pro','vip')) 
                       AND ((_ent->>'tenure')::int >= 3) 
                       AND ((_ent->>'burned')::int >= 500);
      
    WHEN 'L3' THEN
      _next := 'L4';
      _requirements := jsonb_build_object(
        'subscription', 'vip',
        'vip_months', 11,
        'nota2_balance', 100
      );
      _met := jsonb_build_object(
        'subscription', (_ent->>'subscription_tier') = 'vip',
        'vip_months', (_ent->>'vip_month')::int >= 11,
        'nota2_balance', (_ent->>'nota2')::int >= 100
      );
      _can_advance := ((_ent->>'subscription_tier') = 'vip') 
                       AND ((_ent->>'vip_month')::int >= 11) 
                       AND ((_ent->>'nota2')::int >= 100);
      
    WHEN 'L4' THEN
      _next := 'L4';
      _requirements := '{}'::jsonb;
      _met := '{}'::jsonb;
      _can_advance := false; -- already max
  END CASE;
  
  RETURN jsonb_build_object(
    'current_level', _current,
    'next_level', _next,
    'can_advance', _can_advance,
    'requirements', _requirements,
    'met', _met,
    'entitlements', _ent
  );
END;
$$;
