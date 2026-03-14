
-- Workspace roles enum
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Workspaces table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  avatar_url text,
  description text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Workspace members table
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  invited_by uuid,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Security definer function to check workspace role
CREATE OR REPLACE FUNCTION public.has_workspace_role(_user_id uuid, _workspace_id uuid, _role workspace_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id 
      AND workspace_id = _workspace_id
      AND role <= _role  -- enum ordering: owner < admin < editor < viewer
  )
$$;

-- RLS Policies for workspaces
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their workspaces"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
  ON public.workspaces FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for workspace_members
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace owners/admins can add members"
  ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_workspace_role(auth.uid(), workspace_id, 'admin')
    OR (user_id = auth.uid()) -- allow self-join for workspace creation
  );

CREATE POLICY "Workspace owners/admins can update members"
  ON public.workspace_members FOR UPDATE TO authenticated
  USING (public.has_workspace_role(auth.uid(), workspace_id, 'admin'));

CREATE POLICY "Workspace owners/admins can remove members"
  ON public.workspace_members FOR DELETE TO authenticated
  USING (
    public.has_workspace_role(auth.uid(), workspace_id, 'admin')
    OR user_id = auth.uid() -- members can leave
  );

-- Auto-create personal workspace on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
  user_name text;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  INSERT INTO public.workspaces (id, name, slug, owner_id)
  VALUES (gen_random_uuid(), user_name || '''s Workspace', NEW.id::text, NEW.id)
  RETURNING id INTO ws_id;
  
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_workspace();

-- Updated_at trigger
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);
