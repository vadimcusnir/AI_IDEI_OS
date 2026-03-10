-- Fix push_config: only service role should read/write (used by trigger function)
CREATE POLICY "Push config readable by service role only"
  ON public.push_config
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix: allow anon users to read public feedback (for testimonials on landing)
CREATE POLICY "Anon can read public feedback"
  ON public.feedback
  FOR SELECT
  TO anon
  USING (is_public = true);