-- Fix all neurons with NULL workspace_id for user aa08fe29
UPDATE neurons 
SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c' 
WHERE author_id = 'aa08fe29-8dcb-4f3d-9756-8b78beafe4ca' 
AND workspace_id IS NULL;

-- Fix all episodes with NULL workspace_id for user aa08fe29
UPDATE episodes 
SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c' 
WHERE author_id = 'aa08fe29-8dcb-4f3d-9756-8b78beafe4ca' 
AND workspace_id IS NULL;

-- Fix all neuron_jobs with NULL workspace_id for user aa08fe29
UPDATE neuron_jobs 
SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c' 
WHERE author_id = 'aa08fe29-8dcb-4f3d-9756-8b78beafe4ca' 
AND workspace_id IS NULL;

-- Fix all artifacts with NULL workspace_id for user aa08fe29
UPDATE artifacts 
SET workspace_id = '7b2f0fab-e155-4201-9fbc-5ed0c6b82d7c' 
WHERE author_id = 'aa08fe29-8dcb-4f3d-9756-8b78beafe4ca' 
AND workspace_id IS NULL;