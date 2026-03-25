
-- Fix permissive INSERT policy on llm_referrer_log
DROP POLICY IF EXISTS "Anyone can insert referrer logs" ON public.llm_referrer_log;
CREATE POLICY "Authenticated users can insert referrer logs" ON public.llm_referrer_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
