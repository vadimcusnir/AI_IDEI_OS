
-- ═══════════════════════════════════════════
-- GAMIFICATION SYSTEM — Full Schema
-- ═══════════════════════════════════════════

-- 1. User XP & Level state (SSOT)
CREATE TABLE public.user_xp (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  rank_name text NOT NULL DEFAULT 'Novice',
  daily_xp_earned integer NOT NULL DEFAULT 0,
  daily_xp_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own XP" ON public.user_xp FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can read others XP for leaderboard" ON public.user_xp FOR SELECT TO authenticated USING (true);

-- 2. Streak tracking
CREATE TABLE public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  grace_period_used boolean NOT NULL DEFAULT false,
  freeze_tokens integer NOT NULL DEFAULT 1,
  freeze_tokens_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streak" ON public.user_streaks FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can read others streak for leaderboard" ON public.user_streaks FOR SELECT TO authenticated USING (true);

-- 3. XP transaction log (append-only audit trail)
CREATE TABLE public.xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  source text NOT NULL,
  description text NOT NULL DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own XP transactions" ON public.xp_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_xp_transactions_user ON public.xp_transactions (user_id, created_at DESC);

-- 4. Daily challenges
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  challenge_type text NOT NULL DEFAULT 'individual',
  goal_metric text NOT NULL,
  goal_value integer NOT NULL DEFAULT 1,
  xp_reward integer NOT NULL DEFAULT 50,
  active_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active challenges" ON public.daily_challenges FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage challenges" ON public.daily_challenges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Challenge progress tracking
CREATE TABLE public.challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  current_value integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.challenge_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own progress" ON public.challenge_progress FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can modify own progress" ON public.challenge_progress FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ═══════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════

-- Award XP with daily cap enforcement
CREATE OR REPLACE FUNCTION public.award_xp(
  _user_id uuid,
  _amount integer,
  _source text,
  _description text DEFAULT '',
  _bypass_cap boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    jsonb_build_object('original_amount', _amount, 'capped', _amount != _effective_amount));
  
  -- Notify on level up
  IF _leveled_up THEN
    INSERT INTO notifications (user_id, type, title, message, link, meta)
    VALUES (_user_id, 'level_up', '🎉 Level Up! ' || _new_rank,
      'You reached Level ' || _new_level || '!', '/profile',
      jsonb_build_object('level', _new_level, 'rank', _new_rank, 'total_xp', _new_total));
  END IF;
  
  RETURN jsonb_build_object(
    'awarded', _effective_amount,
    'total_xp', _new_total,
    'level', _new_level,
    'rank', _new_rank,
    'leveled_up', _leveled_up
  );
END;
$$;

-- Record daily activity for streak
CREATE OR REPLACE FUNCTION public.record_daily_activity(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _streak RECORD;
  _today date := CURRENT_DATE;
  _days_since integer;
BEGIN
  -- Upsert streak row
  INSERT INTO user_streaks (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  
  SELECT * INTO _streak FROM user_streaks WHERE user_id = _user_id FOR UPDATE;
  
  -- Already active today
  IF _streak.last_active_date = _today THEN
    RETURN jsonb_build_object('streak', _streak.current_streak, 'already_recorded', true);
  END IF;
  
  IF _streak.last_active_date IS NULL THEN
    _days_since := 999;
  ELSE
    _days_since := _today - _streak.last_active_date;
  END IF;
  
  IF _days_since = 1 THEN
    -- Consecutive day — extend streak
    UPDATE user_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_active_date = _today,
      grace_period_used = false,
      updated_at = now()
    WHERE user_id = _user_id;
  ELSIF _days_since <= 4 AND NOT _streak.grace_period_used THEN
    -- Within 3-day grace period
    UPDATE user_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_active_date = _today,
      grace_period_used = true,
      updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    -- Streak broken — reset
    UPDATE user_streaks SET
      current_streak = 1,
      last_active_date = _today,
      grace_period_used = false,
      updated_at = now()
    WHERE user_id = _user_id;
  END IF;
  
  SELECT * INTO _streak FROM user_streaks WHERE user_id = _user_id;
  
  -- Award streak XP: +5 per streak day, capped at +50
  PERFORM award_xp(_user_id, LEAST(5 * _streak.current_streak, 50), 'streak', 'Daily streak bonus: day ' || _streak.current_streak);
  
  RETURN jsonb_build_object(
    'streak', _streak.current_streak,
    'longest', _streak.longest_streak,
    'grace_used', _streak.grace_period_used
  );
END;
$$;

-- Auto-initialize gamification on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_xp (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_streaks (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_gamification
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_gamification();

-- Award XP on neuron creation
CREATE OR REPLACE FUNCTION public.award_xp_on_neuron()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM award_xp(NEW.author_id, 25, 'neuron_created', 'Created neuron: ' || NEW.title);
  PERFORM record_daily_activity(NEW.author_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_neuron_created_xp
  AFTER INSERT ON public.neurons
  FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_neuron();

-- Award XP on job completion
CREATE OR REPLACE FUNCTION public.award_xp_on_job_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM award_xp(NEW.author_id, 15, 'job_completed', 'Completed: ' || NEW.worker_type);
    PERFORM record_daily_activity(NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_job_completed_xp
  AFTER UPDATE ON public.neuron_jobs
  FOR EACH ROW EXECUTE FUNCTION public.award_xp_on_job_complete();
