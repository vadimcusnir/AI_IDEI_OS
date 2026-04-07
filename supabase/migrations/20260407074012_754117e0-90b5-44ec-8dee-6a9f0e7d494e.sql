-- 1. Recreate views with security_invoker=on (satisfies linter)
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

GRANT SELECT ON public.leaderboard_xp TO authenticated, anon;
GRANT SELECT ON public.leaderboard_karma TO authenticated, anon;
GRANT SELECT ON public.leaderboard_streaks TO authenticated, anon;
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.capacity_state_public TO authenticated, anon;

-- 2. Create SECURITY DEFINER functions for cross-user reads (recommended pattern)

CREATE OR REPLACE FUNCTION public.get_leaderboard_xp(lim int DEFAULT 50)
RETURNS TABLE(user_id uuid, total_xp int, level int, rank_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, total_xp, level, rank_name FROM public.user_xp ORDER BY total_xp DESC LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_karma(lim int DEFAULT 50)
RETURNS TABLE(user_id uuid, karma int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, karma FROM public.user_karma ORDER BY karma DESC LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_streaks(lim int DEFAULT 50)
RETURNS TABLE(user_id uuid, current_streak int, longest_streak int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, current_streak, longest_streak FROM public.user_streaks ORDER BY longest_streak DESC LIMIT lim;
$$;

CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE(id uuid, user_id uuid, username text, avatar_url text, bio text, display_name text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, user_id, username, avatar_url, bio, display_name, created_at
  FROM public.profiles WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_capacity_status()
RETURNS TABLE(utilization numeric, queue_depth int, premium_only_mode boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT utilization, queue_depth, premium_only_mode FROM public.capacity_state LIMIT 1;
$$;