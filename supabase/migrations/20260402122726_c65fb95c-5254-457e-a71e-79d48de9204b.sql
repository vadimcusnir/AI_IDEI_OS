
-- Blog Topics table (SEO topic bank replacing hardcoded TOPIC_SEEDS)
CREATE TABLE public.blog_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'knowledge-extraction',
  subcategory text,
  search_intent text DEFAULT 'informational',
  difficulty text DEFAULT 'medium',
  priority integer DEFAULT 50,
  status text NOT NULL DEFAULT 'pending',
  generated_post_id uuid REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for status-based queries
CREATE INDEX idx_blog_topics_status ON public.blog_topics(status, priority DESC);

-- Enable RLS
ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;

-- Public read for pending topics (used by edge function)
CREATE POLICY "Anyone can read blog topics"
  ON public.blog_topics FOR SELECT
  TO authenticated
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage blog topics"
  ON public.blog_topics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) can update topics
CREATE POLICY "Service can manage blog topics"
  ON public.blog_topics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add pipeline_stage column to blog_posts for tracking 5-stage pipeline
ALTER TABLE public.blog_posts 
  ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'single-shot',
  ADD COLUMN IF NOT EXISTS pipeline_scores jsonb,
  ADD COLUMN IF NOT EXISTS related_post_ids text[] DEFAULT '{}';
