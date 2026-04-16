-- ============ MISSING CONTROL LAYERS (Phase 1-5) ============
-- Paralel cu sistemul existent. Nu atinge tabele live.

-- 1. DECISIONS
CREATE TABLE public.mcl_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  source_type text NOT NULL,
  source_reference text,
  target_entity_type text NOT NULL,
  target_entity_reference text,
  decision_type text NOT NULL CHECK (decision_type IN ('rerun','escalate','package','price_adjust','defer','ignore','archive','reinforce','kill','notify','simulate')),
  rationale text NOT NULL,
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  trust_state text NOT NULL DEFAULT 'low' CHECK (trust_state IN ('low','medium','high','blocked')),
  priority_score numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','auto_executed','rejected','expired')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX idx_mcl_decisions_status ON public.mcl_decisions(status, priority_score DESC);
CREATE INDEX idx_mcl_decisions_target ON public.mcl_decisions(target_entity_type, target_entity_reference);

-- 2. PRIORITY RULES
CREATE TABLE public.mcl_priority_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  target_scope text NOT NULL,
  formula_version text NOT NULL DEFAULT 'v1',
  weighting_definition jsonb NOT NULL,
  active_from timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TEMPORAL POLICIES
CREATE TABLE public.mcl_temporal_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  entity_type text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('real_time','hourly','daily','weekly','monthly','event_driven','manual')),
  ttl_class text NOT NULL CHECK (ttl_class IN ('short_term','mid_term','long_term')),
  ttl_days integer NOT NULL,
  decay_rule jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. MEMORY RECORDS
CREATE TABLE public.mcl_memory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  memory_class text NOT NULL CHECK (memory_class IN ('short_term','mid_term','long_term')),
  source_type text NOT NULL,
  source_reference text,
  retained_signal jsonb NOT NULL,
  retention_reason text NOT NULL,
  ttl_class text NOT NULL,
  expire_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','promoted','forgotten','expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcl_memory_expire ON public.mcl_memory_records(expire_at) WHERE status = 'active';

-- 5. TRUST PROFILES
CREATE TABLE public.mcl_trust_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  target_entity_type text NOT NULL,
  target_entity_reference text,
  trust_level text NOT NULL CHECK (trust_level IN ('low','medium','high')),
  confidence_score numeric NOT NULL DEFAULT 0,
  reversibility_level text NOT NULL DEFAULT 'reversible' CHECK (reversibility_level IN ('reversible','partial','irreversible')),
  economic_risk_level text NOT NULL DEFAULT 'low' CHECK (economic_risk_level IN ('low','medium','high','critical')),
  decision_scope text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. RECOVERY EVENTS
CREATE TABLE public.mcl_recovery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  failure_type text NOT NULL CHECK (failure_type IN ('transient_runtime_failure','partial_output_failure','low_quality_output','economic_failure','policy_conflict','dependency_failure')),
  source_reference text,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  response_mode text NOT NULL CHECK (response_mode IN ('retry','rollback','degrade','quarantine','alert','escalate')),
  retry_count integer NOT NULL DEFAULT 0,
  rollback_possible boolean NOT NULL DEFAULT false,
  degraded_mode_activated boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','recovered','escalated','resolved')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- 7. RECOVERY POLICIES
CREATE TABLE public.mcl_recovery_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  failure_type text NOT NULL,
  max_retry_count integer NOT NULL DEFAULT 3,
  allowed_response_modes text[] NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. SELECTION EVENTS
CREATE TABLE public.mcl_selection_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  target_entity_type text NOT NULL,
  target_entity_reference text NOT NULL,
  selection_action text NOT NULL CHECK (selection_action IN ('reinforce','archive','kill','promote','demote')),
  selection_reason text NOT NULL,
  evidence_summary jsonb NOT NULL,
  expected_impact text,
  applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. ECONOMIC UNITS
