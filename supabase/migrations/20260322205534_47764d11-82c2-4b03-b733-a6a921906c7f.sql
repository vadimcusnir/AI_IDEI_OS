
-- =============================================
-- INTELLIGENCE SCHEMA — P0
-- =============================================

-- 1. person — unified identity
CREATE TABLE public.intel_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  external_ref TEXT,
  name TEXT NOT NULL,
  normalized_name TEXT,
  entity_type TEXT NOT NULL DEFAULT 'guest' CHECK (entity_type IN ('host', 'guest', 'brand', 'organization')),
  avatar_url TEXT,
  bio TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intel_persons_user ON public.intel_persons(user_id);
CREATE INDEX idx_intel_persons_name ON public.intel_persons(normalized_name);

-- 2. intel_transcripts — source raw (linked to episodes)
CREATE TABLE public.intel_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  episode_id UUID,
  source_type TEXT NOT NULL DEFAULT 'upload' CHECK (source_type IN ('zoom', 'youtube', 'upload', 'auto_ingest', 'text')),
  content TEXT NOT NULL DEFAULT '',
  word_count INTEGER NOT NULL DEFAULT 0,
  language TEXT DEFAULT 'ro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intel_transcripts_person ON public.intel_transcripts(person_id);
CREATE INDEX idx_intel_transcripts_job ON public.intel_transcripts(job_id);

-- 3. intel_statements — atomic semantic units
CREATE TABLE public.intel_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  transcript_id UUID REFERENCES public.intel_transcripts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position_start INTEGER,
  position_end INTEGER,
  confidence_score NUMERIC DEFAULT 0.5,
  source_weight NUMERIC DEFAULT 1.0,
  intensity_score NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intel_statements_person ON public.intel_statements(person_id);
CREATE INDEX idx_intel_statements_transcript ON public.intel_statements(transcript_id);

