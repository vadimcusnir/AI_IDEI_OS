
-- =============================================
-- PHASE 1: SERVICE CATALOG DATABASE
-- =============================================

-- 1. Execution Prompts (secret, server-only)
CREATE TABLE public.execution_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_version INT NOT NULL DEFAULT 1,
  linked_service_id UUID,
  linked_service_level TEXT CHECK (linked_service_level IN ('L1','L2','L3')),
  execution_type TEXT NOT NULL DEFAULT 'single',
  quality_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Formation Frameworks (secret, server-only)
CREATE TABLE public.formation_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_name TEXT NOT NULL,
  framework_logic TEXT NOT NULL,
  linked_service_id UUID,
  linked_service_level TEXT CHECK (linked_service_level IN ('L1','L2','L3')),
  assembly_rules JSONB DEFAULT '{}'::jsonb,
  adaptation_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Services Level 3 (atomic services)
CREATE TABLE public.services_level_3 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  description_public TEXT NOT NULL DEFAULT '',
  description_internal TEXT,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  internal_credit_cost INT NOT NULL DEFAULT 0,
  production_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  deliverable_name TEXT NOT NULL DEFAULT '',
  deliverable_type TEXT NOT NULL DEFAULT 'text',
  estimated_delivery_seconds INT NOT NULL DEFAULT 60,
  execution_prompt_id UUID REFERENCES public.execution_prompts(id),
  formation_framework_id UUID REFERENCES public.formation_frameworks(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','unlisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Services Level 2 (cluster services)
CREATE TABLE public.services_level_2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  description_public TEXT NOT NULL DEFAULT '',
  description_internal TEXT,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  internal_credit_cost INT NOT NULL DEFAULT 0,
  production_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  deliverable_name TEXT NOT NULL DEFAULT '',
  deliverable_type TEXT NOT NULL DEFAULT 'bundle',
  estimated_delivery_seconds INT NOT NULL DEFAULT 300,
  execution_prompt_id UUID REFERENCES public.execution_prompts(id),
  formation_framework_id UUID REFERENCES public.formation_frameworks(id),
  component_l3_ids UUID[] DEFAULT '{}',
  component_selection_logic JSONB DEFAULT '{}'::jsonb,
  component_execution_order JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','unlisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Services Level 1 (master systems)
CREATE TABLE public.services_level_1 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  description_public TEXT NOT NULL DEFAULT '',
  description_internal TEXT,
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  internal_credit_cost INT NOT NULL DEFAULT 0,
  production_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  deliverable_name TEXT NOT NULL DEFAULT '',
  deliverable_type TEXT NOT NULL DEFAULT 'system',
  estimated_delivery_seconds INT NOT NULL DEFAULT 1800,
  execution_prompt_id UUID REFERENCES public.execution_prompts(id),
  formation_framework_id UUID REFERENCES public.formation_frameworks(id),
  component_l2_ids UUID[] DEFAULT '{}',
  component_l3_ids_optional UUID[] DEFAULT '{}',
  final_delivery_assembly_logic JSONB DEFAULT '{}'::jsonb,
  master_deliverables JSONB DEFAULT '[]'::jsonb,
  output_types TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','draft')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private','unlisted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Execution Prompts: ZERO public access, admin + service_role only
ALTER TABLE public.execution_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read execution_prompts"
  ON public.execution_prompts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin manage execution_prompts"
  ON public.execution_prompts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Formation Frameworks: ZERO public access, admin + service_role only
ALTER TABLE public.formation_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read formation_frameworks"
  ON public.formation_frameworks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admin manage formation_frameworks"
  ON public.formation_frameworks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Services L3: public SELECT for visible, admin CRUD
ALTER TABLE public.services_level_3 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible L3 services"
  ON public.services_level_3 FOR SELECT TO anon, authenticated
  USING (visibility = 'public' AND status = 'active');

CREATE POLICY "Admin manage L3 services"
  ON public.services_level_3 FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Services L2: public SELECT for visible, admin CRUD
ALTER TABLE public.services_level_2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible L2 services"
  ON public.services_level_2 FOR SELECT TO anon, authenticated
  USING (visibility = 'public' AND status = 'active');

CREATE POLICY "Admin manage L2 services"
  ON public.services_level_2 FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Services L1: public SELECT for visible, admin CRUD
ALTER TABLE public.services_level_1 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read visible L1 services"
  ON public.services_level_1 FOR SELECT TO anon, authenticated
  USING (visibility = 'public' AND status = 'active');

CREATE POLICY "Admin manage L1 services"
  ON public.services_level_1 FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Revoke direct access to prompt_text from authenticated role
REVOKE ALL ON public.execution_prompts FROM anon;
REVOKE ALL ON public.formation_frameworks FROM anon;
