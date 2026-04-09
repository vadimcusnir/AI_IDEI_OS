
-- CMS content table for editable site sections
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_key TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'landing',
  locale TEXT NOT NULL DEFAULT 'ro',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_key, locale)
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Public can read published content
CREATE POLICY "Anyone can read published site content"
  ON public.site_content FOR SELECT
  USING (is_published = true);

-- Admin full access
CREATE POLICY "Admins can manage site content"
  ON public.site_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_site_content_key ON public.site_content(content_key);
CREATE INDEX idx_site_content_section ON public.site_content(section);
