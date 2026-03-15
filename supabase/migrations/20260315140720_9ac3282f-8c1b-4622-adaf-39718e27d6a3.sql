
-- 1. Thread tags
ALTER TABLE public.forum_threads ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Forum post flags for moderation
CREATE TABLE IF NOT EXISTS public.forum_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL DEFAULT 'post',
  target_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create flags" ON public.forum_flags
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view all flags" ON public.forum_flags
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reporters can view own flags" ON public.forum_flags
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Admins can update flags" ON public.forum_flags
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Team challenges
CREATE TABLE IF NOT EXISTS public.team_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  goal_metric text NOT NULL,
  goal_value integer NOT NULL DEFAULT 100,
  current_value integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 50,
  neurons_reward integer NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active team challenges" ON public.team_challenges
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins manage team challenges" ON public.team_challenges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.team_challenge_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.team_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_challenge_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions" ON public.team_challenge_contributions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert contributions" ON public.team_challenge_contributions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4. Forum notification triggers
CREATE OR REPLACE FUNCTION public.notify_forum_reply()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _thread RECORD;
  _parent_author uuid;
  _mentions text[];
  _mention text;
  _mentioned_user uuid;
BEGIN
  -- Get the thread
  SELECT * INTO _thread FROM forum_threads WHERE id = NEW.thread_id;
  
  -- Notify thread author (if not self)
  IF _thread.author_id != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, title, message, link, meta)
    VALUES (_thread.author_id, 'forum_reply', 'New reply on your thread',
      LEFT(NEW.content, 100), '/community/' || (SELECT slug FROM forum_categories WHERE id = _thread.category_id) || '/thread/' || NEW.thread_id,
      jsonb_build_object('thread_id', NEW.thread_id, 'post_id', NEW.id));
  END IF;

  -- Notify parent reply author (if nested reply, not self)
  IF NEW.reply_to_id IS NOT NULL THEN
    SELECT author_id INTO _parent_author FROM forum_posts WHERE id = NEW.reply_to_id;
    IF _parent_author IS NOT NULL AND _parent_author != NEW.author_id AND _parent_author != _thread.author_id THEN
      INSERT INTO notifications (user_id, type, title, message, link, meta)
      VALUES (_parent_author, 'forum_mention', 'Someone replied to your comment',
        LEFT(NEW.content, 100), '/community/' || (SELECT slug FROM forum_categories WHERE id = _thread.category_id) || '/thread/' || NEW.thread_id,
        jsonb_build_object('thread_id', NEW.thread_id, 'post_id', NEW.id));
    END IF;
  END IF;

  -- Detect @mentions and notify
  SELECT array_agg(m[1]) INTO _mentions
  FROM regexp_matches(NEW.content, '@(\w+)', 'g') AS m;
  
  IF _mentions IS NOT NULL THEN
    FOREACH _mention IN ARRAY _mentions LOOP
      SELECT user_id INTO _mentioned_user
      FROM profiles
      WHERE LOWER(REPLACE(display_name, ' ', '_')) = LOWER(_mention)
      LIMIT 1;
      
      IF _mentioned_user IS NOT NULL AND _mentioned_user != NEW.author_id THEN
        INSERT INTO notifications (user_id, type, title, message, link, meta)
        VALUES (_mentioned_user, 'forum_mention', 'You were mentioned in a discussion',
          LEFT(NEW.content, 100), '/community/' || (SELECT slug FROM forum_categories WHERE id = _thread.category_id) || '/thread/' || NEW.thread_id,
          jsonb_build_object('thread_id', NEW.thread_id, 'post_id', NEW.id))
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_forum_reply ON public.forum_posts;
CREATE TRIGGER trg_notify_forum_reply
  AFTER INSERT ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_forum_reply();
