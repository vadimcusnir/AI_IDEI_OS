-- 1. access_window_state: block all client writes (service_role only)
DROP POLICY IF EXISTS "System inserts access" ON public.access_window_state;
DROP POLICY IF EXISTS "access_window_state_insert_own" ON public.access_window_state;
DROP POLICY IF EXISTS "access_window_state_update_own" ON public.access_window_state;

-- 2. onboarding_progress: block client UPDATE (prevents bonus flag reset)
DROP POLICY IF EXISTS "onboarding_progress_update_own" ON public.onboarding_progress;
DROP POLICY IF EXISTS "Users can update own onboarding progress" ON public.onboarding_progress;

-- Keep one INSERT for initial row creation, add trigger to enforce defaults
DROP POLICY IF EXISTS "onboarding_progress_insert_own" ON public.onboarding_progress;

-- Trigger: force bonus flags to false on any client insert
CREATE OR REPLACE FUNCTION public.enforce_onboarding_defaults()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.welcome_bonus_received := false;
  NEW.completion_bonus_received := false;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_onboarding_defaults_trigger ON public.onboarding_progress;
CREATE TRIGGER enforce_onboarding_defaults_trigger
BEFORE INSERT ON public.onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.enforce_onboarding_defaults();