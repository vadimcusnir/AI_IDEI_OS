
-- Neuron lifecycle stages and content categories
CREATE TYPE public.neuron_lifecycle AS ENUM ('ingested', 'structured', 'active', 'capitalized', 'compounded');
CREATE TYPE public.content_category AS ENUM ('transcript', 'insight', 'framework', 'strategy', 'formula', 'pattern', 'avatar', 'argument_map', 'narrative', 'psychological', 'commercial');
CREATE TYPE public.service_class AS ENUM ('A', 'B', 'C');

-- Episodes table: raw content ingestion (the Extractor)
CREATE TABLE public.episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Episode',
  source_type text NOT NULL DEFAULT 'text',
  source_url text,
  status text NOT NULL DEFAULT 'uploaded',
  metadata jsonb DEFAULT '{}'::jsonb,
  transcript text,
  duration_seconds integer,
  language text DEFAULT 'ro',
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own episodes" ON public.episodes
  FOR ALL TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Link neurons to episodes (extraction lineage)
ALTER TABLE public.neurons ADD COLUMN IF NOT EXISTS lifecycle text NOT NULL DEFAULT 'ingested';
ALTER TABLE public.neurons ADD COLUMN IF NOT EXISTS content_category text DEFAULT NULL;
ALTER TABLE public.neurons ADD COLUMN IF NOT EXISTS episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL;
ALTER TABLE public.neurons ADD COLUMN IF NOT EXISTS credits_cost integer NOT NULL DEFAULT 0;

-- Service catalog: defines available AI services
CREATE TABLE public.service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  service_class text NOT NULL DEFAULT 'A',
  category text NOT NULL DEFAULT 'analysis',
  credits_cost integer NOT NULL DEFAULT 100,
  input_schema jsonb DEFAULT '[]'::jsonb,
  deliverables_schema jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  icon text DEFAULT 'sparkles',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service catalog readable by all" ON public.service_catalog
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage service catalog" ON public.service_catalog
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default services
INSERT INTO public.service_catalog (service_key, name, description, service_class, category, credits_cost, icon) VALUES
  ('extract_insights', 'Extract Insights', 'Extract key takeaways and insights from content', 'A', 'extraction', 50, 'brain'),
  ('extract_frameworks', 'Extract Frameworks', 'Identify mental models and structured patterns', 'A', 'extraction', 75, 'layers'),
  ('extract_questions', 'Extract Questions', 'Generate Socratic questions from content', 'A', 'extraction', 50, 'help-circle'),
  ('extract_quotes', 'Extract Quotes', 'Find quotable and impactful statements', 'A', 'extraction', 30, 'quote'),
  ('extract_prompts', 'Generate Prompts', 'Create reusable AI prompts from content', 'A', 'extraction', 60, 'message-square'),
  ('market_research', 'Market Research', 'Deep market analysis and positioning', 'A', 'analysis', 350, 'bar-chart-3'),
  ('generate_article', 'Generate Article', 'Transform neurons into full articles', 'B', 'production', 150, 'file-text'),
  ('generate_course', 'Generate Course Structure', 'Create course outline from knowledge', 'B', 'production', 500, 'graduation-cap'),
  ('generate_funnel', 'Build Funnel Strategy', 'Design conversion funnel from insights', 'C', 'orchestration', 700, 'filter'),
  ('campaign_builder', 'Campaign Builder', 'Orchestrate multi-channel campaign', 'C', 'orchestration', 1000, 'megaphone');

-- Enable realtime for episodes
ALTER PUBLICATION supabase_realtime ADD TABLE public.episodes;
