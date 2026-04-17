
-- Add is_premium flag to blog_posts (paywall soft)
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments(post_id, created_at DESC);
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read non-hidden comments" ON public.blog_comments;
CREATE POLICY "Anyone can read non-hidden comments" ON public.blog_comments FOR SELECT USING (is_hidden = false);

DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.blog_comments;
CREATE POLICY "Authenticated users can post comments" ON public.blog_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can edit own comments" ON public.blog_comments;
CREATE POLICY "Users can edit own comments" ON public.blog_comments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.blog_comments;
CREATE POLICY "Users can delete own comments" ON public.blog_comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all comments" ON public.blog_comments;
CREATE POLICY "Admins manage all comments" ON public.blog_comments FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Reactions (like/clap)
CREATE TABLE IF NOT EXISTS public.blog_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like','clap','insightful')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, reaction_type)
);
CREATE INDEX IF NOT EXISTS idx_blog_reactions_post ON public.blog_reactions(post_id);
ALTER TABLE public.blog_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reactions" ON public.blog_reactions;
CREATE POLICY "Anyone can read reactions" ON public.blog_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own reactions" ON public.blog_reactions;
CREATE POLICY "Users manage own reactions" ON public.blog_reactions FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'blog',
  user_id uuid,
  confirmed boolean NOT NULL DEFAULT false,
  unsubscribed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT
  USING (has_role(auth.uid(),'admin'::app_role));

-- View counter RPC (atomic increment, no RLS bypass needed since it's invoker-rights via RPC SECURITY DEFINER carefully scoped)
CREATE OR REPLACE FUNCTION public.increment_blog_view(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts
     SET view_count = view_count + 1
   WHERE slug = _slug AND status = 'published';
END;
$$;

-- updated_at trigger for comments
CREATE OR REPLACE FUNCTION public.touch_blog_comments_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_blog_comments_updated_at ON public.blog_comments;
CREATE TRIGGER trg_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.touch_blog_comments_updated_at();
