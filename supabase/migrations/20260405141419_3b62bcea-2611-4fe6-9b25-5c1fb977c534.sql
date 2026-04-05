
-- WALLET_STATE: Drop dangerous write policies
DROP POLICY IF EXISTS "System inserts wallet" ON public.wallet_state;
DROP POLICY IF EXISTS "wallet_state_insert_own" ON public.wallet_state;
DROP POLICY IF EXISTS "wallet_state_update_own" ON public.wallet_state;
DROP POLICY IF EXISTS "wallet_state_delete_own" ON public.wallet_state;

-- Deduplicate SELECT
DROP POLICY IF EXISTS "Users read own wallet" ON public.wallet_state;

-- Add admin read
CREATE POLICY "admin_read_wallet_state"
ON public.wallet_state FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- BILLING_CONFIG: Drop broad SELECT
DROP POLICY IF EXISTS "Anyone can read billing_config" ON public.billing_config;

-- Add admin-only policies
CREATE POLICY "admin_read_billing_config"
ON public.billing_config FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admin_manage_billing_config"
ON public.billing_config FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
