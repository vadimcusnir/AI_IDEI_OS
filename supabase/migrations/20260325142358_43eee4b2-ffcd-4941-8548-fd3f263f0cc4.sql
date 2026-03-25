
-- Function: Extract patterns from completed agent executions
CREATE OR REPLACE FUNCTION public.extract_execution_pattern()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agent record;
  _pattern_type text;
  _category text;
  _quality numeric;
  _existing_id uuid;
BEGIN
  -- Only fire on completion
  IF NEW.status NOT IN ('completed', 'failed') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get agent info
  SELECT role, agent_type INTO _agent FROM os_agents WHERE id = NEW.agent_id;
  IF _agent IS NULL THEN RETURN NEW; END IF;

  _quality := COALESCE((NEW.performance->>'quality')::numeric, 0.5);
  _pattern_type := CASE WHEN NEW.status = 'completed' AND _quality >= 0.7 THEN 'success' WHEN NEW.status = 'failed' THEN 'failure' ELSE 'optimization' END;
  _category := _agent.agent_type;

  -- Check if pattern already exists for this user + type + category
  SELECT id INTO _existing_id
  FROM os_memory_patterns
  WHERE user_id = NEW.user_id
    AND pattern_type = _pattern_type
    AND category = _category;

  IF _existing_id IS NOT NULL THEN
    -- Update existing pattern: increment frequency, rolling effectiveness
    UPDATE os_memory_patterns
    SET frequency = frequency + 1,
        effectiveness_score = (effectiveness_score * 0.8) + (_quality * 0.2),
        last_used_at = now(),
        pattern_data = jsonb_build_object(
          'last_agent', _agent.role,
          'last_quality', _quality,
          'last_duration_ms', NEW.duration_ms,
          'last_status', NEW.status,
          'output_keys', CASE WHEN NEW.output IS NOT NULL THEN (SELECT array_agg(k) FROM jsonb_object_keys(NEW.output) AS k) ELSE ARRAY[]::text[] END
        ),
        updated_at = now()
    WHERE id = _existing_id;
  ELSE
    -- Create new pattern
    INSERT INTO os_memory_patterns (
      id, user_id, pattern_type, category, pattern_data,
      frequency, effectiveness_score, last_used_at
    ) VALUES (
      gen_random_uuid(), NEW.user_id, _pattern_type, _category,
      jsonb_build_object(
        'last_agent', _agent.role,
        'last_quality', _quality,
        'last_duration_ms', NEW.duration_ms,
        'last_status', NEW.status,
        'source', 'auto_extraction'
      ),
      1, _quality, now()
    );
  END IF;

  -- Also create agent-specific pattern (tracks per-agent performance)
  SELECT id INTO _existing_id
  FROM os_memory_patterns
  WHERE user_id = NEW.user_id
    AND pattern_type = 'agent_profile'
    AND category = _agent.role;

  IF _existing_id IS NOT NULL THEN
    UPDATE os_memory_patterns
    SET frequency = frequency + 1,
        effectiveness_score = (effectiveness_score * 0.85) + (_quality * 0.15),
        last_used_at = now(),
        pattern_data = jsonb_build_object(
          'agent_type', _agent.agent_type,
          'total_runs', (COALESCE((pattern_data->>'total_runs')::int, 0) + 1),
          'avg_duration_ms', CASE
            WHEN NEW.duration_ms IS NOT NULL THEN
              ((COALESCE((pattern_data->>'avg_duration_ms')::int, 0) * COALESCE((pattern_data->>'total_runs')::int, 0)) + NEW.duration_ms) / (COALESCE((pattern_data->>'total_runs')::int, 0) + 1)
            ELSE COALESCE((pattern_data->>'avg_duration_ms')::int, 0)
          END,
          'last_status', NEW.status,
          'success_rate', CASE
            WHEN NEW.status = 'completed' THEN
              ((COALESCE((pattern_data->>'success_rate')::numeric, 0) * COALESCE((pattern_data->>'total_runs')::int, 0)) + 1.0) / (COALESCE((pattern_data->>'total_runs')::int, 0) + 1)
            ELSE
              ((COALESCE((pattern_data->>'success_rate')::numeric, 0) * COALESCE((pattern_data->>'total_runs')::int, 0)) + 0.0) / (COALESCE((pattern_data->>'total_runs')::int, 0) + 1)
          END
        ),
        updated_at = now()
    WHERE id = _existing_id;
  ELSE
    INSERT INTO os_memory_patterns (
      id, user_id, pattern_type, category, pattern_data,
      frequency, effectiveness_score, last_used_at
    ) VALUES (
      gen_random_uuid(), NEW.user_id, 'agent_profile', _agent.role,
      jsonb_build_object(
        'agent_type', _agent.agent_type,
        'total_runs', 1,
        'avg_duration_ms', COALESCE(NEW.duration_ms, 0),
        'last_status', NEW.status,
        'success_rate', CASE WHEN NEW.status = 'completed' THEN 1.0 ELSE 0.0 END,
        'source', 'auto_extraction'
      ),
      1, _quality, now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Auto-extract patterns after execution status changes
DROP TRIGGER IF EXISTS trg_extract_execution_pattern ON os_executions;
CREATE TRIGGER trg_extract_execution_pattern
  AFTER UPDATE OF status ON os_executions
  FOR EACH ROW
  EXECUTE FUNCTION extract_execution_pattern();
