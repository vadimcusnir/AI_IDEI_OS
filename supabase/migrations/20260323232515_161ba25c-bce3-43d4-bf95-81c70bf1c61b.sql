
-- Unified atomic reserve on user_credits (canonical balance)
-- Moves funds: available → locked, with tier discount + daily cap check
CREATE OR REPLACE FUNCTION public.reserve_neurons(
  _user_id uuid,
  _amount integer,
  _job_id uuid DEFAULT NULL,
  _description text DEFAULT 'Reserved for execution'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _row RECORD;
  _tier text;
  _discount numeric;
  _discounted integer;
  _daily_spent integer;
BEGIN
  -- Lock the row
  SELECT * INTO _row FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_CREDITS_ROW');
  END IF;

  -- Tier discount
  SELECT tier INTO _tier FROM access_window_state WHERE user_id = _user_id;
  _discount := CASE
    WHEN _tier = 'vip' THEN 0.40
    WHEN _tier = 'pro' THEN 0.25
    WHEN _tier = 'starter' THEN 0.10
    ELSE 0.0
  END;
  _discounted := GREATEST(1, ROUND(_amount * (1.0 - _discount))::integer);

  -- Daily cap reset
  IF _row.daily_spent_date < CURRENT_DATE THEN
    UPDATE user_credits SET daily_spent = 0, daily_spent_date = CURRENT_DATE WHERE user_id = _user_id;
    _daily_spent := 0;
  ELSE
    _daily_spent := _row.daily_spent;
  END IF;

  -- Check daily cap
  IF _daily_spent + _discounted > _row.daily_spend_cap THEN
    RETURN jsonb_build_object('ok', false, 'error', 'DAILY_CAP_EXCEEDED', 'remaining', _row.daily_spend_cap - _daily_spent);
  END IF;

  -- Check balance
  IF _row.balance < _discounted THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS', 'balance', _row.balance);
  END IF;

  -- Reserve: deduct from balance, track in wallet_state locked
  UPDATE user_credits SET
    balance = balance - _discounted,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Track locked amount in wallet_state
  INSERT INTO wallet_state (user_id, available, staked, locked)
  VALUES (_user_id, 0, 0, _discounted)
  ON CONFLICT (user_id) DO UPDATE SET
    locked = wallet_state.locked + _discounted,
    snapshot_ts = now();

  -- Log reservation
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_discounted, 'reserve', _description || ' [' || _discount * 100 || '% discount]', _job_id);

  RETURN jsonb_build_object(
    'ok', true,
    'reserved', _discounted,
    'original_cost', _amount,
    'discount_pct', _discount,
    'new_balance', _row.balance - _discounted
  );
END;
$$;

-- Settle: confirm reserved credits as spent (locked → spent)
CREATE OR REPLACE FUNCTION public.settle_neurons(
  _user_id uuid,
  _amount integer,
  _job_id uuid DEFAULT NULL,
  _description text DEFAULT 'Settled'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Move locked → spent
  UPDATE wallet_state SET
    locked = GREATEST(0, locked - _amount),
    snapshot_ts = now()
  WHERE user_id = _user_id;

  -- Update user_credits total_spent + daily_spent
  UPDATE user_credits SET
    total_spent = total_spent + _amount,
    daily_spent = daily_spent + _amount,
    updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_amount, 'settle', _description, _job_id);

  RETURN jsonb_build_object('ok', true, 'settled', _amount);
END;
$$;

-- Release: return reserved credits on failure (locked → available)
CREATE OR REPLACE FUNCTION public.release_neurons(
  _user_id uuid,
  _amount integer,
  _job_id uuid DEFAULT NULL,
  _description text DEFAULT 'Released - execution failed'
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Return to balance
  UPDATE user_credits SET
    balance = balance + _amount,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Remove from locked
  UPDATE wallet_state SET
    locked = GREATEST(0, locked - _amount),
    snapshot_ts = now()
  WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, _amount, 'release', _description, _job_id);

  RETURN jsonb_build_object('ok', true, 'released', _amount);
END;
$$;
