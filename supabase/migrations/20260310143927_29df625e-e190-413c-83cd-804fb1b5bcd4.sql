
-- Remove overly permissive anon insert policy, webhook will use service role key
DROP POLICY "Service can insert raw changes" ON public.changes_raw;
