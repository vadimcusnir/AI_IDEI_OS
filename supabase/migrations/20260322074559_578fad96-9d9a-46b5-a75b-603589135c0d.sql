
-- LLM entities extracted from pages
CREATE TABLE public.llm_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.llm_page_index(id) ON DELETE CASCADE NOT NULL,
  entity_name text NOT NULL,
  entity_type text NOT NULL DEFAULT 'concept',
  description text DEFAULT '',
  confidence numeric(3,2) DEFAULT 0.5,
  source_context text DEFAULT '',
  schema_org_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_llm_entities_page ON public.llm_entities(page_id);
CREATE INDEX idx_llm_entities_type ON public.llm_entities(entity_type);

-- Knowledge surface pages — auto-generated SEO pages
CREATE TABLE public.knowledge_surface_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  page_type text NOT NULL DEFAULT 'concept',
  title text NOT NULL,
  meta_description text DEFAULT '',
  content_md text DEFAULT '',
  entity_ids uuid[] DEFAULT '{}',
  neuron_ids integer[] DEFAULT '{}',
  schema_json jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  view_count integer DEFAULT 0,
  llm_citation_count integer DEFAULT 0,
  quality_score numeric(4,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ksp_slug ON public.knowledge_surface_pages(slug);
CREATE INDEX idx_ksp_status ON public.knowledge_surface_pages(status);
CREATE INDEX idx_ksp_type ON public.knowledge_surface_pages(page_type);

-- Product surface pages — public product pages
CREATE TABLE public.product_surface_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  product_key text NOT NULL,
  title text NOT NULL,
  tagline text DEFAULT '',
  description_md text DEFAULT '',
  features jsonb DEFAULT '[]'::jsonb,
  use_cases jsonb DEFAULT '[]'::jsonb,
  schema_json jsonb DEFAULT '{}'::jsonb,
  og_image_url text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_psp_slug ON public.product_surface_pages(slug);

-- LLM visibility scores — per-page scoring over time
CREATE TABLE public.llm_visibility_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.llm_page_index(id) ON DELETE CASCADE,
  surface_page_id uuid REFERENCES public.knowledge_surface_pages(id) ON DELETE CASCADE,
  score_date date NOT NULL DEFAULT CURRENT_DATE,
  visibility_score numeric(5,2) DEFAULT 0,
  citation_count integer DEFAULT 0,
  referral_count integer DEFAULT 0,
  schema_score numeric(4,2) DEFAULT 0,
  content_depth_score numeric(4,2) DEFAULT 0,
  entity_coverage_score numeric(4,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(page_id, score_date)
);

-- LLM crawl queue — for scheduled crawling
CREATE TABLE public.llm_crawl_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL,
  priority integer DEFAULT 5,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crawl_queue_status ON public.llm_crawl_queue(status, priority DESC);

-- Enable RLS
ALTER TABLE public.llm_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_surface_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_surface_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_visibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_crawl_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access on llm_entities" ON public.llm_entities
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read published knowledge pages" ON public.knowledge_surface_pages
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admin full access on knowledge_surface_pages" ON public.knowledge_surface_pages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read published product pages" ON public.product_surface_pages
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Admin full access on product_surface_pages" ON public.product_surface_pages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on llm_visibility_scores" ON public.llm_visibility_scores
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin full access on llm_crawl_queue" ON public.llm_crawl_queue
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