-- 4. trait_definitions — stable taxonomy
CREATE TABLE public.trait_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cognitive', 'behavioral', 'rhetorical', 'risk', 'emotional', 'strategic')),
  polarity TEXT NOT NULL DEFAULT 'positive' CHECK (polarity IN ('positive', 'neutral', 'negative')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. trait_signals — statement → trait link
CREATE TABLE public.trait_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES public.intel_statements(id) ON DELETE CASCADE,
  trait_id UUID REFERENCES public.trait_definitions(id) ON DELETE CASCADE,
  signal_strength NUMERIC NOT NULL DEFAULT 0.5 CHECK (signal_strength >= 0 AND signal_strength <= 1),
  detection_method TEXT NOT NULL DEFAULT 'llm' CHECK (detection_method IN ('llm', 'rule', 'hybrid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trait_signals_person ON public.trait_signals(person_id);
CREATE INDEX idx_trait_signals_trait ON public.trait_signals(trait_id);
CREATE INDEX idx_trait_signals_statement ON public.trait_signals(statement_id);

-- 6. person_traits — longitudinal aggregation
CREATE TABLE public.person_traits (
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  trait_id UUID REFERENCES public.trait_definitions(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  signal_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, trait_id)
);

-- 7. personality_dimensions — Big Five / custom
CREATE TABLE public.personality_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. trait_dimension_map — trait → dimension mapping
CREATE TABLE public.trait_dimension_map (
  trait_id UUID REFERENCES public.trait_definitions(id) ON DELETE CASCADE,
  dimension_id UUID REFERENCES public.personality_dimensions(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  PRIMARY KEY (trait_id, dimension_id)
);

-- 9. person_dimension_scores — aggregated per dimension
CREATE TABLE public.person_dimension_scores (
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  dimension_id UUID REFERENCES public.personality_dimensions(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, dimension_id)
);

-- 10. person_profiles — final generated output
CREATE TABLE public.person_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  profile_version TEXT NOT NULL DEFAULT 'v1',
  summary TEXT,
  strengths JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  communication_style JSONB DEFAULT '{}',
  strategic_profile JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_person_profiles_person ON public.person_profiles(person_id);

-- 11. person_snapshots — longitudinal drift detection
CREATE TABLE public.person_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trait_distribution JSONB DEFAULT '{}',
  dimension_distribution JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_person_snapshots_person ON public.person_snapshots(person_id);

-- 12. risk_signals — risk intelligence
CREATE TABLE public.risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES public.intel_persons(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES public.intel_statements(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL,
  severity NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_signals_person ON public.risk_signals(person_id);

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.intel_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trait_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trait_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trait_dimension_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_dimension_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_signals ENABLE ROW LEVEL SECURITY;

-- intel_persons: owner can CRUD, admin can read all
CREATE POLICY "Users manage own persons" ON public.intel_persons FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- intel_transcripts: follow person ownership
CREATE POLICY "Users manage own transcripts" ON public.intel_transcripts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- intel_statements: follow person ownership
CREATE POLICY "Users manage own statements" ON public.intel_statements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- trait_definitions: public read, admin write
CREATE POLICY "Anyone can read traits" ON public.trait_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage traits" ON public.trait_definitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- trait_signals: follow person ownership
CREATE POLICY "Users manage own signals" ON public.trait_signals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- person_traits: follow person ownership
CREATE POLICY "Users read own traits" ON public.person_traits FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- personality_dimensions: public read, admin write
CREATE POLICY "Anyone can read dimensions" ON public.personality_dimensions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage dimensions" ON public.personality_dimensions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- trait_dimension_map: public read, admin write
CREATE POLICY "Anyone can read maps" ON public.trait_dimension_map FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage maps" ON public.trait_dimension_map FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- person_dimension_scores: follow person ownership
CREATE POLICY "Users read own dimension scores" ON public.person_dimension_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- person_profiles: follow person ownership
CREATE POLICY "Users manage own profiles" ON public.person_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- person_snapshots: follow person ownership
CREATE POLICY "Users read own snapshots" ON public.person_snapshots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- risk_signals: follow person ownership
CREATE POLICY "Users read own risk signals" ON public.risk_signals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.intel_persons p WHERE p.id = person_id AND (p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

-- =============================================
-- RPC FUNCTIONS
-- =============================================

-- Compute person trait scores (aggregation)
CREATE OR REPLACE FUNCTION public.compute_person_traits(_person_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_statements INTEGER;
  _trait RECORD;
BEGIN
  SELECT COUNT(*) INTO _total_statements FROM intel_statements WHERE person_id = _person_id;
  IF _total_statements = 0 THEN RETURN; END IF;

  FOR _trait IN
    SELECT ts.trait_id,
           SUM(ts.signal_strength * s.confidence_score * s.source_weight * (1 + s.intensity_score)) as raw_score,
           COUNT(*) as signal_count
    FROM trait_signals ts
    JOIN intel_statements s ON s.id = ts.statement_id
    WHERE ts.person_id = _person_id
    GROUP BY ts.trait_id
  LOOP
    INSERT INTO person_traits (person_id, trait_id, score, signal_count, last_updated)
    VALUES (
      _person_id,
      _trait.trait_id,
      1.0 / (1.0 + EXP(-3.0 * (_trait.raw_score / LN(1 + _total_statements) - 0.5))),
      _trait.signal_count,
      now()
    )
    ON CONFLICT (person_id, trait_id) DO UPDATE SET
      score = EXCLUDED.score,
      signal_count = EXCLUDED.signal_count,
      last_updated = now();
  END LOOP;
END;
$$;

-- Compute dimension scores from trait scores
CREATE OR REPLACE FUNCTION public.compute_person_dimensions(_person_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _dim RECORD;
BEGIN
  FOR _dim IN
    SELECT tdm.dimension_id,
           SUM(pt.score * tdm.weight) / NULLIF(SUM(tdm.weight), 0) as dim_score
    FROM person_traits pt
    JOIN trait_dimension_map tdm ON tdm.trait_id = pt.trait_id
    WHERE pt.person_id = _person_id
    GROUP BY tdm.dimension_id
  LOOP
    INSERT INTO person_dimension_scores (person_id, dimension_id, score, last_updated)
    VALUES (_person_id, _dim.dimension_id, _dim.dim_score, now())
    ON CONFLICT (person_id, dimension_id) DO UPDATE SET
      score = EXCLUDED.score,
      last_updated = now();
  END LOOP;
END;
$$;

-- Compute confidence index for a person
CREATE OR REPLACE FUNCTION public.compute_person_confidence(_person_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total INTEGER;
BEGIN
  SELECT COUNT(*) INTO _total FROM intel_statements WHERE person_id = _person_id;
  RETURN 1.0 - EXP(-0.02 * _total);
END;
$$;

-- Full intelligence pipeline for a person
CREATE OR REPLACE FUNCTION public.run_intelligence_pipeline(_person_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _confidence NUMERIC;
  _trait_count INTEGER;
  _dim_count INTEGER;
BEGIN
  PERFORM compute_person_traits(_person_id);
  PERFORM compute_person_dimensions(_person_id);
  
  _confidence := compute_person_confidence(_person_id);
  SELECT COUNT(*) INTO _trait_count FROM person_traits WHERE person_id = _person_id;
  SELECT COUNT(*) INTO _dim_count FROM person_dimension_scores WHERE person_id = _person_id;
  
  -- Create snapshot
  INSERT INTO person_snapshots (person_id, snapshot_date, trait_distribution, dimension_distribution, confidence_score)
  VALUES (
    _person_id,
    CURRENT_DATE,
    (SELECT COALESCE(jsonb_object_agg(td.code, pt.score), '{}'::jsonb)
     FROM person_traits pt JOIN trait_definitions td ON td.id = pt.trait_id WHERE pt.person_id = _person_id),
    (SELECT COALESCE(jsonb_object_agg(pd.code, pds.score), '{}'::jsonb)
     FROM person_dimension_scores pds JOIN personality_dimensions pd ON pd.id = pds.dimension_id WHERE pds.person_id = _person_id),
    _confidence
  );
  
  RETURN jsonb_build_object(
    'person_id', _person_id,
    'confidence', _confidence,
    'traits_computed', _trait_count,
    'dimensions_computed', _dim_count,
    'snapshot_created', true
  );
END;
$$;

-- updated_at triggers
CREATE TRIGGER update_intel_persons_updated_at BEFORE UPDATE ON public.intel_persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
