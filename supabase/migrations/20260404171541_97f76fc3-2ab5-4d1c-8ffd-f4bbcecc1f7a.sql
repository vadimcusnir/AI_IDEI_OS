
-- 1. Three-axis extraction results table
CREATE TABLE public.axis_extraction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  axis TEXT NOT NULL CHECK (axis IN ('psychological', 'narrative', 'commercial')),
  extraction JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(4,3) DEFAULT 0.000,
  model_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_axis_results_neuron ON public.axis_extraction_results(neuron_id);
CREATE INDEX idx_axis_results_user ON public.axis_extraction_results(user_id);
CREATE INDEX idx_axis_results_axis ON public.axis_extraction_results(axis);

ALTER TABLE public.axis_extraction_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own axis results"
  ON public.axis_extraction_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own axis results"
  ON public.axis_extraction_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Extended content categories for neurons (add column if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'neurons' AND column_name = 'content_category'
  ) THEN
    ALTER TABLE public.neurons ADD COLUMN content_category TEXT DEFAULT 'general';
  END IF;
END$$;

-- 3. Public figure SEO metadata table
CREATE TABLE public.public_figure_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  json_ld JSONB DEFAULT '{}',
  hreflang JSONB DEFAULT '{}',
  keyword_clusters JSONB DEFAULT '[]',
  internal_links JSONB DEFAULT '[]',
  content_score JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pf_seo_profile ON public.public_figure_seo(profile_id);

ALTER TABLE public.public_figure_seo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public figure SEO"
  ON public.public_figure_seo FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users insert SEO"
  ON public.public_figure_seo FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update SEO"
  ON public.public_figure_seo FOR UPDATE
  TO authenticated
  USING (true);
