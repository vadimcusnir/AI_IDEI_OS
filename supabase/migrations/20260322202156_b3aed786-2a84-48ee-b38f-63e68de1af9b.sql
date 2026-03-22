
-- Fix guest_profile_edits: restrict SELECT to editor only or admins
DROP POLICY IF EXISTS "Authenticated can view edits" ON public.guest_profile_edits;
CREATE POLICY "Users can view own edits" ON public.guest_profile_edits
  FOR SELECT TO authenticated
  USING (editor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Fix guest_profile_suggestions: restrict SELECT to creator or admins
DROP POLICY IF EXISTS "Authenticated can view suggestions" ON public.guest_profile_suggestions;
CREATE POLICY "Users can view own suggestions" ON public.guest_profile_suggestions
  FOR SELECT TO authenticated
  USING (suggested_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
