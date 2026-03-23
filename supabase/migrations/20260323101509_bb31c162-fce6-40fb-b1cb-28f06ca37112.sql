
-- ═══════════════════════════════════════════
-- INTELLIGENCE PROFILES — Full Schema
-- ═══════════════════════════════════════════

-- Enums
DO $$ BEGIN CREATE TYPE profile_type AS ENUM ('public_figure','local_figure','anonymized_client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE profile_source_type AS ENUM ('podcast','interview','conversation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE profile_visibility_status AS ENUM ('draft','review','published','blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE profile_risk_flag AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Core truth table
CREATE TABLE IF NOT EXISTS intelligence_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type profile_type NOT NULL,
  source_type profile_source_type NOT NULL,
  source_ref text NOT NULL,
  transcript_ref uuid,
  person_name text NOT NULL DEFAULT '',
  extracted_indicators jsonb NOT NULL DEFAULT '[]'::jsonb,
  cognitive_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  synthesis_text text NOT NULL DEFAULT '',
  public_slug text NOT NULL UNIQUE,
  visibility_status profile_visibility_status NOT NULL DEFAULT 'draft',
  risk_flag profile_risk_flag NOT NULL DEFAULT 'low',
  consent_required boolean NOT NULL DEFAULT false,
  same_as_urls text[] DEFAULT '{}',
  source_duration_minutes integer,
  source_date date,
  version integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_visibility ON intelligence_profiles(visibility_status);
CREATE INDEX IF NOT EXISTS idx_ip_type ON intelligence_profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_ip_slug ON intelligence_profiles(public_slug);
CREATE INDEX IF NOT EXISTS idx_ip_risk ON intelligence_profiles(risk_flag);

-- Public subset (derived view)
CREATE TABLE IF NOT EXISTS intelligence_profile_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES intelligence_profiles(id) ON DELETE CASCADE UNIQUE,
  public_indicators jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  public_summary text,
  meta_title text,
  meta_description text,
  seo_queries text[] DEFAULT '{}',
  json_ld jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Consent tracking
CREATE TABLE IF NOT EXISTS intelligence_profile_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES intelligence_profiles(id) ON DELETE CASCADE,
  user_id uuid,
  doc_ref text,
  consent_status text NOT NULL CHECK (consent_status IN ('granted','revoked')),
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ipc_profile ON intelligence_profile_consent(profile_id);

-- State transitions (audit trail)
CREATE TABLE IF NOT EXISTS intelligence_profile_state_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES intelligence_profiles(id) ON DELETE CASCADE,
  from_status profile_visibility_status,
  to_status profile_visibility_status NOT NULL,
  reason_code text,
  guardrail_results jsonb,
  decided_by uuid,
  decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ipst_profile ON intelligence_profile_state_transitions(profile_id);

-- RLS
ALTER TABLE intelligence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_profile_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_profile_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_profile_state_transitions ENABLE ROW LEVEL SECURITY;

-- Public can read only published profiles via public subset
CREATE POLICY "Anyone can read published profile public data"
ON intelligence_profile_public FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM intelligence_profiles ip
    WHERE ip.id = intelligence_profile_public.profile_id
    AND ip.visibility_status = 'published'
    AND ip.risk_flag != 'high'
  )
);

-- Published profiles basic info is public
CREATE POLICY "Anyone can read published profiles"
ON intelligence_profiles FOR SELECT
USING (visibility_status = 'published' AND risk_flag != 'high');

