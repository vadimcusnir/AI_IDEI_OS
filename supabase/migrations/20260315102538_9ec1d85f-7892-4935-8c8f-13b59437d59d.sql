
-- ═══════════════════════════════════════════════════════════
-- GAMIFICATION PHASE 2: Achievements Registry + Enhanced XP + Forum Bonuses
-- ═══════════════════════════════════════════════════════════

-- 1) ACHIEVEMENTS REGISTRY TABLE
CREATE TABLE IF NOT EXISTS public.achievements_registry (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_ro text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  description_ro text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'activation',
  tier text NOT NULL DEFAULT 'bronze',
  xp_reward integer NOT NULL DEFAULT 50,
  icon text NOT NULL DEFAULT 'star',
  hidden boolean NOT NULL DEFAULT false,
  requirements jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read, no public write
ALTER TABLE public.achievements_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_registry_public_read"
  ON public.achievements_registry FOR SELECT
  USING (true);

-- 2) ENHANCE award_xp WITH QUALITY MULTIPLIER
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid, 
  _amount integer, 
  _source text, 
  _description text DEFAULT '',
  _bypass_cap boolean DEFAULT false,
  _quality_multiplier numeric DEFAULT 1.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _current RECORD;
  _effective_amount integer;
  _daily_cap integer := 200;
  _remaining_cap integer;
  _new_total integer;
  _new_level integer;
  _new_rank text;
  _leveled_up boolean := false;
