-- ═══════════════════════════════════════════════════════════════
-- P0 Wave-2 Hardening: F-010, F-011, F-012, F-013
-- Source: audit1.md / plan.md
-- ═══════════════════════════════════════════════════════════════

-- ─── F-011: prevent negative balances on user_credits ───
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_credits'::regclass
      AND conname = 'user_credits_balance_non_negative'
  ) THEN
    ALTER TABLE public.user_credits
      ADD CONSTRAINT user_credits_balance_non_negative
      CHECK (balance >= 0) NOT VALID;
    -- VALIDATE later (skip if any legacy negative rows; we leave NOT VALID safe)
    BEGIN
      ALTER TABLE public.user_credits VALIDATE CONSTRAINT user_credits_balance_non_negative;
    EXCEPTION WHEN check_violation THEN
      RAISE WARNING 'user_credits has rows with balance<0; constraint left NOT VALID. Backfill required.';
    END;
  END IF;
END $$;

-- ─── F-010: idempotency uniqueness on credit_transactions ───
-- Add column if it does not exist (safe even if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='credit_transactions' AND column_name='idempotency_key'
  ) THEN
    ALTER TABLE public.credit_transactions ADD COLUMN idempotency_key TEXT;
  END IF;
END $$;

-- Partial unique index — allows NULLs for legacy rows, enforces uniqueness for new ones
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_idempotency_key_uniq
  ON public.credit_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ─── F-012: lock translations to authenticated read-only ───
-- Replace the open "true" SELECT policy with an authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can read translations" ON public.translations;
CREATE POLICY "translations_authenticated_read"
  ON public.translations FOR SELECT
  TO authenticated
  USING (true);

-- ─── F-013: notifications insert must target the calling user OR admin ───
DROP POLICY IF EXISTS notifications_insert_service_only ON public.notifications;
CREATE POLICY notifications_insert_self_or_admin
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
-- Service-role bypasses RLS, so edge functions using SUPABASE_SERVICE_ROLE_KEY
-- can still create system notifications without restriction.

COMMENT ON CONSTRAINT user_credits_balance_non_negative ON public.user_credits IS
  'F-011: prevent negative balances. Audit hard finding.';
COMMENT ON INDEX public.credit_transactions_idempotency_key_uniq IS
  'F-010: enforce idempotency uniqueness for retried Stripe / billing events.';