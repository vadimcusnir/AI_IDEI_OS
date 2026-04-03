
-- T1.2: Add indexing dimensions to os_otos
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS intent text DEFAULT 'convert';
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS complexity text DEFAULT 'L1';
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS impact_band text DEFAULT 'medium';
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS index_code text;
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS score_total numeric DEFAULT 0;
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS score_conversion_power numeric DEFAULT 0;
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS score_frequency numeric DEFAULT 0;
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS score_perceived_value numeric DEFAULT 0;
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS score_complexity numeric DEFAULT 0;
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS score_leverage numeric DEFAULT 0;
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS score_tier text DEFAULT 'B';
ALTER TABLE public.os_otos ADD COLUMN IF NOT EXISTS neurons_cost integer DEFAULT 29;

-- T1.4: Add bundle pricing to os_mms
ALTER TABLE public.os_mms ADD COLUMN IF NOT EXISTS bundle_discount_pct integer DEFAULT 20;
ALTER TABLE public.os_mms ADD COLUMN IF NOT EXISTS bundle_price_neurons integer DEFAULT 0;
ALTER TABLE public.os_mms ADD COLUMN IF NOT EXISTS score_p numeric DEFAULT 0;
ALTER TABLE public.os_mms ADD COLUMN IF NOT EXISTS score_s numeric DEFAULT 0;
ALTER TABLE public.os_mms ADD COLUMN IF NOT EXISTS score_c numeric DEFAULT 0;
ALTER TABLE public.os_mms ADD COLUMN IF NOT EXISTS score_total numeric DEFAULT 0;
ALTER TABLE public.os_mms ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_otos_intent_domain ON public.os_otos(intent, domain);
CREATE INDEX IF NOT EXISTS idx_otos_score_tier ON public.os_otos(score_tier);
CREATE INDEX IF NOT EXISTS idx_otos_index_code ON public.os_otos(index_code);
