-- ═══════════════════════════════════════════════════════════════
-- COST ENGINE — extends MCL with full 14-model economic infrastructure
-- ═══════════════════════════════════════════════════════════════

-- 1. Cost categories registry (14 canonical domains)
CREATE TABLE IF NOT EXISTS public.mcl_cost_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  domain text NOT NULL CHECK (domain IN (
    'frontend','backend','ai_inference','infrastructure','storage',
    'observability','security','payments','support','dev_maintenance',
    'fraud_abuse','internal_liability','marketing','taxes_legal'
  )),
  cost_type text NOT NULL DEFAULT 'recurring' CHECK (cost_type IN ('one_time','recurring','variable','fixed','allocated')),
  unit text NOT NULL DEFAULT 'EUR',
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mcl_cost_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_cost_categories admin all"
  ON public.mcl_cost_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Cost ledger — every recorded cost event
CREATE TABLE IF NOT EXISTS public.mcl_cost_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.mcl_cost_categories(id) ON DELETE RESTRICT,
  category_key text NOT NULL,
  source text NOT NULL,  -- 'llm_call', 'edge_invocation', 'storage_gb', 'infra_hour', 'refund', 'fraud_loss', 'manual'
  source_ref text,        -- job_id, transaction_id, etc.
  amount_eur numeric(18,6) NOT NULL DEFAULT 0,
  amount_currency text DEFAULT 'EUR',
  fx_rate numeric(18,8) DEFAULT 1.0,
  quantity numeric(18,6) DEFAULT 1.0,  -- tokens, ms, GB
  unit_cost numeric(18,8) DEFAULT 0,
  is_direct boolean DEFAULT true,       -- direct vs allocated
  is_economic boolean DEFAULT false,    -- accounting (false) vs economic/opportunity (true)
  user_id uuid,                         -- if attributable
  service_key text,                     -- if attributable
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcl_cost_ledger_occurred ON public.mcl_cost_ledger(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcl_cost_ledger_category ON public.mcl_cost_ledger(category_key);
CREATE INDEX IF NOT EXISTS idx_mcl_cost_ledger_source ON public.mcl_cost_ledger(source);
CREATE INDEX IF NOT EXISTS idx_mcl_cost_ledger_user ON public.mcl_cost_ledger(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.mcl_cost_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_cost_ledger admin select"
  ON public.mcl_cost_ledger FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "mcl_cost_ledger admin insert"
  ON public.mcl_cost_ledger FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. Cost inputs — monthly assumptions per category
CREATE TABLE IF NOT EXISTS public.mcl_cost_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL,
  period_month date NOT NULL,           -- first day of month
  expected_volume numeric(18,6) DEFAULT 0,
  unit_cost numeric(18,8) DEFAULT 0,
  total_budget_eur numeric(18,2) DEFAULT 0,
  fx_rate numeric(18,8) DEFAULT 1.0,
  status text DEFAULT 'active' CHECK (status IN ('active','draft','archived','no_data')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (category_key, period_month)
);

ALTER TABLE public.mcl_cost_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_cost_inputs admin all"
  ON public.mcl_cost_inputs FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Internal liability — sold credits not yet consumed
CREATE TABLE IF NOT EXISTS public.mcl_internal_liability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at timestamptz DEFAULT now(),
  credits_outstanding numeric(18,4) DEFAULT 0,        -- total credits sold but not redeemed
  estimated_redemption_cost_eur numeric(18,2) DEFAULT 0,
  liability_per_credit_eur numeric(18,8) DEFAULT 0,
  redemption_rate_30d numeric(6,4) DEFAULT 0,         -- 0..1
  expected_burn_rate_per_day numeric(18,4) DEFAULT 0,
  days_to_full_burn numeric(10,2),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mcl_internal_liability_snapshot ON public.mcl_internal_liability(snapshot_at DESC);

ALTER TABLE public.mcl_internal_liability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_internal_liability admin all"
  ON public.mcl_internal_liability FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Break-even state snapshots
CREATE TABLE IF NOT EXISTS public.mcl_break_even_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computed_at timestamptz DEFAULT now(),
  period_month date NOT NULL,
  total_fixed_cost_eur numeric(18,2) DEFAULT 0,
  total_variable_cost_eur numeric(18,2) DEFAULT 0,
  total_revenue_eur numeric(18,2) DEFAULT 0,
  unit_revenue_eur numeric(18,8) DEFAULT 0,           -- avg revenue per credit
  unit_variable_cost_eur numeric(18,8) DEFAULT 0,     -- avg variable cost per credit
  contribution_margin_per_unit numeric(18,8) DEFAULT 0,
  contribution_margin_pct numeric(8,4) DEFAULT 0,
  break_even_units numeric(18,4),                      -- credits needed to BE
  break_even_revenue_eur numeric(18,2),
  current_units_sold numeric(18,4) DEFAULT 0,
  margin_of_safety_pct numeric(8,4),
  status text DEFAULT 'computed',
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mcl_break_even_period ON public.mcl_break_even_state(period_month DESC, computed_at DESC);

ALTER TABLE public.mcl_break_even_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_break_even_state admin all"
  ON public.mcl_break_even_state FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 6. Cost scenarios — what-if templates
CREATE TABLE IF NOT EXISTS public.mcl_cost_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  scenario_type text DEFAULT 'base' CHECK (scenario_type IN ('low','base','high','custom','stress')),
  assumptions jsonb NOT NULL DEFAULT '{}'::jsonb,    -- {volume_multiplier, cost_multiplier, churn, ...}
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mcl_cost_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_cost_scenarios admin all"
  ON public.mcl_cost_scenarios FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. Scenario results — persisted simulations
CREATE TABLE IF NOT EXISTS public.mcl_cost_scenario_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES public.mcl_cost_scenarios(id) ON DELETE CASCADE,
  scenario_key text NOT NULL,
  computed_at timestamptz DEFAULT now(),
  period_month date NOT NULL,
  total_cost_eur numeric(18,2),
  total_revenue_eur numeric(18,2),
  margin_eur numeric(18,2),
  margin_pct numeric(8,4),
  break_even_units numeric(18,4),
  sensitivity_data jsonb DEFAULT '{}'::jsonb,
  triggered_by uuid                                    -- admin who ran sim
);

CREATE INDEX IF NOT EXISTS idx_mcl_scenario_results_scenario ON public.mcl_cost_scenario_results(scenario_id, computed_at DESC);

ALTER TABLE public.mcl_cost_scenario_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_cost_scenario_results admin all"
  ON public.mcl_cost_scenario_results FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. Unit economics — per-service P&L
CREATE TABLE IF NOT EXISTS public.mcl_unit_economics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key text NOT NULL,
  period_month date NOT NULL,
  units_sold numeric(18,4) DEFAULT 0,
  revenue_eur numeric(18,2) DEFAULT 0,
  direct_cost_eur numeric(18,2) DEFAULT 0,
  allocated_cost_eur numeric(18,2) DEFAULT 0,
  total_cost_eur numeric(18,2) DEFAULT 0,
  contribution_margin_eur numeric(18,2) DEFAULT 0,
  contribution_margin_pct numeric(8,4) DEFAULT 0,
  cost_per_unit_eur numeric(18,8) DEFAULT 0,
  revenue_per_unit_eur numeric(18,8) DEFAULT 0,
  margin_per_unit_eur numeric(18,8) DEFAULT 0,
  status text DEFAULT 'computed',
  metadata jsonb DEFAULT '{}'::jsonb,
  computed_at timestamptz DEFAULT now(),
  UNIQUE (service_key, period_month)
);

