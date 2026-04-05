
-- ============================================================
-- GAMIFICATION / ECONOMY RLS LOCKDOWN
-- Drop all user-level INSERT, UPDATE, DELETE on challenge_progress,
-- user_streaks, vip_milestone_progress.
-- Also deduplicate SELECT policies across all gamification tables.
-- ============================================================

-- ===================== challenge_progress =====================
-- DROP dangerous INSERT policies
DROP POLICY IF EXISTS "Users can update own progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "challenge_progress_insert_own" ON public.challenge_progress;

-- DROP dangerous UPDATE policies
DROP POLICY IF EXISTS "Users can modify own progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "challenge_progress_update_own" ON public.challenge_progress;

-- DROP dangerous DELETE policy
DROP POLICY IF EXISTS "challenge_progress_delete_own" ON public.challenge_progress;

-- Deduplicate SELECT: keep one canonical
DROP POLICY IF EXISTS "Users can read own progress" ON public.challenge_progress;
DROP POLICY IF EXISTS "Users read own challenge progress" ON public.challenge_progress;
-- keep "challenge_progress_select_own"

-- ===================== user_streaks =====================
-- DROP dangerous INSERT
DROP POLICY IF EXISTS "user_streaks_insert_own" ON public.user_streaks;

-- DROP dangerous UPDATE
DROP POLICY IF EXISTS "user_streaks_update_own" ON public.user_streaks;

-- DROP dangerous DELETE
DROP POLICY IF EXISTS "user_streaks_delete_own" ON public.user_streaks;

-- Deduplicate SELECT: keep one canonical
DROP POLICY IF EXISTS "Users can read own streak" ON public.user_streaks;
-- keep "user_streaks_select_own" and leaderboard policy

-- ===================== vip_milestone_progress =====================
-- DROP dangerous INSERT
DROP POLICY IF EXISTS "vip_milestone_progress_insert_own" ON public.vip_milestone_progress;

-- DROP dangerous UPDATE
DROP POLICY IF EXISTS "vip_milestone_progress_update_own" ON public.vip_milestone_progress;

-- DROP dangerous DELETE
DROP POLICY IF EXISTS "vip_milestone_progress_delete_own" ON public.vip_milestone_progress;

-- Deduplicate SELECT: keep one canonical
DROP POLICY IF EXISTS "Users read own milestone progress" ON public.vip_milestone_progress;
-- keep "vip_milestone_progress_select_own"

-- ===================== Deduplicate SELECT on other tables =====================

-- user_xp: keep "user_xp_select_own" + leaderboard
DROP POLICY IF EXISTS "Users can read own XP" ON public.user_xp;

-- xp_transactions: keep "xp_transactions_select_own"
DROP POLICY IF EXISTS "Users can read own XP transactions" ON public.xp_transactions;

-- user_achievements: keep "user_achievements_select_own" + admin
DROP POLICY IF EXISTS "Authenticated read own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can read own achievements" ON public.user_achievements;

-- user_karma: keep "user_karma_select_own" + admin + leaderboard
DROP POLICY IF EXISTS "Users read own karma" ON public.user_karma;

-- token_balances: keep "token_balances_select_own"
DROP POLICY IF EXISTS "Users read own token balance" ON public.token_balances;

-- token_transactions: keep "token_transactions_select_own"
DROP POLICY IF EXISTS "Users read own token transactions" ON public.token_transactions;

-- credit_transactions: keep "credit_transactions_select_own" + admin
DROP POLICY IF EXISTS "Users can read own transactions" ON public.credit_transactions;

-- user_credits: keep "user_credits_select_own" + admin
DROP POLICY IF EXISTS "Users can read own credits" ON public.user_credits;

-- user_streaks: keep leaderboard + canonical
-- (already handled above)
