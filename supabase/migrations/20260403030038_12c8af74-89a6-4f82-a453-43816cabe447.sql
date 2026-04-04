
CREATE TYPE public.service_level AS ENUM ('otos', 'mms', 'lcss');
CREATE TYPE public.asset_type AS ENUM ('atomic_asset', 'compound_asset', 'system_asset');
CREATE TYPE public.reuse_value AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected', 'revision_needed');

CREATE TABLE public.service_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level service_level NOT NULL DEFAULT 'otos',
  name TEXT NOT NULL,
  single_output TEXT NOT NULL,
  single_function TEXT NOT NULL,
  single_decision TEXT NOT NULL,
  mechanism TEXT NOT NULL,
  role TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'copy',
  intent TEXT NOT NULL DEFAULT 'convert',
  prompt_id UUID,
  deliverable_id UUID,
  score_json JSONB NOT NULL DEFAULT '{}',
  cost_json JSONB NOT NULL DEFAULT '{}',
  pricing_json JSONB NOT NULL DEFAULT '{}',
  otos_id UUID REFERENCES public.os_otos(id),
  mms_id UUID REFERENCES public.os_mms(id),
  lcss_id UUID REFERENCES public.os_lcss(id),
  status TEXT NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.prompt_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_unit_id UUID NOT NULL REFERENCES public.service_units(id) ON DELETE CASCADE,
  system_role TEXT NOT NULL DEFAULT 'atomic_service_executor',
  purpose TEXT NOT NULL,
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB NOT NULL DEFAULT '{}',
  quality_gate JSONB NOT NULL DEFAULT '[]',
  rules JSONB NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  hash TEXT,
  access_scope TEXT NOT NULL DEFAULT 'internal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.deliverable_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_unit_id UUID NOT NULL REFERENCES public.service_units(id) ON DELETE CASCADE,
  primary_assets JSONB NOT NULL DEFAULT '[]',
  secondary_assets JSONB NOT NULL DEFAULT '[]',
  asset_type asset_type NOT NULL DEFAULT 'atomic_asset',
  reuse_value reuse_value NOT NULL DEFAULT 'medium',
  exportability TEXT[] NOT NULL DEFAULT ARRAY['txt', 'md', 'json'],
  storage_target TEXT NOT NULL DEFAULT 'library',
  ownership TEXT NOT NULL DEFAULT 'user_owned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.service_release_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_unit_id UUID NOT NULL REFERENCES public.service_units(id) ON DELETE CASCADE,
  atomicity_check BOOLEAN NOT NULL DEFAULT false,
  duplication_check BOOLEAN NOT NULL DEFAULT false,
  schema_check BOOLEAN NOT NULL DEFAULT false,
  monetization_check BOOLEAN NOT NULL DEFAULT false,
  root2_check BOOLEAN NOT NULL DEFAULT false,
  total_score NUMERIC(4,2),
  approval_status approval_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_units
  ADD CONSTRAINT fk_prompt FOREIGN KEY (prompt_id) REFERENCES public.prompt_vault(id),
  ADD CONSTRAINT fk_deliverable FOREIGN KEY (deliverable_id) REFERENCES public.deliverable_contracts(id);

ALTER TABLE public.service_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_release_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_units_select_authenticated" ON public.service_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_units_admin_full" ON public.service_units FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "prompt_vault_admin_only" ON public.prompt_vault FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "deliverable_contracts_select_authenticated" ON public.deliverable_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "deliverable_contracts_admin_full" ON public.deliverable_contracts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "release_log_admin_only" ON public.service_release_log FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_service_units_level ON public.service_units(level);
CREATE INDEX idx_service_units_status ON public.service_units(status);
CREATE INDEX idx_service_units_intent ON public.service_units(intent);
CREATE INDEX idx_service_units_domain ON public.service_units(domain);
CREATE INDEX idx_service_units_role ON public.service_units(role);
CREATE INDEX idx_service_units_otos_id ON public.service_units(otos_id);
CREATE INDEX idx_prompt_vault_unit ON public.prompt_vault(service_unit_id);
CREATE INDEX idx_deliverable_unit ON public.deliverable_contracts(service_unit_id);
CREATE INDEX idx_release_log_unit ON public.service_release_log(service_unit_id);
