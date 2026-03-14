
-- Fix overly permissive INSERT on decision_ledger
DROP POLICY "System can insert ledger entries" ON public.decision_ledger;

CREATE POLICY "Authenticated users insert own ledger entries"
  ON public.decision_ledger FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
