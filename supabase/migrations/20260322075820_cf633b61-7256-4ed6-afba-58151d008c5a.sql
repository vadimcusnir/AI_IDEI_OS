
-- ═══════════════════════════════════════════
-- LLM INDEX ENGINE — 6 core tables from spec
-- ═══════════════════════════════════════════

-- 1. site_pages — Inventory of all crawled pages
CREATE TABLE IF NOT EXISTS public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  canonical_url TEXT,
  title TEXT,
  meta_description TEXT,
  page_type TEXT DEFAULT 'page',
  language TEXT DEFAULT 'en',
  status_code INTEGER,
  content_hash TEXT,
  word_count INTEGER DEFAULT 0,
  entity_count INTEGER DEFAULT 0,
  heading_count INTEGER DEFAULT 0,
  internal_link_count INTEGER DEFAULT 0,
  external_link_count INTEGER DEFAULT 0,
  embedding_score NUMERIC(5,2) DEFAULT 0,
  llm_visibility_score NUMERIC(5,2) DEFAULT 0,
  schema_present BOOLEAN DEFAULT false,
  schema_types TEXT[] DEFAULT '{}',
  last_schema_update TIMESTAMPTZ,
  first_discovered TIMESTAMPTZ DEFAULT now(),
  last_scan TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_pages_url ON public.site_pages(url);
CREATE INDEX IF NOT EXISTS idx_site_pages_last_scan ON public.site_pages(last_scan);
CREATE INDEX IF NOT EXISTS idx_site_pages_visibility ON public.site_pages(llm_visibility_score DESC);

-- 2. parsed_content — Parsed content chunks per page
CREATE TABLE IF NOT EXISTS public.parsed_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.site_pages(id) ON DELETE CASCADE NOT NULL,
  section_type TEXT DEFAULT 'paragraph',
  heading TEXT,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parsed_content_page ON public.parsed_content(page_id);

-- 3. entity_graph — Relationships between LLM entities
CREATE TABLE IF NOT EXISTS public.entity_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  relation_type TEXT DEFAULT 'relates_to',
  strength NUMERIC(5,4) DEFAULT 0.5,
  page_id UUID REFERENCES public.site_pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_graph_source ON public.entity_graph(source_entity);
CREATE INDEX IF NOT EXISTS idx_entity_graph_target ON public.entity_graph(target_entity);

-- 4. llm_issues — Indexation issues detected
CREATE TABLE IF NOT EXISTS public.llm_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.site_pages(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  description TEXT,
  suggested_fix TEXT,
  auto_fix_available BOOLEAN DEFAULT false,
  fix_applied BOOLEAN DEFAULT false,
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_llm_issues_page ON public.llm_issues(page_id);
CREATE INDEX IF NOT EXISTS idx_llm_issues_severity ON public.llm_issues(severity);

-- 5. llm_citations — AI platform citations of the site
CREATE TABLE IF NOT EXISTS public.llm_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform TEXT NOT NULL,
  citation_url TEXT,
  referenced_page_id UUID REFERENCES public.site_pages(id) ON DELETE SET NULL,
  citation_text TEXT,
  query_context TEXT,
  confidence NUMERIC(5,2) DEFAULT 0,
  detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_llm_citations_platform ON public.llm_citations(source_platform);

-- 6. llm_scores — Per-page visibility metrics
CREATE TABLE IF NOT EXISTS public.llm_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.site_pages(id) ON DELETE CASCADE,
  entity_density NUMERIC(5,2) DEFAULT 0,
  schema_coverage NUMERIC(5,2) DEFAULT 0,
  embedding_quality NUMERIC(5,2) DEFAULT 0,
  internal_link_score NUMERIC(5,2) DEFAULT 0,
  citation_probability NUMERIC(5,2) DEFAULT 0,
  llm_visibility_score NUMERIC(5,2) DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id)
);

CREATE INDEX IF NOT EXISTS idx_llm_scores_page ON public.llm_scores(page_id);

-- ═══════════════════════════════════════════
-- RLS Policies for LLM Index Engine tables
-- ═══════════════════════════════════════════

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_scores ENABLE ROW LEVEL SECURITY;

-- Public read for all (LLM engine data is platform-level, not user-level)
CREATE POLICY "Public read site_pages" ON public.site_pages FOR SELECT USING (true);
CREATE POLICY "Public read parsed_content" ON public.parsed_content FOR SELECT USING (true);
CREATE POLICY "Public read entity_graph" ON public.entity_graph FOR SELECT USING (true);
CREATE POLICY "Public read llm_issues" ON public.llm_issues FOR SELECT USING (true);
CREATE POLICY "Public read llm_citations" ON public.llm_citations FOR SELECT USING (true);
CREATE POLICY "Public read llm_scores" ON public.llm_scores FOR SELECT USING (true);

-- Admin-only write
CREATE POLICY "Admin write site_pages" ON public.site_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write parsed_content" ON public.parsed_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write entity_graph" ON public.entity_graph FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write llm_issues" ON public.llm_issues FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write llm_citations" ON public.llm_citations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write llm_scores" ON public.llm_scores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add product_surface_pages table for Product Surface
CREATE TABLE IF NOT EXISTS public.product_surface_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  product_key TEXT NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  meta_description TEXT,
  content_md TEXT DEFAULT '',
  features JSONB DEFAULT '[]',
  pricing JSONB DEFAULT '{}',
  schema_json JSONB DEFAULT '{}',
  og_image_url TEXT,
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.product_surface_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_surface_pages" ON public.product_surface_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Admin write product_surface_pages" ON public.product_surface_pages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
