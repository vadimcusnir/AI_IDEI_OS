
-- Per-user daily credit spend cap (prevents runaway consumption)
-- Default cap: 5000 NEURONS/day

-- Add daily spend tracking columns to user_credits
ALTER TABLE user_credits
  ADD COLUMN IF NOT EXISTS daily_spent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_spent_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS daily_spend_cap integer NOT NULL DEFAULT 5000;

-- Create a secure RPC that checks + enforces daily cap before spending
CREATE OR REPLACE FUNCTION public.spend_credits_capped(
  _user_id uuid,
  _amount integer,
  _description text,
  _job_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _row RECORD;
  _effective_daily_spent integer;
BEGIN
  SELECT * INTO _row FROM user_credits WHERE user_id = _user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_CREDITS_ROW');
  END IF;

  -- Reset daily counter if new day
  IF _row.daily_spent_date < CURRENT_DATE THEN
    _effective_daily_spent := 0;
    UPDATE user_credits SET daily_spent = 0, daily_spent_date = CURRENT_DATE WHERE user_id = _user_id;
  ELSE
    _effective_daily_spent := _row.daily_spent;
  END IF;

  -- Check daily cap
  IF _effective_daily_spent + _amount > _row.daily_spend_cap THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'DAILY_CAP_EXCEEDED',
      'daily_spent', _effective_daily_spent,
      'daily_cap', _row.daily_spend_cap,
      'remaining', _row.daily_spend_cap - _effective_daily_spent
    );
  END IF;

  -- Check balance
  IF _row.balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'balance', _row.balance);
  END IF;

  -- Deduct
  UPDATE user_credits
  SET balance = balance - _amount,
      total_spent = total_spent + _amount,
      daily_spent = daily_spent + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Log
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_amount, 'spend', _description, _job_id);

  RETURN jsonb_build_object('success', true, 'new_balance', _row.balance - _amount);
END;
$$;
