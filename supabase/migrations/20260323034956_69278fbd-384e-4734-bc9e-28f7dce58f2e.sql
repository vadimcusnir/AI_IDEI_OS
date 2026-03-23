-- Fix ALL remaining functions that call award_xp with 4 args (need 5)

-- forum_vote
CREATE OR REPLACE FUNCTION public.forum_vote(_target_type text, _target_id uuid, _vote_value smallint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _existing record;
  _author_id uuid;
  _old_value smallint;
  _delta integer;
  _new_score integer;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RETURN jsonb_build_object('error', 'Not authenticated'); END IF;
  IF _vote_value NOT IN (-1, 1) THEN RETURN jsonb_build_object('error', 'Vote must be +1 or -1'); END IF;

  IF _target_type = 'thread' THEN
    SELECT author_id INTO _author_id FROM forum_threads WHERE id = _target_id;
  ELSIF _target_type = 'post' THEN
    SELECT author_id INTO _author_id FROM forum_posts WHERE id = _target_id;
  ELSE
    RETURN jsonb_build_object('error', 'Invalid target type');
  END IF;

  IF _author_id IS NULL THEN RETURN jsonb_build_object('error', 'Target not found'); END IF;
  IF _author_id = _user_id THEN RETURN jsonb_build_object('error', 'Cannot vote on own content'); END IF;

  SELECT * INTO _existing FROM forum_votes WHERE user_id = _user_id AND target_type = _target_type AND target_id = _target_id;

  IF _existing IS NOT NULL THEN
    IF _existing.vote_value = _vote_value THEN
      DELETE FROM forum_votes WHERE id = _existing.id;
      _delta := -_vote_value;
    ELSE
      UPDATE forum_votes SET vote_value = _vote_value WHERE id = _existing.id;
      _delta := _vote_value * 2;
    END IF;
  ELSE
    INSERT INTO forum_votes (user_id, target_type, target_id, vote_value) VALUES (_user_id, _target_type, _target_id, _vote_value);
    _delta := _vote_value;
  END IF;

  IF _target_type = 'thread' THEN
    UPDATE forum_threads SET vote_score = vote_score + _delta WHERE id = _target_id RETURNING vote_score INTO _new_score;
    IF _new_score = 3 AND _delta > 0 THEN
      PERFORM add_credits(_author_id, 15, 'Forum: Quality thread bonus (+15 NEURONS)');
      PERFORM award_xp(_author_id, 30, 'forum_quality_thread'::text, 'Thread reached 3+ upvotes'::text, false::boolean);
    END IF;
  ELSE
    UPDATE forum_posts SET vote_score = vote_score + _delta WHERE id = _target_id RETURNING vote_score INTO _new_score;
    IF _new_score = 5 AND _delta > 0 THEN
      PERFORM add_credits(_author_id, 5, 'Forum: Highly-upvoted reply bonus (+5 NEURONS)');
      PERFORM award_xp(_author_id, 20, 'forum_quality_reply'::text, 'Reply reached 5+ upvotes'::text, false::boolean);
    END IF;
  END IF;

  INSERT INTO user_karma (user_id, karma) VALUES (_author_id, _delta)
  ON CONFLICT (user_id) DO UPDATE SET
    karma = user_karma.karma + _delta,
    upvotes_received = CASE WHEN _delta > 0 THEN user_karma.upvotes_received + 1 ELSE user_karma.upvotes_received END,
    downvotes_received = CASE WHEN _delta < 0 THEN user_karma.downvotes_received + 1 ELSE user_karma.downvotes_received END,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'delta', _delta, 'new_score', _new_score);
END;
$$;

-- check_streak_achievements
CREATE OR REPLACE FUNCTION public.check_streak_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ach RECORD;
BEGIN
  FOR _ach IN
    SELECT id, requirements FROM achievements_registry
    WHERE category = 'consistency'
      AND id NOT IN (SELECT achievement_key FROM user_achievements WHERE user_id = NEW.user_id)
  LOOP
    IF (_ach.requirements->>'streak_days')::int IS NOT NULL
       AND NEW.current_streak >= (_ach.requirements->>'streak_days')::int THEN
      INSERT INTO user_achievements (user_id, achievement_key) VALUES (NEW.user_id, _ach.id) ON CONFLICT DO NOTHING;
      PERFORM award_xp(NEW.user_id, (SELECT xp_reward FROM achievements_registry WHERE id = _ach.id), 'achievement'::text, _ach.id::text, false::boolean);
      INSERT INTO notifications (user_id, type, title, message, link, meta)
      VALUES (NEW.user_id, 'achievement_unlocked', '🏆 Achievement Unlocked!',
        (SELECT name FROM achievements_registry WHERE id = _ach.id), '/gamification',
        jsonb_build_object('achievement_id', _ach.id));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- check_forum_achievements
