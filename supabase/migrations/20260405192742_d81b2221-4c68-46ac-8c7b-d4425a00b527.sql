-- Leaderboard views intentionally use security_definer to allow cross-user reads of minimal columns
ALTER VIEW public.leaderboard_xp SET (security_invoker = off);
ALTER VIEW public.leaderboard_karma SET (security_invoker = off);
ALTER VIEW public.leaderboard_streaks SET (security_invoker = off);