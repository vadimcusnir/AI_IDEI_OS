
-- Drop non-critical tables from realtime publication
-- (DROP TABLE without IF EXISTS — use DO block for safety)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'os_agents', 'os_memory_patterns', 'os_executions',
    'command_decisions', 'share_events', 'imf_pipeline_runs',
    'automation_runs', 'agent_steps'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', tbl);
    EXCEPTION WHEN undefined_object THEN
      -- Table not in publication, skip
    END;
  END LOOP;
END $$;
