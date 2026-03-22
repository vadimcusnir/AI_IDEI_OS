
-- ════════════════════════════════════════════════
-- 1. Expand achievement checking to community, streaks, credits
-- ════════════════════════════════════════════════

-- Achievement check on streak update
CREATE OR REPLACE FUNCTION public.check_streak_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ach RECORD;
BEGIN
  FOR _ach IN
    SELECT id, requirements FROM achievements_registry
    WHERE category = 'consistency'
      AND id NOT IN (SELECT achievement_key FROM user_achievements WHERE user_id = NEW.user_id)
  LOOP
    IF (_ach.requirements->>'streak_days')::int IS NOT NULL
       AND NEW.current_streak >= (_ach.requirements->>'streak_days')::int THEN
      INSERT INTO user_achievements (user_id, achievement_key)
      VALUES (NEW.user_id, _ach.id) ON CONFLICT DO NOTHING;
      
      PERFORM award_xp(NEW.user_id, (SELECT xp_reward FROM achievements_registry WHERE id = _ach.id), 'achievement', _ach.id);
      
      INSERT INTO notifications (user_id, type, title, message, link, meta)
      VALUES (NEW.user_id, 'achievement_unlocked', '🏆 Achievement Unlocked!',
        (SELECT name FROM achievements_registry WHERE id = _ach.id),
        '/gamification',
        jsonb_build_object('achievement_id', _ach.id));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_check_streak_achievements
  AFTER UPDATE ON user_streaks
  FOR EACH ROW
  WHEN (NEW.current_streak > OLD.current_streak)
  EXECUTE FUNCTION check_streak_achievements();

-- Achievement check on forum post (social category)
CREATE OR REPLACE FUNCTION public.check_forum_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ach RECORD;
  _post_count integer;
BEGIN
  SELECT COUNT(*) INTO _post_count FROM forum_posts WHERE author_id = NEW.author_id;
  
  FOR _ach IN
    SELECT id, requirements FROM achievements_registry
    WHERE category = 'social'
      AND id NOT IN (SELECT achievement_key FROM user_achievements WHERE user_id = NEW.author_id)
  LOOP
    IF (_ach.requirements->>'forum_posts')::int IS NOT NULL
       AND _post_count >= (_ach.requirements->>'forum_posts')::int THEN
      INSERT INTO user_achievements (user_id, achievement_key)
      VALUES (NEW.author_id, _ach.id) ON CONFLICT DO NOTHING;
      
      PERFORM award_xp(NEW.author_id, (SELECT xp_reward FROM achievements_registry WHERE id = _ach.id), 'achievement', _ach.id);
      
      INSERT INTO notifications (user_id, type, title, message, link, meta)
      VALUES (NEW.author_id, 'achievement_unlocked', '🏆 Achievement Unlocked!',
        (SELECT name FROM achievements_registry WHERE id = _ach.id),
        '/gamification',
        jsonb_build_object('achievement_id', _ach.id));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_check_forum_achievements
  AFTER INSERT ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION check_forum_achievements();

-- Achievement check on credit spending milestones
CREATE OR REPLACE FUNCTION public.check_credit_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ach RECORD;
BEGIN
  FOR _ach IN
    SELECT id, requirements FROM achievements_registry
    WHERE category IN ('activation', 'mastery')
      AND id NOT IN (SELECT achievement_key FROM user_achievements WHERE user_id = NEW.user_id)
  LOOP
    IF (_ach.requirements->>'total_spent')::int IS NOT NULL
       AND NEW.total_spent >= (_ach.requirements->>'total_spent')::int THEN
      INSERT INTO user_achievements (user_id, achievement_key)
      VALUES (NEW.user_id, _ach.id) ON CONFLICT DO NOTHING;
      
      PERFORM award_xp(NEW.user_id, (SELECT xp_reward FROM achievements_registry WHERE id = _ach.id), 'achievement', _ach.id);
      
      INSERT INTO notifications (user_id, type, title, message, link, meta)
      VALUES (NEW.user_id, 'achievement_unlocked', '🏆 Achievement Unlocked!',
        (SELECT name FROM achievements_registry WHERE id = _ach.id),
        '/gamification',
        jsonb_build_object('achievement_id', _ach.id));
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_check_credit_achievements
  AFTER UPDATE ON user_credits
  FOR EACH ROW
  WHEN (NEW.total_spent > OLD.total_spent)
  EXECUTE FUNCTION check_credit_achievements();

-- ════════════════════════════════════════════════
-- 2. Tier-based XP Boost — update award_xp to apply multipliers
-- ════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_tier_xp_multiplier(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tier text;
BEGIN
  SELECT tier INTO _tier FROM access_window_state WHERE user_id = _user_id;
  RETURN CASE
    WHEN _tier = 'vip' THEN 1.5
    WHEN _tier = 'pro' THEN 1.25
    WHEN _tier = 'starter' THEN 1.1
    ELSE 1.0
  END;
END;
$$;

-- ════════════════════════════════════════════════
-- 3. Auto-generate daily challenges function
-- ════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generate_daily_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _today date := CURRENT_DATE;
  _templates jsonb[] := ARRAY[
    '{"title":"Create 3 Neurons","description":"Extract or create 3 knowledge neurons today.","goal_metric":"neurons_created","goal_value":3,"xp_reward":50}'::jsonb,
    '{"title":"Run 2 Services","description":"Execute any 2 AI services.","goal_metric":"jobs_completed","goal_value":2,"xp_reward":40}'::jsonb,
    '{"title":"Upload a Transcript","description":"Upload and transcribe new content.","goal_metric":"transcripts_uploaded","goal_value":1,"xp_reward":30}'::jsonb,
    '{"title":"Community Contributor","description":"Post a reply in the forum.","goal_metric":"forum_posts","goal_value":1,"xp_reward":25}'::jsonb,
    '{"title":"Deep Analysis","description":"Run a deep extraction on any content.","goal_metric":"deep_extractions","goal_value":1,"xp_reward":60}'::jsonb,
    '{"title":"Knowledge Explorer","description":"View 5 entity detail pages.","goal_metric":"entities_viewed","goal_value":5,"xp_reward":20}'::jsonb
  ];
  _picked jsonb;
  _indices int[];
  _i int;
  _idx int;
BEGIN
  -- Don't regenerate if today already has challenges
  IF EXISTS (SELECT 1 FROM daily_challenges WHERE active_date = _today) THEN
    RETURN;
  END IF;
  
  -- Pick 3 random challenges from templates
  _indices := ARRAY[]::int[];
  WHILE array_length(_indices, 1) IS NULL OR array_length(_indices, 1) < 3 LOOP
    _idx := 1 + floor(random() * array_length(_templates, 1))::int;
    IF NOT (_idx = ANY(_indices)) THEN
      _indices := array_append(_indices, _idx);
    END IF;
  END LOOP;
  
  FOREACH _i IN ARRAY _indices LOOP
    _picked := _templates[_i];
    INSERT INTO daily_challenges (
      title, description, goal_metric, goal_value, xp_reward, active_date, is_active
    ) VALUES (
      _picked->>'title',
      _picked->>'description',
      _picked->>'goal_metric',
      (_picked->>'goal_value')::int,
      (_picked->>'xp_reward')::int,
      _today,
      true
    );
  END LOOP;
END;
$$;
