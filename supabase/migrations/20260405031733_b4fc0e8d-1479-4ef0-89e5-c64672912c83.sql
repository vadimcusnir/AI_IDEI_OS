
DROP FUNCTION IF EXISTS public.record_daily_activity(uuid);

CREATE OR REPLACE FUNCTION public.record_daily_activity(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := current_date;
  _row user_streaks%ROWTYPE;
  _days_gap int;
  _new_streak int;
  _grace boolean := false;
BEGIN
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
  VALUES (_user_id, 0, 0, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO _row FROM user_streaks WHERE user_id = _user_id FOR UPDATE;

  IF _row.last_active_date = _today THEN
    RETURN jsonb_build_object('status', 'already_recorded', 'current_streak', _row.current_streak);
  END IF;

  IF _row.last_active_date IS NULL THEN
    _new_streak := 1;
  ELSE
    _days_gap := _today - _row.last_active_date;
    IF _days_gap = 1 THEN
      _new_streak := _row.current_streak + 1;
    ELSIF _days_gap = 2 AND NOT _row.grace_period_used THEN
      _new_streak := _row.current_streak + 1;
      _grace := true;
    ELSIF _days_gap = 2 AND _row.freeze_tokens > 0 THEN
      _new_streak := _row.current_streak + 1;
      UPDATE user_streaks SET freeze_tokens = freeze_tokens - 1 WHERE user_id = _user_id;
    ELSE
      _new_streak := 1;
    END IF;
  END IF;

  UPDATE user_streaks SET
    current_streak = _new_streak,
    longest_streak = GREATEST(_row.longest_streak, _new_streak),
    last_active_date = _today,
    grace_period_used = CASE WHEN _grace THEN true ELSE _row.grace_period_used END,
    updated_at = now()
  WHERE user_id = _user_id;

  UPDATE user_tier_progress SET
    current_streak_days = _new_streak,
    longest_streak_days = GREATEST(COALESCE(longest_streak_days, 0), _new_streak),
    last_activity_at = now(),
    updated_at = now()
  WHERE user_id = _user_id;

  RETURN jsonb_build_object(
    'status', 'recorded',
    'current_streak', _new_streak,
    'grace_used', _grace,
    'longest_streak', GREATEST(_row.longest_streak, _new_streak)
  );
END;
$$;
