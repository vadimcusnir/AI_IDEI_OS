-- Add RLS policies on push_config table
-- push_config stores internal secrets used by triggers, should be read-only by service role
ALTER TABLE IF EXISTS public.push_config ENABLE ROW LEVEL SECURITY;

-- No public access — only service role (used by trigger functions)
CREATE POLICY "push_config_no_public_access" ON public.push_config
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
