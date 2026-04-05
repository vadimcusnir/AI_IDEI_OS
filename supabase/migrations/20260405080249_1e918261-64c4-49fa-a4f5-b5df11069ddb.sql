
-- =============================================
-- FIX 1: PRIVILEGE ESCALATION - user_roles
-- Remove user self-update and self-delete on roles
-- =============================================
DROP POLICY IF EXISTS "user_roles_update_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_own" ON public.user_roles;

-- =============================================
-- FIX 2: FINANCIAL RECORD TAMPERING - credit_transactions
-- Make transactions append-only (no user update/delete)
-- =============================================
DROP POLICY IF EXISTS "credit_transactions_update_own" ON public.credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_delete_own" ON public.credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert_own" ON public.credit_transactions;

-- =============================================
-- FIX 3: SELF-CREDITING - user_credits
-- Remove direct user write access (handled by SECURITY DEFINER functions)
-- =============================================
DROP POLICY IF EXISTS "user_credits_insert_own" ON public.user_credits;
DROP POLICY IF EXISTS "user_credits_update_own" ON public.user_credits;

-- =============================================
-- FIX 4: TOKEN BALANCE FRAUD - token_balances
-- Remove direct user write access
-- =============================================
DROP POLICY IF EXISTS "token_balances_insert_own" ON public.token_balances;
DROP POLICY IF EXISTS "token_balances_update_own" ON public.token_balances;

-- =============================================
-- FIX 5: PLAN TEMPLATE TAMPERING - agent_plan_templates
-- Replace USING(true) with admin-only update
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can update own templates" ON public.agent_plan_templates;
CREATE POLICY "Admins can update plan templates"
  ON public.agent_plan_templates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- FIX 6: NOTEBOOK FILES OWNERSHIP - storage
-- Replace permissive policies with ownership checks
-- =============================================
DROP POLICY IF EXISTS "Users can read notebook files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete notebook files" ON storage.objects;

CREATE POLICY "Users can read own notebook files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notebook-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own notebook files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notebook-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
