
-- 1. CRITICAL: Block anon INSERT on login_attempts
CREATE POLICY "block_anon_insert_login_attempts"
ON public.login_attempts
AS RESTRICTIVE
FOR INSERT
TO anon
WITH CHECK (false);

-- 2. Block regular user INSERT on credit_transactions (defense in depth)
CREATE POLICY "block_user_insert_credit_transactions"
ON public.credit_transactions
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Block user writes on gamification tables (server-managed only)
CREATE POLICY "block_user_write_user_xp"
ON public.user_xp
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "block_user_write_user_karma"
ON public.user_karma
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "block_user_write_user_streaks"
ON public.user_streaks
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "block_user_write_challenge_progress"
ON public.challenge_progress
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Fix mutable search_path on email functions
ALTER FUNCTION public.delete_email SET search_path = public;
ALTER FUNCTION public.enqueue_email SET search_path = public;
ALTER FUNCTION public.move_to_dlq SET search_path = public;
ALTER FUNCTION public.read_email_batch SET search_path = public;
