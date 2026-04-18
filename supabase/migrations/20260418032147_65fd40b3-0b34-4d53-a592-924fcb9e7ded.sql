-- Wave 6: Cleanup cron for resolved alerts (>30d) + sort helper
-- Purges resolved alerts older than 30 days to keep admin_alerts lean.

CREATE OR REPLACE FUNCTION public.cleanup_resolved_admin_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.admin_alerts
  WHERE resolved_at IS NOT NULL
    AND resolved_at < now() - interval '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_resolved_admin_alerts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_resolved_admin_alerts() TO service_role;

-- Schedule daily at 03:17 UTC
SELECT cron.schedule(
  'cleanup-resolved-admin-alerts-daily',
  '17 3 * * *',
  $$ SELECT public.cleanup_resolved_admin_alerts(); $$
);