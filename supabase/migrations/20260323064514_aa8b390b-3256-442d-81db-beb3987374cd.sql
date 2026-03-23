
-- ═══════════════════════════════════════════
-- DISTRIBUTION ENGINE: Share tracking
-- ═══════════════════════════════════════════
CREATE TABLE public.share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL DEFAULT 'service_output',
  content_category text NOT NULL DEFAULT 'utility_tool',
  service_key text,
  platform text NOT NULL,
  share_text_preview text,
  has_cta boolean NOT NULL DEFAULT true,
  clicked_back boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own shares"
  ON public.share_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own shares"
  ON public.share_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_share_events_user ON public.share_events(user_id, created_at DESC);
CREATE INDEX idx_share_events_platform ON public.share_events(platform, created_at DESC);

-- ═══════════════════════════════════════════
-- MEMORY ENGINE: User memory entries
-- ═══════════════════════════════════════════
CREATE TABLE public.user_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  memory_type text NOT NULL DEFAULT 'action',
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}',
  source_type text DEFAULT 'manual',
  source_id text,
  reuse_count integer NOT NULL DEFAULT 0,
  last_reused_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own memory"
  ON public.user_memory FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_user_memory_user ON public.user_memory(user_id, created_at DESC);
CREATE INDEX idx_user_memory_type ON public.user_memory(user_id, memory_type, category);

-- ═══════════════════════════════════════════
-- MEMORY ENGINE: User intelligence profiles
-- ═══════════════════════════════════════════
CREATE TABLE public.user_intelligence_profiles (
  user_id uuid PRIMARY KEY,
  interests text[] DEFAULT '{}',
  preferred_services text[] DEFAULT '{}',
  content_style text DEFAULT 'neutral',
  spending_pattern text DEFAULT 'conservative',
  behavior_tags text[] DEFAULT '{}',
  top_topics text[] DEFAULT '{}',
  total_outputs integer NOT NULL DEFAULT 0,
  total_neurons integer NOT NULL DEFAULT 0,
  total_shares integer NOT NULL DEFAULT 0,
  lockin_score numeric(5,2) NOT NULL DEFAULT 0,
  compounding_level integer NOT NULL DEFAULT 1,
  last_computed_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_intelligence_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.user_intelligence_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.user_intelligence_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Auto-create intelligence profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_intelligence()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_intelligence_profiles (user_id)
  VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_intelligence
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_intelligence();

-- ═══════════════════════════════════════════
-- MEMORY ENGINE: Compute intelligence profile
-- ═══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.compute_user_intelligence(_user_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _neurons_count integer;
  _outputs_count integer;
  _shares_count integer;
  _top_services text[];
  _top_topics text[];
  _lockin numeric;
  _compound_level integer;
  _spending text;
BEGIN
  -- Count neurons
  SELECT COUNT(*) INTO _neurons_count FROM neurons WHERE author_id = _user_id;
  
  -- Count outputs (artifacts)
  SELECT COUNT(*) INTO _outputs_count FROM artifacts WHERE author_id = _user_id;
  
  -- Count shares
  SELECT COUNT(*) INTO _shares_count FROM share_events WHERE user_id = _user_id;
  
  -- Top services used
  SELECT ARRAY(
    SELECT service_key FROM (
      SELECT service_key, COUNT(*) as cnt
      FROM artifacts WHERE author_id = _user_id AND service_key IS NOT NULL
      GROUP BY service_key ORDER BY cnt DESC LIMIT 5
    ) sub
  ) INTO _top_services;
  
  -- Top topics from neurons
  SELECT ARRAY(
    SELECT tag FROM (
      SELECT unnest(tags) as tag, COUNT(*) as cnt
      FROM neurons WHERE author_id = _user_id AND tags IS NOT NULL
      GROUP BY tag ORDER BY cnt DESC LIMIT 5
    ) sub
  ) INTO _top_topics;
  
  -- Spending pattern
  SELECT CASE
    WHEN COALESCE(total_spent, 0) > 10000 THEN 'heavy'
    WHEN COALESCE(total_spent, 0) > 3000 THEN 'moderate'
    WHEN COALESCE(total_spent, 0) > 500 THEN 'light'
    ELSE 'conservative'
  END INTO _spending
  FROM user_credits WHERE user_id = _user_id;
  
  -- Lock-in score (0-100)
  _lockin := LEAST(100, (
    _neurons_count * 2.0 +
    _outputs_count * 1.5 +
    _shares_count * 0.5 +
    (SELECT COUNT(*) FROM user_memory WHERE user_id = _user_id) * 0.3
  ));
  
  -- Compounding level
  _compound_level := CASE
    WHEN _neurons_count >= 100 THEN 5
    WHEN _neurons_count >= 50 THEN 4
    WHEN _neurons_count >= 10 THEN 3
    WHEN _neurons_count >= 1 THEN 2
    ELSE 1
  END;
  
  -- Update profile
  INSERT INTO user_intelligence_profiles (
    user_id, preferred_services, top_topics, spending_pattern,
    total_outputs, total_neurons, total_shares, lockin_score,
    compounding_level, last_computed_at, updated_at
  ) VALUES (
    _user_id, _top_services, _top_topics, COALESCE(_spending, 'conservative'),
    _outputs_count, _neurons_count, _shares_count, _lockin,
    _compound_level, now(), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    preferred_services = EXCLUDED.preferred_services,
    top_topics = EXCLUDED.top_topics,
    spending_pattern = EXCLUDED.spending_pattern,
    total_outputs = EXCLUDED.total_outputs,
    total_neurons = EXCLUDED.total_neurons,
    total_shares = EXCLUDED.total_shares,
    lockin_score = EXCLUDED.lockin_score,
    compounding_level = EXCLUDED.compounding_level,
    last_computed_at = now(),
    updated_at = now();
  
  RETURN jsonb_build_object(
    'neurons', _neurons_count,
    'outputs', _outputs_count,
    'shares', _shares_count,
    'lockin', _lockin,
    'compound_level', _compound_level,
    'top_services', _top_services,
    'top_topics', _top_topics
  );
END;
$$;

-- Enable realtime for share_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.share_events;
