-- Allow anonymous inserts for pre-session auth telemetry only.
-- Strict allowlist: event_name must be a known auth event AND user_id must be null.
CREATE POLICY "anon_insert_pre_session_auth_telemetry"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL
  AND event_name IN (
    'auth_attempt_started',
    'provider_redirect_started',
    'callback_received',
    'code_exchange_failed',
    'session_restore_failed',
    'bad_jwt_recovered',
    'auth_error_normalized',
    'guard_redirect_triggered',
    'logout_completed'
  )
);

-- Allow admins to read all auth telemetry (the AuthFlowMonitor component query).
-- Existing "Admins read all events" already covers this, but ensure anon-inserted
-- rows (user_id IS NULL) are visible to admins.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.analytics_events'::regclass
      AND polname = 'admins_select_anon_auth_events'
  ) THEN
    CREATE POLICY "admins_select_anon_auth_events"
    ON public.analytics_events
    FOR SELECT
    TO authenticated
    USING (
      user_id IS NULL
      AND has_role(auth.uid(), 'admin'::app_role)
    );
  END IF;
END $$;