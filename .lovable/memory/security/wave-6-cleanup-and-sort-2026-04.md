---
name: Wave-6 Alert Cleanup & Sort 2026-04
description: cleanup_resolved_admin_alerts cron daily 03:17 UTC purges resolved >30d. Client-side severity DESC semantic sort (critical→low) with unacked-first tiebreak.
type: feature
---

# Wave 6 — Alert Hygiene

## Cleanup Cron
- `public.cleanup_resolved_admin_alerts()` SECURITY DEFINER, service_role only
- Schedule: `17 3 * * *` (daily 03:17 UTC) via pg_cron job `cleanup-resolved-admin-alerts-daily`
- Deletes `admin_alerts WHERE resolved_at < now() - 30 days`

## Client Sort (useFinOps.ts)
SQL `ORDER BY severity` was alphabetical (critical < high < low < medium = wrong).
Now: severity rank (critical=4, high=3, medium=2, low=1) DESC, then unacknowledged first, then last_seen DESC.

## AlertCenterTab
Already renders sorted list; no UI change needed — feeds from `useFinOps().alerts`.
