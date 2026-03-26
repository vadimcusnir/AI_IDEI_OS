
CREATE TABLE public.consent_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analytics boolean NOT NULL DEFAULT false,
  ads boolean NOT NULL DEFAULT false,
  personalization boolean NOT NULL DEFAULT false,
  data_sharing boolean NOT NULL DEFAULT false,
  consent_version text NOT NULL DEFAULT '1.0',
  consented_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_consent_preferences_user ON public.consent_preferences(user_id);

ALTER TABLE public.consent_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own consent" ON public.consent_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consent" ON public.consent_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consent" ON public.consent_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
