
CREATE TABLE public.psychological_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_profile_id uuid REFERENCES public.guest_profiles(id) ON DELETE CASCADE NOT NULL,
  author_id uuid NOT NULL,
  
  -- Big Five scores (0-100)
  openness integer DEFAULT 0,
  conscientiousness integer DEFAULT 0,
  extraversion integer DEFAULT 0,
  agreeableness integer DEFAULT 0,
  neuroticism integer DEFAULT 0,
  
  -- LIWC-style metrics (0-100)
  analytical_thinking integer DEFAULT 0,
  emotional_tone integer DEFAULT 0,
  authenticity integer DEFAULT 0,
  clout integer DEFAULT 0,
  
  -- Communication style
  dominance integer DEFAULT 0,
  empathy integer DEFAULT 0,
  cognitive_complexity integer DEFAULT 0,
  confidence_level integer DEFAULT 0,
  
  -- Derived insights
  communication_style text,
  leadership_style text,
  decision_style text,
  persuasion_approach text,
  risk_tolerance text,
  
  -- Raw analysis data
  lexical_features jsonb DEFAULT '{}'::jsonb,
  analysis_metadata jsonb DEFAULT '{}'::jsonb,
  model_version text DEFAULT 'v1',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(guest_profile_id)
);

ALTER TABLE public.psychological_profiles ENABLE ROW LEVEL SECURITY;

-- Public read for published guest profiles
CREATE POLICY "Anyone can read psycho profiles of public guests"
  ON public.psychological_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.guest_profiles gp
      WHERE gp.id = psychological_profiles.guest_profile_id
      AND gp.is_public = true
    )
  );

-- Owner can manage
CREATE POLICY "Authors can manage their psycho profiles"
  ON public.psychological_profiles FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_psychological_profiles_updated_at
  BEFORE UPDATE ON public.psychological_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
