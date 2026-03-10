
-- Auto-initialize 500 NEURONS for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 500, 500, 0)
  ON CONFLICT DO NOTHING;
  
  -- Log the welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 500, 'bonus', 'WELCOME BONUS: +500 NEURONS');
  
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (fires after handle_new_user)
CREATE TRIGGER trigger_new_user_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();
