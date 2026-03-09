
-- =====================================================
-- NEURON IDENTITY ARCHITECTURE
-- Three-layer identity: internal_id, uuid, neuron_number
-- =====================================================

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Neuron number sequence (sequential, starts at 1)
CREATE SEQUENCE public.neuron_number_seq START 1;

-- =====================================================
-- 1. NEURONS — The atomic knowledge object
-- =====================================================
CREATE TABLE public.neurons (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  number BIGINT NOT NULL DEFAULT nextval('neuron_number_seq') UNIQUE,
  title TEXT NOT NULL DEFAULT 'Untitled Neuron',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'published')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'public')),
  score FLOAT NOT NULL DEFAULT 0,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_neurons_number ON public.neurons(number);
CREATE INDEX idx_neurons_author ON public.neurons(author_id);
CREATE INDEX idx_neurons_status ON public.neurons(status);
CREATE INDEX idx_neurons_created ON public.neurons(created_at DESC);

ALTER TABLE public.neurons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public neurons are viewable by everyone"
  ON public.neurons FOR SELECT
  USING (visibility = 'public' OR auth.uid() = author_id);

CREATE POLICY "Users can create neurons"
  ON public.neurons FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own neurons"
  ON public.neurons FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own neurons"
  ON public.neurons FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Anon can read public neurons"
  ON public.neurons FOR SELECT TO anon
  USING (visibility = 'public');

CREATE TRIGGER update_neurons_updated_at
  BEFORE UPDATE ON public.neurons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. NEURON BLOCKS — Format-aware content blocks
-- =====================================================
CREATE TABLE public.neuron_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neuron_id BIGINT NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN (
    'text', 'heading', 'subheading', 'markdown',
    'todo', 'quote', 'list', 'idea', 'reference',
    'divider', 'code', 'yaml', 'json', 'prompt',
    'dataset', 'diagram', 'ai-action'
  )),
  content TEXT NOT NULL DEFAULT '',
  language TEXT CHECK (language IN ('python', 'javascript', 'typescript', 'sql', 'bash', 'rust', 'go', NULL)),
  execution_mode TEXT NOT NULL DEFAULT 'passive' CHECK (execution_mode IN ('passive', 'validated', 'executable', 'automated')),
  checked BOOLEAN DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocks_neuron ON public.neuron_blocks(neuron_id);
CREATE INDEX idx_blocks_position ON public.neuron_blocks(neuron_id, position);
CREATE INDEX idx_blocks_type ON public.neuron_blocks(type);

ALTER TABLE public.neuron_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocks follow neuron visibility"
  ON public.neuron_blocks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_blocks.neuron_id
    AND (n.visibility = 'public' OR n.author_id = auth.uid())
  ));

CREATE POLICY "Users can manage blocks for own neurons"
  ON public.neuron_blocks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_blocks.neuron_id AND n.author_id = auth.uid()
  ));

CREATE POLICY "Users can update blocks for own neurons"
  ON public.neuron_blocks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_blocks.neuron_id AND n.author_id = auth.uid()
  ));

CREATE POLICY "Users can delete blocks for own neurons"
  ON public.neuron_blocks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_blocks.neuron_id AND n.author_id = auth.uid()
  ));

CREATE POLICY "Anon can read public neuron blocks"
  ON public.neuron_blocks FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_blocks.neuron_id AND n.visibility = 'public'
  ));

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON public.neuron_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 3. NEURON LINKS — Graph edges between neurons
-- =====================================================
CREATE TABLE public.neuron_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_neuron_id BIGINT NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  target_neuron_id BIGINT NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'supports', 'contradicts', 'extends', 'references', 'derived_from'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_neuron_id, target_neuron_id, relation_type)
);

CREATE INDEX idx_links_source ON public.neuron_links(source_neuron_id);
CREATE INDEX idx_links_target ON public.neuron_links(target_neuron_id);

ALTER TABLE public.neuron_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Links are viewable if either neuron is accessible"
  ON public.neuron_links FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.neurons WHERE id = source_neuron_id AND (visibility = 'public' OR author_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.neurons WHERE id = target_neuron_id AND (visibility = 'public' OR author_id = auth.uid()))
  );