CREATE TABLE public.mcl_economic_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('execution','agent','product','flow','user')),
  scope_reference text NOT NULL,
  cost_estimate numeric NOT NULL DEFAULT 0,
  time_estimate_seconds numeric NOT NULL DEFAULT 0,
  credit_cost numeric NOT NULL DEFAULT 0,
  revenue_amount numeric NOT NULL DEFAULT 0,
  profit_amount numeric GENERATED ALWAYS AS (revenue_amount - cost_estimate) STORED,
  margin_score numeric,
  measured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcl_econ_scope ON public.mcl_economic_units(scope_type, scope_reference);
CREATE INDEX idx_mcl_econ_profit ON public.mcl_economic_units(profit_amount DESC);

-- 10. USER PROGRESSION
CREATE TABLE public.mcl_user_progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  user_reference uuid NOT NULL,
  current_stage text NOT NULL CHECK (current_stage IN ('beginner','operator','builder','scaler')),
  previous_stage text,
  transition_trigger text,
  feature_usage_summary jsonb DEFAULT '{}'::jsonb,
  commercial_behavior_summary jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcl_progression_user ON public.mcl_user_progression(user_reference, updated_at DESC);

-- 11. CONTROL ACTIONS
CREATE TABLE public.mcl_control_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  control_action text NOT NULL CHECK (control_action IN ('override_decision','change_threshold','kill_agent','pause_queue','force_packaging','force_archive','rerun_process','switch_mode','approve_recommendation','reject_recommendation','run_simulation')),
  scope_type text NOT NULL CHECK (scope_type IN ('entity','queue','policy','global')),
  scope_reference text,
  initiator uuid NOT NULL,
  rationale text NOT NULL,
  effect_summary jsonb DEFAULT '{}'::jsonb,
  linked_decision_id uuid REFERENCES public.mcl_decisions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 12. SIMULATION RUNS
CREATE TABLE public.mcl_simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  simulation_type text NOT NULL CHECK (simulation_type IN ('pricing_simulation','priority_simulation','selection_simulation','policy_simulation','agent_behavior_simulation','retention_simulation')),
  scenario_summary text NOT NULL,
  assumptions jsonb NOT NULL,
  source_data_window text,
  projected_impact jsonb NOT NULL,
  risk_estimate text NOT NULL CHECK (risk_estimate IN ('low','medium','high')),
  recommendation text,
  confidence text NOT NULL CHECK (confidence IN ('low','medium','high')),
  initiator uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. META METRIC REPORTS
CREATE TABLE public.mcl_meta_metric_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  report_window text NOT NULL CHECK (report_window IN ('daily','weekly','monthly')),
  health_score numeric NOT NULL CHECK (health_score BETWEEN 0 AND 10),
  automation_rate numeric,
  decision_accuracy_score numeric,
  revenue_per_execution numeric,
  recovery_success_rate numeric,
  key_failures jsonb DEFAULT '[]'::jsonb,
  key_recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ENABLE RLS — admin only (paralel layer, nu user-facing)
ALTER TABLE public.mcl_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_priority_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_temporal_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_memory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_trust_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_recovery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_recovery_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_selection_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_economic_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_user_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_control_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcl_meta_metric_reports ENABLE ROW LEVEL SECURITY;

-- Policies: admin-only read+write pe toate (loop)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'mcl_decisions','mcl_priority_rules','mcl_temporal_policies','mcl_memory_records',
    'mcl_trust_profiles','mcl_recovery_events','mcl_recovery_policies','mcl_selection_events',
    'mcl_economic_units','mcl_user_progression','mcl_control_actions','mcl_simulation_runs',
    'mcl_meta_metric_reports'
  ])
  LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (public.has_role(auth.uid(),''admin''))', t||'_admin_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.has_role(auth.uid(),''admin''))', t||'_admin_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (public.has_role(auth.uid(),''admin''))', t||'_admin_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (public.has_role(auth.uid(),''admin''))', t||'_admin_delete', t);
  END LOOP;
END $$;

-- ============ RPCs CORE ============

-- Compute priority score (formula din spec)
CREATE OR REPLACE FUNCTION public.mcl_compute_priority(
  _revenue_potential numeric, _urgency numeric, _frequency numeric,
  _effort numeric, _strategic_value numeric, _risk numeric
) RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT (COALESCE(_revenue_potential,0)*0.30)
       + (COALESCE(_urgency,0)*0.20)
       + (COALESCE(_frequency,0)*0.15)
       + (COALESCE(_strategic_value,0)*0.20)
       - (COALESCE(_effort,0)*0.10)
       - (COALESCE(_risk,0)*0.05);
