
-- Entity localization: labels (name/description per language)
CREATE TABLE public.entity_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (entity_id, language)
);

-- Entity localization: full content per language
CREATE TABLE public.entity_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  title text NOT NULL,
  summary text,
  content text,
  meta_description text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (entity_id, language)
);

-- Topic localization
CREATE TABLE public.topic_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  title text NOT NULL,
  description text,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (topic_id, language)
);

-- Enable RLS
ALTER TABLE public.entity_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_labels ENABLE ROW LEVEL SECURITY;

-- entity_labels policies
CREATE POLICY "Published entity labels readable" ON public.entity_labels
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.entities WHERE entities.id = entity_labels.entity_id AND entities.is_published = true));

CREATE POLICY "Admins manage entity labels" ON public.entity_labels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- entity_content policies
CREATE POLICY "Published entity content readable" ON public.entity_content
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.entities WHERE entities.id = entity_content.entity_id AND entities.is_published = true));

CREATE POLICY "Admins manage entity content" ON public.entity_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- topic_labels policies
CREATE POLICY "Topic labels readable by all" ON public.topic_labels
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins manage topic labels" ON public.topic_labels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_entity_labels_entity_lang ON public.entity_labels(entity_id, language);
CREATE INDEX idx_entity_content_entity_lang ON public.entity_content(entity_id, language);
CREATE INDEX idx_entity_content_slug ON public.entity_content(slug, language);
CREATE INDEX idx_topic_labels_topic_lang ON public.topic_labels(topic_id, language);
