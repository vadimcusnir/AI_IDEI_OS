
-- ═══════════════════════════════════════════════════════════
-- Wallet: spend/reserve/settle/refund RPCs
-- Gamification: award_xp RPC with level-up + streak maintenance
-- Analytics: event aggregation RPCs
-- ═══════════════════════════════════════════════════════════

-- Wallet: Reserve credits (pre-auth before job execution)
CREATE OR REPLACE FUNCTION public.wallet_reserve(_user_id uuid, _amount numeric, _job_id uuid DEFAULT NULL, _description text DEFAULT 'Reserved')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _available numeric;
BEGIN
  SELECT available INTO _available FROM wallet_state WHERE user_id = _user_id FOR UPDATE;
  IF _available IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'NO_WALLET');
  END IF;
  IF _available < _amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'INSUFFICIENT_FUNDS', 'available', _available);
  END IF;

  UPDATE wallet_state SET
    available = available - _amount,
    staked = staked + _amount,
    snapshot_ts = now()
  WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_amount, 'reserve', _description, _job_id);

  RETURN jsonb_build_object('ok', true, 'reserved', _amount);
END;
$$;

-- Wallet: Settle (convert reservation to spend)
CREATE OR REPLACE FUNCTION public.wallet_settle(_user_id uuid, _amount numeric, _job_id uuid DEFAULT NULL, _description text DEFAULT 'Settled')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE wallet_state SET
    staked = GREATEST(0, staked - _amount),
    snapshot_ts = now()
  WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_amount, 'spend', _description, _job_id);

  RETURN jsonb_build_object('ok', true, 'settled', _amount);
END;
$$;

-- Wallet: Refund (return reserved credits)
CREATE OR REPLACE FUNCTION public.wallet_refund(_user_id uuid, _amount numeric, _job_id uuid DEFAULT NULL, _description text DEFAULT 'Refunded')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE wallet_state SET
    available = available + _amount,
    staked = GREATEST(0, staked - _amount),
    snapshot_ts = now()
  WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, _amount, 'refund', _description, _job_id);

  RETURN jsonb_build_object('ok', true, 'refunded', _amount);
END;
$$;

-- Wallet: Add credits (top-up or reward)
CREATE OR REPLACE FUNCTION public.wallet_add(_user_id uuid, _amount numeric, _description text DEFAULT 'Top-up')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Upsert wallet
  INSERT INTO wallet_state (user_id, available) VALUES (_user_id, _amount)
  ON CONFLICT (user_id) DO UPDATE SET
    available = wallet_state.available + _amount,
    snapshot_ts = now();

  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (_user_id, _amount, 'add', _description);

  RETURN jsonb_build_object('ok', true, 'added', _amount);
END;
$$;

