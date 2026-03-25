
-- llm_referrer_log is a public analytics table with no user_id column.
-- It needs anonymous INSERT access for referrer tracking from public pages.
-- Replace authenticated-only with anon+authenticated access.
DROP POLICY IF EXISTS "Authenticated users can insert referrer logs" ON public.llm_referrer_log;
CREATE POLICY "Public referrer log insert" ON public.llm_referrer_log
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
