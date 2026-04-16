-- Liability: also INSERT snapshot
CREATE OR REPLACE FUNCTION public.mcl_compute_liability()
RETURNS TABLE(total_credits_sold bigint, total_credits_consumed bigint, outstanding_credits bigint, liability_eur numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_per numeric;
  v_sold bigint;
  v_consumed bigint;
  v_outstanding bigint;
  v_burn_30d bigint;
  v_burn_per_day numeric;
  v_redemption numeric;
  v_days numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.008) INTO v_cost_per
  FROM public.billing_config WHERE config_key='cost_per_credit_eur' LIMIT 1;
  IF v_cost_per IS NULL THEN v_cost_per := 0.008; END IF;

  SELECT COALESCE(SUM(amount),0)::bigint INTO v_sold
  FROM public.credit_transactions WHERE amount>0 AND type IN ('purchase','grant','bonus','topup','refund');

  SELECT COALESCE(SUM(ABS(amount)),0)::bigint INTO v_consumed
  FROM public.credit_transactions WHERE amount<0;

  v_outstanding := GREATEST(v_sold - v_consumed, 0);

  SELECT COALESCE(SUM(ABS(amount)),0)::bigint INTO v_burn_30d
  FROM public.credit_transactions
  WHERE amount<0 AND created_at >= now() - interval '30 days';

  v_burn_per_day := v_burn_30d::numeric / 30.0;
  v_redemption := CASE WHEN v_sold > 0 THEN v_consumed::numeric / v_sold::numeric ELSE 0 END;
  v_days := CASE WHEN v_burn_per_day > 0 THEN v_outstanding::numeric / v_burn_per_day ELSE NULL END;

  INSERT INTO public.mcl_internal_liability(
    credits_outstanding, estimated_redemption_cost_eur, liability_per_credit_eur,
    redemption_rate_30d, expected_burn_rate_per_day, days_to_full_burn, metadata
  ) VALUES (
    v_outstanding, v_outstanding::numeric * v_cost_per, v_cost_per,
    v_redemption, v_burn_per_day, v_days,
    jsonb_build_object('sold', v_sold, 'consumed', v_consumed, 'burn_30d', v_burn_30d)
  );

  RETURN QUERY SELECT v_sold, v_consumed, v_outstanding, v_outstanding::numeric * v_cost_per;
END;
$$;

-- Break-even: also INSERT snapshot
CREATE OR REPLACE FUNCTION public.mcl_compute_break_even()
RETURNS TABLE(
  monthly_fixed_cost_eur numeric, avg_revenue_per_credit_eur numeric, avg_cost_per_credit_eur numeric,
  contribution_margin_per_credit numeric, break_even_credits numeric, break_even_revenue_eur numeric,
  current_30d_credits bigint, margin_of_safety_pct numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fixed numeric; v_rev_per numeric; v_cost_per numeric; v_margin numeric;
  v_bep_credits numeric; v_current bigint; v_mos numeric; v_var_cost numeric; v_revenue numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 5000) INTO v_fixed
  FROM public.billing_config WHERE config_key='monthly_fixed_cost_eur' LIMIT 1;
  IF v_fixed IS NULL THEN v_fixed := 5000; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.01) INTO v_rev_per
  FROM public.billing_config WHERE config_key='revenue_per_credit_eur' LIMIT 1;
  IF v_rev_per IS NULL THEN v_rev_per := 0.01; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.008) INTO v_cost_per
  FROM public.billing_config WHERE config_key='cost_per_credit_eur' LIMIT 1;
  IF v_cost_per IS NULL THEN v_cost_per := 0.008; END IF;

  v_margin := v_rev_per - v_cost_per;
  v_bep_credits := CASE WHEN v_margin > 0 THEN v_fixed / v_margin ELSE NULL END;

  SELECT COALESCE(SUM(ABS(amount)),0)::bigint INTO v_current
  FROM public.credit_transactions
  WHERE amount<0 AND created_at >= now() - interval '30 days';

  v_mos := CASE WHEN v_bep_credits IS NOT NULL AND v_bep_credits>0
    THEN ((v_current::numeric - v_bep_credits) / v_bep_credits) * 100 ELSE NULL END;

  v_var_cost := v_current::numeric * v_cost_per;
  v_revenue := v_current::numeric * v_rev_per;

  INSERT INTO public.mcl_break_even_state(
    period_month, total_fixed_cost_eur, total_variable_cost_eur, total_revenue_eur,
    unit_revenue_eur, unit_variable_cost_eur, contribution_margin_per_unit, contribution_margin_pct,
    break_even_units, break_even_revenue_eur, current_units_sold, margin_of_safety_pct, status, metadata
  ) VALUES (
    date_trunc('month', now())::date, v_fixed, v_var_cost, v_revenue,
    v_rev_per, v_cost_per, v_margin,
    CASE WHEN v_rev_per > 0 THEN (v_margin / v_rev_per) * 100 ELSE 0 END,
    v_bep_credits, CASE WHEN v_bep_credits IS NOT NULL THEN v_bep_credits * v_rev_per ELSE NULL END,
    v_current, v_mos, 'computed',
    jsonb_build_object('source','mcl_compute_break_even','window','30d')
  );

  RETURN QUERY SELECT v_fixed, v_rev_per, v_cost_per, v_margin, v_bep_credits,
    CASE WHEN v_bep_credits IS NOT NULL THEN v_bep_credits * v_rev_per ELSE NULL END,
    v_current, v_mos;