CREATE POLICY "Users can create links for own neurons"
  ON public.neuron_links FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.neurons WHERE id = source_neuron_id AND author_id = auth.uid()
  ));

CREATE POLICY "Users can delete links for own neurons"
  ON public.neuron_links FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.neurons WHERE id = source_neuron_id AND author_id = auth.uid()
  ));

-- =====================================================
-- 4. NEURON VERSIONS — Content history
-- =====================================================
CREATE TABLE public.neuron_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neuron_id BIGINT NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  blocks_snapshot JSONB NOT NULL DEFAULT '[]',
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(neuron_id, version)
);

CREATE INDEX idx_versions_neuron ON public.neuron_versions(neuron_id);

ALTER TABLE public.neuron_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Versions follow neuron visibility"
  ON public.neuron_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_versions.neuron_id
    AND (n.visibility = 'public' OR n.author_id = auth.uid())
  ));

CREATE POLICY "Users can create versions for own neurons"
  ON public.neuron_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_versions.neuron_id AND n.author_id = auth.uid()
  ));

-- =====================================================
-- 5. NEURON JOBS — AI worker execution log
-- =====================================================
CREATE TABLE public.neuron_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neuron_id BIGINT NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.neuron_blocks(id) ON DELETE SET NULL,
  worker_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
  input JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_neuron ON public.neuron_jobs(neuron_id);
CREATE INDEX idx_jobs_status ON public.neuron_jobs(status);

ALTER TABLE public.neuron_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs for accessible neurons"
  ON public.neuron_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_jobs.neuron_id
    AND (n.visibility = 'public' OR n.author_id = auth.uid())
  ));

CREATE POLICY "Users can create jobs for own neurons"
  ON public.neuron_jobs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_jobs.neuron_id AND n.author_id = auth.uid()
  ));

CREATE POLICY "Users can update jobs for own neurons"
  ON public.neuron_jobs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_jobs.neuron_id AND n.author_id = auth.uid()
  ));

-- =====================================================
-- 6. NEURON ADDRESSES — Semantic navigation (NAS)
-- =====================================================
CREATE TABLE public.neuron_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  neuron_id BIGINT NOT NULL REFERENCES public.neurons(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  domain TEXT NOT NULL,
  level_1 TEXT,
  level_2 TEXT,
  level_3 TEXT,
  level_4 TEXT,
  depth INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(neuron_id, path)
);

CREATE INDEX idx_addresses_neuron ON public.neuron_addresses(neuron_id);
CREATE INDEX idx_addresses_path ON public.neuron_addresses(path);
CREATE INDEX idx_addresses_domain ON public.neuron_addresses(domain);

ALTER TABLE public.neuron_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses follow neuron visibility"
  ON public.neuron_addresses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_addresses.neuron_id
    AND (n.visibility = 'public' OR n.author_id = auth.uid())
  ));

CREATE POLICY "Users can manage addresses for own neurons"
  ON public.neuron_addresses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_addresses.neuron_id AND n.author_id = auth.uid()
  ));

CREATE POLICY "Users can update addresses for own neurons"
  ON public.neuron_addresses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_addresses.neuron_id AND n.author_id = auth.uid()
  ));

CREATE POLICY "Users can delete addresses for own neurons"
  ON public.neuron_addresses FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_addresses.neuron_id AND n.author_id = auth.uid()
  ));

-- =====================================================
-- 7. NEURON NUMBER RANGES — Worker allocation
-- =====================================================
CREATE TABLE public.neuron_number_ranges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL,
  range_start BIGINT NOT NULL,
  range_end BIGINT NOT NULL,
  current_pointer BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.neuron_number_ranges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages number ranges"
  ON public.neuron_number_ranges FOR ALL
  USING (false);

-- =====================================================
-- 8. NEURON ADDRESS ALIASES — Path redirects
-- =====================================================
CREATE TABLE public.neuron_address_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias TEXT NOT NULL UNIQUE,
  target_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.neuron_address_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aliases are publicly readable"
  ON public.neuron_address_aliases FOR SELECT
  USING (true);

CREATE POLICY "Aliases readable by anon"
  ON public.neuron_address_aliases FOR SELECT TO anon
  USING (true);
