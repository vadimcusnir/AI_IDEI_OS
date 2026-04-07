-- 1. Add cross-user read policies on base tables

CREATE POLICY "Authenticated read all xp for leaderboard"
ON public.user_xp FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated read all karma for leaderboard"
ON public.user_karma FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated read all streaks for leaderboard"
ON public.user_streaks FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated read basic profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated read capacity state"
ON public.capacity_state FOR SELECT TO authenticated
USING (true);

-- 2. Recreate all views with security_invoker=on

DROP VIEW IF EXISTS public.leaderboard_xp;
CREATE VIEW public.leaderboard_xp WITH (security_invoker=on) AS
SELECT user_id, total_xp, level, rank_name FROM public.user_xp;

DROP VIEW IF EXISTS public.leaderboard_karma;
CREATE VIEW public.leaderboard_karma WITH (security_invoker=on) AS
SELECT user_id, karma FROM public.user_karma;

DROP VIEW IF EXISTS public.leaderboard_streaks;
CREATE VIEW public.leaderboard_streaks WITH (security_invoker=on) AS
SELECT user_id, current_streak, longest_streak FROM public.user_streaks;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker=on) AS
SELECT id, user_id, username, avatar_url, bio, display_name, created_at
FROM public.profiles;

DROP VIEW IF EXISTS public.capacity_state_public;
CREATE VIEW public.capacity_state_public WITH (security_invoker=on) AS
SELECT id, utilization, queue_depth, premium_only_mode, updated_at
FROM public.capacity_state;

DROP VIEW IF EXISTS public.neuron_lifecycle_pricing;
CREATE VIEW public.neuron_lifecycle_pricing WITH (security_invoker=on) AS
SELECT
  id AS neuron_id, lifecycle, credits_cost AS base_cost,
  CASE lifecycle
    WHEN 'ingested' THEN 1.0 WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8 WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END AS lifecycle_multiplier,
  round(credits_cost * CASE lifecycle
    WHEN 'ingested' THEN 1.0 WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8 WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END) AS adjusted_cost
FROM public.neurons;

DROP VIEW IF EXISTS public.public_contributions;
CREATE VIEW public.public_contributions WITH (security_invoker=on) AS
SELECT id, title, content, contribution_type, tags, word_count,
       status, neurons_awarded, created_at, updated_at
FROM public.content_contributions
WHERE status = 'approved';

-- 3. Grant SELECT on all views
GRANT SELECT ON public.leaderboard_xp TO authenticated, anon;
GRANT SELECT ON public.leaderboard_karma TO authenticated, anon;
GRANT SELECT ON public.leaderboard_streaks TO authenticated, anon;
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.capacity_state_public TO authenticated, anon;
GRANT SELECT ON public.neuron_lifecycle_pricing TO authenticated, anon;
GRANT SELECT ON public.public_contributions TO authenticated, anon;