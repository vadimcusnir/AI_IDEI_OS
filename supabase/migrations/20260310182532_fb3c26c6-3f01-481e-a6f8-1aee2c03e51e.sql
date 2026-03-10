
-- =============================================
-- KNOWLEDGE GRAPH INFRASTRUCTURE
-- =============================================

-- 1. ENTITIES — public projections of neurons
CREATE TABLE public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neuron_id BIGINT REFERENCES public.neurons(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  meta_description TEXT,
  confidence_score FLOAT DEFAULT 0,
  importance_score FLOAT DEFAULT 0,
  evidence_count INT DEFAULT 0,
  canonical_url TEXT,
  json_ld JSONB,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ENTITY RELATIONS — knowledge graph edges
CREATE TABLE public.entity_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  target_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  relation_type TEXT NOT NULL,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_entity_id, target_entity_id, relation_type)
);

-- 3. TOPICS — knowledge context layer
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  parent_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  entity_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ENTITY_TOPICS — junction
CREATE TABLE public.entity_topics (
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE NOT NULL,
  relevance_score FLOAT DEFAULT 1.0,
  PRIMARY KEY (entity_id, topic_id)
);

-- 5. INDEXES
CREATE INDEX idx_entities_type ON public.entities(entity_type);
CREATE INDEX idx_entities_published ON public.entities(is_published);
CREATE INDEX idx_entities_neuron ON public.entities(neuron_id);
CREATE INDEX idx_entity_relations_source ON public.entity_relations(source_entity_id);
CREATE INDEX idx_entity_relations_target ON public.entity_relations(target_entity_id);
CREATE INDEX idx_entity_relations_type ON public.entity_relations(relation_type);
CREATE INDEX idx_topics_slug ON public.topics(slug);
CREATE INDEX idx_entity_topics_topic ON public.entity_topics(topic_id);

-- 6. RLS
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_topics ENABLE ROW LEVEL SECURITY;

-- Entities: public read for published, admin manage
CREATE POLICY "Published entities readable by all" ON public.entities FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Admins manage entities" ON public.entities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Relations: readable if both entities published, admin manage
CREATE POLICY "Relations readable for published" ON public.entity_relations FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM public.entities WHERE id = source_entity_id AND is_published = true)
  AND EXISTS (SELECT 1 FROM public.entities WHERE id = target_entity_id AND is_published = true)
);
CREATE POLICY "Admins manage relations" ON public.entity_relations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Topics: public read, admin manage
CREATE POLICY "Topics readable by all" ON public.topics FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage topics" ON public.topics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Entity topics: public read, admin manage
CREATE POLICY "Entity topics readable" ON public.entity_topics FOR SELECT TO public USING (
  EXISTS (SELECT 1 FROM public.entities WHERE id = entity_id AND is_published = true)
);
CREATE POLICY "Admins manage entity topics" ON public.entity_topics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
