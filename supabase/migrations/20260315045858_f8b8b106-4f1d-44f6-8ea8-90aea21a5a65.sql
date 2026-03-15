
-- ══════════════════════════════════════════════
-- COMMUNITY FORUM SCHEMA
-- ══════════════════════════════════════════════

-- Forum categories
CREATE TABLE public.forum_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'message-square',
  position integer NOT NULL DEFAULT 0,
  parent_id uuid REFERENCES public.forum_categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  thread_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Forum threads
CREATE TABLE public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text NOT NULL DEFAULT '',
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_solved boolean NOT NULL DEFAULT false,
  solved_post_id uuid,
  view_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  vote_score integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Forum posts (replies)
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  is_solution boolean NOT NULL DEFAULT false,
  vote_score integer NOT NULL DEFAULT 0,
  reply_to_id uuid REFERENCES public.forum_posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Forum votes (threads + posts)
CREATE TABLE public.forum_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL, -- 'thread' or 'post'
  target_id uuid NOT NULL,
  vote_value smallint NOT NULL DEFAULT 1, -- +1 or -1
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- User karma
CREATE TABLE public.user_karma (
  user_id uuid PRIMARY KEY,
  karma integer NOT NULL DEFAULT 0,
  threads_created integer NOT NULL DEFAULT 0,
  posts_created integer NOT NULL DEFAULT 0,
  solutions_given integer NOT NULL DEFAULT 0,
  upvotes_received integer NOT NULL DEFAULT 0,
  downvotes_received integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════
CREATE INDEX idx_forum_threads_category ON public.forum_threads(category_id, last_activity_at DESC);
CREATE INDEX idx_forum_threads_author ON public.forum_threads(author_id);
CREATE INDEX idx_forum_posts_thread ON public.forum_posts(thread_id, created_at);
CREATE INDEX idx_forum_posts_author ON public.forum_posts(author_id);
CREATE INDEX idx_forum_votes_target ON public.forum_votes(target_type, target_id);

-- ══════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_karma ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
CREATE POLICY "Anyone can read active categories" ON public.forum_categories
  FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins manage categories" ON public.forum_categories
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Threads: public read, auth create, author/admin edit
CREATE POLICY "Anyone can read threads" ON public.forum_threads
  FOR SELECT TO public USING (true);
CREATE POLICY "Auth users create threads" ON public.forum_threads
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors update own threads" ON public.forum_threads
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete threads" ON public.forum_threads
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Posts: public read, auth create, author/admin edit
CREATE POLICY "Anyone can read posts" ON public.forum_posts
  FOR SELECT TO public USING (true);
CREATE POLICY "Auth users create posts" ON public.forum_posts
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Authors update own posts" ON public.forum_posts
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete posts" ON public.forum_posts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Votes: auth users manage own votes
CREATE POLICY "Anyone can read votes" ON public.forum_votes
  FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage own votes" ON public.forum_votes
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Karma: public read, system write
CREATE POLICY "Anyone can read karma" ON public.user_karma
  FOR SELECT TO public USING (true);
CREATE POLICY "System updates karma" ON public.user_karma
  FOR ALL TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════
-- FUNCTIONS: Vote handling with karma update
-- ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.forum_vote(
  _target_type text,
  _target_id uuid,
  _vote_value smallint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _existing record;
  _author_id uuid;
  _old_value smallint;
  _delta integer;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Validate vote value
  IF _vote_value NOT IN (-1, 1) THEN
    RETURN jsonb_build_object('error', 'Vote must be +1 or -1');
  END IF;

  -- Get author of target
  IF _target_type = 'thread' THEN
    SELECT author_id INTO _author_id FROM forum_threads WHERE id = _target_id;
  ELSIF _target_type = 'post' THEN
    SELECT author_id INTO _author_id FROM forum_posts WHERE id = _target_id;
  ELSE
    RETURN jsonb_build_object('error', 'Invalid target type');
  END IF;

  IF _author_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Target not found');
  END IF;

  -- Can't vote on own content
  IF _author_id = _user_id THEN
    RETURN jsonb_build_object('error', 'Cannot vote on own content');
  END IF;

  -- Check existing vote
  SELECT * INTO _existing FROM forum_votes
  WHERE user_id = _user_id AND target_type = _target_type AND target_id = _target_id;

  IF _existing IS NOT NULL THEN
    IF _existing.vote_value = _vote_value THEN
      -- Remove vote (toggle off)
      DELETE FROM forum_votes WHERE id = _existing.id;
      _delta := -_vote_value;
    ELSE
      -- Change vote
      UPDATE forum_votes SET vote_value = _vote_value WHERE id = _existing.id;
      _delta := _vote_value * 2; -- swing from -1 to +1 = +2
    END IF;
  ELSE
    -- New vote
    INSERT INTO forum_votes (user_id, target_type, target_id, vote_value)
    VALUES (_user_id, _target_type, _target_id, _vote_value);
    _delta := _vote_value;
  END IF;

  -- Update vote_score on target
  IF _target_type = 'thread' THEN
    UPDATE forum_threads SET vote_score = vote_score + _delta WHERE id = _target_id;
  ELSE
    UPDATE forum_posts SET vote_score = vote_score + _delta WHERE id = _target_id;
  END IF;

  -- Update karma for the content author
  INSERT INTO user_karma (user_id, karma)
  VALUES (_author_id, _delta)
  ON CONFLICT (user_id) DO UPDATE SET
    karma = user_karma.karma + _delta,
    upvotes_received = CASE WHEN _delta > 0 THEN user_karma.upvotes_received + 1 ELSE user_karma.upvotes_received END,
    downvotes_received = CASE WHEN _delta < 0 THEN user_karma.downvotes_received + 1 ELSE user_karma.downvotes_received END,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'delta', _delta);
END;
$$;

-- ══════════════════════════════════════════════
-- FUNCTION: Mark post as solution
-- ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.forum_mark_solution(
  _thread_id uuid,
  _post_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _thread record;
  _post record;
BEGIN
  _user_id := auth.uid();

  SELECT * INTO _thread FROM forum_threads WHERE id = _thread_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Thread not found'); END IF;

  -- Only thread author or admin can mark solution
  IF _thread.author_id != _user_id AND NOT has_role(_user_id, 'admin') THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;

  SELECT * INTO _post FROM forum_posts WHERE id = _post_id AND thread_id = _thread_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Post not found'); END IF;

  -- Unmark previous solution
  UPDATE forum_posts SET is_solution = false WHERE thread_id = _thread_id AND is_solution = true;

  -- Mark new solution
  UPDATE forum_posts SET is_solution = true WHERE id = _post_id;
  UPDATE forum_threads SET is_solved = true, solved_post_id = _post_id WHERE id = _thread_id;

  -- Award karma bonus to solution author
  INSERT INTO user_karma (user_id, karma, solutions_given)
  VALUES (_post.author_id, 10, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    karma = user_karma.karma + 10,
    solutions_given = user_karma.solutions_given + 1,
    updated_at = now();

  -- Award Neuroni bonus (5 credits for helpful answer)
  PERFORM add_credits(_post.author_id, 5, 'Forum: Solution accepted bonus');

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ══════════════════════════════════════════════
-- TRIGGER: Update counters on thread/post creation
-- ══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.forum_update_counters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_TABLE_NAME = 'forum_threads' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE forum_categories SET thread_count = thread_count + 1 WHERE id = NEW.category_id;
      INSERT INTO user_karma (user_id, threads_created)
      VALUES (NEW.author_id, 1)
      ON CONFLICT (user_id) DO UPDATE SET
        threads_created = user_karma.threads_created + 1,
        karma = user_karma.karma + 2,
        updated_at = now();
    END IF;
  ELSIF TG_TABLE_NAME = 'forum_posts' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE forum_threads SET
        reply_count = reply_count + 1,
        last_activity_at = now()
      WHERE id = NEW.thread_id;
      
      UPDATE forum_categories SET post_count = post_count + 1
      WHERE id = (SELECT category_id FROM forum_threads WHERE id = NEW.thread_id);
      
      INSERT INTO user_karma (user_id, posts_created)
      VALUES (NEW.author_id, 1)
      ON CONFLICT (user_id) DO UPDATE SET
        posts_created = user_karma.posts_created + 1,
        karma = user_karma.karma + 1,
        updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_forum_thread_counter
  AFTER INSERT ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION public.forum_update_counters();

CREATE TRIGGER trg_forum_post_counter
  AFTER INSERT ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.forum_update_counters();

-- ══════════════════════════════════════════════
-- SEED: Default categories
-- ══════════════════════════════════════════════
INSERT INTO public.forum_categories (name, slug, description, icon, position) VALUES
  ('Getting Started', 'getting-started', 'Onboarding, tutorials, first steps with AI-IDEI', 'rocket', 1),
  ('Services & Features', 'services-features', 'Discuss extraction, analysis, and generation services', 'zap', 2),
  ('Knowledge Library', 'knowledge-library', 'Share and discuss neurons, frameworks, and patterns', 'brain', 3),
  ('Tips & Best Practices', 'tips-best-practices', 'Community tips for maximizing platform value', 'lightbulb', 4),
  ('Bug Reports', 'bug-reports', 'Report issues and track fixes', 'bug', 5),
  ('Feature Requests', 'feature-requests', 'Suggest and vote on new features', 'sparkles', 6),
  ('General Discussion', 'general', 'Off-topic and general community chat', 'message-square', 7);
