
-- Memory entries for auto-recall
CREATE TABLE public.user_memory_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'context',
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  relevance_score NUMERIC(4,3) DEFAULT 1.0,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_memory_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own memory" ON public.user_memory_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own memory" ON public.user_memory_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own memory" ON public.user_memory_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own memory" ON public.user_memory_entries FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_memory_user_type ON public.user_memory_entries(user_id, memory_type);
CREATE INDEX idx_memory_relevance ON public.user_memory_entries(user_id, relevance_score DESC);

-- Adaptation log
CREATE TABLE public.user_adaptation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  adaptation_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  confidence NUMERIC(4,3) DEFAULT 0.5,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_adaptation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own adaptations" ON public.user_adaptation_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own adaptations" ON public.user_adaptation_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_adaptation_user ON public.user_adaptation_log(user_id, created_at DESC);

-- Personalization preferences
CREATE TABLE public.user_personalization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pref_key TEXT NOT NULL,
  pref_value JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual',
  confidence NUMERIC(4,3) DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pref_key)
);

ALTER TABLE public.user_personalization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own prefs" ON public.user_personalization FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own prefs" ON public.user_personalization FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.user_personalization FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own prefs" ON public.user_personalization FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_personalization_user ON public.user_personalization(user_id);
