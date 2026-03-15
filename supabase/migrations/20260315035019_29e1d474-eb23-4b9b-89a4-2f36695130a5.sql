
-- Add workspace_id to core tables
ALTER TABLE public.episodes 
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.neurons 
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.neuron_jobs 
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.artifacts 
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.guest_profiles 
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;

-- Backfill: assign existing data to user's first workspace
UPDATE public.episodes e
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm 
  WHERE wm.user_id = e.author_id 
  ORDER BY wm.joined_at ASC LIMIT 1
)
WHERE e.workspace_id IS NULL AND e.author_id IS NOT NULL;

UPDATE public.neurons n
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm 
  WHERE wm.user_id = n.author_id 
  ORDER BY wm.joined_at ASC LIMIT 1
)
WHERE n.workspace_id IS NULL AND n.author_id IS NOT NULL;

UPDATE public.neuron_jobs nj
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm 
  WHERE wm.user_id = nj.author_id 
  ORDER BY wm.joined_at ASC LIMIT 1
)
WHERE nj.workspace_id IS NULL AND nj.author_id IS NOT NULL;

UPDATE public.artifacts a
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm 
  WHERE wm.user_id = a.author_id 
  ORDER BY wm.joined_at ASC LIMIT 1
)
WHERE a.workspace_id IS NULL AND a.author_id IS NOT NULL;

UPDATE public.guest_profiles g
SET workspace_id = (
  SELECT wm.workspace_id FROM public.workspace_members wm 
  WHERE wm.user_id = g.author_id 
  ORDER BY wm.joined_at ASC LIMIT 1
)
WHERE g.workspace_id IS NULL AND g.author_id IS NOT NULL;

-- Create indexes for workspace queries
CREATE INDEX IF NOT EXISTS idx_episodes_workspace ON public.episodes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_neurons_workspace ON public.neurons(workspace_id);
CREATE INDEX IF NOT EXISTS idx_neuron_jobs_workspace ON public.neuron_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_workspace ON public.artifacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_workspace ON public.guest_profiles(workspace_id);

-- Auto-assign workspace_id on episode insert via trigger
CREATE OR REPLACE FUNCTION public.auto_assign_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.author_id IS NOT NULL THEN
    SELECT wm.workspace_id INTO NEW.workspace_id
    FROM public.workspace_members wm
    WHERE wm.user_id = NEW.author_id
    ORDER BY wm.joined_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_episodes_auto_workspace
  BEFORE INSERT ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_workspace();

CREATE OR REPLACE TRIGGER trg_neurons_auto_workspace
  BEFORE INSERT ON public.neurons
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_workspace();

CREATE OR REPLACE TRIGGER trg_neuron_jobs_auto_workspace
  BEFORE INSERT ON public.neuron_jobs
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_workspace();

CREATE OR REPLACE TRIGGER trg_artifacts_auto_workspace
  BEFORE INSERT ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_workspace();

CREATE OR REPLACE TRIGGER trg_guest_profiles_auto_workspace
  BEFORE INSERT ON public.guest_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_workspace();
