
CREATE OR REPLACE FUNCTION public.spend_credits_capped(_user_id uuid, _amount integer, _description text, _job_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _row RECORD;
  _effective_daily_spent integer;
  _tier text;
  _discount numeric;
  _discounted_amount integer;
BEGIN
  SELECT * INTO _row FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_CREDITS_ROW');
  END IF;

  -- Determine user tier and apply execution discount
  SELECT tier INTO _tier FROM access_window_state WHERE user_id = _user_id;
  _discount := CASE
    WHEN _tier = 'vip' THEN 0.40    -- Elite: -40%
    WHEN _tier = 'pro' THEN 0.25    -- Pro: -25%
    WHEN _tier = 'starter' THEN 0.10 -- Core: -10%
    ELSE 0.0                         -- Free: no discount
  END;
  _discounted_amount := GREATEST(1, ROUND(_amount * (1.0 - _discount))::integer);

  -- Reset daily counter if new day
  IF _row.daily_spent_date < CURRENT_DATE THEN
    _effective_daily_spent := 0;
    UPDATE user_credits SET daily_spent = 0, daily_spent_date = CURRENT_DATE WHERE user_id = _user_id;
  ELSE
    _effective_daily_spent := _row.daily_spent;
  END IF;

  -- Check daily cap (use discounted amount)
  IF _effective_daily_spent + _discounted_amount > _row.daily_spend_cap THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DAILY_CAP_EXCEEDED',
      'daily_spent', _effective_daily_spent,
      'daily_cap', _row.daily_spend_cap,
      'remaining', _row.daily_spend_cap - _effective_daily_spent
    );
  END IF;

  -- Check balance (use discounted amount)
  IF _row.balance < _discounted_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'balance', _row.balance);
  END IF;

  -- Deduct discounted amount
  UPDATE user_credits
  SET balance = balance - _discounted_amount,
      total_spent = total_spent + _discounted_amount,
      daily_spent = daily_spent + _discounted_amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Log with discount info
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_discounted_amount, 'spend', 
    _description || CASE WHEN _discount > 0 THEN ' [' || (_discount * 100)::int || '% tier discount, saved ' || (_amount - _discounted_amount) || 'N]' ELSE '' END,
    _job_id);

  RETURN jsonb_build_object(
    'success', true, 
    'new_balance', _row.balance - _discounted_amount,
    'original_cost', _amount,
    'discount_pct', _discount,
    'final_cost', _discounted_amount,
    'saved', _amount - _discounted_amount
  );
END;
$function$;
