
-- FIX: wallet_state - remove user UPDATE policy
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallet_state;

-- FIX: content_contributions - replace ALL with INSERT+SELECT only
DROP POLICY IF EXISTS "Authors manage own contributions" ON public.content_contributions;
DROP POLICY IF EXISTS "Authors CRUD own contributions" ON public.content_contributions;

CREATE POLICY "Authors insert contributions"
  ON public.content_contributions FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors read own contributions"
  ON public.content_contributions FOR SELECT TO authenticated
  USING (author_id = auth.uid());

-- FIX: vip_milestone_progress - remove user INSERT
DROP POLICY IF EXISTS "Users insert own milestone progress" ON public.vip_milestone_progress;
DROP POLICY IF EXISTS "Users manage own milestones" ON public.vip_milestone_progress;

-- FIX: challenge_progress - remove user INSERT/UPDATE
DROP POLICY IF EXISTS "Users insert own challenge progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Users update own challenge progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Users manage own challenge progress" ON public.challenge_progress;

CREATE POLICY "Users read own challenge progress"
  ON public.challenge_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- FIX: learning_path_progress - replace ALL with SELECT only
DROP POLICY IF EXISTS "Users manage own learning progress" ON public.learning_path_progress;
DROP POLICY IF EXISTS "Users CRUD own learning progress" ON public.learning_path_progress;

CREATE POLICY "Users read own learning progress"
  ON public.learning_path_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- FIX: team_challenge_contributions - remove user INSERT
DROP POLICY IF EXISTS "Users insert own contributions" ON public.team_challenge_contributions;
DROP POLICY IF EXISTS "Users add contributions" ON public.team_challenge_contributions;

CREATE POLICY "Users read own team contributions"
  ON public.team_challenge_contributions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
