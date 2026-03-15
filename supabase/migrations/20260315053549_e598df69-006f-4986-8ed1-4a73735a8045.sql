
-- ═══════════════════════════════════════════════════════════
-- Data Collection Pipeline — Cognitive hierarchy & LLM readiness
-- ═══════════════════════════════════════════════════════════

-- Cognitive categories (taxonomy for knowledge extraction)
CREATE TABLE public.cognitive_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  parent_id uuid REFERENCES public.cognitive_categories(id) ON DELETE SET NULL,
  depth integer NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT 'brain',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cognitive units (extracted knowledge atoms linked to neurons)
CREATE TABLE public.cognitive_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.cognitive_categories(id) ON DELETE CASCADE,
  neuron_id integer,
  episode_id uuid,
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  unit_type text NOT NULL DEFAULT 'concept',
  confidence float NOT NULL DEFAULT 0.5,
  quality_score float NOT NULL DEFAULT 0,
  tags text[] DEFAULT '{}',
  source_context text,
  is_validated boolean NOT NULL DEFAULT false,
  validated_by uuid,
  validated_at timestamptz,
  llm_ready boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Training datasets (curated sets for LLM fine-tuning)
CREATE TABLE public.training_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  dataset_type text NOT NULL DEFAULT 'instruction',
  status text NOT NULL DEFAULT 'draft',
  total_samples integer NOT NULL DEFAULT 0,
  quality_threshold float NOT NULL DEFAULT 0.7,
  created_by uuid,
  export_format text NOT NULL DEFAULT 'jsonl',
  last_exported_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dataset samples (individual training pairs)
CREATE TABLE public.training_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid NOT NULL REFERENCES public.training_datasets(id) ON DELETE CASCADE,
  cognitive_unit_id uuid REFERENCES public.cognitive_units(id) ON DELETE SET NULL,
  input_text text NOT NULL,
  output_text text NOT NULL,
  system_prompt text,
  quality_score float NOT NULL DEFAULT 0,
  is_approved boolean NOT NULL DEFAULT false,
  reviewer_notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Collection pipeline runs
CREATE TABLE public.collection_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'episode',
  source_id uuid,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  units_extracted integer NOT NULL DEFAULT 0,
  units_validated integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cog_cats_parent ON public.cognitive_categories(parent_id);
CREATE INDEX idx_cog_cats_slug ON public.cognitive_categories(slug);
CREATE INDEX idx_cog_units_category ON public.cognitive_units(category_id);
CREATE INDEX idx_cog_units_author ON public.cognitive_units(author_id);
CREATE INDEX idx_cog_units_neuron ON public.cognitive_units(neuron_id);
CREATE INDEX idx_cog_units_validated ON public.cognitive_units(is_validated, llm_ready);
CREATE INDEX idx_training_samples_dataset ON public.training_samples(dataset_id);
CREATE INDEX idx_collection_runs_user ON public.collection_runs(user_id);

-- RLS
ALTER TABLE public.cognitive_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cognitive_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_runs ENABLE ROW LEVEL SECURITY;

-- cognitive_categories: all authenticated can read
CREATE POLICY "Authenticated read categories" ON public.cognitive_categories FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admin manage categories" ON public.cognitive_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- cognitive_units: user reads own, admin all
CREATE POLICY "Users read own cognitive units" ON public.cognitive_units FOR SELECT TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Users insert own cognitive units" ON public.cognitive_units FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users update own cognitive units" ON public.cognitive_units FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admin full access cognitive_units" ON public.cognitive_units FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- training_datasets: admin only
CREATE POLICY "Admin manage training_datasets" ON public.training_datasets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read training_datasets" ON public.training_datasets FOR SELECT TO authenticated USING (true);

-- training_samples: admin only write, authenticated read
CREATE POLICY "Admin manage training_samples" ON public.training_samples FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read training_samples" ON public.training_samples FOR SELECT TO authenticated USING (true);

-- collection_runs: user reads own
CREATE POLICY "Users read own collection runs" ON public.collection_runs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own collection runs" ON public.collection_runs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin full access collection_runs" ON public.collection_runs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed cognitive categories (hierarchy)
INSERT INTO public.cognitive_categories (name, slug, description, depth, icon, position) VALUES
('Frameworks', 'frameworks', 'Modele mentale și structuri de gândire', 0, 'layers', 1),
('Rhetorical Patterns', 'rhetorical-patterns', 'Formule de argumentare și persuasiune', 0, 'message-square', 2),
('Psychological Signals', 'psychological-signals', 'Indicatori comportamentali și psihologici', 0, 'brain', 3),
('Marketing Structures', 'marketing-structures', 'Strategii și tactici de marketing', 0, 'target', 4),
('Narrative Techniques', 'narrative-techniques', 'Tehnici de storytelling și narațiune', 0, 'book-open', 5),
('Decision Models', 'decision-models', 'Modele de luare a deciziilor', 0, 'git-branch', 6),
('Persuasion Formulas', 'persuasion-formulas', 'Formule validate de convingere', 0, 'sparkles', 7),
('JTBD Patterns', 'jtbd-patterns', 'Jobs-to-be-Done și motivații', 0, 'briefcase', 8);

-- Function to mark cognitive units as LLM-ready
CREATE OR REPLACE FUNCTION public.mark_units_llm_ready(_category_id uuid, _min_quality float DEFAULT 0.7)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE cognitive_units SET
    llm_ready = true,
    updated_at = now()
  WHERE category_id = _category_id
    AND is_validated = true
    AND quality_score >= _min_quality
    AND llm_ready = false;
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- Function to get collection pipeline stats
CREATE OR REPLACE FUNCTION public.collection_pipeline_stats(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_units', (SELECT COUNT(*) FROM cognitive_units WHERE author_id = _user_id),
    'validated_units', (SELECT COUNT(*) FROM cognitive_units WHERE author_id = _user_id AND is_validated = true),
    'llm_ready_units', (SELECT COUNT(*) FROM cognitive_units WHERE author_id = _user_id AND llm_ready = true),
    'total_runs', (SELECT COUNT(*) FROM collection_runs WHERE user_id = _user_id),
    'categories_used', (SELECT COUNT(DISTINCT category_id) FROM cognitive_units WHERE author_id = _user_id),
    'avg_quality', (SELECT COALESCE(AVG(quality_score), 0) FROM cognitive_units WHERE author_id = _user_id)
  ) INTO _result;
  
  RETURN _result;
END;
$$;
