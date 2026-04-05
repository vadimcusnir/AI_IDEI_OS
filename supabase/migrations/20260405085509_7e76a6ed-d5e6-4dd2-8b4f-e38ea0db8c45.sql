DROP POLICY IF EXISTS "workspace_members_insert_own" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_own" ON public.workspace_members;

DROP POLICY IF EXISTS "anyone_read_creator_rankings" ON public.creator_rankings;
DROP POLICY IF EXISTS "creator_rankings_insert_own" ON public.creator_rankings;
DROP POLICY IF EXISTS "creator_rankings_update_own" ON public.creator_rankings;
DROP POLICY IF EXISTS "creator_rankings_delete_own" ON public.creator_rankings;

CREATE POLICY "Admins can view creator rankings"
ON public.creator_rankings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));