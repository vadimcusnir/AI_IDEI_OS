
-- ═══ 1. PROFILES — Extend admin field protection trigger ═══
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_suspended := OLD.is_suspended;
    NEW.suspended_at := OLD.suspended_at;
    NEW.suspended_by := OLD.suspended_by;
    NEW.seller_verified := OLD.seller_verified;
  END IF;
  RETURN NEW;
END;
$$;

-- ═══ 2. PROFILES — Deduplicate UPDATE policies ═══
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- ═══ 3. FEEDBACK — Fix self-approve vulnerability ═══
DROP POLICY IF EXISTS "Users update own pending feedback" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update_own" ON public.feedback;

CREATE POLICY "Users update own pending feedback"
ON public.feedback FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending')
WITH CHECK (
  user_id = auth.uid()
  AND status = 'pending'
  AND is_public = false
  AND admin_response IS NULL
);
