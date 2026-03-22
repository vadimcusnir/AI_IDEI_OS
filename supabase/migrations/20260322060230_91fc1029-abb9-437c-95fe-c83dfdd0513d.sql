
-- ═══ Marketplace Licensing ═══
CREATE TABLE IF NOT EXISTS public.asset_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.knowledge_assets(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  license_type text NOT NULL DEFAULT 'standard',
  price_neurons integer NOT NULL DEFAULT 0,
  price_usd numeric(10,2) DEFAULT 0,
  platform_fee_pct integer NOT NULL DEFAULT 30,
  creator_revenue integer NOT NULL DEFAULT 0,
  platform_revenue integer NOT NULL DEFAULT 0,
  is_transferable boolean NOT NULL DEFAULT false,
  transferred_from uuid REFERENCES public.asset_licenses(id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.asset_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own licenses" ON public.asset_licenses
  FOR SELECT TO authenticated USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "System inserts licenses" ON public.asset_licenses
  FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());

CREATE INDEX idx_asset_licenses_buyer ON public.asset_licenses(buyer_id);
CREATE INDEX idx_asset_licenses_asset ON public.asset_licenses(asset_id);

-- ═══ Admin: Approval Requests ═══
CREATE TABLE IF NOT EXISTS public.admin_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  target_resource text,
  target_id text,
  requested_by uuid NOT NULL,
  approved_by uuid,
  approval_level integer NOT NULL DEFAULT 1,
  required_level integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'pending',
  timelock_until timestamptz,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_note text
);

ALTER TABLE public.admin_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage approvals" ON public.admin_approval_requests
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX idx_approval_status ON public.admin_approval_requests(status);

-- ═══ Anomaly Alerts ═══
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  user_id uuid,
  metric_name text NOT NULL,
  current_value numeric NOT NULL,
  threshold_value numeric NOT NULL,
  deviation_pct numeric,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts" ON public.anomaly_alerts
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX idx_anomaly_alerts_type ON public.anomaly_alerts(alert_type, created_at DESC);
