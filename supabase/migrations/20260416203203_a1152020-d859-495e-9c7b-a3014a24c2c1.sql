
-- Trigger 1: Job failure → recovery event + decision
CREATE OR REPLACE FUNCTION public.mcl_hook_job_failure()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_priority numeric;
  v_severity text;
BEGIN
  -- Only fire on transition to failed/dead_letter
  IF NEW.status NOT IN ('failed', 'dead_letter') THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  v_severity := CASE WHEN NEW.dead_letter THEN 'critical' ELSE 'high' END;

  INSERT INTO public.mcl_recovery_events (
    name, failure_type, source_reference, severity, response_mode, status,
    retry_count, rollback_possible, metadata
  ) VALUES (
    'job_failure_' || substr(NEW.id::text, 1, 8),
    CASE WHEN NEW.retry_count >= NEW.max_retries THEN 'transient_runtime_failure' ELSE 'partial_output_failure' END,
    NEW.id::text,
    v_severity,
    CASE WHEN NEW.dead_letter THEN 'escalate' ELSE 'retry' END,
    CASE WHEN NEW.dead_letter THEN 'unresolved' ELSE 'retrying' END,
    NEW.retry_count,
    false,
    jsonb_build_object('worker_type', NEW.worker_type, 'error', NEW.error_message, 'neuron_id', NEW.neuron_id)
  );

  -- Compute priority for triage decision
  SELECT public.mcl_compute_priority(
    revenue_potential => 5,
    urgency => CASE WHEN NEW.dead_letter THEN 10 ELSE 6 END,
    frequency => 5,
    strategic_value => 4,
    effort => 3,
    risk => CASE WHEN NEW.dead_letter THEN 8 ELSE 4 END
  ) INTO v_priority;

  INSERT INTO public.mcl_decisions (
    name, source_type, source_reference, target_entity_type, target_entity_reference,
    decision_type, rationale, confidence, trust_state, priority_score, status, metadata
  ) VALUES (
    'triage_job_' || substr(NEW.id::text, 1, 8),
    'recovery_event', NEW.id::text,
    'neuron_job', NEW.id::text,
    CASE WHEN NEW.dead_letter THEN 'escalate' ELSE 'rerun' END,
    format('Job %s failed (%s). Worker: %s. Auto-triage.', substr(NEW.id::text, 1, 8), NEW.error_message, NEW.worker_type),
    'medium',
    'medium',
    v_priority,
    'pending',
    jsonb_build_object('source_table', 'neuron_jobs', 'auto_generated', true)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mcl_job_failure ON public.neuron_jobs;
CREATE TRIGGER trg_mcl_job_failure
AFTER UPDATE OF status ON public.neuron_jobs
FOR EACH ROW EXECUTE FUNCTION public.mcl_hook_job_failure();

-- Trigger 2: Credit spend → economic unit
CREATE OR REPLACE FUNCTION public.mcl_hook_credit_spend()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cost_estimate numeric;
BEGIN
  IF NEW.type NOT IN ('spend', 'consume', 'usage') THEN RETURN NEW; END IF;
  IF NEW.amount >= 0 THEN RETURN NEW; END IF;

  -- 1 neuron credit ~= $0.04 platform cost (per Root2)
  v_cost_estimate := abs(NEW.amount) * 0.02;

  INSERT INTO public.mcl_economic_units (
    name, scope_type, scope_reference,
    cost_estimate, time_estimate, credit_cost, revenue_amount, profit_amount, margin_score,
    measured_at, metadata
  ) VALUES (
    'spend_' || substr(NEW.id::text, 1, 8),
    CASE WHEN NEW.job_id IS NOT NULL THEN 'execution_level' ELSE 'user_level' END,
    COALESCE(NEW.job_id::text, NEW.user_id::text),
    v_cost_estimate,
    0,
    abs(NEW.amount),
    0,
    -v_cost_estimate,
    -1.0,
    NEW.created_at,
    jsonb_build_object('service_key', NEW.service_key, 'transaction_id', NEW.id, 'auto_generated', true)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mcl_credit_spend ON public.credit_transactions;
CREATE TRIGGER trg_mcl_credit_spend
AFTER INSERT ON public.credit_transactions
FOR EACH ROW EXECUTE FUNCTION public.mcl_hook_credit_spend();

-- RPC: Generate meta health report on demand
CREATE OR REPLACE FUNCTION public.mcl_generate_meta_report(_window text DEFAULT 'daily')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_window_start timestamptz;
  v_total_jobs int;
  v_failed_jobs int;
  v_decisions_total int;
  v_decisions_resolved int;
  v_recoveries_total int;
  v_recoveries_resolved int;
  v_total_cost numeric;
  v_total_executions int;
  v_health numeric;
  v_automation_rate numeric;
  v_decision_acc numeric;
  v_rev_per_exec numeric;
  v_recovery_rate numeric;
  v_failures jsonb;
  v_recs jsonb;
  v_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin role required';
  END IF;

  v_window_start := CASE _window
    WHEN 'daily' THEN now() - interval '1 day'
    WHEN 'weekly' THEN now() - interval '7 days'
    WHEN 'monthly' THEN now() - interval '30 days'
    ELSE now() - interval '1 day'
  END;

  SELECT count(*), count(*) FILTER (WHERE status IN ('failed','dead_letter'))
    INTO v_total_jobs, v_failed_jobs
    FROM public.neuron_jobs WHERE created_at >= v_window_start;

  SELECT count(*), count(*) FILTER (WHERE status IN ('approved','auto_executed','rejected'))
    INTO v_decisions_total, v_decisions_resolved
    FROM public.mcl_decisions WHERE created_at >= v_window_start;

  SELECT count(*), count(*) FILTER (WHERE status = 'resolved')
    INTO v_recoveries_total, v_recoveries_resolved
    FROM public.mcl_recovery_events WHERE created_at >= v_window_start;

  SELECT COALESCE(sum(cost_estimate),0), count(*)
    INTO v_total_cost, v_total_executions
    FROM public.mcl_economic_units WHERE measured_at >= v_window_start;

  v_automation_rate := CASE WHEN v_decisions_total > 0
    THEN (SELECT count(*)::numeric / v_decisions_total FROM public.mcl_decisions
          WHERE created_at >= v_window_start AND status = 'auto_executed')
    ELSE 0 END;

  v_decision_acc := CASE WHEN v_decisions_total > 0
    THEN v_decisions_resolved::numeric / v_decisions_total ELSE 0 END;

  v_recovery_rate := CASE WHEN v_recoveries_total > 0
    THEN v_recoveries_resolved::numeric / v_recoveries_total ELSE 0 END;

  v_rev_per_exec := CASE WHEN v_total_executions > 0
    THEN -v_total_cost / v_total_executions ELSE 0 END;

  -- Health score: weighted (recovery 30%, automation 25%, decision_acc 25%, error_rate 20%)
  v_health := round((
    (v_recovery_rate * 3.0) +
    (v_automation_rate * 2.5) +
    (v_decision_acc * 2.5) +
    (CASE WHEN v_total_jobs > 0 THEN (1 - v_failed_jobs::numeric/v_total_jobs) ELSE 1 END * 2.0)
  )::numeric, 2);

  v_failures := jsonb_build_object(
    'failed_jobs', v_failed_jobs,
    'job_error_rate', CASE WHEN v_total_jobs > 0 THEN round(v_failed_jobs::numeric/v_total_jobs, 3) ELSE 0 END,
    'unresolved_recoveries', v_recoveries_total - v_recoveries_resolved
  );

  v_recs := jsonb_build_array();
  IF v_total_jobs > 0 AND v_failed_jobs::numeric/v_total_jobs > 0.5 THEN
    v_recs := v_recs || jsonb_build_object('priority','critical','action','investigate_worker_pool','reason','job error rate > 50%');
  END IF;
  IF v_automation_rate < 0.2 AND v_decisions_total > 10 THEN
    v_recs := v_recs || jsonb_build_object('priority','medium','action','raise_trust_thresholds','reason','automation_rate < 20%');
  END IF;
  IF v_recovery_rate < 0.5 AND v_recoveries_total > 5 THEN
    v_recs := v_recs || jsonb_build_object('priority','high','action','review_recovery_policies','reason','recovery_rate < 50%');
  END IF;
  IF jsonb_array_length(v_recs) = 0 THEN
    v_recs := v_recs || jsonb_build_object('priority','low','action','maintain_current_policies','reason','system within nominal');
  END IF;

  INSERT INTO public.mcl_meta_metric_reports (
    name, report_window, health_score, automation_rate, decision_accuracy_score,
    revenue_per_execution, recovery_success_rate, key_failures, key_recommendations
  ) VALUES (
    'meta_' || _window || '_' || to_char(now(), 'YYYYMMDD_HH24MI'),
    _window, v_health, v_automation_rate, v_decision_acc,
    v_rev_per_exec, v_recovery_rate, v_failures, v_recs
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- RPC: Auto-archive dead assets (selection layer)
CREATE OR REPLACE FUNCTION public.mcl_run_selection_sweep()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int := 0;
  v_asset record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin role required';
  END IF;

  FOR v_asset IN
    SELECT a.id, a.title FROM public.knowledge_assets a
    LEFT JOIN public.asset_licenses l ON l.asset_id = a.id
    WHERE a.created_at < now() - interval '30 days'
      AND l.id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.mcl_selection_events s
        WHERE s.target_entity_reference = a.id::text
          AND s.created_at > now() - interval '7 days'
      )
    LIMIT 100
  LOOP
    INSERT INTO public.mcl_selection_events (
      name, target_entity_type, target_entity_reference, selection_action,
      selection_reason, evidence_summary, expected_impact
    ) VALUES (
      'archive_dead_asset_' || substr(v_asset.id::text, 1, 8),
      'knowledge_asset', v_asset.id::text, 'archive',
      'No licenses sold in 30+ days',
      jsonb_build_object('asset_title', v_asset.title, 'days_unsold', 30, 'license_count', 0),
      jsonb_build_object('action', 'reduce_visibility', 'free_storage', true)
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
