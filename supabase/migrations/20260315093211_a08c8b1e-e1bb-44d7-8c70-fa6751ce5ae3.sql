
-- Fix SELECT policy: allow owners to see their workspaces even before workspace_members exists
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR is_workspace_member(auth.uid(), id));

-- Fix workspace_members INSERT: allow owners to add themselves
DROP POLICY IF EXISTS "Workspace owners/admins can add members" ON public.workspace_members;
CREATE POLICY "Workspace owners/admins can add members"
  ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR has_workspace_role(auth.uid(), workspace_id, 'admin'::workspace_role)
    OR user_id = auth.uid()
  );
