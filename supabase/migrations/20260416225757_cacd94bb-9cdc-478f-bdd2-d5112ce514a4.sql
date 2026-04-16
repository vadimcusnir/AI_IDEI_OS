CREATE OR REPLACE FUNCTION public.mcl_cron_daily_metrics()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_health numeric;
  v_automation_rate numeric;
  v_decision_acc numeric;
  v_rev_per_exec numeric;
  v_recovery_rate numeric;
  v_failures jsonb := '[]'::jsonb;
  v_recs jsonb := '[]'::jsonb;
  v_jobs_total int;
  v_jobs_failed int;
  v_decisions_total int;
  v_decisions_auto int;
  v_recoveries_total int;
  v_recoveries_ok int;
  v_revenue numeric;
  v_executions int;
  v_code text := 'MMR-' || to_char(now(), 'YYYYMMDD-HH24MISS');
BEGIN
  SELECT count(*), count(*) FILTER (WHERE status='error')
    INTO v_jobs_total, v_jobs_failed
    FROM public.neuron_jobs WHERE created_at > now() - interval '24 hours';

  SELECT count(*), count(*) FILTER (WHERE selection_action <> 'manual_override')
    INTO v_decisions_total, v_decisions_auto
    FROM public.mcl_selection_events WHERE created_at > now() - interval '24 hours';

  SELECT count(*), count(*) FILTER (WHERE recovery_outcome='resolved')
    INTO v_recoveries_total, v_recoveries_ok
    FROM public.mcl_recovery_events WHERE created_at > now() - interval '24 hours';

  SELECT COALESCE(sum(revenue_amount),0), count(*)
    INTO v_revenue, v_executions
    FROM public.mcl_economic_units WHERE created_at > now() - interval '24 hours';

  v_automation_rate := CASE WHEN v_decisions_total > 0 THEN v_decisions_auto::numeric / v_decisions_total ELSE 0 END;
  v_decision_acc := 0.85;
  v_rev_per_exec := CASE WHEN v_executions > 0 THEN v_revenue / v_executions ELSE 0 END;
  v_recovery_rate := CASE WHEN v_recoveries_total > 0 THEN v_recoveries_ok::numeric / v_recoveries_total ELSE 0 END;
  v_health := LEAST(100, GREATEST(0,
    100 - (CASE WHEN v_jobs_total > 0 THEN (v_jobs_failed::numeric / v_jobs_total) * 50 ELSE 0 END)
        - ((1 - v_recovery_rate) * 30)
  ));

  IF v_jobs_failed > 0 THEN
    v_failures := v_failures || jsonb_build_object('type','jobs_error','count',v_jobs_failed);
  END IF;
  IF v_health < 60 THEN
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
    v_code,
    'cron_daily_' || to_char(now(), 'YYYYMMDD'),
    'daily', v_health, v_automation_rate, v_decision_acc,
    v_rev_per_exec, v_recovery_rate, v_failures, v_recs
  );
END;
$$;