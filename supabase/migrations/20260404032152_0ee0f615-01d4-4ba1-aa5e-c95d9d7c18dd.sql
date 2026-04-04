-- Create RBAC permissions matrix table
CREATE TABLE IF NOT EXISTS public.rbac_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission_key)
);

ALTER TABLE public.rbac_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_rbac" ON public.rbac_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default permissions
INSERT INTO public.rbac_permissions (role, permission_key) VALUES
  ('admin', 'manage_users'), ('admin', 'manage_credits'), ('admin', 'manage_roles'),
  ('admin', 'manage_services'), ('admin', 'manage_jobs'), ('admin', 'view_logs'),
  ('admin', 'view_analytics'), ('admin', 'manage_incidents'), ('admin', 'kill_switch'),
  ('finops', 'manage_credits'), ('finops', 'view_analytics'), ('finops', 'view_logs'),
  ('support', 'view_users'), ('support', 'view_jobs'), ('support', 'manage_jobs'),
  ('security', 'view_logs'), ('security', 'view_incidents'), ('security', 'manage_incidents'),
  ('reader', 'view_users'), ('reader', 'view_analytics'), ('reader', 'view_jobs')
ON CONFLICT DO NOTHING;

-- Function to check permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.rbac_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission_key = _permission
  )
$$;