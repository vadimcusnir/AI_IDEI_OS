
-- Inevitability Engine: platform-level metrics + lock-in tracking

-- Platform metrics snapshots (daily)
CREATE TABLE public.platform_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  total_users integer DEFAULT 0,
  active_users_7d integer DEFAULT 0,
  total_assets integer DEFAULT 0,
  total_executions integer DEFAULT 0,
  total_revenue_neurons bigint DEFAULT 0,
  revenue_per_user numeric(12,2) DEFAULT 0,
  assets_per_execution numeric(8,2) DEFAULT 0,
  marketplace_velocity numeric(8,2) DEFAULT 0,
  reuse_rate numeric(5,4) DEFAULT 0,
  avg_lock_in_score numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_date)
);

-- User lock-in scores
CREATE TABLE public.user_lock_in (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_dependency numeric(5,2) DEFAULT 0,
  revenue_dependency numeric(5,2) DEFAULT 0,
  identity_dependency numeric(5,2) DEFAULT 0,
  total_score numeric(5,2) DEFAULT 0,
  tier text DEFAULT 'explorer',
  assets_count integer DEFAULT 0,
  executions_count integer DEFAULT 0,
  marketplace_revenue bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Creator rankings
CREATE TABLE public.creator_rankings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_rank integer DEFAULT 0,
  creator_tier text DEFAULT 'newcomer',
  total_assets_sold integer DEFAULT 0,
  total_revenue_neurons bigint DEFAULT 0,
  avg_asset_rating numeric(3,2) DEFAULT 0,
  portfolio_value bigint DEFAULT 0,
  reputation_score numeric(5,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_rankings ENABLE ROW LEVEL SECURITY;

-- Platform metrics: admin read-only
CREATE POLICY "admin_read_platform_metrics" ON public.platform_metrics
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User lock-in: users can read own, admins can read all
CREATE POLICY "users_read_own_lock_in" ON public.user_lock_in
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admin_read_all_lock_in" ON public.user_lock_in
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Creator rankings: public read for marketplace transparency
CREATE POLICY "anyone_read_creator_rankings" ON public.creator_rankings
  FOR SELECT TO authenticated
  USING (true);

-- Indexes
CREATE INDEX idx_platform_metrics_date ON public.platform_metrics(metric_date DESC);
CREATE INDEX idx_creator_rankings_rank ON public.creator_rankings(creator_rank DESC);
CREATE INDEX idx_user_lock_in_score ON public.user_lock_in(total_score DESC);
