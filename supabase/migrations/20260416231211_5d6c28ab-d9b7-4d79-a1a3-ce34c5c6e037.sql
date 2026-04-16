
-- 1) admin_user_overview RPC
CREATE OR REPLACE FUNCTION public.admin_user_overview()
RETURNS TABLE (
  user_id uuid,
  email text,
  balance numeric,
  total_earned numeric,
  total_spent numeric,
  neuron_count bigint,
  roles text[],
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'admin access required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    COALESCE(au.email, '')::text AS email,
    COALESCE(uc.balance, 0)::numeric AS balance,
    COALESCE(uc.total_earned, 0)::numeric AS total_earned,
    COALESCE(uc.total_spent, 0)::numeric AS total_spent,
    COALESCE((SELECT count(*) FROM public.neurons n WHERE n.author_id = p.user_id), 0)::bigint AS neuron_count,
    COALESCE(
      (SELECT array_agg(ur.role::text) FROM public.user_roles ur WHERE ur.user_id = p.user_id),
      ARRAY[]::text[]
    ) AS roles,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users au ON au.id = p.user_id
  LEFT JOIN public.user_credits uc ON uc.user_id = p.user_id
  ORDER BY p.created_at DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_user_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_overview() TO authenticated;

-- 2) demand_signals
CREATE TABLE IF NOT EXISTS public.demand_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type text NOT NULL,
  source text,
  strength numeric DEFAULT 0,
  payload jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.demand_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demand_signals_admin_read"
  ON public.demand_signals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "demand_signals_admin_write"
  ON public.demand_signals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) generated_landing_pages
CREATE TABLE IF NOT EXISTS public.generated_landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived')),
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "glp_public_read_published"
  ON public.generated_landing_pages FOR SELECT
  USING (status = 'published');
CREATE POLICY "glp_admin_all"
  ON public.generated_landing_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX IF NOT EXISTS idx_glp_status ON public.generated_landing_pages(status);