CREATE OR REPLACE FUNCTION public.check_forum_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ach RECORD; _post_count integer;
BEGIN
  SELECT COUNT(*) INTO _post_count FROM forum_posts WHERE author_id = NEW.author_id;
  FOR _ach IN
    SELECT id, requirements FROM achievements_registry
    WHERE category = 'social'
      AND id NOT IN (SELECT achievement_key FROM user_achievements WHERE user_id = NEW.author_id)
  LOOP
    IF (_ach.requirements->>'forum_posts')::int IS NOT NULL
       AND _post_count >= (_ach.requirements->>'forum_posts')::int THEN
      INSERT INTO user_achievements (user_id, achievement_key) VALUES (NEW.author_id, _ach.id) ON CONFLICT DO NOTHING;
      PERFORM award_xp(NEW.author_id, (SELECT xp_reward FROM achievements_registry WHERE id = _ach.id), 'achievement'::text, _ach.id::text, false::boolean);
      INSERT INTO notifications (user_id, type, title, message, link, meta)
      VALUES (NEW.author_id, 'achievement_unlocked', '🏆 Achievement Unlocked!',
        (SELECT name FROM achievements_registry WHERE id = _ach.id), '/gamification',
        jsonb_build_object('achievement_id', _ach.id));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- forum_mark_solution
CREATE OR REPLACE FUNCTION public.forum_mark_solution(_thread_id uuid, _post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user_id uuid; _thread record; _post record;
BEGIN
  _user_id := auth.uid();
  SELECT * INTO _thread FROM forum_threads WHERE id = _thread_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Thread not found'); END IF;
  IF _thread.author_id != _user_id AND NOT has_role(_user_id, 'admin') THEN
    RETURN jsonb_build_object('error', 'Not authorized');
  END IF;
  SELECT * INTO _post FROM forum_posts WHERE id = _post_id AND thread_id = _thread_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Post not found'); END IF;

  UPDATE forum_posts SET is_solution = false WHERE thread_id = _thread_id AND is_solution = true;
  UPDATE forum_posts SET is_solution = true WHERE id = _post_id;
  UPDATE forum_threads SET is_solved = true, solved_post_id = _post_id WHERE id = _thread_id;

  INSERT INTO user_karma (user_id, karma, solutions_given) VALUES (_post.author_id, 10, 1)
  ON CONFLICT (user_id) DO UPDATE SET karma = user_karma.karma + 10, solutions_given = user_karma.solutions_given + 1, updated_at = now();

  PERFORM add_credits(_post.author_id, 10, 'Forum: Helpful answer bonus (+10 NEURONS)');
  PERFORM award_xp(_post.author_id, 50, 'forum_solution'::text, 'Answer marked as solution'::text, false::boolean);

  RETURN jsonb_build_object('success', true);
END;
$$;

-- track_challenge_forum
CREATE OR REPLACE FUNCTION public.track_challenge_forum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _challenge RECORD;
BEGIN
  FOR _challenge IN
    SELECT dc.id, dc.goal_value FROM daily_challenges dc
    WHERE dc.active_date = CURRENT_DATE AND dc.is_active = true AND dc.goal_metric = 'forum_posts'
  LOOP
    INSERT INTO challenge_progress (user_id, challenge_id, current_value, completed)
    VALUES (NEW.author_id, _challenge.id, 1, 1 >= _challenge.goal_value)
    ON CONFLICT (user_id, challenge_id) DO UPDATE SET
      current_value = challenge_progress.current_value + 1,
      completed = (challenge_progress.current_value + 1) >= _challenge.goal_value,
      completed_at = CASE WHEN (challenge_progress.current_value + 1) >= _challenge.goal_value AND challenge_progress.completed_at IS NULL THEN now() ELSE challenge_progress.completed_at END;
    IF EXISTS (SELECT 1 FROM challenge_progress WHERE user_id = NEW.author_id AND challenge_id = _challenge.id AND completed = true AND completed_at = now()) THEN
      PERFORM award_xp(NEW.author_id, (SELECT xp_reward FROM daily_challenges WHERE id = _challenge.id), 'daily_challenge'::text, _challenge.id::text, false::boolean);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- claim_vip_reward
CREATE OR REPLACE FUNCTION public.claim_vip_reward(_user_id uuid, _milestone_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _progress RECORD; _milestone RECORD;
BEGIN
  SELECT * INTO _progress FROM vip_milestone_progress WHERE user_id = _user_id AND milestone_id = _milestone_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'MILESTONE_NOT_UNLOCKED'); END IF;
  IF _progress.claimed_reward THEN RETURN jsonb_build_object('ok', false, 'reason', 'ALREADY_CLAIMED'); END IF;
  SELECT * INTO _milestone FROM vip_milestones WHERE id = _milestone_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'MILESTONE_NOT_FOUND'); END IF;

  UPDATE vip_milestone_progress SET claimed_reward = true WHERE id = _progress.id;
  IF _milestone.reward_neurons > 0 THEN
    PERFORM add_credits(_user_id, _milestone.reward_neurons, 'VIP Reward: ' || _milestone.title || ' (+' || _milestone.reward_neurons || ' NEURONS)');
  END IF;
  PERFORM award_xp(_user_id, 50, 'vip_milestone'::text, ('Claimed: ' || _milestone.title)::text, false::boolean);
  RETURN jsonb_build_object('ok', true, 'reward_neurons', _milestone.reward_neurons, 'milestone', _milestone.title);
END;
$$;