-- Wave 7: notified_at column + admin emails RPC + cron

ALTER TABLE public.admin_alerts
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_admin_alerts_critical_unnotified
  ON public.admin_alerts (created_at)
  WHERE severity = 'critical' AND notified_at IS NULL AND resolved_at IS NULL AND acknowledged_at IS NULL;

-- Return admin emails (security definer, only callable by service role / admins)
CREATE OR REPLACE FUNCTION public.get_admin_emails()
RETURNS TABLE(email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.email::text
  FROM auth.users u
  INNER JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE ur.role = 'admin'
    AND u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_admin_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_emails() TO service_role;

-- Cron job: notify-critical-alerts every 5 minutes
DO $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  SELECT decrypted_secret INTO v_supabase_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE NOTICE 'Vault secrets missing — cron job not scheduled. Run setup_email_infra first.';
    RETURN;
  END IF;

  -- Unschedule if exists
  PERFORM cron.unschedule('notify-critical-alerts')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-critical-alerts');

  PERFORM cron.schedule(
    'notify-critical-alerts',
    '*/5 * * * *',
    format($cron$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || %L),
        body := '{}'::jsonb
      ) AS request_id;
    $cron$, v_supabase_url || '/functions/v1/notify-critical-alerts', v_service_key)
  );
END $$;