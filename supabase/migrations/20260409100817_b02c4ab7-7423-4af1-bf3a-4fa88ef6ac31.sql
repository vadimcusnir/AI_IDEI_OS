CREATE TABLE IF NOT EXISTS public.user_personalization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pref_key TEXT NOT NULL,
  pref_value JSONB DEFAULT 'null',
  source TEXT NOT NULL DEFAULT 'manual',
  confidence NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pref_key)
);

ALTER TABLE public.user_personalization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prefs" ON public.user_personalization
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prefs" ON public.user_personalization
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON public.user_personalization
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prefs" ON public.user_personalization
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_personalization_updated_at
  BEFORE UPDATE ON public.user_personalization
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();