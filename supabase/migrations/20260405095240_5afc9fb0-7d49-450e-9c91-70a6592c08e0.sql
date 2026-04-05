
-- Add explicit RLS policies to login_attempts (currently RLS enabled but no policies)
-- This is an audit/security table: admin-read, no direct user access

CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