BEGIN
  -- Clamp multiplier
  _quality_multiplier := GREATEST(0.5, LEAST(2.0, _quality_multiplier));
  
  -- Apply quality multiplier to amount
  _amount := FLOOR(_amount * _quality_multiplier);
  
  -- Upsert user_xp row
  INSERT INTO user_xp (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO _current FROM user_xp WHERE user_id = _user_id FOR UPDATE;
  
  -- Reset daily counter if new day
  IF _current.daily_xp_date < CURRENT_DATE THEN
    UPDATE user_xp SET daily_xp_earned = 0, daily_xp_date = CURRENT_DATE WHERE user_id = _user_id;
    _current.daily_xp_earned := 0;
  END IF;
  
  -- Apply daily cap
  IF _bypass_cap THEN
    _effective_amount := _amount;
  ELSE
    _remaining_cap := GREATEST(0, _daily_cap - _current.daily_xp_earned);
    _effective_amount := LEAST(_amount, _remaining_cap);
  END IF;
  
  IF _effective_amount <= 0 THEN
    RETURN jsonb_build_object('awarded', 0, 'reason', 'DAILY_CAP_REACHED', 'total_xp', _current.total_xp, 'level', _current.level);
  END IF;
  
  _new_total := _current.total_xp + _effective_amount;
  
  -- Calculate level: Level N requires (N-1)² × 100 XP
  _new_level := 1 + FLOOR(SQRT(_new_total::float / 100.0))::integer;
  _new_level := LEAST(_new_level, 20); -- Cap at level 20
  
  -- Determine rank
  _new_rank := CASE
    WHEN _new_level >= 20 THEN 'Legend'
    WHEN _new_level >= 15 THEN 'Virtuoso'
    WHEN _new_level >= 10 THEN 'Master'
    WHEN _new_level >= 7 THEN 'Expert'
    WHEN _new_level >= 5 THEN 'Artisan'
    WHEN _new_level >= 3 THEN 'Creator'
    WHEN _new_level >= 2 THEN 'Apprentice'
    ELSE 'Novice'
  END;
  
  _leveled_up := _new_level > _current.level;
  
  -- Update XP state
  UPDATE user_xp SET
    total_xp = _new_total,
    level = _new_level,
    rank_name = _new_rank,
    daily_xp_earned = daily_xp_earned + _effective_amount,
    updated_at = now()
  WHERE user_id = _user_id;
  
  -- Log transaction
  INSERT INTO xp_transactions (user_id, amount, source, description, metadata)
  VALUES (_user_id, _effective_amount, _source, _description,
    jsonb_build_object('original_amount', _amount, 'quality_multiplier', _quality_multiplier, 'capped', _amount != _effective_amount));
  
  -- Notify on level up
  IF _leveled_up THEN
    INSERT INTO notifications (user_id, type, title, message, link, meta)
    VALUES (_user_id, 'level_up', '🎉 Level Up! ' || _new_rank,
      'You reached Level ' || _new_level || '!', '/gamification',
      jsonb_build_object('level', _new_level, 'rank', _new_rank, 'total_xp', _new_total));
  END IF;
  
  RETURN jsonb_build_object(
    'awarded', _effective_amount,
    'total_xp', _new_total,
    'level', _new_level,
    'rank', _new_rank,
    'leveled_up', _leveled_up,
    'quality_multiplier', _quality_multiplier
  );
END;
$function$;

-- 3) ENHANCE forum_mark_solution TO AWARD 10 NEURONS (up from 5)
CREATE OR REPLACE FUNCTION public.forum_mark_solution(_thread_id uuid, _post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _thread record;
  _post record;
BEGIN
  _user_id := auth.uid();

  SELECT * INTO _thread FROM forum_threads WHERE id = _thread_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Thread not found'); END IF;

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

  -- Award karma bonus (10 for solution)
  INSERT INTO user_karma (user_id, karma, solutions_given)
  VALUES (_post.author_id, 10, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    karma = user_karma.karma + 10,
    solutions_given = user_karma.solutions_given + 1,
    updated_at = now();

  -- Award 10 NEURONS for helpful answer (up from 5)
  PERFORM add_credits(_post.author_id, 10, 'Forum: Helpful answer bonus (+10 NEURONS)');

  -- Award XP
  PERFORM award_xp(_post.author_id, 50, 'forum_solution', 'Answer marked as solution');

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- 4) FORUM VOTE BONUS: Award 5 NEURONS when a reply reaches 5+ upvotes
CREATE OR REPLACE FUNCTION public.forum_vote(_target_type text, _target_id uuid, _vote_value smallint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid;
  _existing record;
  _author_id uuid;
  _old_value smallint;
  _delta integer;
  _new_score integer;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  IF _vote_value NOT IN (-1, 1) THEN
    RETURN jsonb_build_object('error', 'Vote must be +1 or -1');
  END IF;

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

  IF _author_id = _user_id THEN
    RETURN jsonb_build_object('error', 'Cannot vote on own content');
  END IF;

  SELECT * INTO _existing FROM forum_votes
  WHERE user_id = _user_id AND target_type = _target_type AND target_id = _target_id;

  IF _existing IS NOT NULL THEN
    IF _existing.vote_value = _vote_value THEN
      DELETE FROM forum_votes WHERE id = _existing.id;
      _delta := -_vote_value;
    ELSE
      UPDATE forum_votes SET vote_value = _vote_value WHERE id = _existing.id;
      _delta := _vote_value * 2;
    END IF;
  ELSE
    INSERT INTO forum_votes (user_id, target_type, target_id, vote_value)
    VALUES (_user_id, _target_type, _target_id, _vote_value);
    _delta := _vote_value;
  END IF;

  -- Update vote_score on target and get new score
  IF _target_type = 'thread' THEN
    UPDATE forum_threads SET vote_score = vote_score + _delta WHERE id = _target_id
    RETURNING vote_score INTO _new_score;
    
    -- Quality thread bonus: 15 NEURONS at exactly 3 upvotes
    IF _new_score = 3 AND _delta > 0 THEN
      PERFORM add_credits(_author_id, 15, 'Forum: Quality thread bonus (+15 NEURONS)');
      PERFORM award_xp(_author_id, 30, 'forum_quality_thread', 'Thread reached 3+ upvotes');
    END IF;
  ELSE
    UPDATE forum_posts SET vote_score = vote_score + _delta WHERE id = _target_id
    RETURNING vote_score INTO _new_score;
    
    -- Highly-upvoted reply bonus: 5 NEURONS at exactly 5 upvotes
    IF _new_score = 5 AND _delta > 0 THEN
      PERFORM add_credits(_author_id, 5, 'Forum: Highly-upvoted reply bonus (+5 NEURONS)');
      PERFORM award_xp(_author_id, 20, 'forum_quality_reply', 'Reply reached 5+ upvotes');
    END IF;
  END IF;

  -- Update karma
  INSERT INTO user_karma (user_id, karma)
  VALUES (_author_id, _delta)
  ON CONFLICT (user_id) DO UPDATE SET
    karma = user_karma.karma + _delta,
    upvotes_received = CASE WHEN _delta > 0 THEN user_karma.upvotes_received + 1 ELSE user_karma.upvotes_received END,
    downvotes_received = CASE WHEN _delta < 0 THEN user_karma.downvotes_received + 1 ELSE user_karma.downvotes_received END,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'delta', _delta, 'new_score', _new_score);
END;
$function$;
