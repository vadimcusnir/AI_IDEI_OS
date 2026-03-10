-- Allow admins to read all credit transactions for the Logs tab
CREATE POLICY "Admins can read all transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert credit transactions for credit adjustments
CREATE POLICY "Admins can insert transactions for any user"
ON public.credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all user_credits for credit adjustments
CREATE POLICY "Admins can read all user credits"
ON public.user_credits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any user credits
CREATE POLICY "Admins can update all user credits"
ON public.user_credits
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));