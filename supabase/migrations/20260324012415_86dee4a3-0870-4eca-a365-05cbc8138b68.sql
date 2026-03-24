
-- Financialization Layer: tokenization, performance market, certifications, intelligence

-- Asset tokenization — fractional ownership
CREATE TABLE public.asset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.knowledge_assets(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL,
  total_units integer NOT NULL DEFAULT 100,
  units_sold integer DEFAULT 0,
  price_per_unit integer NOT NULL DEFAULT 200,
  revenue_share_pct numeric(5,2) DEFAULT 10,
  status text DEFAULT 'active',
  total_revenue bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Token ownership ledger
CREATE TABLE public.token_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.asset_tokens(id) ON DELETE CASCADE,
  holder_id uuid NOT NULL,
  units integer NOT NULL DEFAULT 1,
  purchase_price integer NOT NULL DEFAULT 0,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(token_id, holder_id)
);

-- Performance listings — sell results not content
CREATE TABLE public.performance_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.knowledge_assets(id),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  performance_type text DEFAULT 'revenue',
  proof_data jsonb DEFAULT '{}',
  revenue_generated numeric(12,2) DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  price_neurons integer DEFAULT 2000,
  total_sales integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Certifications
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  level text DEFAULT 'creator',
  requirements jsonb DEFAULT '{}',
  badge_icon text DEFAULT 'award',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User certifications
CREATE TABLE public.user_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cert_id uuid NOT NULL REFERENCES public.certifications(id),
  awarded_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  UNIQUE(user_id, cert_id)
);

-- Intelligence reports
CREATE TABLE public.intelligence_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  report_type text DEFAULT 'competitor_analysis',
  title text NOT NULL,
  input_summary text DEFAULT '',
  strategies jsonb DEFAULT '[]',
  weaknesses jsonb DEFAULT '[]',
  positioning jsonb DEFAULT '[]',
  full_report text DEFAULT '',
  cost_neurons integer DEFAULT 0,
  job_id uuid REFERENCES public.neuron_jobs(id),
  created_at timestamptz DEFAULT now()
);

-- Data products (aggregated intelligence for sale)
CREATE TABLE public.data_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  product_type text DEFAULT 'market_trends',
  description text DEFAULT '',
  data_snapshot jsonb DEFAULT '{}',
  price_neurons integer DEFAULT 2000,
  total_sales integer DEFAULT 0,
  is_published boolean DEFAULT false,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- RLS
ALTER TABLE public.asset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_products ENABLE ROW LEVEL SECURITY;

-- Asset tokens: creator can manage, authenticated can read active
CREATE POLICY "creator_manage_tokens" ON public.asset_tokens FOR ALL TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "read_active_tokens" ON public.asset_tokens FOR SELECT TO authenticated
  USING (status = 'active');

-- Token holdings: holder reads own, admin reads all
CREATE POLICY "holder_read_own" ON public.token_holdings FOR SELECT TO authenticated
  USING (holder_id = auth.uid());
CREATE POLICY "holder_insert" ON public.token_holdings FOR INSERT TO authenticated
  WITH CHECK (holder_id = auth.uid());
CREATE POLICY "admin_read_holdings" ON public.token_holdings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Performance listings: creator manage, public read active
CREATE POLICY "creator_manage_perf" ON public.performance_listings FOR ALL TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "read_active_perf" ON public.performance_listings FOR SELECT TO authenticated
  USING (status = 'active');

-- Certifications: public read
CREATE POLICY "read_certs" ON public.certifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_certs" ON public.certifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- User certifications: own read
CREATE POLICY "read_own_certs" ON public.user_certifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admin_manage_user_certs" ON public.user_certifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Intelligence reports: author only
CREATE POLICY "author_manage_intel" ON public.intelligence_reports FOR ALL TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- Data products: public read published, admin manage
CREATE POLICY "read_published_data" ON public.data_products FOR SELECT TO authenticated
  USING (is_published = true);
CREATE POLICY "admin_manage_data" ON public.data_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_asset_tokens_asset ON public.asset_tokens(asset_id);
CREATE INDEX idx_token_holdings_holder ON public.token_holdings(holder_id);
CREATE INDEX idx_perf_listings_creator ON public.performance_listings(creator_id);
CREATE INDEX idx_intel_reports_author ON public.intelligence_reports(author_id);
CREATE INDEX idx_user_certs_user ON public.user_certifications(user_id);

-- Seed certifications
INSERT INTO public.certifications (cert_key, name, description, level, requirements) VALUES
  ('certified_creator', 'Certified Creator', 'Demonstrated ability to produce high-quality marketplace assets', 'creator', '{"min_assets_sold": 5, "min_avg_rating": 3.5}'),
  ('certified_system_builder', 'Certified System Builder', 'Built and deployed complex multi-service systems', 'expert', '{"min_executions": 50, "min_services_used": 20}'),
  ('certified_analyst', 'Certified Intelligence Analyst', 'Produced actionable competitive intelligence reports', 'expert', '{"min_reports": 10, "min_quality_score": 0.8}'),
  ('knowledge_architect', 'Knowledge Architect', 'Master-level knowledge graph contributor with high neuron quality', 'master', '{"min_neurons": 200, "min_quality_score": 0.85}');
