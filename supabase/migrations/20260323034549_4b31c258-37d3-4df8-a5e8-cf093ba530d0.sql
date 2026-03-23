-- Move the 1 episode from duplicate workspace to the original workspace
UPDATE episodes SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c'
WHERE workspace_id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

-- Move any other resources that might reference the duplicate workspace
UPDATE neurons SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c'
WHERE workspace_id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

UPDATE neuron_jobs SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c'
WHERE workspace_id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

UPDATE artifacts SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c'
WHERE workspace_id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

UPDATE agent_actions SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c'
WHERE workspace_id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

UPDATE contradiction_pairs SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c'
WHERE workspace_id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

-- Delete workspace members for the duplicate
DELETE FROM workspace_members WHERE workspace_id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

-- Delete the duplicate workspace
DELETE FROM workspaces WHERE id = '69f51399-9830-4b2e-b243-b15e6a1580a0';

-- Add unique constraint to prevent future duplicate workspace creation per user
-- Using a partial unique index on owner_id to prevent race conditions
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_single_owner 
ON workspaces (owner_id) 
WHERE owner_id IS NOT NULL;