CREATE INDEX IF NOT EXISTS idx_mcl_unit_economics_period ON public.mcl_unit_economics(period_month DESC);

ALTER TABLE public.mcl_unit_economics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcl_unit_economics admin all"
  ON public.mcl_unit_economics FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- RPC FUNCTIONS — economic engine
-- ═══════════════════════════════════════════════════════════════

-- Compute internal liability snapshot (sold-but-unconsumed credits)
CREATE OR REPLACE FUNCTION public.mcl_compute_liability()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_outstanding numeric;
  v_per_credit_cost numeric;
  v_estimated_cost numeric;
  v_redemption_rate numeric;
  v_burn_per_day numeric;
  v_days numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  -- outstanding credits = sum of user_credits balance
  SELECT COALESCE(SUM(balance), 0) INTO v_outstanding
  FROM public.user_credits WHERE balance > 0;

  -- per-credit cost: read from billing_config or use default 0.01 EUR
  SELECT COALESCE((config_value->>'eur_per_credit')::numeric, 0.01) INTO v_per_credit_cost
  FROM public.billing_config WHERE config_key = 'cost_per_credit_eur';
  IF v_per_credit_cost IS NULL THEN v_per_credit_cost := 0.01; END IF;

  v_estimated_cost := v_outstanding * v_per_credit_cost;

  -- redemption rate over last 30 days
  SELECT COALESCE(
    SUM(CASE WHEN transaction_type = 'spend' THEN ABS(amount) ELSE 0 END) /
    NULLIF(SUM(CASE WHEN transaction_type IN ('grant','purchase') THEN amount ELSE 0 END), 0),
    0
  ) INTO v_redemption_rate
  FROM public.credit_transactions
  WHERE created_at > now() - interval '30 days';

  -- burn per day
  SELECT COALESCE(SUM(ABS(amount)), 0) / 30.0 INTO v_burn_per_day
  FROM public.credit_transactions
  WHERE transaction_type = 'spend' AND created_at > now() - interval '30 days';

  v_days := CASE WHEN v_burn_per_day > 0 THEN v_outstanding / v_burn_per_day ELSE NULL END;

  INSERT INTO public.mcl_internal_liability(
    credits_outstanding, estimated_redemption_cost_eur, liability_per_credit_eur,
    redemption_rate_30d, expected_burn_rate_per_day, days_to_full_burn
  ) VALUES (
    v_outstanding, v_estimated_cost, v_per_credit_cost,
    v_redemption_rate, v_burn_per_day, v_days
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Compute break-even for current month
CREATE OR REPLACE FUNCTION public.mcl_compute_break_even(_period date DEFAULT date_trunc('month', now())::date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_fixed numeric;
  v_variable numeric;
  v_revenue numeric;
  v_units numeric;
  v_unit_revenue numeric;
  v_unit_var_cost numeric;
  v_cm_per_unit numeric;
  v_cm_pct numeric;
  v_be_units numeric;
  v_be_revenue numeric;
  v_mos numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  -- Fixed costs (one_time + fixed) from inputs for the period
  SELECT COALESCE(SUM(total_budget_eur), 0) INTO v_fixed
  FROM public.mcl_cost_inputs i
  JOIN public.mcl_cost_categories c ON c.category_key = i.category_key
  WHERE i.period_month = _period AND c.cost_type IN ('one_time','fixed','allocated');

  -- Variable costs from ledger for the period
  SELECT COALESCE(SUM(amount_eur), 0) INTO v_variable
  FROM public.mcl_cost_ledger l
  JOIN public.mcl_cost_categories c ON c.category_key = l.category_key
  WHERE date_trunc('month', l.occurred_at) = _period AND c.cost_type IN ('variable','recurring');

  -- Revenue from credit_transactions purchases
  SELECT COALESCE(SUM(amount * COALESCE((metadata->>'eur_per_credit')::numeric, 0.01)), 0),
         COALESCE(SUM(amount), 0)
  INTO v_revenue, v_units
  FROM public.credit_transactions
  WHERE transaction_type = 'purchase'
    AND date_trunc('month', created_at) = _period;

  IF v_units > 0 THEN
    v_unit_revenue := v_revenue / v_units;
    v_unit_var_cost := v_variable / v_units;
  ELSE
    v_unit_revenue := 0;
    v_unit_var_cost := 0;
  END IF;

  v_cm_per_unit := v_unit_revenue - v_unit_var_cost;
  v_cm_pct := CASE WHEN v_unit_revenue > 0 THEN (v_cm_per_unit / v_unit_revenue) * 100 ELSE 0 END;
  v_be_units := CASE WHEN v_cm_per_unit > 0 THEN v_fixed / v_cm_per_unit ELSE NULL END;
  v_be_revenue := CASE WHEN v_be_units IS NOT NULL THEN v_be_units * v_unit_revenue ELSE NULL END;
  v_mos := CASE WHEN v_be_revenue > 0 AND v_revenue > 0 THEN ((v_revenue - v_be_revenue) / v_revenue) * 100 ELSE NULL END;

  INSERT INTO public.mcl_break_even_state(
    period_month, total_fixed_cost_eur, total_variable_cost_eur, total_revenue_eur,
    unit_revenue_eur, unit_variable_cost_eur, contribution_margin_per_unit, contribution_margin_pct,
    break_even_units, break_even_revenue_eur, current_units_sold, margin_of_safety_pct
  ) VALUES (
    _period, v_fixed, v_variable, v_revenue,
    v_unit_revenue, v_unit_var_cost, v_cm_per_unit, v_cm_pct,
    v_be_units, v_be_revenue, v_units, v_mos
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Run scenario simulation
CREATE OR REPLACE FUNCTION public.mcl_run_scenario(_scenario_key text, _period date DEFAULT date_trunc('month', now())::date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scenario record;
  v_result_id uuid;
  v_vol_mult numeric;
  v_cost_mult numeric;
  v_price_mult numeric;
  v_base_cost numeric;
  v_base_revenue numeric;
  v_sim_cost numeric;
  v_sim_revenue numeric;
  v_margin numeric;
  v_margin_pct numeric;
  v_be_units numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  SELECT * INTO v_scenario FROM public.mcl_cost_scenarios WHERE scenario_key = _scenario_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'Scenario not found: %', _scenario_key; END IF;

  v_vol_mult := COALESCE((v_scenario.assumptions->>'volume_multiplier')::numeric, 1.0);
  v_cost_mult := COALESCE((v_scenario.assumptions->>'cost_multiplier')::numeric, 1.0);
  v_price_mult := COALESCE((v_scenario.assumptions->>'price_multiplier')::numeric, 1.0);

  SELECT COALESCE(SUM(amount_eur), 0) INTO v_base_cost
  FROM public.mcl_cost_ledger
  WHERE date_trunc('month', occurred_at) = _period;

  SELECT COALESCE(SUM(amount * COALESCE((metadata->>'eur_per_credit')::numeric, 0.01)), 0)
  INTO v_base_revenue
  FROM public.credit_transactions
  WHERE transaction_type = 'purchase' AND date_trunc('month', created_at) = _period;

  v_sim_cost := v_base_cost * v_cost_mult * v_vol_mult;
  v_sim_revenue := v_base_revenue * v_price_mult * v_vol_mult;
  v_margin := v_sim_revenue - v_sim_cost;
  v_margin_pct := CASE WHEN v_sim_revenue > 0 THEN (v_margin / v_sim_revenue) * 100 ELSE 0 END;

  INSERT INTO public.mcl_cost_scenario_results(
    scenario_id, scenario_key, period_month,
    total_cost_eur, total_revenue_eur, margin_eur, margin_pct,
    sensitivity_data, triggered_by
  ) VALUES (
    v_scenario.id, _scenario_key, _period,
    v_sim_cost, v_sim_revenue, v_margin, v_margin_pct,
    jsonb_build_object(
      'base_cost', v_base_cost, 'base_revenue', v_base_revenue,
      'volume_mult', v_vol_mult, 'cost_mult', v_cost_mult, 'price_mult', v_price_mult
    ),
    auth.uid()
  ) RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$$;

-- Compute unit economics per service
CREATE OR REPLACE FUNCTION public.mcl_compute_unit_economics(_period date DEFAULT date_trunc('month', now())::date)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_service record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  FOR v_service IN
    SELECT 
      l.service_key,
      COUNT(*) AS units_sold,
      SUM(l.amount_eur) AS direct_cost
    FROM public.mcl_cost_ledger l
    WHERE l.service_key IS NOT NULL
      AND date_trunc('month', l.occurred_at) = _period
    GROUP BY l.service_key
  LOOP
    INSERT INTO public.mcl_unit_economics(
      service_key, period_month, units_sold, direct_cost_eur, total_cost_eur,
      cost_per_unit_eur
    ) VALUES (
      v_service.service_key, _period, v_service.units_sold, 
      v_service.direct_cost, v_service.direct_cost,
      v_service.direct_cost / NULLIF(v_service.units_sold, 0)
    )
    ON CONFLICT (service_key, period_month) DO UPDATE SET
      units_sold = EXCLUDED.units_sold,
      direct_cost_eur = EXCLUDED.direct_cost_eur,
      total_cost_eur = EXCLUDED.total_cost_eur,
      cost_per_unit_eur = EXCLUDED.cost_per_unit_eur,
      computed_at = now();
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- LIVE HOOKS — extract costs from existing economic activity
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.mcl_hook_credit_spend_to_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_per_credit numeric := 0.01;
  v_eur_cost numeric;
BEGIN
  IF NEW.transaction_type = 'spend' AND NEW.amount < 0 THEN
    SELECT COALESCE((config_value->>'eur_per_credit')::numeric, 0.01) INTO v_cost_per_credit
    FROM public.billing_config WHERE config_key = 'cost_per_credit_eur';
    IF v_cost_per_credit IS NULL THEN v_cost_per_credit := 0.01; END IF;
    
    v_eur_cost := ABS(NEW.amount) * v_cost_per_credit;

    INSERT INTO public.mcl_cost_ledger(
      category_key, source, source_ref,
      amount_eur, quantity, unit_cost,
      is_direct, user_id, service_key,
      metadata
    ) VALUES (
      'ai_inference_compute', 'credit_spend', NEW.id::text,
      v_eur_cost, ABS(NEW.amount), v_cost_per_credit,
      true, NEW.user_id, NEW.metadata->>'service_key',
      jsonb_build_object('transaction_id', NEW.id, 'reason', NEW.reason)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mcl_credit_to_cost ON public.credit_transactions;
CREATE TRIGGER trg_mcl_credit_to_cost
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.mcl_hook_credit_spend_to_cost();