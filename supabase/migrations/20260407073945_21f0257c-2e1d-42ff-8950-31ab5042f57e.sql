-- Recreate views WITHOUT security_invoker (defaults to DEFINER mode)
-- This allows views to read all rows while base tables are locked down

DROP VIEW IF EXISTS public.leaderboard_xp;
CREATE VIEW public.leaderboard_xp AS
SELECT user_id, total_xp, level, rank_name FROM public.user_xp;

DROP VIEW IF EXISTS public.leaderboard_karma;
CREATE VIEW public.leaderboard_karma AS
SELECT user_id, karma FROM public.user_karma;

DROP VIEW IF EXISTS public.leaderboard_streaks;
CREATE VIEW public.leaderboard_streaks AS
SELECT user_id, current_streak, longest_streak FROM public.user_streaks;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT id, user_id, username, avatar_url, bio, display_name, created_at
FROM public.profiles;

DROP VIEW IF EXISTS public.capacity_state_public;
CREATE VIEW public.capacity_state_public AS
SELECT id, utilization, queue_depth, premium_only_mode, updated_at
FROM public.capacity_state;

-- Re-grant SELECT
GRANT SELECT ON public.leaderboard_xp TO authenticated, anon;
GRANT SELECT ON public.leaderboard_karma TO authenticated, anon;
GRANT SELECT ON public.leaderboard_streaks TO authenticated, anon;
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.capacity_state_public TO authenticated, anon;