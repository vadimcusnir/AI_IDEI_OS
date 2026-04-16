DROP FUNCTION IF EXISTS public.atomic_deduct_neurons(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.atomic_deduct_neurons(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'service_execution'
)
RETURNS TABLE(success BOOLEAN, remaining INTEGER, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_daily_spent INTEGER;
  v_daily_cap INTEGER;
  v_daily_date DATE;
BEGIN
  SELECT available INTO v_current_balance
  FROM wallet_state
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT false, 0, 'No wallet found'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT false, v_current_balance, 'Insufficient balance'::TEXT;
    RETURN;
  END IF;

  SELECT uc.daily_spent, uc.daily_spend_cap, uc.daily_spent_date
  INTO v_daily_spent, v_daily_cap, v_daily_date
  FROM user_credits uc
  WHERE uc.user_id = p_user_id
  FOR UPDATE;

  IF v_daily_date IS NULL OR v_daily_date < CURRENT_DATE THEN
    v_daily_spent := 0;
    UPDATE user_credits SET daily_spent = 0, daily_spent_date = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;

  v_daily_cap := COALESCE(v_daily_cap, 5000);
  IF (v_daily_spent + p_amount) > v_daily_cap THEN
    RETURN QUERY SELECT false, v_current_balance,
      format('Daily spend cap reached (%s/%s)', v_daily_spent, v_daily_cap)::TEXT;
    RETURN;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE wallet_state SET available = v_new_balance
  WHERE user_id = p_user_id;

  UPDATE user_credits
  SET daily_spent = v_daily_spent + p_amount,
      daily_spent_date = CURRENT_DATE,
      total_spent = total_spent + p_amount,
      balance = balance - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'service_execution', p_description);

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;