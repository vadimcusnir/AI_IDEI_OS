
-- 1. Economic Contract per service
CREATE TABLE IF NOT EXISTS public.service_economic_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  base_neurons INTEGER NOT NULL DEFAULT 0,
  tier_multipliers JSONB NOT NULL DEFAULT '{"starter":1,"pro":0.85,"vip":0.7,"enterprise":0.5}'::jsonb,
  margin_target NUMERIC NOT NULL DEFAULT 0.3,
  refund_policy TEXT NOT NULL DEFAULT 'full_on_failure',
  revenue_split_pct NUMERIC NOT NULL DEFAULT 0,
  currency_model TEXT NOT NULL DEFAULT 'neurons',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_economic_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read economic contracts" ON public.service_economic_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage economic contracts" ON public.service_economic_contracts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Verdict / scoring config
CREATE TABLE IF NOT EXISTS public.service_verdict_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  scoring_dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  minimum_pass_score NUMERIC NOT NULL DEFAULT 60,
  auto_approve_threshold NUMERIC NOT NULL DEFAULT 80,
  human_review_required BOOLEAN NOT NULL DEFAULT false,
  verdict_schema JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_verdict_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read verdict configs" ON public.service_verdict_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage verdict configs" ON public.service_verdict_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Access rules
CREATE TABLE IF NOT EXISTS public.service_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  min_tier TEXT NOT NULL DEFAULT 'starter',
  required_certifications TEXT[] DEFAULT '{}',
  geo_restrictions JSONB DEFAULT '{}'::jsonb,
  cooldown_seconds INTEGER NOT NULL DEFAULT 0,
  max_daily_uses INTEGER NOT NULL DEFAULT 100,
  requires_kyc BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_access_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read access rules" ON public.service_access_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage access rules" ON public.service_access_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. QA config
CREATE TABLE IF NOT EXISTS public.service_qa_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  qa_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_word_count INTEGER NOT NULL DEFAULT 100,
  required_sections TEXT[] DEFAULT '{}',
  plagiarism_check BOOLEAN NOT NULL DEFAULT false,
  tone_check BOOLEAN NOT NULL DEFAULT false,
  auto_regenerate_on_fail BOOLEAN NOT NULL DEFAULT false,
  max_regenerations INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_qa_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read QA configs" ON public.service_qa_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage QA configs" ON public.service_qa_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Security policies
CREATE TABLE IF NOT EXISTS public.service_security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  input_sanitization_level TEXT NOT NULL DEFAULT 'strict',
  output_filtering BOOLEAN NOT NULL DEFAULT true,
  prompt_injection_guard BOOLEAN NOT NULL DEFAULT true,
  pii_detection BOOLEAN NOT NULL DEFAULT false,
  audit_log_required BOOLEAN NOT NULL DEFAULT true,
  rate_limit_override JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_security_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read security policies" ON public.service_security_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage security policies" ON public.service_security_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Retry / fallback config
CREATE TABLE IF NOT EXISTS public.service_retry_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  max_retries INTEGER NOT NULL DEFAULT 2,
  retry_delay_ms INTEGER NOT NULL DEFAULT 1000,
  fallback_model TEXT,
  fallback_service_key TEXT,
  timeout_seconds INTEGER NOT NULL DEFAULT 120,
  circuit_breaker_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_retry_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read retry configs" ON public.service_retry_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage retry configs" ON public.service_retry_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Template compliance tracking
CREATE TABLE IF NOT EXISTS public.service_template_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key TEXT NOT NULL UNIQUE,
  sections_completed JSONB NOT NULL DEFAULT '{
    "manifest": false, "economic_contract": false, "verdict_system": false,
    "access_control": false, "pipeline": false, "qa_config": false,
    "security_policy": false, "retry_config": false, "prompt_vault": false,
    "dependencies": false, "preview_config": false, "audit_trail": false
  }'::jsonb,
  compliance_score INTEGER NOT NULL DEFAULT 0,
  last_validated_at TIMESTAMPTZ,
  validator_version TEXT DEFAULT '1.0',
  issues JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_template_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read compliance" ON public.service_template_compliance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage compliance" ON public.service_template_compliance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_economic_contracts_key ON public.service_economic_contracts(service_key);
CREATE INDEX IF NOT EXISTS idx_verdict_configs_key ON public.service_verdict_configs(service_key);
CREATE INDEX IF NOT EXISTS idx_access_rules_key ON public.service_access_rules(service_key);
CREATE INDEX IF NOT EXISTS idx_qa_configs_key ON public.service_qa_configs(service_key);
CREATE INDEX IF NOT EXISTS idx_security_policies_key ON public.service_security_policies(service_key);
CREATE INDEX IF NOT EXISTS idx_retry_configs_key ON public.service_retry_configs(service_key);
CREATE INDEX IF NOT EXISTS idx_template_compliance_key ON public.service_template_compliance(service_key);

-- Updated_at triggers
CREATE TRIGGER update_service_economic_contracts_updated_at BEFORE UPDATE ON public.service_economic_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_verdict_configs_updated_at BEFORE UPDATE ON public.service_verdict_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_access_rules_updated_at BEFORE UPDATE ON public.service_access_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_qa_configs_updated_at BEFORE UPDATE ON public.service_qa_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_security_policies_updated_at BEFORE UPDATE ON public.service_security_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_retry_configs_updated_at BEFORE UPDATE ON public.service_retry_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_template_compliance_updated_at BEFORE UPDATE ON public.service_template_compliance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
