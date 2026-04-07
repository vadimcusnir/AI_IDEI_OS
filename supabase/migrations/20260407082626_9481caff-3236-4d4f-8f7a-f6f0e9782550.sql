-- CRITICAL: Prevent users from modifying suspension fields on their own profile
-- Use a trigger to protect admin-only columns
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is not an admin, preserve admin-controlled fields
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_suspended := OLD.is_suspended;
    NEW.suspended_at := OLD.suspended_at;
    NEW.suspended_by := OLD.suspended_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_admin_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_admin_fields();

-- WARN: user_integrations auth_tokens — revoke column-level SELECT (belt + suspenders)
REVOKE SELECT (auth_tokens) ON public.user_integrations FROM authenticated, anon;