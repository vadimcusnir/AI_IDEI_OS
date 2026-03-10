
-- ============================================
-- BLOCK TYPE REGISTRY (Dynamic block types)
-- ============================================
CREATE TABLE IF NOT EXISTS public.block_type_registry (
  type_key text PRIMARY KEY,
  label text NOT NULL,
  short_label text NOT NULL,
  icon text NOT NULL DEFAULT 'file',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'content',
  is_executable boolean NOT NULL DEFAULT false,
  default_execution_mode text NOT NULL DEFAULT 'passive',
  config_schema jsonb DEFAULT '{}'::jsonb,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.block_type_registry ENABLE ROW LEVEL SECURITY;

-- Everyone can read block types
CREATE POLICY "Block types are publicly readable" ON public.block_type_registry
  FOR SELECT TO public USING (true);

-- Only admins can manage block types
CREATE POLICY "Admins can manage block types" ON public.block_type_registry
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed system block types
INSERT INTO public.block_type_registry (type_key, label, short_label, icon, description, category, is_executable, default_execution_mode, is_system) VALUES
  ('text', 'Text', 'Txt', 'type', 'Plain text block', 'content', false, 'passive', true),
  ('heading', 'Heading', 'H1', 'heading', 'Section heading', 'structure', false, 'passive', true),
  ('subheading', 'Subheading', 'H2', 'heading-2', 'Subsection heading', 'structure', false, 'passive', true),
  ('markdown', 'Markdown', 'MD', 'file-text', 'Rich markdown content', 'content', false, 'passive', true),
  ('todo', 'Todo', 'Todo', 'check-square', 'Task item', 'content', false, 'passive', true),
  ('quote', 'Quote', 'Qte', 'quote', 'Blockquote', 'content', false, 'passive', true),
  ('list', 'List', 'List', 'list', 'Bullet or numbered list', 'content', false, 'passive', true),
  ('idea', 'Idea', 'Idea', 'lightbulb', 'Idea capture block', 'content', false, 'passive', true),
  ('reference', 'Reference', 'Ref', 'book-open', 'Citation or source', 'content', false, 'passive', true),
  ('divider', 'Divider', '---', 'minus', 'Section divider', 'structure', false, 'passive', true),
  ('code', 'Code', 'Code', 'code', 'Executable code block', 'code', true, 'executable', true),
  ('yaml', 'YAML', 'YAML', 'file-cog', 'Pipeline / agent definition', 'code', true, 'executable', true),
  ('json', 'JSON', 'JSON', 'braces', 'Data structure / API payload', 'code', true, 'validated', true),
  ('prompt', 'Prompt', 'Prmt', 'message-square', 'AI prompt template', 'ai', true, 'executable', true),
  ('dataset', 'Dataset', 'Data', 'table', 'Structured data table', 'ai', true, 'validated', true),
  ('diagram', 'Diagram', 'Diag', 'git-branch', 'Mermaid / flow diagram', 'ai', true, 'validated', true),
  ('ai-action', 'AI Action', 'AI', 'sparkles', 'AI worker execution block', 'ai', true, 'automated', true)
ON CONFLICT (type_key) DO NOTHING;

-- ============================================
-- NEURON TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.neuron_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  blocks_template jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_tags text[] DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neuron_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public templates are readable by all" ON public.neuron_templates
  FOR SELECT TO authenticated USING (is_public = true OR author_id = auth.uid());

CREATE POLICY "Users can create templates" ON public.neuron_templates
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own templates" ON public.neuron_templates
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

CREATE POLICY "Users can delete own templates" ON public.neuron_templates
  FOR DELETE TO authenticated USING (author_id = auth.uid());

-- Seed default templates
INSERT INTO public.neuron_templates (name, description, category, blocks_template, is_public, default_tags) VALUES
  ('Research Note', 'Quick research capture with sources', 'research', '[{"type":"heading","content":""},{"type":"text","content":""},{"type":"reference","content":""},{"type":"todo","content":"Follow-up items"}]'::jsonb, true, ARRAY['research']),
  ('AI Prompt Lab', 'Test and iterate on AI prompts', 'ai', '[{"type":"heading","content":""},{"type":"prompt","content":""},{"type":"ai-action","content":""},{"type":"text","content":"Results & analysis"}]'::jsonb, true, ARRAY['ai', 'prompt']),
  ('Data Analysis', 'Structured data analysis workflow', 'analysis', '[{"type":"heading","content":""},{"type":"text","content":"Objective"},{"type":"dataset","content":""},{"type":"code","content":"","language":"python"},{"type":"diagram","content":""},{"type":"text","content":"Conclusions"}]'::jsonb, true, ARRAY['data', 'analysis']),
  ('Decision Pack', 'Decision framework with evidence', 'business', '[{"type":"heading","content":"Decision"},{"type":"text","content":"Context"},{"type":"list","content":"Options"},{"type":"quote","content":"Key insight"},{"type":"todo","content":"Action items"}]'::jsonb, true, ARRAY['decision', 'business'])
ON CONFLICT DO NOTHING;

-- ============================================
-- NEURON CLONES (lineage tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.neuron_clones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_neuron_id bigint NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  cloned_neuron_id bigint NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  cloned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  clone_type text NOT NULL DEFAULT 'full',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neuron_clones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clones" ON public.neuron_clones
  FOR SELECT TO authenticated USING (cloned_by = auth.uid());

CREATE POLICY "Users can create clones" ON public.neuron_clones
  FOR INSERT TO authenticated WITH CHECK (cloned_by = auth.uid());

-- ============================================
-- ENHANCE VERSIONING (parent chain + diff + summary)
-- ============================================
ALTER TABLE public.neuron_versions
  ADD COLUMN IF NOT EXISTS parent_version_id uuid REFERENCES public.neuron_versions(id),
  ADD COLUMN IF NOT EXISTS change_summary text DEFAULT '',
  ADD COLUMN IF NOT EXISTS diff jsonb DEFAULT '{}'::jsonb;

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_neurons_fts ON public.neurons USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_blocks_fts ON public.neuron_blocks USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_neurons_author_status ON public.neurons(author_id, status);
CREATE INDEX IF NOT EXISTS idx_neurons_visibility ON public.neurons(visibility);
CREATE INDEX IF NOT EXISTS idx_neurons_updated ON public.neurons(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_neuron_pos ON public.neuron_blocks(neuron_id, position);
CREATE INDEX IF NOT EXISTS idx_links_source ON public.neuron_links(source_neuron_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_links_target ON public.neuron_links(target_neuron_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.neuron_jobs(neuron_id, status);
CREATE INDEX IF NOT EXISTS idx_versions_neuron ON public.neuron_versions(neuron_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_clones_source ON public.neuron_clones(source_neuron_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.neuron_templates(category, is_public);

-- ============================================
-- MATERIALIZED VIEW FOR STATS
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.neuron_stats AS
SELECT
  author_id,
  COUNT(*) as total_neurons,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE status = 'draft') as drafts,
  AVG(score) as avg_score,
  MAX(updated_at) as last_active
FROM public.neurons
GROUP BY author_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_neuron_stats_author ON public.neuron_stats(author_id);
