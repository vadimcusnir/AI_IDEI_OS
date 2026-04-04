
-- ═══════════════════════════════════════
-- 1. RSO VERSIONS (Raw Structured Output)
-- ═══════════════════════════════════════
CREATE TABLE public.rso_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE CASCADE NOT NULL,
  version INT NOT NULL DEFAULT 1,
  raw_output JSONB NOT NULL DEFAULT '{}',
  source_context TEXT,
  model_used TEXT,
  confidence NUMERIC(4,3) DEFAULT 0.000,
  token_count INT DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(neuron_id, version)
);
ALTER TABLE public.rso_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own RSO" ON public.rso_versions FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Users insert own RSO" ON public.rso_versions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins full RSO" ON public.rso_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- 2. CLASSIFICATION RESULTS (3 dimensions)
-- ═══════════════════════════════════════
CREATE TABLE public.classification_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE CASCADE NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('cognitive', 'emotional', 'behavioral')),
  label TEXT NOT NULL,
  score NUMERIC(4,3) NOT NULL DEFAULT 0.000,
  sub_labels JSONB DEFAULT '[]',
  model_version TEXT,
  classified_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(neuron_id, dimension)
);
ALTER TABLE public.classification_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own classifications" ON public.classification_results FOR SELECT TO authenticated
  USING (classified_by = auth.uid());
CREATE POLICY "Users insert own classifications" ON public.classification_results FOR INSERT TO authenticated
  WITH CHECK (classified_by = auth.uid());
CREATE POLICY "Admins full classifications" ON public.classification_results FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- 3. SEMANTIC LINKS (cognitive graph edges)
-- ═══════════════════════════════════════
CREATE TABLE public.semantic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE CASCADE NOT NULL,
  target_neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE CASCADE NOT NULL,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('supports', 'contradicts', 'extends', 'derives', 'opposes', 'complements')),
  strength NUMERIC(4,3) NOT NULL DEFAULT 0.500,
  context TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_neuron_id, target_neuron_id, relation_type)
);
ALTER TABLE public.semantic_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own links" ON public.semantic_links FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Users insert own links" ON public.semantic_links FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins full links" ON public.semantic_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- 4. SCORING RESULTS (multi-axial)
-- ═══════════════════════════════════════
CREATE TABLE public.scoring_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE CASCADE NOT NULL,
  axis TEXT NOT NULL CHECK (axis IN ('clarity', 'depth', 'originality', 'applicability', 'commercial_potential')),
  score NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  rationale TEXT,
  scored_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(neuron_id, axis)
);
ALTER TABLE public.scoring_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own scores" ON public.scoring_results FOR SELECT TO authenticated
  USING (scored_by = auth.uid());
CREATE POLICY "Users insert own scores" ON public.scoring_results FOR INSERT TO authenticated
  WITH CHECK (scored_by = auth.uid());
CREATE POLICY "Admins full scores" ON public.scoring_results FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- 5. EXTRACTED PATTERNS (formal)
-- ═══════════════════════════════════════
CREATE TABLE public.extracted_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_neuron_ids BIGINT[] NOT NULL DEFAULT '{}',
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('behavioral', 'rhetorical', 'strategic', 'cognitive', 'emotional')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  evidence JSONB DEFAULT '[]',
  frequency INT DEFAULT 1,
  confidence NUMERIC(4,3) DEFAULT 0.000,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.extracted_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own patterns" ON public.extracted_patterns FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Users insert own patterns" ON public.extracted_patterns FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins full patterns" ON public.extracted_patterns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════
-- 6. COGNITIVE CHAIN NODES (6 layers)
-- ═══════════════════════════════════════
CREATE TABLE public.cognitive_chain_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.extracted_patterns(id) ON DELETE SET NULL,
  layer INT NOT NULL CHECK (layer BETWEEN 1 AND 6),
  layer_label TEXT NOT NULL CHECK (layer_label IN ('insight', 'idea', 'pattern', 'formula', 'application', 'contradiction')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  parent_node_id UUID REFERENCES public.cognitive_chain_nodes(id) ON DELETE SET NULL,
  depth_score NUMERIC(4,3) DEFAULT 0.000,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cognitive_chain_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own chain" ON public.cognitive_chain_nodes FOR SELECT TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "Users insert own chain" ON public.cognitive_chain_nodes FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Admins full chain" ON public.cognitive_chain_nodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
