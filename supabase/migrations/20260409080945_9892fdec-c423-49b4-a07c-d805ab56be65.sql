
-- Fix search_path for update_user_credits function
CREATE OR REPLACE FUNCTION public.update_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user_credits materialized balance when credit_transactions change
  INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  VALUES (
    NEW.user_id,
    CASE WHEN NEW.transaction_type IN ('earn', 'bonus', 'refund', 'purchase', 'admin_grant') THEN NEW.amount ELSE -NEW.amount END,
    CASE WHEN NEW.transaction_type IN ('earn', 'bonus', 'refund', 'purchase', 'admin_grant') THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.transaction_type IN ('spend', 'deduct') THEN NEW.amount ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_credits.balance + EXCLUDED.balance,
    lifetime_earned = user_credits.lifetime_earned + EXCLUDED.lifetime_earned,
    lifetime_spent = user_credits.lifetime_spent + EXCLUDED.lifetime_spent,
    updated_at = now();
  RETURN NEW;
END;
$$;
