
CREATE OR REPLACE FUNCTION public.atomic_deduct_neurons(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'service_execution'
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
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

  v_new_balance := v_current_balance - p_amount;

  UPDATE wallet_state
  SET available = v_new_balance
  WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -p_amount, 'service_execution', p_description);

  RETURN QUERY SELECT true, v_new_balance, NULL::TEXT;
END;
$$;
