
-- ════════════════════════════════════════════════
-- Auto-update challenge progress on user actions
-- ════════════════════════════════════════════════

-- Track neuron creation for daily challenges
CREATE OR REPLACE FUNCTION public.track_challenge_neurons()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _challenge RECORD;
BEGIN
  FOR _challenge IN
    SELECT dc.id, dc.goal_value FROM daily_challenges dc
    WHERE dc.active_date = CURRENT_DATE
      AND dc.is_active = true
      AND dc.goal_metric = 'neurons_created'
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
    
    -- Award XP on completion
    IF EXISTS (
      SELECT 1 FROM challenge_progress
      WHERE user_id = NEW.author_id AND challenge_id = _challenge.id
        AND completed = true AND completed_at = now()
    ) THEN
      PERFORM award_xp(NEW.author_id, (SELECT xp_reward FROM daily_challenges WHERE id = _challenge.id), 'daily_challenge', _challenge.id::text);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_track_challenge_neurons
  AFTER INSERT ON neurons
  FOR EACH ROW
  EXECUTE FUNCTION track_challenge_neurons();

-- Track job completion for daily challenges
CREATE OR REPLACE FUNCTION public.track_challenge_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        PERFORM award_xp(NEW.author_id, (SELECT xp_reward FROM daily_challenges WHERE id = _challenge.id), 'daily_challenge', _challenge.id::text);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_track_challenge_jobs
  AFTER UPDATE ON neuron_jobs
  FOR EACH ROW
  EXECUTE FUNCTION track_challenge_jobs();

-- Track forum posts for daily challenges
CREATE OR REPLACE FUNCTION public.track_challenge_forum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _challenge RECORD;
BEGIN
  FOR _challenge IN
    SELECT dc.id, dc.goal_value FROM daily_challenges dc
    WHERE dc.active_date = CURRENT_DATE
      AND dc.is_active = true
      AND dc.goal_metric = 'forum_posts'
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
      PERFORM award_xp(NEW.author_id, (SELECT xp_reward FROM daily_challenges WHERE id = _challenge.id), 'daily_challenge', _challenge.id::text);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_track_challenge_forum
  AFTER INSERT ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION track_challenge_forum();

-- Add unique constraint on challenge_progress if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'challenge_progress_user_challenge_unique'
  ) THEN
    ALTER TABLE challenge_progress ADD CONSTRAINT challenge_progress_user_challenge_unique 
      UNIQUE (user_id, challenge_id);
  END IF;
END $$;
