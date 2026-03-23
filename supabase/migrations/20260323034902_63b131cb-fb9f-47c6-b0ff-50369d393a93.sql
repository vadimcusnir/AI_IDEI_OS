-- Fix award_xp_on_job_complete: uses 4 args, needs 5
CREATE OR REPLACE FUNCTION public.award_xp_on_job_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM award_xp(NEW.author_id, 15, 'job_completed'::text, ('Completed: ' || NEW.worker_type)::text, false::boolean);
    PERFORM record_daily_activity(NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Fix check_credit_achievements: uses 4 args, needs 5
CREATE OR REPLACE FUNCTION public.check_credit_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      
      PERFORM award_xp(NEW.user_id, (SELECT xp_reward FROM achievements_registry WHERE id = _ach.id), 'achievement'::text, _ach.id::text, false::boolean);
      
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

-- Fix track_challenge_jobs: uses 4 args, needs 5
CREATE OR REPLACE FUNCTION public.track_challenge_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _challenge RECORD;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    FOR _challenge IN
      SELECT dc.id, dc.goal_value FROM daily_challenges dc
      WHERE dc.active_date = CURRENT_DATE
        AND dc.is_active = true
        AND dc.goal_metric = 'jobs_completed'
    LOOP
      INSERT INTO challenge_progress (user_id, challenge_id, current_value, completed)
      VALUES (NEW.author_id, _challenge.id, 1, 1 >= _challenge.goal_value)
      ON CONFLICT (user_id, challenge_id) DO UPDATE SET
        current_value = challenge_progress.current_value + 1,
        completed = (challenge_progress.current_value + 1) >= _challenge.goal_value,
        completed_at = CASE
          WHEN (challenge_progress.current_value + 1) >= _challenge.goal_value AND challenge_progress.completed_at IS NULL
          THEN now()
          ELSE challenge_progress.completed_at
        END;
      
      IF EXISTS (
        SELECT 1 FROM challenge_progress
        WHERE user_id = NEW.author_id AND challenge_id = _challenge.id
          AND completed = true AND completed_at = now()
      ) THEN
        PERFORM award_xp(NEW.author_id, (SELECT xp_reward FROM daily_challenges WHERE id = _challenge.id), 'daily_challenge'::text, _challenge.id::text, false::boolean);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;