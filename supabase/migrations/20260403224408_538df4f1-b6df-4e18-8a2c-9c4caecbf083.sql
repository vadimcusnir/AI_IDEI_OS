ALTER TABLE public.capacity_state 
ADD COLUMN IF NOT EXISTS kill_switch boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS kill_switch_reason text,
ADD COLUMN IF NOT EXISTS kill_switch_activated_by uuid,
ADD COLUMN IF NOT EXISTS kill_switch_activated_at timestamptz;

CREATE TABLE IF NOT EXISTS public.kill_switch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activated_by uuid NOT NULL,
  action text NOT NULL DEFAULT 'activate',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kill_switch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_kill_switch_log" ON public.kill_switch_log
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.check_kill_switch()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT kill_switch FROM capacity_state LIMIT 1), false);
$$;