
-- P1-1: Stripe event idempotency table
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;
-- Admin-only access
CREATE POLICY "admin_only_stripe_events" ON public.stripe_processed_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- P1-2: Cusnir_OS subscription activation function
-- Checks: 11-month VIP + holds NOTA2 tokens → grants cusnir_os access
CREATE OR REPLACE FUNCTION public.check_cusnir_os_eligibility(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _vip RECORD;
  _token_balance numeric;
  _already_active boolean;
  _result jsonb;
BEGIN
  -- Check VIP subscription
  SELECT * INTO _vip FROM vip_subscriptions 
  WHERE user_id = _user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'NO_VIP_SUBSCRIPTION');
  END IF;
  
  IF _vip.current_month < 11 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'INSUFFICIENT_MONTHS', 'current_month', _vip.current_month, 'required', 11);
  END IF;
  
  -- Check NOTA2 token balance
  SELECT balance INTO _token_balance FROM token_balances WHERE user_id = _user_id;
  IF _token_balance IS NULL OR _token_balance <= 0 THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'NO_TOKENS', 'token_balance', COALESCE(_token_balance, 0));
  END IF;
  
  -- Check if already has active cusnir_os access
  SELECT EXISTS(
    SELECT 1 FROM feature_flags f 
    WHERE f.key = 'cusnir_os' AND f.enabled = true
  ) INTO _already_active;
  
  RETURN jsonb_build_object(
    'eligible', true,
    'current_month', _vip.current_month,
    'token_balance', _token_balance,
    'vip_started_at', _vip.started_at
  );
END;
$$;

-- P1-3: VIP auto-advance month trigger
-- Advances VIP month based on subscription start date
CREATE OR REPLACE FUNCTION public.vip_advance_month(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sub RECORD;
  _expected_month int;
  _new_milestones text[];
  _milestone RECORD;
  _bonus int := 0;
BEGIN
  SELECT * INTO _sub FROM vip_subscriptions 
  WHERE user_id = _user_id AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'NO_ACTIVE_VIP');
  END IF;
  
  -- Calculate expected month based on elapsed time
  _expected_month := LEAST(11, 
    EXTRACT(MONTH FROM age(now(), _sub.started_at))::int + 1
  );
  
  IF _expected_month <= _sub.current_month THEN
    RETURN jsonb_build_object('ok', true, 'advanced', false, 'current_month', _sub.current_month);
  END IF;
  
  -- Advance to expected month
  UPDATE vip_subscriptions SET current_month = _expected_month WHERE id = _sub.id;
  
  -- Unlock milestones for all months up to current
  FOR _milestone IN 
    SELECT * FROM vip_milestones WHERE month_number <= _expected_month
  LOOP
    INSERT INTO vip_milestone_progress (user_id, milestone_id)
    VALUES (_user_id, _milestone.id)
    ON CONFLICT DO NOTHING;
    
    _bonus := _bonus + _milestone.reward_neurons;
  END LOOP;
  
  -- Award accumulated NEURONS bonus
  IF _bonus > 0 THEN
    PERFORM add_credits(_user_id, _bonus, 'VIP Milestone bonus: Month ' || _expected_month);
  END IF;
  
  -- Notify
  INSERT INTO notifications (user_id, type, title, message, link, meta)
  VALUES (_user_id, 'vip_advance', 
    '🎖️ VIP Luna ' || _expected_month || ' deblocată!',
    'Ai avansat la luna ' || _expected_month || ' din programul CusnirOS.',
    '/vip',
    jsonb_build_object('month', _expected_month, 'bonus_neurons', _bonus));
  
  -- Check Cusnir_OS eligibility at month 11
  IF _expected_month >= 11 THEN
    INSERT INTO notifications (user_id, type, title, message, link, meta)
    VALUES (_user_id, 'cusnir_os_eligible',
      '🏆 Ești eligibil pentru CusnirOS!',
      'Ai completat toate cele 11 luni. Verifică dacă ai NOTA2 tokens pentru acces.',
      '/vip',
      jsonb_build_object('month', 11));
  END IF;
  
  RETURN jsonb_build_object(
    'ok', true, 
    'advanced', true, 
    'previous_month', _sub.current_month, 
    'new_month', _expected_month,
    'bonus_neurons', _bonus
  );
END;
$$;

-- P1-4: Claim VIP milestone reward function
CREATE OR REPLACE FUNCTION public.claim_vip_reward(_user_id uuid, _milestone_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _progress RECORD;
  _milestone RECORD;
BEGIN
  -- Check progress exists and not yet claimed
  SELECT * INTO _progress FROM vip_milestone_progress 
  WHERE user_id = _user_id AND milestone_id = _milestone_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'MILESTONE_NOT_UNLOCKED');
  END IF;
  
  IF _progress.claimed_reward THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'ALREADY_CLAIMED');
  END IF;
  
  SELECT * INTO _milestone FROM vip_milestones WHERE id = _milestone_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'MILESTONE_NOT_FOUND');
  END IF;
  
  -- Mark as claimed
  UPDATE vip_milestone_progress SET claimed_reward = true WHERE id = _progress.id;
  
  -- Award NEURONS
  IF _milestone.reward_neurons > 0 THEN
    PERFORM add_credits(_user_id, _milestone.reward_neurons, 
      'VIP Reward: ' || _milestone.title || ' (+' || _milestone.reward_neurons || ' NEURONS)');
  END IF;
  
  -- Award XP
  PERFORM award_xp(_user_id, 50, 'vip_milestone', 'Claimed: ' || _milestone.title);
  
  RETURN jsonb_build_object('ok', true, 'reward_neurons', _milestone.reward_neurons, 'milestone', _milestone.title);
END;
$$;
