-- Fix track_challenge_neurons to use the 5-param award_xp signature
CREATE OR REPLACE FUNCTION public.track_challenge_neurons()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    IF EXISTS (
      SELECT 1 FROM challenge_progress
      WHERE user_id = NEW.author_id AND challenge_id = _challenge.id
        AND completed = true AND completed_at = now()
    ) THEN
      PERFORM award_xp(
        NEW.author_id, 
        (SELECT xp_reward FROM daily_challenges WHERE id = _challenge.id), 
        'daily_challenge'::text, 
        _challenge.id::text, 
        false::boolean
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;