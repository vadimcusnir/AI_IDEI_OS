
-- ═══════════════════════════════════════════
-- KNOWLEDGE DASHBOARD — Schema
-- ═══════════════════════════════════════════

-- 1. Knowledge items (articles/content)
CREATE TABLE public.knowledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text,
  category text NOT NULL DEFAULT 'principle',
  subcategory text,
  tags text[] NOT NULL DEFAULT '{}',
  reading_time integer NOT NULL DEFAULT 5,
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  is_public boolean NOT NULL DEFAULT false,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

-- Published items readable by all authenticated users
CREATE POLICY "Published KB items readable" ON public.knowledge_items
  FOR SELECT TO authenticated USING (status = 'published' OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Public items readable by anon
CREATE POLICY "Public KB items readable by anon" ON public.knowledge_items
  FOR SELECT TO anon USING (status = 'published' AND is_public = true);

-- Admins full access
CREATE POLICY "Admins manage KB items" ON public.knowledge_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authors can create
CREATE POLICY "Users create KB items" ON public.knowledge_items
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Authors can update own drafts
CREATE POLICY "Users update own draft KB items" ON public.knowledge_items
  FOR UPDATE TO authenticated USING (created_by = auth.uid() AND status = 'draft');

CREATE INDEX idx_knowledge_items_category ON public.knowledge_items (category, status);
CREATE INDEX idx_knowledge_items_slug ON public.knowledge_items (slug);
CREATE INDEX idx_knowledge_items_created_by ON public.knowledge_items (created_by);

-- 2. KB Analytics
CREATE TABLE public.kb_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'view',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert KB analytics" ON public.kb_analytics
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read KB analytics" ON public.kb_analytics
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_kb_analytics_article ON public.kb_analytics (article_id);
CREATE INDEX idx_kb_analytics_event ON public.kb_analytics (event_type, created_at);

-- 3. Learning paths
CREATE TABLE public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  category_order text[] NOT NULL DEFAULT ARRAY['principle', 'method', 'framework', 'blueprint'],
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active learning paths" ON public.learning_paths
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins manage learning paths" ON public.learning_paths
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Learning path progress
CREATE TABLE public.learning_path_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  completed_items uuid[] NOT NULL DEFAULT '{}',
  current_item_id uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, path_id)
);

ALTER TABLE public.learning_path_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own LP progress" ON public.learning_path_progress
  FOR ALL TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update reading_time on content change
CREATE OR REPLACE FUNCTION public.kb_auto_reading_time()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- ~200 words per minute, word count approximation
  NEW.reading_time := GREATEST(1, CEIL(array_length(string_to_array(NEW.content, ' '), 1)::float / 200.0));
  NEW.updated_at := now();
  
  -- Auto-generate excerpt if empty
  IF NEW.excerpt IS NULL OR NEW.excerpt = '' THEN
    NEW.excerpt := LEFT(regexp_replace(NEW.content, E'[#*_\\[\\]()]', '', 'g'), 150);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER kb_item_before_upsert
  BEFORE INSERT OR UPDATE ON public.knowledge_items
  FOR EACH ROW EXECUTE FUNCTION public.kb_auto_reading_time();

-- Track view count
CREATE OR REPLACE FUNCTION public.kb_track_view(_article_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE knowledge_items SET view_count = view_count + 1, last_viewed_at = now() WHERE id = _article_id;
  INSERT INTO kb_analytics (article_id, user_id, event_type) VALUES (_article_id, _user_id, 'view');
END;
$$;
