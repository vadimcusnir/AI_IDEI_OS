
-- Public analyses table for SEO-indexable /analysis/{slug} pages
CREATE TABLE public.public_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  analysis_type text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  source_artifact_id uuid REFERENCES public.artifacts(id) ON DELETE SET NULL,
  meta_title text,
  meta_description text,
  og_image_url text,
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Public read access (no auth needed)
ALTER TABLE public.public_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published analyses"
  ON public.public_analyses FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authors can manage own analyses"
  ON public.public_analyses FOR ALL
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Index for slug lookups
CREATE INDEX idx_public_analyses_slug ON public.public_analyses(slug);
CREATE INDEX idx_public_analyses_author ON public.public_analyses(author_id);
CREATE INDEX idx_public_analyses_type ON public.public_analyses(analysis_type) WHERE is_published = true;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_analysis_views(_slug text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public_analyses SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
$$;
