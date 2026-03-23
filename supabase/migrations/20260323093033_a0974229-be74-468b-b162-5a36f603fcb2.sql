
-- 1. Update welcome bonus from 500 to 1000 NEURONS
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 1000, 1000, 0)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 1000, 'bonus', 'WELCOME BONUS: +1000 NEURONS');
  
  RETURN NEW;
END;
$function$;

-- 2. Create onboarding_progress table
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_verified boolean NOT NULL DEFAULT false,
  welcome_bonus_received boolean NOT NULL DEFAULT false,
  tutorial_started boolean NOT NULL DEFAULT false,
  tutorial_completed boolean NOT NULL DEFAULT false,
  tutorial_modules_completed jsonb NOT NULL DEFAULT '[]'::jsonb,
  first_service_executed boolean NOT NULL DEFAULT false,
  profile_completed boolean NOT NULL DEFAULT false,
  completion_bonus_received boolean NOT NULL DEFAULT false,
  tos_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Users can read/update only their own progress
CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Auto-create onboarding_progress row for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.onboarding_progress (user_id, welcome_bonus_received)
  VALUES (NEW.id, true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_onboarding();

-- 4. Function to award tutorial completion bonus
CREATE OR REPLACE FUNCTION public.complete_onboarding_tutorial(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _progress RECORD;
BEGIN
  SELECT * INTO _progress FROM onboarding_progress WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No onboarding record found');
  END IF;
  
  IF _progress.completion_bonus_received THEN
    RETURN jsonb_build_object('already_awarded', true);
  END IF;
  
  -- Award 50 NEURONS completion bonus
  PERFORM add_credits(_user_id, 50, 'Onboarding tutorial completion bonus: +50 NEURONS');
  
  UPDATE onboarding_progress SET
    tutorial_completed = true,
    completion_bonus_received = true,
    completed_at = now()
  WHERE user_id = _user_id;
  
  -- Notify
  INSERT INTO notifications (user_id, type, title, message, link, meta)
  VALUES (_user_id, 'bonus', '🎉 Tutorial Complete!', '+50 NEURONS awarded for completing the onboarding tutorial', '/home',
    jsonb_build_object('bonus_amount', 50, 'bonus_type', 'onboarding_completion'));
  
  RETURN jsonb_build_object('ok', true, 'bonus', 50);
END;
$function$;
