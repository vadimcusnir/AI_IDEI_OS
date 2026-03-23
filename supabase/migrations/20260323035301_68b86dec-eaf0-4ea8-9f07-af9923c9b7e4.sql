-- Drop BOTH overloads and recreate a single unified function
DROP FUNCTION IF EXISTS public.award_xp(uuid, integer, text, text, boolean);
DROP FUNCTION IF EXISTS public.award_xp(uuid, integer, text, text, boolean, numeric);

CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid, 
  _amount integer, 
  _source text, 
  _description text DEFAULT ''::text, 
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
  _amount := FLOOR(_amount * _quality_multiplier);
  
  INSERT INTO user_xp (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO _current FROM user_xp WHERE user_id = _user_id FOR UPDATE;
  
  IF _current.daily_xp_date < CURRENT_DATE THEN
    UPDATE user_xp SET daily_xp_earned = 0, daily_xp_date = CURRENT_DATE WHERE user_id = _user_id;
    _current.daily_xp_earned := 0;
  END IF;
  
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
  _new_level := 1 + FLOOR(SQRT(_new_total::float / 100.0))::integer;
  _new_level := LEAST(_new_level, 20);
  
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
  
  UPDATE user_xp SET
    total_xp = _new_total,
    level = _new_level,
    rank_name = _new_rank,
    daily_xp_earned = daily_xp_earned + _effective_amount,
    updated_at = now()
  WHERE user_id = _user_id;
  
  INSERT INTO xp_transactions (user_id, amount, source, description, metadata)
  VALUES (_user_id, _effective_amount, _source, _description,
    jsonb_build_object('original_amount', _amount, 'quality_multiplier', _quality_multiplier, 'capped', _amount != _effective_amount));
  
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