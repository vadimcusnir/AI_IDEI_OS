
-- Sequence for PRM-#### IDs
CREATE SEQUENCE IF NOT EXISTS public.prompt_db_registry_seq START 1;

CREATE TABLE IF NOT EXISTS public.prompt_db_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id text NOT NULL UNIQUE,
  service_key text NOT NULL UNIQUE,
  name text NOT NULL,
  domain text NOT NULL DEFAULT 'general',
  function text NOT NULL DEFAULT 'generate',
  input_type text NOT NULL DEFAULT 'mixed',
  output_type text NOT NULL DEFAULT 'report',
  cluster text NOT NULL DEFAULT 'general',
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'active',
  complexity text NOT NULL DEFAULT 'modular',
  language text NOT NULL DEFAULT 'ro',
  utility_score numeric NOT NULL DEFAULT 5,
  revenue_score numeric NOT NULL DEFAULT 5,
  total_score numeric GENERATED ALWAYS AS ((utility_score + revenue_score) / 2) STORED,
  monetizable boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_db_registry_domain ON public.prompt_db_registry(domain);
CREATE INDEX IF NOT EXISTS idx_prompt_db_registry_function ON public.prompt_db_registry(function);
CREATE INDEX IF NOT EXISTS idx_prompt_db_registry_cluster ON public.prompt_db_registry(cluster);
CREATE INDEX IF NOT EXISTS idx_prompt_db_registry_total_score ON public.prompt_db_registry(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_db_registry_service_key ON public.prompt_db_registry(service_key);

ALTER TABLE public.prompt_db_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view registry"
  ON public.prompt_db_registry FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage registry"
  ON public.prompt_db_registry FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_prompt_db_registry_updated_at
  BEFORE UPDATE ON public.prompt_db_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper to mint next PRM-#### id (zero-padded to 5)
CREATE OR REPLACE FUNCTION public.mint_prompt_db_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n bigint;
BEGIN
  n := nextval('public.prompt_db_registry_seq');
  RETURN 'PRM-' || lpad(n::text, 5, '0');
END;
$$;
