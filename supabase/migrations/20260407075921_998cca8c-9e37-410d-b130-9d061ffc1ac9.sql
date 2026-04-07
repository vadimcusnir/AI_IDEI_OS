-- 1. Convert permissive false policies to RESTRICTIVE

-- email_send_log
DROP POLICY IF EXISTS "Block all client access to send log" ON public.email_send_log;
CREATE POLICY "Restrictive block send log"
ON public.email_send_log AS RESTRICTIVE FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

-- suppressed_emails
DROP POLICY IF EXISTS "Block all client access to suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Restrictive block suppressed emails"
ON public.suppressed_emails AS RESTRICTIVE FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

-- email_unsubscribe_tokens
DROP POLICY IF EXISTS "Block all client access to unsub tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Restrictive block unsub tokens"
ON public.email_unsubscribe_tokens AS RESTRICTIVE FOR ALL TO authenticated, anon
USING (false) WITH CHECK (false);

-- 2. Block push_subscriptions SELECT (server-side only delivery)
DROP POLICY IF EXISTS "push_subscriptions_select_own" ON public.push_subscriptions;