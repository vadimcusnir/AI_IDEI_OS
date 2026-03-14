
-- Phase 3: Insert specialized services into service_catalog
INSERT INTO public.service_catalog (service_key, name, description, category, service_class, credits_cost, icon, is_active, input_schema, deliverables_schema)
VALUES
  -- Personality Intelligence (45 prompts, 10 modules)
  ('personality-intelligence', 'Personality Intelligence', 'Analiză psihologică completă din transcript: Big Five traits, cognitive style, emotional drivers, communication patterns. 45 prompts pe 10 module de profilare.', 'analysis', 'B', 800, 'brain', true,
    '[{"name":"transcript","label":"Transcript / Text","type":"textarea","placeholder":"Paste transcript or text content for psychological analysis...","description":"Content to analyze for personality traits"},{"name":"focus","label":"Focus Area","type":"text","placeholder":"e.g. leadership style, communication patterns","description":"Optional: specific aspect to emphasize"}]'::jsonb,
    '[{"name":"big_five_profile","label":"Big Five Personality Profile"},{"name":"cognitive_style","label":"Cognitive Style Analysis"},{"name":"emotional_drivers","label":"Emotional Drivers Map"},{"name":"communication_dna","label":"Communication DNA"},{"name":"decision_patterns","label":"Decision-Making Patterns"},{"name":"influence_style","label":"Influence & Persuasion Style"},{"name":"stress_response","label":"Stress Response Profile"},{"name":"motivation_matrix","label":"Motivation Matrix"},{"name":"leadership_archetype","label":"Leadership Archetype"},{"name":"growth_opportunities","label":"Growth Opportunities"}]'::jsonb
  ),
  -- Avatar33 Execution Engine (33 prompts)
  ('avatar33', 'Avatar33 — Commercial Avatar', 'Construiește avatarul comercial complet al unui expert: 33 componente de poziționare, messaging, diferențiere și monetizare. Transformă expertiza în brand personal.', 'production', 'C', 1200, 'sparkles', true,
    '[{"name":"transcript","label":"Transcript / Text","type":"textarea","placeholder":"Paste transcript or text with expert knowledge...","description":"Source content for avatar extraction"},{"name":"expert_name","label":"Expert Name","type":"text","placeholder":"e.g. John Smith","description":"Name of the expert being profiled"},{"name":"industry","label":"Industry / Niche","type":"text","placeholder":"e.g. SaaS Marketing, Executive Coaching","description":"Primary industry or niche"}]'::jsonb,
    '[{"name":"positioning_statement","label":"Positioning Statement"},{"name":"unique_mechanism","label":"Unique Mechanism"},{"name":"origin_story","label":"Origin Story Arc"},{"name":"authority_proof","label":"Authority Proof Stack"},{"name":"ideal_client_avatar","label":"Ideal Client Avatar"},{"name":"transformation_promise","label":"Transformation Promise"},{"name":"objection_matrix","label":"Objection Handling Matrix"},{"name":"pricing_architecture","label":"Pricing Architecture"},{"name":"content_pillars","label":"Content Pillars (5)"},{"name":"brand_voice","label":"Brand Voice Guide"},{"name":"lead_magnet_concepts","label":"Lead Magnet Concepts (3)"},{"name":"sales_page_copy","label":"Sales Page Copy"},{"name":"email_sequence","label":"Email Welcome Sequence (5)"}]'::jsonb
  ),
  -- Podcast Intelligence
  ('podcast-intelligence', 'Podcast Intelligence', 'Extrage framework-uri retorice, pattern-uri de persuasiune și structuri narative din episoade podcast. Identifică formulele de succes ale fiecărui host/guest.', 'analysis', 'B', 600, 'layers', true,
    '[{"name":"transcript","label":"Podcast Transcript","type":"textarea","placeholder":"Paste full podcast transcript...","description":"Complete transcript of the podcast episode"},{"name":"episode_title","label":"Episode Title","type":"text","placeholder":"e.g. How I Built a $10M Business","description":"Title of the podcast episode"}]'::jsonb,
    '[{"name":"rhetorical_frameworks","label":"Rhetorical Frameworks"},{"name":"persuasion_patterns","label":"Persuasion Patterns"},{"name":"narrative_structures","label":"Narrative Structures"},{"name":"key_arguments","label":"Key Arguments Map"},{"name":"audience_hooks","label":"Audience Hooks & Triggers"},{"name":"content_repurpose","label":"Content Repurpose Ideas (10)"},{"name":"viral_clips","label":"Viral Clip Candidates"},{"name":"episode_summary","label":"Episode Intelligence Summary"}]'::jsonb
  )
