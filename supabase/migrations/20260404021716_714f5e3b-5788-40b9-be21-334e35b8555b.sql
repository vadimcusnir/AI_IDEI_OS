
-- Allow service-level inserts via SECURITY DEFINER functions (the edge function uses service role)
CREATE POLICY "Service can insert billing log"
  ON public.storage_billing_log FOR INSERT
  TO service_role WITH CHECK (true);
