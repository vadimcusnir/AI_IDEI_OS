
-- Fix llm_referrer_log permissive INSERT policy
-- Table has no user_id, it's public analytics tracking
-- Replace WITH CHECK (true) with a meaningful check
DROP POLICY IF EXISTS "Public referrer log insert" ON public.llm_referrer_log;
CREATE POLICY "Public referrer log insert" ON public.llm_referrer_log
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    referrer_source IS NOT NULL 
    AND page_path IS NOT NULL
  );