-- Wallet: Transaction history
CREATE OR REPLACE FUNCTION public.wallet_history(_user_id uuid, _limit int DEFAULT 50)
RETURNS TABLE(id uuid, amount numeric, type text, description text, job_id uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT id, amount, type, description, job_id, created_at
  FROM credit_transactions
  WHERE user_id = _user_id
  ORDER BY created_at DESC
  LIMIT _limit;
$$;

-- ═══ Gamification: Award XP ═══
CREATE OR REPLACE FUNCTION public.award_xp(_user_id uuid, _amount int, _source text DEFAULT 'action', _source_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _daily_xp int;
  _total_xp int;
  _new_level int;
  _new_rank text;
  _capped_amount int;
  _daily_cap int := 200;
BEGIN
  -- Get current daily XP
  SELECT COALESCE(daily_xp_earned, 0) INTO _daily_xp
  FROM user_xp WHERE user_id = _user_id;

  IF _daily_xp IS NULL THEN
    -- Initialize user XP
    INSERT INTO user_xp (user_id, total_xp, level, rank_name, daily_xp_earned)
    VALUES (_user_id, 0, 1, 'Novice', 0);
    _daily_xp := 0;
  END IF;

  -- Cap at daily limit
  _capped_amount := LEAST(_amount, _daily_cap - _daily_xp);
  IF _capped_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'DAILY_CAP_REACHED');
  END IF;

  -- Award XP
  UPDATE user_xp SET
    total_xp = total_xp + _capped_amount,
    daily_xp_earned = daily_xp_earned + _capped_amount
  WHERE user_id = _user_id
  RETURNING total_xp INTO _total_xp;

  -- Calculate new level (quadratic: level N needs N² * 100 XP)
  _new_level := GREATEST(1, FLOOR(SQRT(_total_xp::numeric / 100)) + 1)::int;

  -- Determine rank
  _new_rank := CASE
    WHEN _new_level >= 50 THEN 'Legend'
    WHEN _new_level >= 40 THEN 'Virtuoso'
    WHEN _new_level >= 30 THEN 'Master'
    WHEN _new_level >= 20 THEN 'Expert'
    WHEN _new_level >= 15 THEN 'Artisan'
    WHEN _new_level >= 10 THEN 'Creator'
    WHEN _new_level >= 5 THEN 'Apprentice'
    ELSE 'Novice'
  END;

  UPDATE user_xp SET level = _new_level, rank_name = _new_rank
  WHERE user_id = _user_id;

  -- Log event
  INSERT INTO xp_events (user_id, amount, source, source_id)
  VALUES (_user_id, _capped_amount, _source, _source_id);

  RETURN jsonb_build_object(
    'ok', true,
    'awarded', _capped_amount,
    'total_xp', _total_xp,
    'level', _new_level,
    'rank', _new_rank
  );
END;
$$;

-- Gamification: Maintain streak
CREATE OR REPLACE FUNCTION public.maintain_streak(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _last_date date;
  _today date := CURRENT_DATE;
  _current int;
  _longest int;
BEGIN
  SELECT last_active_date::date, current_streak, longest_streak
  INTO _last_date, _current, _longest
  FROM user_streaks WHERE user_id = _user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date)
    VALUES (_user_id, 1, 1, _today);
    RETURN jsonb_build_object('streak', 1, 'new', true);
  END IF;

  IF _last_date = _today THEN
    RETURN jsonb_build_object('streak', _current, 'already_counted', true);
  ELSIF _last_date = _today - 1 THEN
    _current := _current + 1;
  ELSE
    _current := 1;
  END IF;

  _longest := GREATEST(_longest, _current);

  UPDATE user_streaks SET
    current_streak = _current,
    longest_streak = _longest,
    last_active_date = _today
  WHERE user_id = _user_id;

  RETURN jsonb_build_object('streak', _current, 'longest', _longest);
END;
$$;

-- ═══ Analytics: Event aggregation ═══
CREATE OR REPLACE FUNCTION public.analytics_summary(_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'unique_users', COUNT(DISTINCT user_id),
    'unique_sessions', COUNT(DISTINCT session_id),
    'top_events', (
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT event_name, COUNT(*) as count
        FROM analytics_events
        WHERE created_at > now() - (_days || ' days')::interval
        GROUP BY event_name
        ORDER BY count DESC
        LIMIT 10
      ) t
    ),
    'daily_breakdown', (
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT created_at::date as day, COUNT(*) as events, COUNT(DISTINCT user_id) as users
        FROM analytics_events
        WHERE created_at > now() - (_days || ' days')::interval
        GROUP BY created_at::date
        ORDER BY day DESC
        LIMIT _days
      ) t
    ),
    'top_pages', (
      SELECT jsonb_agg(row_to_json(t)) FROM (
        SELECT page_path, COUNT(*) as views
        FROM analytics_events
        WHERE page_path IS NOT NULL AND created_at > now() - (_days || ' days')::interval
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 10
      ) t
    )
  ) INTO _result
  FROM analytics_events
  WHERE created_at > now() - (_days || ' days')::interval;

  RETURN _result;
END;
$$;