$$;

-- Create decision (fail-closed)
CREATE OR REPLACE FUNCTION public.mcl_create_decision(
  _name text, _source_type text, _source_reference text,
  _target_entity_type text, _target_entity_reference text,
  _decision_type text, _rationale text, _confidence numeric,
  _priority_score numeric DEFAULT 0
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _code text;
  _trust text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF _target_entity_reference IS NULL THEN
    RAISE EXCEPTION 'no_decision_without_target';
  END IF;
  IF _confidence IS NULL THEN
    RAISE EXCEPTION 'no_decision_without_confidence';
  END IF;
  IF _rationale IS NULL OR length(_rationale) < 5 THEN
    RAISE EXCEPTION 'no_decision_without_rationale';
  END IF;

  _trust := CASE
    WHEN _confidence >= 0.85 THEN 'high'
    WHEN _confidence >= 0.6 THEN 'medium'
    ELSE 'low'
  END;

  _code := 'DEC-' || lpad((floor(random()*99999))::text, 5, '0');

  INSERT INTO public.mcl_decisions(
    code, name, source_type, source_reference,
    target_entity_type, target_entity_reference,
    decision_type, rationale, confidence, trust_state, priority_score, created_by
  ) VALUES (
    _code, _name, _source_type, _source_reference,
    _target_entity_type, _target_entity_reference,
    _decision_type, _rationale, _confidence, _trust, _priority_score, auth.uid()
  ) RETURNING id INTO _id;

  RETURN _id;
END $$;

-- Operator override (audit-logged)
CREATE OR REPLACE FUNCTION public.mcl_override_decision(
  _decision_id uuid, _new_status text, _rationale text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.mcl_decisions
    SET status = _new_status, resolved_at = now()
  WHERE id = _decision_id;

  INSERT INTO public.mcl_control_actions(
    code, name, control_action, scope_type, scope_reference,
    initiator, rationale, linked_decision_id
  ) VALUES (
    'CTRL-' || lpad((floor(random()*99999))::text, 5, '0'),
    'Override decision',
    'override_decision', 'entity', _decision_id::text,
    auth.uid(), _rationale, _decision_id
  );
END $$;

-- ============ SEED ============
INSERT INTO public.mcl_priority_rules(code, name, target_scope, weighting_definition) VALUES
('PRIO-0001','High profit + High urgency','global','{"revenue":0.30,"urgency":0.20,"frequency":0.15,"strategic":0.20,"effort":-0.10,"risk":-0.05}'),
('PRIO-0002','Low confidence block','decisions','{"min_confidence":0.4}'),
('PRIO-0003','Stale candidate decay','candidates','{"decay_after_days":30}');

INSERT INTO public.mcl_trust_profiles(code, name, target_entity_type, trust_level, confidence_score, reversibility_level, economic_risk_level, decision_scope) VALUES
('TRUST-0001','Default agent profile','agent','medium',0.7,'reversible','low','agent_run'),
('TRUST-0002','Pricing changes','pricing','low',0.3,'partial','high','price_adjust'),
('TRUST-0003','Auto archive low-ROI','product','high',0.9,'reversible','low','archive');

INSERT INTO public.mcl_temporal_policies(code, name, entity_type, frequency, ttl_class, ttl_days, decay_rule) VALUES
('TMP-0001','Weak signals decay','signal','event_driven','short_term',7,'{"reduce_priority_per_day":0.1}'),
('TMP-0002','Active patterns','pattern','daily','mid_term',30,'{}'),
('TMP-0003','Validated products','product','weekly','long_term',90,'{}');

INSERT INTO public.mcl_recovery_policies(code, name, failure_type, max_retry_count, allowed_response_modes) VALUES
('RCP-0001','Transient retry','transient_runtime_failure',3,ARRAY['retry','alert']),
('RCP-0002','Critical escalate','policy_conflict',0,ARRAY['escalate','quarantine']);