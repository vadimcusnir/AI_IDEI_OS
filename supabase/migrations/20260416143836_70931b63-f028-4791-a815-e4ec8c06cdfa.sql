
-- Remove public SELECT policies that expose internal data
DROP POLICY IF EXISTS "Anyone authenticated can read security policies" ON public.service_security_policies;
DROP POLICY IF EXISTS "Anyone authenticated can read economic contracts" ON public.service_economic_contracts;
DROP POLICY IF EXISTS "Anyone authenticated can read retry configs" ON public.service_retry_configs;
