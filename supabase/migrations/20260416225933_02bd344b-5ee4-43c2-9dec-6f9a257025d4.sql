CREATE OR REPLACE FUNCTION public.mcl_cron_meta_report()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_window_start timestamptz := now() - interval '1 day';
  v_total_jobs int; v_failed_jobs int;
  v_decisions_total int; v_decisions_resolved int;
  v_recoveries_total int; v_recoveries_resolved int;
  v_total_cost numeric; v_total_executions int;
  v_health numeric; v_automation_rate numeric;
  v_decision_acc numeric; v_rev_per_exec numeric; v_recovery_rate numeric;
  v_failures jsonb; v_recs jsonb := '[]'::jsonb;
BEGIN
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
          WHERE created_at >= v_window_start AND status = 'auto_executed') ELSE 0 END;
  v_decision_acc := CASE WHEN v_decisions_total > 0 THEN v_decisions_resolved::numeric / v_decisions_total ELSE 0 END;
  v_recovery_rate := CASE WHEN v_recoveries_total > 0 THEN v_recoveries_resolved::numeric / v_recoveries_total ELSE 0 END;
  v_rev_per_exec := CASE WHEN v_total_executions > 0 THEN -v_total_cost / v_total_executions ELSE 0 END;

  v_health := round((
    (v_recovery_rate * 3.0) + (v_automation_rate * 2.5) + (v_decision_acc * 2.5) +
    (CASE WHEN v_total_jobs > 0 THEN (1 - v_failed_jobs::numeric/v_total_jobs) ELSE 1 END * 2.0)
  )::numeric, 2);

  v_failures := jsonb_build_object(
    'failed_jobs', v_failed_jobs,
    'job_error_rate', CASE WHEN v_total_jobs > 0 THEN round(v_failed_jobs::numeric/v_total_jobs, 3) ELSE 0 END,
    'unresolved_recoveries', v_recoveries_total - v_recoveries_resolved
  );

  IF v_total_jobs > 0 AND v_failed_jobs::numeric/v_total_jobs > 0.5 THEN
    v_recs := v_recs || jsonb_build_object('priority','critical','action','investigate_worker_pool');
  END IF;
  IF v_automation_rate < 0.2 AND v_decisions_total > 10 THEN
    v_recs := v_recs || jsonb_build_object('priority','medium','action','raise_trust_thresholds');
  END IF;
  IF v_recovery_rate < 0.5 AND v_recoveries_total > 5 THEN
    v_recs := v_recs || jsonb_build_object('priority','high','action','review_recovery_policies');
  END IF;
  IF jsonb_array_length(v_recs) = 0 THEN
    v_recs := jsonb_build_array(jsonb_build_object('priority','low','action','maintain_current_policies'));
  END IF;

  INSERT INTO public.mcl_meta_metric_reports (
    code, name, report_window, health_score, automation_rate, decision_accuracy_score,
    revenue_per_execution, recovery_success_rate, key_failures, key_recommendations
  ) VALUES (
    'MMR-CRON-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
    'cron_daily_' || to_char(now(), 'YYYYMMDD'),
    'daily', v_health, v_automation_rate, v_decision_acc,
    v_rev_per_exec, v_recovery_rate, v_failures, v_recs
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mcl_generate_meta_report(_window text DEFAULT 'daily'::text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_window_start timestamptz;
  v_total_jobs int; v_failed_jobs int;
  v_decisions_total int; v_decisions_resolved int;
  v_recoveries_total int; v_recoveries_resolved int;
  v_total_cost numeric; v_total_executions int;
  v_health numeric; v_automation_rate numeric;
  v_decision_acc numeric; v_rev_per_exec numeric; v_recovery_rate numeric;
  v_failures jsonb; v_recs jsonb := '[]'::jsonb;
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
          WHERE created_at >= v_window_start AND status = 'auto_executed') ELSE 0 END;
  v_decision_acc := CASE WHEN v_decisions_total > 0 THEN v_decisions_resolved::numeric / v_decisions_total ELSE 0 END;
  v_recovery_rate := CASE WHEN v_recoveries_total > 0 THEN v_recoveries_resolved::numeric / v_recoveries_total ELSE 0 END;
  v_rev_per_exec := CASE WHEN v_total_executions > 0 THEN -v_total_cost / v_total_executions ELSE 0 END;

  v_health := round((
    (v_recovery_rate * 3.0) + (v_automation_rate * 2.5) + (v_decision_acc * 2.5) +
    (CASE WHEN v_total_jobs > 0 THEN (1 - v_failed_jobs::numeric/v_total_jobs) ELSE 1 END * 2.0)
  )::numeric, 2);

  v_failures := jsonb_build_object(
    'failed_jobs', v_failed_jobs,
    'job_error_rate', CASE WHEN v_total_jobs > 0 THEN round(v_failed_jobs::numeric/v_total_jobs, 3) ELSE 0 END,
    'unresolved_recoveries', v_recoveries_total - v_recoveries_resolved
  );

  IF v_total_jobs > 0 AND v_failed_jobs::numeric/v_total_jobs > 0.5 THEN
    v_recs := v_recs || jsonb_build_object('priority','critical','action','investigate_worker_pool');
  END IF;
  IF v_automation_rate < 0.2 AND v_decisions_total > 10 THEN
    v_recs := v_recs || jsonb_build_object('priority','medium','action','raise_trust_thresholds');
  END IF;
  IF v_recovery_rate < 0.5 AND v_recoveries_total > 5 THEN
    v_recs := v_recs || jsonb_build_object('priority','high','action','review_recovery_policies');
  END IF;
  IF jsonb_array_length(v_recs) = 0 THEN
    v_recs := jsonb_build_array(jsonb_build_object('priority','low','action','maintain_current_policies'));
  END IF;

  INSERT INTO public.mcl_meta_metric_reports (
    code, name, report_window, health_score, automation_rate, decision_accuracy_score,
    revenue_per_execution, recovery_success_rate, key_failures, key_recommendations
  ) VALUES (
    'MMR-' || upper(_window) || '-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
    'manual_' || _window || '_' || to_char(now(), 'YYYYMMDD-HH24MISS'),
    _window, v_health, v_automation_rate, v_decision_acc,
    v_rev_per_exec, v_recovery_rate, v_failures, v_recs
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;