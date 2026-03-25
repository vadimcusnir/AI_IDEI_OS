
-- RPC: Start agent execution (validates credits, creates execution, deducts credits, logs to ledger)
CREATE OR REPLACE FUNCTION public.start_agent_execution(
  _user_id uuid,
  _agent_id uuid,
  _input jsonb DEFAULT '{}'::jsonb,
  _estimated_credits numeric DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _agent record;
  _balance numeric;
  _exec_id uuid;
BEGIN
  -- Validate agent exists and is active
  SELECT id, role, status, metadata INTO _agent
  FROM os_agents WHERE id = _agent_id;
  
  IF _agent IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'agent_not_found');
  END IF;
  
  IF _agent.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'agent_not_active', 'status', _agent.status);
  END IF;

  -- Check user credit balance
  SELECT COALESCE(available_balance, 0) INTO _balance
  FROM wallet_state WHERE user_id = _user_id;

  IF _balance < _estimated_credits THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits', 'balance', _balance, 'required', _estimated_credits);
  END IF;

  -- Deduct credits
  UPDATE wallet_state
  SET available_balance = available_balance - _estimated_credits,
      locked_balance = locked_balance + _estimated_credits,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Create execution record
  INSERT INTO os_executions (id, agent_id, user_id, input, status, credits_cost, started_at)
  VALUES (gen_random_uuid(), _agent_id, _user_id, _input, 'running', _estimated_credits, now())
  RETURNING id INTO _exec_id;

  -- Update agent last_active_at
  UPDATE os_agents SET last_active_at = now() WHERE id = _agent_id;

  -- Log to decision ledger
  INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason, metadata)
  VALUES (
    'AGENT_EXECUTION_START',
    _user_id,
    _agent.role,
    'ALLOW',
    format('Agent %s started with %s credits', _agent.role, _estimated_credits),
    jsonb_build_object('execution_id', _exec_id, 'agent_id', _agent_id, 'credits', _estimated_credits)
  );

  RETURN jsonb_build_object(
    'success', true,
    'execution_id', _exec_id,
    'agent', _agent.role,
    'credits_locked', _estimated_credits
  );
END;
$$;

-- RPC: Complete agent execution (records output, performance, unlocks credits)
CREATE OR REPLACE FUNCTION public.complete_agent_execution(
  _execution_id uuid,
  _output jsonb DEFAULT '{}'::jsonb,
  _performance jsonb DEFAULT '{"quality": 0.8}'::jsonb,
  _success boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exec record;
  _duration_ms integer;
  _refund numeric;
  _final_status text;
BEGIN
  -- Get execution
  SELECT * INTO _exec FROM os_executions WHERE id = _execution_id;
  IF _exec IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'execution_not_found');
  END IF;

  IF _exec.status != 'running' THEN
    RETURN jsonb_build_object('success', false, 'error', 'execution_not_running');
  END IF;

  _duration_ms := EXTRACT(EPOCH FROM (now() - _exec.started_at)) * 1000;
  _final_status := CASE WHEN _success THEN 'completed' ELSE 'failed' END;

  -- If failed, refund 80% of credits
  _refund := CASE WHEN NOT _success THEN _exec.credits_cost * 0.8 ELSE 0 END;

  -- Update execution
  UPDATE os_executions
  SET status = _final_status,
      output = _output,
      performance = _performance,
      duration_ms = _duration_ms,
      completed_at = now()
  WHERE id = _execution_id;

  -- Unlock credits from locked -> available (refund partial on failure)
  UPDATE wallet_state
  SET locked_balance = locked_balance - _exec.credits_cost,
      available_balance = available_balance + _refund,
      updated_at = now()
  WHERE user_id = _exec.user_id;

  -- Update agent performance score (rolling average)
  UPDATE os_agents
  SET performance_score = (performance_score * 0.9) + (COALESCE((_performance->>'quality')::numeric, 0.8) * 0.1)
  WHERE id = _exec.agent_id;

  -- Log to decision ledger
  INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason, metadata)
  VALUES (
    'AGENT_EXECUTION_COMPLETE',
    _exec.user_id,
    (SELECT role FROM os_agents WHERE id = _exec.agent_id),
    CASE WHEN _success THEN 'ALLOW' ELSE 'DENY' END,
    format('Execution %s in %sms', _final_status, _duration_ms),
    jsonb_build_object('execution_id', _execution_id, 'duration_ms', _duration_ms, 'refund', _refund)
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', _final_status,
    'duration_ms', _duration_ms,
    'credits_refunded', _refund
  );
END;
$$;