END;
$$;

-- Unit economics: aggregate per service_key (last 30d)
CREATE OR REPLACE FUNCTION public.mcl_compute_unit_economics()
RETURNS TABLE(services_computed integer, total_revenue_eur numeric, total_cost_eur numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rev_per numeric; v_cost_per numeric;
  v_count integer := 0; v_total_rev numeric := 0; v_total_cost numeric := 0;
  v_period date := date_trunc('month', now())::date;
  rec record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'unauthorized'; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.01) INTO v_rev_per
  FROM public.billing_config WHERE config_key='revenue_per_credit_eur' LIMIT 1;
  IF v_rev_per IS NULL THEN v_rev_per := 0.01; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.008) INTO v_cost_per
  FROM public.billing_config WHERE config_key='cost_per_credit_eur' LIMIT 1;
  IF v_cost_per IS NULL THEN v_cost_per := 0.008; END IF;

  -- delete prior snapshots of this period to avoid duplicates
  DELETE FROM public.mcl_unit_economics WHERE period_month = v_period;

  FOR rec IN
    SELECT COALESCE(service_key,'unattributed') AS svc, COUNT(*) AS units, SUM(ABS(amount))::numeric AS credits
    FROM public.credit_transactions
    WHERE amount<0 AND created_at >= date_trunc('month', now())
    GROUP BY COALESCE(service_key,'unattributed')
  LOOP
    INSERT INTO public.mcl_unit_economics(
      service_key, period_month, units_sold, revenue_eur, direct_cost_eur, allocated_cost_eur,
      total_cost_eur, contribution_margin_eur, contribution_margin_pct,
      cost_per_unit_eur, revenue_per_unit_eur, margin_per_unit_eur, status, metadata
    ) VALUES (
      rec.svc, v_period, rec.units,
      rec.credits * v_rev_per,
      rec.credits * v_cost_per, 0,
      rec.credits * v_cost_per,
      rec.credits * (v_rev_per - v_cost_per),
      CASE WHEN v_rev_per > 0 THEN ((v_rev_per - v_cost_per) / v_rev_per) * 100 ELSE 0 END,
      CASE WHEN rec.units > 0 THEN (rec.credits * v_cost_per) / rec.units ELSE 0 END,
      CASE WHEN rec.units > 0 THEN (rec.credits * v_rev_per) / rec.units ELSE 0 END,
      CASE WHEN rec.units > 0 THEN (rec.credits * (v_rev_per - v_cost_per)) / rec.units ELSE 0 END,
      'computed',
      jsonb_build_object('credits', rec.credits)
    );
    v_count := v_count + 1;
    v_total_rev := v_total_rev + rec.credits * v_rev_per;
    v_total_cost := v_total_cost + rec.credits * v_cost_per;
  END LOOP;

  RETURN QUERY SELECT v_count, v_total_rev, v_total_cost;
END;
$$;