-- ═══ 1. FIX EMAIL TABLES: Drop bypassable auth.role() policies ═══

-- email_send_log
DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;

CREATE POLICY "Block all client access to send log"
ON public.email_send_log FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

-- email_unsubscribe_tokens
DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;

CREATE POLICY "Block all client access to unsub tokens"
ON public.email_unsubscribe_tokens FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

-- suppressed_emails
DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;

CREATE POLICY "Block all client access to suppressed emails"
ON public.suppressed_emails FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

-- ═══ 2. RESTRICT PROFILES: own-data only (public_profiles view handles cross-user reads) ═══

DROP POLICY IF EXISTS "Authenticated read basic profiles" ON public.profiles;

CREATE POLICY "Users read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- ═══ 3. RESTRICT CAPACITY_STATE: admin-only (capacity_state_public view handles user reads) ═══

DROP POLICY IF EXISTS "Authenticated read capacity state" ON public.capacity_state;

-- ═══ 4. RESTRICT LEADERBOARD TABLES: own-data only (leaderboard views handle cross-user) ═══

DROP POLICY IF EXISTS "Authenticated read all xp for leaderboard" ON public.user_xp;
CREATE POLICY "Users read own xp"
ON public.user_xp FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated read all karma for leaderboard" ON public.user_karma;
CREATE POLICY "Users read own karma"
ON public.user_karma FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated read all streaks for leaderboard" ON public.user_streaks;
CREATE POLICY "Users read own streaks"
ON public.user_streaks FOR SELECT TO authenticated
USING (user_id = auth.uid());