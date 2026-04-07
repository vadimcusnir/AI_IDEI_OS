-- 1. Re-add onboarding INSERT (trigger enforces bonus=false)
CREATE POLICY "Users insert own onboarding"
ON public.onboarding_progress FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow UPDATE only on non-bonus columns via trigger
CREATE OR REPLACE FUNCTION public.protect_onboarding_bonus_flags()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.welcome_bonus_received := OLD.welcome_bonus_received;
  NEW.completion_bonus_received := OLD.completion_bonus_received;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_bonus_on_update ON public.onboarding_progress;
CREATE TRIGGER protect_bonus_on_update
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW EXECUTE FUNCTION public.protect_onboarding_bonus_flags();

CREATE POLICY "Users update own onboarding"
ON public.onboarding_progress FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 2. intelligence_profiles: remove anon access, require authentication
DROP POLICY IF EXISTS "Read published profiles with consent" ON public.intelligence_profiles;
CREATE POLICY "Authenticated read published profiles with consent"
ON public.intelligence_profiles FOR SELECT TO authenticated
USING (visibility_status = 'published' AND risk_flag <> 'high' AND consent_required = false);

-- 3. public_figure_seo: scope to published profiles only
DROP POLICY IF EXISTS "Anyone can read public figure SEO" ON public.public_figure_seo;
DROP POLICY IF EXISTS "public_figure_seo_select" ON public.public_figure_seo;

CREATE POLICY "Read SEO for published profiles"
ON public.public_figure_seo FOR SELECT TO authenticated, anon
USING (EXISTS (
  SELECT 1 FROM public.intelligence_profiles ip
  WHERE ip.id = public_figure_seo.profile_id
  AND ip.visibility_status = 'published'
  AND ip.consent_required = false
));