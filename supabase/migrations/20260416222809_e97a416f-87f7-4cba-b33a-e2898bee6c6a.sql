DROP FUNCTION IF EXISTS public.mcl_compute_liability();
DROP FUNCTION IF EXISTS public.mcl_compute_break_even();

CREATE OR REPLACE FUNCTION public.mcl_compute_liability()
RETURNS TABLE(total_credits_sold bigint, total_credits_consumed bigint, outstanding_credits bigint, liability_eur numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_per_credit numeric;
  v_sold bigint;
  v_consumed bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.008)
    INTO v_cost_per_credit
  FROM public.billing_config
  WHERE config_key = 'cost_per_credit_eur'
  LIMIT 1;
  IF v_cost_per_credit IS NULL THEN v_cost_per_credit := 0.008; END IF;

  SELECT COALESCE(SUM(amount), 0)::bigint INTO v_sold
  FROM public.credit_transactions
  WHERE amount > 0 AND type IN ('purchase','grant','bonus','topup','refund');

  SELECT COALESCE(SUM(ABS(amount)), 0)::bigint INTO v_consumed
  FROM public.credit_transactions
  WHERE amount < 0;

  RETURN QUERY SELECT
    v_sold,
    v_consumed,
    GREATEST(v_sold - v_consumed, 0)::bigint,
    (GREATEST(v_sold - v_consumed, 0)::numeric * v_cost_per_credit);
END;
$$;

CREATE OR REPLACE FUNCTION public.mcl_compute_break_even()
RETURNS TABLE(
  monthly_fixed_cost_eur numeric,
  avg_revenue_per_credit_eur numeric,
  avg_cost_per_credit_eur numeric,
  contribution_margin_per_credit numeric,
  break_even_credits numeric,
  break_even_revenue_eur numeric,
  current_30d_credits bigint,
  margin_of_safety_pct numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fixed numeric;
  v_revenue_per numeric;
  v_cost_per numeric;
  v_margin numeric;
  v_bep_credits numeric;
  v_current bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 5000)
    INTO v_fixed FROM public.billing_config WHERE config_key='monthly_fixed_cost_eur' LIMIT 1;
  IF v_fixed IS NULL THEN v_fixed := 5000; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.01)
    INTO v_revenue_per FROM public.billing_config WHERE config_key='revenue_per_credit_eur' LIMIT 1;
  IF v_revenue_per IS NULL THEN v_revenue_per := 0.01; END IF;

  SELECT COALESCE((config_value->>'eur')::numeric, 0.008)
    INTO v_cost_per FROM public.billing_config WHERE config_key='cost_per_credit_eur' LIMIT 1;
  IF v_cost_per IS NULL THEN v_cost_per := 0.008; END IF;

  v_margin := v_revenue_per - v_cost_per;
  v_bep_credits := CASE WHEN v_margin > 0 THEN v_fixed / v_margin ELSE NULL END;

  SELECT COALESCE(SUM(ABS(amount)), 0)::bigint INTO v_current
  FROM public.credit_transactions
  WHERE amount < 0 AND created_at >= now() - interval '30 days';

  RETURN QUERY SELECT
    v_fixed,
    v_revenue_per,
    v_cost_per,
    v_margin,
    v_bep_credits,
    CASE WHEN v_bep_credits IS NOT NULL THEN v_bep_credits * v_revenue_per ELSE NULL END,
    v_current,
    CASE WHEN v_bep_credits IS NOT NULL AND v_bep_credits > 0
      THEN ((v_current::numeric - v_bep_credits) / v_bep_credits) * 100
      ELSE NULL END;
END;
$$;