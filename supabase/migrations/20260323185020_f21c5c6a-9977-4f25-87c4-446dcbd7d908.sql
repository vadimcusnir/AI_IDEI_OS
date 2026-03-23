
CREATE OR REPLACE FUNCTION public.deduct_neurons(
  _user_id UUID,
  _amount INTEGER,
  _service_id TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_balance INTEGER;
  _new_balance INTEGER;
  _tier TEXT;
  _discount NUMERIC;
  _final_amount INTEGER;
  _daily_spent INTEGER;
  _daily_cap INTEGER;
  _daily_date DATE;
BEGIN
  -- Lock the user's credit row for atomic update
  SELECT balance, daily_spent, daily_spend_cap, daily_spent_date
  INTO _current_balance, _daily_spent, _daily_cap, _daily_date
  FROM user_credits
  WHERE user_id = _user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No credit record found for user %', _user_id;
  END IF;

  -- Determine tier discount
  SELECT tier INTO _tier FROM access_window_state WHERE user_id = _user_id;
  _discount := CASE
    WHEN _tier = 'vip'     THEN 0.40
    WHEN _tier = 'pro'     THEN 0.25
    WHEN _tier = 'starter' THEN 0.10
    ELSE 0.0
  END;
  _final_amount := GREATEST(1, ROUND(_amount * (1.0 - _discount))::INTEGER);

  -- Reset daily counter if new day
  IF _daily_date < CURRENT_DATE THEN
    _daily_spent := 0;
    UPDATE user_credits
    SET daily_spent = 0, daily_spent_date = CURRENT_DATE
    WHERE user_id = _user_id;
  END IF;

  -- Check daily cap
  IF _daily_spent + _final_amount > _daily_cap THEN
    RAISE EXCEPTION 'Daily spend cap exceeded (spent: %, cap: %)', _daily_spent, _daily_cap;
  END IF;

  -- Check sufficient balance
  IF _current_balance < _final_amount THEN
    RAISE EXCEPTION 'Insufficient NEURONS: balance=%, needed=%', _current_balance, _final_amount;
  END IF;

  -- Deduct from user_credits
  UPDATE user_credits
  SET balance     = balance - _final_amount,
      total_spent = total_spent + _final_amount,
      daily_spent = daily_spent + _final_amount,
      updated_at  = now()
  WHERE user_id = _user_id
  RETURNING balance INTO _new_balance;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (
    _user_id,
    -_final_amount,
    'usage',
    COALESCE('Service: ' || _service_id, 'Deduction'),
    NULL
  );

  -- Sync token_balances (mirror available balance)
  UPDATE token_balances
  SET balance    = _new_balance,
      updated_at = now()
  WHERE user_id = _user_id;

  -- If no token_balances row, create one
  IF NOT FOUND THEN
    INSERT INTO token_balances (user_id, balance, updated_at)
    VALUES (_user_id, _new_balance, now())
    ON CONFLICT (user_id) DO UPDATE SET balance = _new_balance, updated_at = now();
  END IF;

  RETURN _new_balance;
END;
$$;
