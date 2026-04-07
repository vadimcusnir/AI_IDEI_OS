-- FIX 1: Set search_path on protect_onboarding_bonus_flags to prevent search_path hijacking
CREATE OR REPLACE FUNCTION public.protect_onboarding_bonus_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.welcome_bonus_received := OLD.welcome_bonus_received;
  NEW.completion_bonus_received := OLD.completion_bonus_received;
  RETURN NEW;
END;
$function$;

-- FIX 2: Remove anonymous access to llm_issues (internal platform data)
DROP POLICY IF EXISTS "Public read llm_issues" ON public.llm_issues;

-- Replace with authenticated-only read for admins
CREATE POLICY "Admins read llm_issues"
ON public.llm_issues FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));