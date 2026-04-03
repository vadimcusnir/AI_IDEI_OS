
-- ══════════════════════════════════════════
-- PHASE 5.1: intent_map
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.intent_map (
  intent_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  label_ro TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  description_ro TEXT NOT NULL DEFAULT '',
  required_roles TEXT[] NOT NULL DEFAULT '{}',
  domain_filter TEXT[] NOT NULL DEFAULT '{}',
  min_tier TEXT NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intent_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intent_map_select_auth" ON public.intent_map
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "intent_map_admin_full" ON public.intent_map
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed 6 core intents
INSERT INTO public.intent_map (intent_key, label, label_ro, description, description_ro, domain_filter, min_tier) VALUES
  ('get_clients', 'Get Clients', 'Obține Clienți', 'Attract new customers and generate leads', 'Atrage clienți noi și generează lead-uri', ARRAY['hooks','cta','sales','outreach','lead_gen'], 'free'),
  ('improve_conversion', 'Improve Conversion', 'Îmbunătățește Conversia', 'Optimize funnels and increase conversion rates', 'Optimizează funnel-uri și crește rata de conversie', ARRAY['conversion','pricing','objections','sales','funnel'], 'free'),
  ('build_authority', 'Build Authority', 'Construiește Autoritate', 'Establish expertise and thought leadership', 'Stabilește expertiză și leadership de opinie', ARRAY['authority','branding','content','storytelling','positioning'], 'free'),
  ('increase_revenue', 'Increase Revenue', 'Crește Veniturile', 'Maximize revenue through pricing and monetization', 'Maximizează veniturile prin prețuri și monetizare', ARRAY['monetization','pricing','offers','upsell','revenue'], 'authenticated'),
  ('retain', 'Retain & Grow', 'Retenție & Creștere', 'Keep customers and increase lifetime value', 'Păstrează clienții și crește valoarea lor', ARRAY['retention','loyalty','community','engagement','nurture'], 'authenticated'),
  ('scale', 'Scale Operations', 'Scalează Operațiunile', 'Automate and scale business processes', 'Automatizează și scalează procesele de business', ARRAY['automation','systems','scaling','team','operations'], 'pro');

-- ══════════════════════════════════════════
-- PHASE 5.2: mms_nodes + mms_edges (DAG)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.mms_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mms_id UUID NOT NULL REFERENCES public.os_mms(id) ON DELETE CASCADE,
  otos_id UUID REFERENCES public.os_otos(id) ON DELETE SET NULL,
  service_unit_id UUID REFERENCES public.service_units(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'processor',
  label TEXT NOT NULL DEFAULT '',
  step_order INT NOT NULL DEFAULT 0,
  depends_on UUID[] DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mms_nodes_mms ON public.mms_nodes(mms_id);

ALTER TABLE public.mms_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mms_nodes_select_auth" ON public.mms_nodes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "mms_nodes_admin_full" ON public.mms_nodes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.mms_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mms_id UUID NOT NULL REFERENCES public.os_mms(id) ON DELETE CASCADE,
  from_node UUID NOT NULL REFERENCES public.mms_nodes(id) ON DELETE CASCADE,
  to_node UUID NOT NULL REFERENCES public.mms_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'sequence',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mms_edges_mms ON public.mms_edges(mms_id);

ALTER TABLE public.mms_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mms_edges_select_auth" ON public.mms_edges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "mms_edges_admin_full" ON public.mms_edges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
