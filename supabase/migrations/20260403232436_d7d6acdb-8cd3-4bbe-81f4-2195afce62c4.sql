
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Rule',
  description TEXT,
  trigger_event TEXT NOT NULL DEFAULT 'low_credits',
  condition JSONB NOT NULL DEFAULT '{}',
  action_type TEXT NOT NULL DEFAULT 'notify',
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  fire_count INT NOT NULL DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rules"
  ON public.automation_rules FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own rules"
  ON public.automation_rules FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rules"
  ON public.automation_rules FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own rules"
  ON public.automation_rules FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
