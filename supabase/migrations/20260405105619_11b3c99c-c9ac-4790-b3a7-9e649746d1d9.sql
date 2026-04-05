-- Drop permissive user-level INSERT policies on economy/gamification tables
-- These allowed users to directly insert arbitrary achievements, XP, karma, and token transactions

DROP POLICY "user_achievements_insert_own" ON public.user_achievements;
DROP POLICY "xp_transactions_insert_own" ON public.xp_transactions;
DROP POLICY "user_xp_insert_own" ON public.user_xp;
DROP POLICY "token_transactions_insert_own" ON public.token_transactions;
DROP POLICY "user_karma_insert_own" ON public.user_karma;