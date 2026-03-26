-- CRITICAL: Remove privilege escalation policies

-- 1. Remove self-insert on user_roles (allows any user to grant themselves admin)
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;

-- 2. Remove self-manage on admin_permissions (allows any user to grant themselves permissions)
DROP POLICY IF EXISTS "admin_permissions_insert_own" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_update_own" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_delete_own" ON public.admin_permissions;

-- 3. Remove overly permissive neuron_embeddings policy
DROP POLICY IF EXISTS "neuron_embeddings_select_all" ON public.neuron_embeddings;