ON CONFLICT (service_key) DO NOTHING;

-- Phase 4.1: Credit reservation function (reserve at start, settle/refund on completion)
CREATE OR REPLACE FUNCTION public.reserve_credits(_user_id uuid, _amount integer, _job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check sufficient balance
  IF NOT EXISTS (
    SELECT 1 FROM user_credits WHERE user_id = _user_id AND balance >= _amount
  ) THEN
    RETURN false;
  END IF;

  -- Deduct balance (reserve)
  UPDATE user_credits
  SET balance = balance - _amount,
      updated_at = now()
  WHERE user_id = _user_id AND balance >= _amount;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Log reservation transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_amount, 'reservation', 'Credit reservation for job', _job_id);

  RETURN true;
END;
$$;

-- Settle credits (confirm spend after successful job)
CREATE OR REPLACE FUNCTION public.settle_credits(_user_id uuid, _amount integer, _job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update total_spent
  UPDATE user_credits
  SET total_spent = total_spent + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Log settlement
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, 0, 'settlement', 'Credit settlement — job completed', _job_id);

  RETURN true;
END;
$$;

-- Refund credits on failed job
CREATE OR REPLACE FUNCTION public.refund_credits(_user_id uuid, _amount integer, _job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Refund balance
  UPDATE user_credits
  SET balance = balance + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Log refund
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, _amount, 'refund', 'Auto-refund — job failed', _job_id);

  RETURN true;
END;
$$;

-- Phase 4.2: checkAccess function
CREATE OR REPLACE FUNCTION public.check_access(_user_id uuid, _service_key text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _service record;
  _balance integer;
  _is_admin boolean;
  _result jsonb;
BEGIN
  -- Get service
  SELECT * INTO _service FROM service_catalog WHERE service_key = _service_key AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('verdict', 'DENY', 'reason', 'service_not_found');
  END IF;

  -- Check admin
  SELECT has_role(_user_id, 'admin') INTO _is_admin;
  IF _is_admin THEN
    RETURN jsonb_build_object('verdict', 'ALLOW', 'reason', 'admin', 'credits_cost', _service.credits_cost);
  END IF;

  -- Check credits
  SELECT balance INTO _balance FROM user_credits WHERE user_id = _user_id;
  IF _balance IS NULL THEN
    RETURN jsonb_build_object('verdict', 'PAYWALL', 'reason', 'no_credits', 'credits_cost', _service.credits_cost, 'balance', 0);
  END IF;

  IF _balance < _service.credits_cost THEN
    RETURN jsonb_build_object('verdict', 'PAYWALL', 'reason', 'insufficient_credits', 'credits_cost', _service.credits_cost, 'balance', _balance, 'deficit', _service.credits_cost - _balance);
  END IF;

  RETURN jsonb_build_object('verdict', 'ALLOW', 'reason', 'credits_sufficient', 'credits_cost', _service.credits_cost, 'balance', _balance);
END;
$$;

-- Phase 4.4: Add access_tier column to service_catalog for free/premium distinction
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS access_tier text NOT NULL DEFAULT 'premium';

-- Set some services as free tier
UPDATE public.service_catalog SET access_tier = 'free' WHERE service_key IN ('summary', 'key-quotes', 'seo-keywords', 'topic-extraction', 'viral-clips');
