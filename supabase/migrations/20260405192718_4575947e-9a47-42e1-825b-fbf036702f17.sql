ALTER VIEW public.user_integrations_safe SET (security_invoker = on);
ALTER VIEW public.leaderboard_xp SET (security_invoker = on);
ALTER VIEW public.leaderboard_karma SET (security_invoker = on);
ALTER VIEW public.leaderboard_streaks SET (security_invoker = on);