-- Admins can do everything on all profile tables
CREATE POLICY "Admins manage intelligence profiles"
ON intelligence_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage profile public"
ON intelligence_profile_public FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage profile consent"
ON intelligence_profile_consent FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage profile transitions"
ON intelligence_profile_state_transitions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Guardrail validation function
CREATE OR REPLACE FUNCTION public.validate_profile_guardrails(_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
  _consent RECORD;
  _checks jsonb := '[]'::jsonb;
  _all_pass boolean := true;
  _reason text;
BEGIN
  SELECT * INTO _profile FROM intelligence_profiles WHERE id = _profile_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Profile not found'); END IF;

  -- Gate 1: RISK
  IF _profile.risk_flag = 'high' THEN
    _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'risk', 'status', 'FAIL', 'reason', 'RISK_HIGH'));
    _all_pass := false;
  ELSE
    _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'risk', 'status', 'PASS'));
  END IF;

  -- Gate 2: CONSENT
  IF _profile.consent_required THEN
    SELECT * INTO _consent FROM intelligence_profile_consent
    WHERE profile_id = _profile_id AND consent_status = 'granted'
    ORDER BY created_at DESC LIMIT 1;
    
    IF NOT FOUND THEN
      _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'consent', 'status', 'FAIL', 'reason', 'CONSENT_MISSING'));
      _all_pass := false;
    ELSE
      _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'consent', 'status', 'PASS'));
    END IF;
  ELSE
    _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'consent', 'status', 'SKIP', 'reason', 'NOT_REQUIRED'));
  END IF;

  -- Gate 3: SOURCE PUBLIC
  IF _profile.profile_type = 'public_figure' THEN
    IF _profile.source_ref IS NULL OR _profile.source_ref = '' OR NOT (_profile.source_ref LIKE 'http%') THEN
      _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'source_public', 'status', 'FAIL', 'reason', 'SOURCE_NOT_PUBLIC'));
      _all_pass := false;
    ELSE
      _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'source_public', 'status', 'PASS'));
    END IF;
  ELSE
    _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'source_public', 'status', 'SKIP'));
  END IF;

  -- Gate 4: ANONYMIZATION (for conversations)
  IF _profile.source_type = 'conversation' THEN
    IF _profile.profile_type != 'anonymized_client' THEN
      _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'anonymization', 'status', 'FAIL', 'reason', 'CONVERSATION_NOT_ANONYMIZED'));
      _all_pass := false;
    ELSE
      _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'anonymization', 'status', 'PASS'));
    END IF;
  ELSE
    _checks := _checks || jsonb_build_array(jsonb_build_object('gate', 'anonymization', 'status', 'SKIP'));
  END IF;

  RETURN jsonb_build_object(
    'profile_id', _profile_id,
    'all_pass', _all_pass,
    'checks', _checks,
    'visibility_status', _profile.visibility_status,
    'risk_flag', _profile.risk_flag::text,
    'profile_type', _profile.profile_type::text
  );
END;
$$;

-- State transition function with Decision Ledger
CREATE OR REPLACE FUNCTION public.transition_profile_status(
  _profile_id uuid,
  _to_status profile_visibility_status,
  _reason_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
  _from_status profile_visibility_status;
  _guardrails jsonb;
  _user_id uuid := auth.uid();
BEGIN
  SELECT * INTO _profile FROM intelligence_profiles WHERE id = _profile_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Profile not found'); END IF;

  _from_status := _profile.visibility_status;

  -- Validate allowed transitions
  IF NOT (
    (_from_status = 'draft' AND _to_status = 'review') OR
    (_from_status = 'review' AND _to_status IN ('published', 'blocked')) OR
    (_from_status = 'blocked' AND _to_status = 'draft') OR
    (_from_status = 'published' AND _to_status = 'blocked')
  ) THEN
    RETURN jsonb_build_object('error', 'Invalid transition: ' || _from_status::text || ' → ' || _to_status::text);
  END IF;

  -- If publishing, run guardrails
  IF _to_status = 'published' THEN
    _guardrails := validate_profile_guardrails(_profile_id);
    IF NOT (_guardrails->>'all_pass')::boolean THEN
      -- Log DENY
      INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason, metadata)
      VALUES ('PROFILE_PUBLISH', _user_id, 'intelligence_profile:' || _profile_id::text, 'DENY',
        COALESCE(_reason_code, 'GUARDRAIL_FAILED'), _guardrails);
      
      RETURN jsonb_build_object('error', 'Guardrails failed', 'guardrails', _guardrails);
    END IF;
  END IF;

  -- Perform transition
  UPDATE intelligence_profiles SET
    visibility_status = _to_status,
    updated_at = now(),
    version = CASE WHEN _to_status = 'published' AND _from_status != 'published' THEN version + 1 ELSE version END
  WHERE id = _profile_id;

  -- Update published_at
  IF _to_status = 'published' THEN
    UPDATE intelligence_profile_public SET published_at = now(), updated_at = now()
    WHERE profile_id = _profile_id;
  END IF;

  -- Log transition
  INSERT INTO intelligence_profile_state_transitions (profile_id, from_status, to_status, reason_code, guardrail_results, decided_by)
  VALUES (_profile_id, _from_status, _to_status, _reason_code, _guardrails, _user_id);

  -- Decision Ledger
  INSERT INTO decision_ledger (event_type, actor_id, target_resource, verdict, reason, metadata)
  VALUES (
    'PROFILE_PUBLISH',
    _user_id,
    'intelligence_profile:' || _profile_id::text,
    CASE WHEN _to_status = 'blocked' THEN 'DENY' ELSE 'ALLOW' END,
    COALESCE(_reason_code, _from_status::text || '_to_' || _to_status::text),
    jsonb_build_object('from', _from_status::text, 'to', _to_status::text, 'guardrails', _guardrails)
  );

  RETURN jsonb_build_object('ok', true, 'from', _from_status::text, 'to', _to_status::text);
END;
$$;

-- Updated_at trigger
CREATE TRIGGER trg_ip_updated_at BEFORE UPDATE ON intelligence_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ipp_updated_at BEFORE UPDATE ON intelligence_profile_public
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
