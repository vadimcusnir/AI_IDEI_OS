
-- ============================================================
-- FIX: Remove insecure OR clause from workspace_members INSERT
-- ============================================================
DROP POLICY IF EXISTS "Workspace owners/admins can add members" ON public.workspace_members;

-- Keep only the safe "Owners can add workspace members" policy we just created
-- (already exists from previous migration)

-- ============================================================
-- FIX: user_karma - remove ALL policy, replace with SELECT-only
-- ============================================================
DROP POLICY IF EXISTS "System updates karma" ON public.user_karma;
DROP POLICY IF EXISTS "Users read own karma" ON public.user_karma;

-- Users can only READ their own karma
CREATE POLICY "Users read own karma"
  ON public.user_karma
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin can read all karma
CREATE POLICY "Admin read all karma"
  ON public.user_karma
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only service-role / triggers can INSERT/UPDATE karma (via SECURITY DEFINER functions)
-- No user-facing write policy needed

-- ============================================================
-- FIX: user_achievements - restrict public read to authenticated
-- ============================================================
DROP POLICY IF EXISTS "Public can read achievements" ON public.user_achievements;

CREATE POLICY "Authenticated read own achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin read all achievements"
  ON public.user_achievements
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- FIX: forum_votes - restrict to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "Anyone can read votes" ON public.forum_votes;

CREATE POLICY "Authenticated read votes"
  ON public.forum_votes
  FOR SELECT
  TO authenticated
  USING (true);
