
-- Drop user-level UPDATE policies on economy/gamification ledger tables
DROP POLICY IF EXISTS "xp_transactions_update_own" ON public.xp_transactions;
DROP POLICY IF EXISTS "token_transactions_update_own" ON public.token_transactions;
DROP POLICY IF EXISTS "user_achievements_update_own" ON public.user_achievements;
DROP POLICY IF EXISTS "user_karma_update_own" ON public.user_karma;
DROP POLICY IF EXISTS "user_xp_update_own" ON public.user_xp;

-- Drop user-level INSERT on certifications (self-issuance)
DROP POLICY IF EXISTS "user_certifications_insert_own" ON public.user_certifications;
