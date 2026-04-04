
ALTER TABLE public.credit_transactions ADD COLUMN IF NOT EXISTS service_key text;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_service_key ON public.credit_transactions(service_key) WHERE service_key IS NOT NULL;
