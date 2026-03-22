
-- LLM Page Index: tracks indexation quality per page
CREATE TABLE public.llm_page_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text NOT NULL UNIQUE,
  page_title text,
  page_type text DEFAULT 'content',
  schema_types text[] DEFAULT '{}',
  entity_count integer DEFAULT 0,
  internal_links_count integer DEFAULT 0,
  external_links_count integer DEFAULT 0,
  word_count integer DEFAULT 0,
  topic_clarity_score numeric(4,2) DEFAULT 0,
  entity_density_score numeric(4,2) DEFAULT 0,
  semantic_links_score numeric(4,2) DEFAULT 0,
  overall_score numeric(4,2) DEFAULT 0,
  issues jsonb DEFAULT '[]',
  last_crawled_at timestamptz,
  last_fixed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- LLM Fix Suggestions: AI-generated fixes for SEO issues
CREATE TABLE public.llm_fix_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.llm_page_index(id) ON DELETE CASCADE,
  issue_type text NOT NULL,
  severity text DEFAULT 'medium',
  current_value text,
  suggested_value text,
  ai_reasoning text,
  status text DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- LLM Referrer Tracking: detect traffic from LLMs
CREATE TABLE public.llm_referrer_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_source text NOT NULL,
  page_path text NOT NULL,
  entity_type text,
  entity_id text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Knowledge Graph Cache: stores pre-generated JSON-LD exports
CREATE TABLE public.knowledge_graph_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE DEFAULT 'main',
  graph_data jsonb NOT NULL DEFAULT '{}',
  entity_count integer DEFAULT 0,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- Indexes
CREATE INDEX idx_llm_page_index_score ON public.llm_page_index(overall_score DESC);
CREATE INDEX idx_llm_page_index_type ON public.llm_page_index(page_type);
CREATE INDEX idx_llm_fix_status ON public.llm_fix_suggestions(status);
CREATE INDEX idx_llm_referrer_source ON public.llm_referrer_log(referrer_source, created_at DESC);
CREATE INDEX idx_llm_referrer_page ON public.llm_referrer_log(page_path, created_at DESC);

-- RLS
ALTER TABLE public.llm_page_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_fix_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_referrer_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_graph_cache ENABLE ROW LEVEL SECURITY;

-- Admin-only policies via has_role
CREATE POLICY "Admins can manage llm_page_index" ON public.llm_page_index
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage llm_fix_suggestions" ON public.llm_fix_suggestions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert referrer logs" ON public.llm_referrer_log
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can read referrer logs" ON public.llm_referrer_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read knowledge graph cache" ON public.knowledge_graph_cache
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can manage knowledge graph cache" ON public.knowledge_graph_cache
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
